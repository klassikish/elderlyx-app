import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only send on creation
    if (event.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const subject = `Welcome to Elderlyx Family Groups - ${data.group_name}`;
    const body = `
Welcome to Elderlyx! Your family group has been created.

👋 Hello,

Your family group "${data.group_name}" is now active and ready to use.

📋 Group Details:
- Group Name: ${data.group_name}
- Care Recipient: ${data.senior_name || 'Not yet assigned'}
- Plan: ${data.subscription_plan}
- Created: ${new Date().toLocaleDateString()}

🚀 Next Steps:
1. Complete your family profile
2. Invite family members to join
3. Schedule your first visit
4. Set up emergency contacts

👥 Invite Family Members:
Share your family group link with family members and caregivers. They can accept invitations and join at their own pace.

📞 Need Help?
Visit our help center or contact support if you have any questions.

💙 Thank you for choosing Elderlyx. Together, we're ensuring your loved ones receive the best care.
`;

    await base44.integrations.Core.SendEmail({
      to: data.primary_owner_email,
      subject,
      body,
      from_name: 'Elderlyx Care Team',
    });

    return Response.json({ sent: true, group: data.group_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});