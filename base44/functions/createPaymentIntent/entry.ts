import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Creates a Stripe PaymentIntent for a booking (task or transportation)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, service_type, senior_name, booking_description } = await req.json();
    if (!amount || amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    const amountCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        service_type: service_type || 'unknown',
        senior_name: senior_name || '',
        description: booking_description || '',
      },
      description: `Elderlyx ${service_type} booking for ${senior_name || 'senior'}`,
    });

    return Response.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});