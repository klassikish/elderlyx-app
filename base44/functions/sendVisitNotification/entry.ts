import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id, playback_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    // Fetch booking and family user
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    const familyUsers = await base44.asServiceRole.entities.User.filter({ email: booking.family_email }, '', 1);
    const familyUser = familyUsers[0];

    if (!familyUser) {
      return Response.json({ error: 'Family user not found' }, { status: 404 });
    }

    const subscription = familyUser.subscription_plan || 'basic';
    let notificationTitle, notificationBody, notificationType;

    if (subscription === 'basic') {
      // BASIC: Simple visit completed + 1-2 line note
      const playback = playback_id ? await base44.asServiceRole.entities.VisitPlayback.get(playback_id) : null;
      notificationTitle = `Visit completed for ${booking.senior_name}`;
      const notePreview = playback?.notes ? playback.notes.substring(0, 50) : 'No additional notes';
      notificationBody = notePreview.length > 50 ? notePreview + '...' : notePreview;
      notificationType = 'booking_completed';
    } else if (subscription === 'family') {
      // FAMILY: Daily summary notification
      const playback = playback_id ? await base44.asServiceRole.entities.VisitPlayback.get(playback_id) : null;
      notificationTitle = `${booking.senior_name} visit report ready`;
      const eating = playback?.eating === 'full' ? '✓ Ate well' : '⚠ Eating concern';
      const med = playback?.medication_taken ? '✓ Took meds' : '⚠ Missed meds';
      notificationBody = `${eating} · ${med}`;
      notificationType = 'booking_completed_family';
    } else {
      // PREMIUM: Full alerts with risk detection
      const playback = playback_id ? await base44.asServiceRole.entities.VisitPlayback.get(playback_id) : null;
      const hasRisks = playback?.risk_flags?.length > 0;
      
      notificationTitle = hasRisks 
        ? `⚠️ Health Alert for ${booking.senior_name}`
        : `✓ ${booking.senior_name} check-in complete`;
      
      if (hasRisks) {
        const riskTypes = playback.risk_flags.slice(0, 2).join(', ');
        notificationBody = `${riskTypes} detected. Review in Daily Life Playback.`;
        notificationType = 'health_alert';
      } else {
        notificationBody = 'All metrics stable. View full playback for trends.';
        notificationType = 'booking_completed_premium';
      }
    }

    // Trigger upgrade prompt for non-premium (add flag to notification)
    const shouldPromptUpgrade = subscription !== 'premium';

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: booking.family_email,
      title: notificationTitle,
      body: notificationBody,
      type: notificationType,
      booking_id: booking_id,
      is_read: false,
    });

    return Response.json({ notification, subscription });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});