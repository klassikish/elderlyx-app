import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Plan price IDs — set these as env vars or hardcode your Stripe price IDs
const PLAN_PRICES = {
  basic:   Deno.env.get('STRIPE_PRICE_BASIC')   || null,
  family:  Deno.env.get('STRIPE_PRICE_FAMILY')  || null,
  premium: Deno.env.get('STRIPE_PRICE_PREMIUM') || null,
};

// Monthly prices as fallback (charge immediately if no price IDs configured)
const PLAN_AMOUNTS = { basic: 1900, family: 3900, premium: 6900 }; // cents

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan, payment_method_id } = await req.json();
    if (!plan || !PLAN_AMOUNTS[plan]) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Attach payment method
    if (payment_method_id) {
      await stripe.paymentMethods.attach(payment_method_id, { customer: customerId });
      await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: payment_method_id } });
    }

    if (PLAN_PRICES[plan]) {
      // Create a real subscription with recurring price
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: PLAN_PRICES[plan] }],
        payment_settings: { payment_method_types: ['card'] },
        expand: ['latest_invoice.payment_intent'],
      });
      await base44.auth.updateMe({ subscription_plan: plan, stripe_subscription_id: subscription.id });
      return Response.json({ success: true, subscription_id: subscription.id, plan });
    } else {
      // No Stripe price configured — charge a one-time monthly fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: PLAN_AMOUNTS[plan],
        currency: 'usd',
        customer: customerId,
        payment_method: payment_method_id,
        confirm: !!payment_method_id,
        automatic_payment_methods: payment_method_id ? undefined : { enabled: true },
        description: `Elderlyx ${plan} plan — monthly`,
        metadata: { user_id: user.id, plan },
      });
      if (paymentIntent.status === 'succeeded' || !payment_method_id) {
        await base44.auth.updateMe({ subscription_plan: plan });
      }
      return Response.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        plan,
        requires_action: paymentIntent.status === 'requires_action',
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});