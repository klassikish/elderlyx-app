import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { booking_id, lat, lng, accuracy } = payload;

    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    // Fetch booking
    const booking = await base44.entities.Booking.get(booking_id);
    if (!booking || booking.caregiver_id !== user.id) {
      return Response.json({ error: 'Unauthorized for this booking' }, { status: 403 });
    }

    // Create check-in log entry
    const checkInLog = await base44.entities.CheckInLog.create({
      booking_id,
      caregiver_id: user.id,
      caregiver_name: user.full_name,
      senior_name: booking.senior_name,
      family_email: booking.family_email,
      check_in_time: new Date().toISOString(),
      check_in_lat: lat,
      check_in_lng: lng,
      scheduled_duration_minutes: (booking.duration_hours || 1) * 60,
    });

    // Update booking status
    await base44.entities.Booking.update(booking_id, {
      status: 'in_progress',
    });

    return Response.json({
      success: true,
      check_in_log_id: checkInLog.id,
      checked_in_at: checkInLog.check_in_time,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});