import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    const admin = await base44.auth.me();
    if (admin?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only alert if score dropped by 15+ points
    const scoreChange = old_data?.overall_score ? data.overall_score - old_data.overall_score : 0;
    if (scoreChange > -15) {
      return Response.json({ skipped: true, reason: 'Score change not significant' });
    }

    const subject = `⚠️ Health Score Alert: ${data.group_name} (${Math.round(data.overall_score)}/100)`;
    const body = `
A family group's health score has declined significantly.

📊 Current Score: ${Math.round(data.overall_score)}/100
📉 Change: ${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)} points
📋 Group: ${data.group_name}
👤 Owner: ${data.primary_owner_email}

Score Breakdown:
- Activity: ${Math.round(data.activity_score)}/100
- Payment: ${Math.round(data.payment_score)}/100
- Engagement: ${Math.round(data.engagement_score)}/100
- Compliance: ${Math.round(data.compliance_score)}/100

Risk Factors:
${data.risk_factors?.length > 0 ? data.risk_factors.map(f => `• ${f}`).join('\n') : '• No specific risk factors identified'}

💡 Note: ${data.calculation_notes || 'Review account for concerns'}

🔗 Review in Admin Dashboard to determine if action is needed.
`;

    await base44.integrations.Core.SendEmail({
      to: admin.email,
      subject,
      body,
      from_name: 'Elderlyx Admin Alerts',
    });

    return Response.json({ sent: true, scoreChange });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});