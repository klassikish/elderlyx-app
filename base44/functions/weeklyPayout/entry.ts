import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Run weekly — pays all caregivers with pending earnings via Stripe Connect transfers
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Get all pending earnings
    const pendingEarnings = await base44.asServiceRole.entities.CaregiverEarning.filter({ payout_status: 'pending' });

    if (pendingEarnings.length === 0) {
      return Response.json({ message: 'No pending earnings to pay out', paid: 0 });
    }

    // Group by caregiver
    const byCaregiverId = {};
    for (const e of pendingEarnings) {
      if (!byCaregiverId[e.caregiver_id]) {
        byCaregiverId[e.caregiver_id] = { earnings: [], total: 0, email: e.caregiver_email, name: e.caregiver_name };
      }
      byCaregiverId[e.caregiver_id].earnings.push(e);
      byCaregiverId[e.caregiver_id].total += e.total_pay;
    }

    const results = [];

    for (const [caregiver_id, data] of Object.entries(byCaregiverId)) {
      // Look up caregiver's stripe_account_id from User entity
      const users = await base44.asServiceRole.entities.User.list();
      const caregiver = users.find(u => u.id === caregiver_id);
      const stripeAccountId = caregiver?.stripe_account_id;

      if (!stripeAccountId) {
        results.push({ caregiver_id, status: 'skipped', reason: 'No Stripe Connect account linked', amount: data.total });
        continue;
      }

      // Skip if pay is frozen
      if (caregiver?.pay_frozen) {
        results.push({ caregiver_id, status: 'skipped', reason: `Pay frozen: ${caregiver.pay_freeze_reason || 'Admin hold'}`, amount: data.total });
        continue;
      }

      const amountCents = Math.round(data.total * 100);

      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: stripeAccountId,
        description: `Elderlyx weekly payout — ${data.earnings.length} job(s) for ${data.name}`,
      });

      // Mark all earnings as paid
      for (const earning of data.earnings) {
        await base44.asServiceRole.entities.CaregiverEarning.update(earning.id, {
          payout_status: 'paid',
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
        });
      }

      results.push({ caregiver_id, status: 'paid', amount: data.total, transfer_id: transfer.id });
    }

    return Response.json({ success: true, results, total_caregivers: Object.keys(byCaregiverId).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});