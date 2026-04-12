import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only send for high/critical severity flags
    if (!['high', 'critical'].includes(data.severity)) {
      return Response.json({ skipped: true });
    }

    const admin = await base44.auth.me();
    if (admin?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const flagSeverityColor = data.severity === 'critical' ? '🔴' : '🟠';
    const subject = `[ALERT] High-Severity Flag: ${data.group_name}`;
    const body = `
A high-severity flag has been created for a family group.

${flagSeverityColor} Severity: ${data.severity.toUpperCase()}
📋 Group: ${data.group_name}
👤 Owner: ${data.primary_owner_email}
🏷️ Type: ${data.flag_type}

Description:
${data.description}

🔗 Action Required: Review this account in the Admin Dashboard immediately.
`;

    await base44.integrations.Core.SendEmail({
      to: admin.email,
      subject,
      body,
      from_name: 'Elderlyx Admin Alerts',
    });

    return Response.json({ sent: true, severity: data.severity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});