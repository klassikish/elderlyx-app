import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      booking_id,
      caregiver_id,
      caregiver_name,
      caregiver_phone,
      family_email,
      senior_name,
      latitude,
      longitude,
    } = body;

    if (!booking_id || !family_email || !senior_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Geocode location if available
    let address = 'Location data unavailable';
    if (latitude && longitude) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const geoData = await geoRes.json();
        address = geoData.address?.road || geoData.address?.neighbourhood || `${latitude}, ${longitude}`;
      } catch {
        address = `${latitude}, ${longitude}`;
      }
    }

    // Create SOS alert record
    const alert = await base44.asServiceRole.entities.SosAlert.create({
      booking_id,
      senior_name,
      family_email,
      caregiver_id: caregiver_id || '',
      caregiver_name: caregiver_name || '',
      caregiver_phone,
      latitude: latitude || null,
      longitude: longitude || null,
      address,
      alert_type: 'emergency',
      status: 'active',
    });

    // Notify caregiver (if assigned)
    if (caregiver_id && caregiver_phone) {
      await base44.integrations.Core.SendEmail({
        to: `${caregiver_name} <${caregiver_phone}>`,
        subject: `🚨 EMERGENCY ALERT: ${senior_name}`,
        body: `Emergency alert received at ${new Date().toLocaleTimeString()}\n\nLocation: ${address}\n\nPlease respond immediately or contact the family.`,
      }).catch(() => {});
    }

    // Notify family
    await base44.integrations.Core.SendEmail({
      to: family_email,
      subject: `🚨 EMERGENCY: Alert for ${senior_name}`,
      body: `An emergency alert was triggered at ${new Date().toLocaleString()}.\n\nLocation: ${address}\n\nYour caregiver has been notified and emergency contacts are being reached.`,
    }).catch(() => {});

    // Create notification records for both
    if (caregiver_id) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: caregiver_id, // Store caregiver_id as user identifier
        title: '🚨 EMERGENCY ALERT',
        body: `Emergency alert received for ${senior_name}. Location: ${address}. Respond immediately.`,
        type: 'general',
        booking_id,
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: family_email,
      title: '🚨 EMERGENCY ALERT',
      body: `Emergency alert triggered for ${senior_name}. Your caregiver has been notified. Location: ${address}.`,
      type: 'general',
      booking_id,
    }).catch(() => {});

    return Response.json({
      success: true,
      alert_id: alert.id,
      timestamp: new Date().toISOString(),
      address,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});