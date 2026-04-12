import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Cancellation fee rules:
// - Cancel > 24h before scheduled: 100% refund
// - Cancel 2–24h before scheduled: 50% refund (50% cancellation fee)
// - Cancel < 2h before or after start: no refund

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Only the booking owner or admin can cancel
    if (booking.family_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.payment_status !== 'paid' || !booking.stripe_payment_intent_id) {
      // No charge yet — just cancel
      await base44.asServiceRole.entities.Booking.update(booking_id, { status: 'cancelled' });
      return Response.json({ refund_amount: 0, fee_charged: 0, message: 'Booking cancelled (no charge was made)' });
    }

    const scheduledDate = new Date(booking.scheduled_date);
    const hoursUntil = (scheduledDate - Date.now()) / 3600000;
    const price = booking.price || 0;

    let refundPercent = 0;
    let feeMessage = '';

    if (hoursUntil > 24) {
      refundPercent = 100;
      feeMessage = 'Full refund — cancelled more than 24h in advance';
    } else if (hoursUntil >= 2) {
      refundPercent = 50;
      feeMessage = '50% refund — cancelled within 24h (50% cancellation fee applies)';
    } else {
      refundPercent = 0;
      feeMessage = 'No refund — cancelled less than 2h before scheduled time';
    }

    const refundAmount = Math.round(price * (refundPercent / 100));
    const refundCents = Math.round(refundAmount * 100);

    if (refundCents > 0) {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      const chargeId = paymentIntent.latest_charge;
      if (chargeId) {
        await stripe.refunds.create({ charge: chargeId, amount: refundCents });
      }
    }

    await base44.asServiceRole.entities.Booking.update(booking_id, {
      status: 'cancelled',
      payment_status: refundPercent === 100 ? 'refunded' : 'paid',
    });

    // Notify family
    await base44.asServiceRole.entities.Notification.create({
      user_email: booking.family_email,
      title: '📋 Booking Cancelled',
      body: `${feeMessage}. ${refundAmount > 0 ? `$${refundAmount} will be returned to your card within 5-7 days.` : ''}`,
      type: 'booking_cancelled',
      booking_id,
    });

    return Response.json({
      refund_amount: refundAmount,
      fee_charged: price - refundAmount,
      refund_percent: refundPercent,
      message: feeMessage,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});