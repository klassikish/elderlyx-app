import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get invoices with failed payment status and due date passed
    const now = new Date();
    const failedInvoices = await base44.asServiceRole.entities.Invoice.filter(
      {
        status: 'failed',
        due_date: { $lt: now.toISOString().split('T')[0] },
      },
      '-created_date',
      1000
    );

    const reminders = [];

    for (const invoice of failedInvoices) {
      try {
        // Don't send more than 3 reminders
        if ((invoice.reminder_sent_count || 0) >= 3) {
          console.log(`Max reminders reached for invoice ${invoice.id}`);
          continue;
        }

        // Check if reminder was sent recently (within last 3 days)
        if (invoice.last_reminder_sent_at) {
          const lastReminder = new Date(invoice.last_reminder_sent_at);
          const daysSinceReminder = Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24));
          if (daysSinceReminder < 3) {
            console.log(`Reminder sent recently for invoice ${invoice.id}`);
            continue;
          }
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

        // Send reminder email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.primary_owner_email,
          subject: `⚠️ Payment Reminder: Overdue Invoice - Elderlyx Subscription`,
          body: `Hello ${invoice.primary_owner_name || 'Family Owner'},

This is a friendly reminder that your Elderlyx subscription payment is now overdue.

Invoice Details:
- Invoice #: ${invoice.id.slice(0, 8)}
- Amount Due: $${invoice.amount.toFixed(2)}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Days Overdue: ${daysOverdue}
- Plan: ${invoice.subscription_plan.charAt(0).toUpperCase() + invoice.subscription_plan.slice(1)}

Action Required:
Please update your payment method or submit payment as soon as possible to avoid service interruption.

Billing Period: ${invoice.billing_period_start} to ${invoice.billing_period_end}

If you've already made this payment, please disregard this message. If you're experiencing issues with payment, please contact our support team immediately at support@elderlyx.com.

Best regards,
Elderlyx Billing Team`,
        });

        // Update invoice with reminder tracking
        const newReminderCount = (invoice.reminder_sent_count || 0) + 1;
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          reminder_sent_count: newReminderCount,
          last_reminder_sent_at: now.toISOString(),
        });

        reminders.push({
          invoiceId: invoice.id,
          email: invoice.primary_owner_email,
          amount: invoice.amount,
          reminderCount: newReminderCount,
        });

      } catch (err) {
        console.error(`Error sending reminder for invoice ${invoice.id}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      remindersSent: reminders.length,
      details: reminders,
      message: `Sent ${reminders.length} payment failure reminders`,
    });
  } catch (error) {
    console.error('Payment reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});