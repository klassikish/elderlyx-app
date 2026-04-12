import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    const admin = await base44.auth.me();
    if (admin?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isLock = event.type === 'create';
    const subject = isLock
      ? `[ACTION] Group Locked: ${data.group_name}`
      : `[ACTION] Group Unlocked: ${data.group_name}`;

    const action = isLock ? 'LOCKED' : 'UNLOCKED';
    const actionText = isLock
      ? 'This group has been locked and all bookings/payments are disabled.'
      : 'This group has been unlocked and restrictions have been lifted.';

    const body = `
A family group lock status has changed.

🔐 Status: ${action}
📋 Group: ${data.group_name}
👤 Owner: ${data.primary_owner_email}
👨‍💼 Action By: ${data.locked_by_admin || data.unlocked_by_admin}

Lock Reason: ${data.lock_reason}
${data.lock_details ? `Details: ${data.lock_details}` : ''}

${actionText}

${isLock ? '⚠️ Restrictions Applied:' : '✅ Restrictions Lifted:'}
${isLock ? '- Bookings disabled\n- Payments disabled\n- Role changes disabled' : '- All features restored'}
`;

    await base44.integrations.Core.SendEmail({
      to: admin.email,
      subject,
      body,
      from_name: 'Elderlyx Admin Alerts',
    });

    return Response.json({ sent: true, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});