import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Triggered when a new Booking is created.
// Sends email to family confirming their request was received.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data: booking } = body;
    if (!booking || !booking.family_email) return Response.json({ ok: true });

    // Confirm to family that booking request was received
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.family_email,
      subject: `📬 Booking Request Received — ${booking.service_type}`,
      body: `
        <h2>Your booking request has been received!</h2>
        <p>We're matching the best caregiver for <strong>${booking.senior_name}</strong>.</p>
        <ul>
          <li><strong>Service:</strong> ${booking.service_type}</li>
          <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</li>
          <li><strong>Total:</strong> $${booking.price}</li>
        </ul>
        <p>You'll be notified as soon as a caregiver is confirmed.</p>
        <p style="color:#666;font-size:12px">Elderlyx — Care made simple</p>
      `,
    });

    await base44.asServiceRole.entities.Notification.create({
      user_email: booking.family_email,
      title: '📬 Booking Request Received',
      body: `We're finding the best caregiver for ${booking.senior_name}. You'll be notified when one is confirmed.`,
      type: 'general',
      booking_id: booking.id,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});