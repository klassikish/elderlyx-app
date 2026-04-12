import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Called when a caregiver presses timer buttons repeatedly while not near the job location
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, caregiver_id, caregiver_name, action_attempted, attempts, distance_meters } = await req.json();

    // Create an admin alert
    await base44.asServiceRole.entities.Alert.create({
      title: '🚨 Timer Abuse Detected',
      description: `Caregiver ${caregiver_name || caregiver_id} attempted to press "${action_attempted}" button ${attempts} times while ~${distance_meters}m from the job location (booking: ${booking_id}). GPS verification failed each time.`,
      severity: 'critical',
      category: 'safety',
      is_read: false,
      action_taken: false,
    });

    // Also notify all admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        title: '🚨 Timer Button Abuse Alert',
        body: `${caregiver_name || 'A caregiver'} pressed the "${action_attempted}" button ${attempts}× while ${distance_meters}m from the job location on booking ${booking_id}.`,
        type: 'general',
        booking_id,
      })
    ));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});