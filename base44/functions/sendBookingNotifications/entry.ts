import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Triggered by entity automation on Booking update.
// Sends in-app notifications + email fallback for key status transitions.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data: booking, old_data, event } = body;
    if (!booking) return Response.json({ ok: true });

    const oldStatus = old_data?.status;
    const newStatus = booking.status;
    const oldArrived = old_data?.arrived_at_destination;
    const newArrived = booking.arrived_at_destination;

    const notify = async (userEmail, title, message, type = 'general') => {
      await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        title,
        body: message,
        type,
        booking_id: booking.id,
      });
      // Email fallback
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userEmail,
        subject: title,
        body: `<p>${message}</p><p style="color:#666;font-size:12px">Log in to Elderlyx to view your booking details.</p>`,
      });
    };

    // ── Family: Caregiver confirmed (on the way) ──────────────────
    if (oldStatus === 'pending' && newStatus === 'confirmed' && booking.family_email) {
      await notify(
        booking.family_email,
        `✅ Caregiver Confirmed — ${booking.caregiver_name || 'Your caregiver'} is on the way`,
        `${booking.caregiver_name || 'Your caregiver'} has accepted the ${booking.service_type} booking for ${booking.senior_name}. They are on their way!`,
        'booking_confirmed'
      );
    }

    // ── Family: Caregiver arrived (transportation timer started) ──
    if (!oldArrived && newArrived && booking.family_email && booking.service_type === 'transportation') {
      await notify(
        booking.family_email,
        `📍 Caregiver Has Arrived`,
        `${booking.caregiver_name || 'Your caregiver'} has arrived for ${booking.senior_name}'s trip. The wait timer has started.`,
        'general'
      );
    }

    // ── Family: Trip/Visit completed ──────────────────────────────
    if (oldStatus !== 'completed' && newStatus === 'completed' && booking.family_email) {
      const waitCharge = booking.wait_charge || 0;
      const msg = waitCharge > 0
        ? `The ${booking.service_type} for ${booking.senior_name} is complete. Total charged: $${booking.price} (includes $${waitCharge} wait overage).`
        : `The ${booking.service_type} for ${booking.senior_name} is complete. Total charged: $${booking.price}.`;
      await notify(booking.family_email, `🎉 Booking Completed`, msg, 'booking_completed');
    }

    // ── Caregiver: Booking confirmed (they accepted) ───────────────
    if (oldStatus === 'pending' && newStatus === 'confirmed' && booking.caregiver_id) {
      // Look up caregiver email
      const users = await base44.asServiceRole.entities.User.filter({ id: booking.caregiver_id });
      const caregiver = users[0];
      if (caregiver?.email) {
        await notify(
          caregiver.email,
          `📋 Booking Confirmed — ${booking.service_type}`,
          `You are confirmed for a ${booking.service_type} booking for ${booking.senior_name} on ${new Date(booking.scheduled_date).toLocaleDateString()}. See you there!`,
          'booking_confirmed'
        );
      }
    }

    // ── Caregiver: Cancelled booking they were assigned to ────────
    if (oldStatus !== 'cancelled' && newStatus === 'cancelled' && booking.caregiver_id) {
      const users = await base44.asServiceRole.entities.User.filter({ id: booking.caregiver_id });
      const caregiver = users[0];
      if (caregiver?.email) {
        await notify(
          caregiver.email,
          `❌ Booking Cancelled`,
          `The ${booking.service_type} booking for ${booking.senior_name} on ${new Date(booking.scheduled_date).toLocaleDateString()} has been cancelled.`,
          'booking_cancelled'
        );
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});