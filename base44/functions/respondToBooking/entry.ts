import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Called when a caregiver accepts or declines a matched booking
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { booking_id, action } = await req.json(); // action: 'accept' | 'decline'
  if (!booking_id || !action) return Response.json({ error: 'booking_id and action required' }, { status: 400 });

  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
  const booking = bookings[0];
  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

  // Verify this caregiver is one of the matched ones
  const matched = Array.isArray(booking.matched_caregivers) ? booking.matched_caregivers : [];
  if (!matched.includes(user.id)) {
    return Response.json({ error: 'You are not matched to this booking' }, { status: 403 });
  }

  if (action === 'accept') {
    // Assign caregiver to booking
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      caregiver_id: user.id,
      caregiver_name: user.full_name,
      status: 'confirmed',
    });

    // Notify family
    if (booking.family_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.family_email,
        title: '✅ Caregiver Confirmed!',
        body: `${user.full_name} has accepted your ${booking.service_type} booking for ${booking.senior_name}.`,
        type: 'booking_confirmed',
        booking_id,
      });
    }

    return Response.json({ success: true, status: 'confirmed' });
  }

  if (action === 'decline') {
    // Remove caregiver from matched list
    const updatedMatched = matched.filter(id => id !== user.id);
    const newRejectedCount = (booking.rejected_count || 0) + 1;

    if (updatedMatched.length === 0) {
      // All 3 declined — alert admin for manual assignment
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        matched_caregivers: [],
        rejected_count: newRejectedCount,
        needs_manual_assignment: true,
      });

      const allUsers = await base44.asServiceRole.entities.User.list();
      const admins = allUsers.filter(u => u.role === 'admin');
      await Promise.all(admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          title: '⚠️ Manual Assignment Needed',
          body: `All 3 matched caregivers declined booking for ${booking.senior_name} (${booking.service_type}). Please assign manually.`,
          type: 'general',
          booking_id,
        })
      ));

      await base44.asServiceRole.entities.Alert.create({
        title: '⚠️ Manual Caregiver Assignment Required',
        description: `All matched caregivers declined booking ${booking_id} for ${booking.senior_name} (${booking.service_type}, ${new Date(booking.scheduled_date).toLocaleDateString()}). Please assign a caregiver manually.`,
        severity: 'warning',
        category: 'general',
        is_read: false,
        action_taken: false,
      });

      return Response.json({ success: true, status: 'needs_manual_assignment' });
    }

    // Still has remaining candidates
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      matched_caregivers: updatedMatched,
      rejected_count: newRejectedCount,
    });

    return Response.json({ success: true, status: 'declined', remaining: updatedMatched.length });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
});