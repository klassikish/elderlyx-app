import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { senior_email, senior_id } = await req.json();

    if (!senior_email || !senior_id) {
      return Response.json({ error: 'Missing params' }, { status: 400 });
    }

    // Fetch last 7 visits
    const allPlaybacks = await base44.asServiceRole.entities.VisitPlayback.filter(
      { family_email: senior_email, senior_name: senior_id },
      '-created_date',
      7
    );

    if (allPlaybacks.length === 0) {
      return Response.json({ alerts: [] });
    }

    const alerts = [];

    // 1. Eating trend: check if decreasing
    const eatingSequence = allPlaybacks.map(p => (['full', 'partial', 'none'].indexOf(p.eating) || 0));
    const recentEating = eatingSequence.slice(0, 3);
    if (recentEating.length >= 3 && recentEating[0] > recentEating[1] && recentEating[1] > recentEating[2]) {
      alerts.push({
        type: 'eating_decline',
        severity: 'warning',
        message: 'Eating less than usual',
        description: 'Over the last few visits, meals have been smaller.',
      });
    }

    // 2. Confusion increase: check frequency
    const confusionCount = allPlaybacks.filter(p => p.confusion_observed).length;
    if (confusionCount >= 3) {
      alerts.push({
        type: 'confusion_increase',
        severity: 'critical',
        message: 'Confusion observed in multiple visits',
        description: `Confusion noted in ${confusionCount} of last 7 visits. Consider monitoring closely.`,
      });
    }

    // 3. Mobility decline
    const mobilitySequence = allPlaybacks.map(p => (['worse', 'same', 'better'].indexOf(p.mobility) || 0));
    const recentMobility = mobilitySequence.slice(0, 3);
    if (recentMobility.length >= 3 && recentMobility[0] <= recentMobility[1] && recentMobility[1] <= recentMobility[2]) {
      alerts.push({
        type: 'mobility_decline',
        severity: 'warning',
        message: 'Mobility getting more difficult',
        description: 'Recent visits show decreasing mobility. May need additional support.',
      });
    }

    // 4. Medication missed
    const missedMeds = allPlaybacks.filter(p => !p.medication_taken).length;
    if (missedMeds >= 2) {
      alerts.push({
        type: 'medication_missed',
        severity: 'critical',
        message: 'Medication missed multiple times',
        description: `Medication not taken in ${missedMeds} recent visits.`,
      });
    }

    // 5. Mood decline
    const moodSequence = allPlaybacks.map(p => (['low', 'neutral', 'positive'].indexOf(p.mood) || 0));
    const recentMood = moodSequence.slice(0, 3);
    if (recentMood.length >= 3 && recentMood[0] <= recentMood[1] && recentMood[1] <= recentMood[2]) {
      alerts.push({
        type: 'mood_decline',
        severity: 'info',
        message: 'Mood appears lower than usual',
        description: 'Recent observations show quieter, less engaged behavior.',
      });
    }

    // Send notifications for critical alerts
    for (const alert of alerts.filter(a => a.severity === 'critical')) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: senior_email,
        title: alert.message,
        body: alert.description,
        type: 'general',
        is_read: false,
      });
    }

    return Response.json({ alerts, count: alerts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});