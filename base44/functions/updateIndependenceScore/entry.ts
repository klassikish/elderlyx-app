import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { assessment_id } = await req.json();

    // Fetch the submitted assessment
    const assessments = await base44.asServiceRole.entities.IndependenceAssessment.filter({ id: assessment_id }, '-created_date', 1);
    if (!assessments.length) return Response.json({ error: 'Assessment not found' }, { status: 404 });
    const current = assessments[0];

    // Get previous assessments for this senior
    const previous = await base44.asServiceRole.entities.IndependenceAssessment.filter(
      { family_email: current.family_email, senior_name: current.senior_name },
      '-created_date',
      10
    );
    // Exclude current assessment
    const history = previous.filter(a => a.id !== current.id);

    if (history.length > 0) {
      const lastScore = history[0].total_score;
      const drop = lastScore - current.total_score;

      // Alert if score dropped by 10+ points
      if (drop >= 10) {
        await base44.asServiceRole.entities.Alert.create({
          senior_id: current.senior_name,
          title: `Independence Score dropped significantly for ${current.senior_name}`,
          description: `Score dropped by ${drop} points (from ${lastScore} → ${current.total_score}) after visit on ${new Date().toLocaleDateString()}. Caregiver: ${current.caregiver_name}.`,
          severity: drop >= 20 ? 'critical' : 'warning',
          category: 'general',
          is_read: false,
          action_taken: false,
        });

        // Notify the family
        await base44.asServiceRole.entities.Notification.create({
          user_email: current.family_email,
          title: `⚠ Independence score alert for ${current.senior_name}`,
          body: `Score dropped by ${drop} points to ${current.total_score}/100. Review the latest report.`,
          type: 'general',
          is_read: false,
        });
      }

      // Alert if concerns were flagged
      if (current.concerns && current.concerns.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: current.family_email,
          title: `Concerns flagged for ${current.senior_name}`,
          body: `${current.concerns.length} concern(s): ${current.concerns.slice(0, 3).join(', ')}`,
          type: 'general',
          is_read: false,
        });
      }
    }

    return Response.json({ ok: true, score: current.total_score });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});