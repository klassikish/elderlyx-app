import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription
    const userData = await base44.entities.User.list();
    const userRecord = userData.find(u => u.email === user.email);
    if (userRecord?.subscription_plan !== 'premium') {
      return Response.json(
        { error: 'Family Sharing is a Premium feature' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      member_email,
      member_name,
      member_phone,
      relationship,
      role,
      senior_name,
    } = body;

    if (!member_email || !member_name || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate invitation token
    const invitation_token = crypto.randomBytes(32).toString('hex');

    // Create family member record
    const member = await base44.asServiceRole.entities.FamilyMember.create({
      primary_account_email: user.email,
      senior_name: senior_name || 'Your loved one',
      member_email,
      member_name,
      member_phone: member_phone || '',
      relationship,
      role,
      status: 'pending',
      invitation_token,
    });

    // Send invitation email
    const inviteLink = `${Deno.env.get('BASE44_APP_URL') || 'https://app.elderlyx.com'}/accept-family-invite?token=${invitation_token}`;

    await base44.integrations.Core.SendEmail({
      to: member_email,
      subject: `${user.full_name} invited you to Elderlyx Family Sharing`,
      body: `Hi ${member_name},\n\n${user.full_name} invited you to join their Elderlyx family group to help care for ${senior_name}.\n\nAccept Invitation: ${inviteLink}\n\nYou'll be able to see Daily Life Playback, alerts, visit history, and more.\n\nBest,\nElderlyx Team`,
    }).catch(() => {});

    return Response.json({
      success: true,
      member_id: member.id,
      message: `Invitation sent to ${member_email}`,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});