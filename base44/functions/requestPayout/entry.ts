import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();

  // ── Create / retrieve a Stripe Connect Express account ───────────────────
  if (action === 'connect') {
    let accountId = user.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { user_id: user.id, user_email: user.email },
      });
      accountId = account.id;
      await base44.auth.updateMe({ stripe_connect_account_id: accountId });
    }

    const appUrl = req.headers.get('origin') || 'https://app.elderlyx.com';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/CaregiverEarnings`,
      return_url: `${appUrl}/CaregiverEarnings?connected=1`,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url, account_id: accountId });
  }

  // ── Check Stripe Connect account status ──────────────────────────────────
  if (action === 'status') {
    const accountId = user.stripe_connect_account_id;
    if (!accountId) return Response.json({ connected: false });

    const account = await stripe.accounts.retrieve(accountId);
    return Response.json({
      connected: account.charges_enabled && account.payouts_enabled,
      account_id: accountId,
      details_submitted: account.details_submitted,
    });
  }

  // ── Request payout of pending earnings ───────────────────────────────────
  if (action === 'payout') {
    const accountId = user.stripe_connect_account_id;
    if (!accountId) return Response.json({ error: 'No connected account' }, { status: 400 });

    // Get pending earnings for this caregiver
    const pending = await base44.asServiceRole.entities.CaregiverEarning.filter({
      caregiver_id: user.id,
      payout_status: 'pending',
    });

    if (pending.length === 0) return Response.json({ error: 'No pending earnings' }, { status: 400 });

    const totalCents = Math.round(pending.reduce((s, e) => s + e.total_pay, 0) * 100);
    if (totalCents < 100) return Response.json({ error: 'Minimum payout is $1.00' }, { status: 400 });

    // Transfer funds to the connected account
    const transfer = await stripe.transfers.create({
      amount: totalCents,
      currency: 'usd',
      destination: accountId,
      metadata: {
        caregiver_id: user.id,
        caregiver_email: user.email,
        earning_ids: pending.map(e => e.id).join(','),
      },
    });

    // Mark earnings as paid
    await Promise.all(pending.map(e =>
      base44.asServiceRole.entities.CaregiverEarning.update(e.id, {
        payout_status: 'paid',
        stripe_transfer_id: transfer.id,
        paid_at: new Date().toISOString(),
      })
    ));

    return Response.json({
      success: true,
      transfer_id: transfer.id,
      amount: totalCents / 100,
      count: pending.length,
    });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});