import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import jsPDF from 'npm:jspdf@4.0.0';

const PLAN_PRICES = {
  basic: 19,
  family: 39,
  premium: 69,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all active family groups
    const familyGroups = await base44.asServiceRole.entities.FamilyGroup.filter(
      { status: 'active' },
      '-created_date',
      1000
    );

    const invoices = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Generate invoice for each active family group
    for (const group of familyGroups) {
      try {
        // Check if invoice already exists for this month
        const existingInvoice = await base44.asServiceRole.entities.Invoice.filter(
          {
            family_group_id: group.id,
            billing_period_start: { $gte: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01` },
          },
          '-created_date',
          1
        );

        if (existingInvoice.length > 0) {
          console.log(`Invoice already exists for ${group.group_name}`);
          continue;
        }

        // Calculate billing period
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const amount = PLAN_PRICES[group.subscription_plan] || 19;

        // Generate PDF invoice
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header
        doc.setFillColor(33, 150, 243);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('INVOICE', 20, 25);

        // Company info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('Elderlyx', 20, 55);
        doc.text('Elder Care Platform', 20, 62);
        doc.text('support@elderlyx.com', 20, 69);

        // Invoice details
        doc.setFontSize(11);
        doc.text('Invoice Details', pageWidth - 80, 55);
        doc.setFontSize(9);
        doc.text(`Invoice #: ${group.id.slice(0, 8)}-${currentMonth}${currentYear}`, pageWidth - 80, 62);
        doc.text(`Date: ${now.toLocaleDateString()}`, pageWidth - 80, 69);

        // Bill to
        doc.setFontSize(11);
        doc.text('Bill To:', 20, 90);
        doc.setFontSize(9);
        doc.text(group.primary_owner_name || 'Family Owner', 20, 97);
        doc.text(group.primary_owner_email, 20, 104);

        // Items table
        const tableTop = 125;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, tableTop, pageWidth - 40, 10, 'F');

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Description', 25, tableTop + 7);
        doc.text('Plan', 120, tableTop + 7);
        doc.text('Amount', pageWidth - 40, tableTop + 7, { align: 'right' });

        doc.setFont(undefined, 'normal');
        const itemTop = tableTop + 20;
        doc.text(
          `Monthly Subscription (${new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
          25,
          itemTop
        );
        doc.text(group.subscription_plan.charAt(0).toUpperCase() + group.subscription_plan.slice(1), 120, itemTop);
        doc.text(`$${amount.toFixed(2)}`, pageWidth - 40, itemTop, { align: 'right' });

        // Total
        const totalTop = itemTop + 20;
        doc.setFont(undefined, 'bold');
        doc.text('Total:', 120, totalTop);
        doc.text(`$${amount.toFixed(2)}`, pageWidth - 40, totalTop, { align: 'right' });

        // Due date
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Due Date: ${new Date(currentYear, currentMonth, 10).toLocaleDateString()}`, 20, pageHeight - 40);

        // Payment terms
        doc.text('Payment Terms:', 20, pageHeight - 30);
        doc.text('Please pay within 10 days of invoice date. Thank you!', 20, pageHeight - 23);

        // Convert to blob and upload
        const pdfBytes = doc.output('arraybuffer');
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Create a File-like object
        const fileName = `invoice_${group.id.slice(0, 8)}_${currentMonth}${currentYear}.pdf`;
        const formData = new FormData();
        formData.append('file', blob, fileName);

        // Upload to base44
        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({
          file: blob,
        });

        // Create invoice record
        const invoice = await base44.asServiceRole.entities.Invoice.create({
          family_group_id: group.id,
          family_name: group.group_name,
          primary_owner_email: group.primary_owner_email,
          primary_owner_name: group.primary_owner_name,
          subscription_plan: group.subscription_plan,
          billing_period_start: startDate.toISOString().split('T')[0],
          billing_period_end: endDate.toISOString().split('T')[0],
          amount,
          description: `${group.subscription_plan} Plan - ${new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          pdf_url: uploadRes.file_url,
          status: 'sent',
          due_date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
        });

        invoices.push(invoice);

        // Send email to family owner
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: group.primary_owner_email,
          subject: `Your Elderlyx Monthly Invoice - ${new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          body: `Hello ${group.primary_owner_name || 'Family Owner'},

Your monthly Elderlyx subscription invoice is ready.

Plan: ${group.subscription_plan.charAt(0).toUpperCase() + group.subscription_plan.slice(1)} ($${amount}/month)
Billing Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
Amount Due: $${amount.toFixed(2)}
Due Date: ${new Date(currentYear, currentMonth, 10).toLocaleDateString()}

You can view and download your invoice from your Elderlyx account.

If you have any questions about this invoice, please contact our support team.

Best regards,
Elderlyx Support`,
        });

      } catch (err) {
        console.error(`Error generating invoice for ${group.group_name}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      invoicesGenerated: invoices.length,
      message: `Generated ${invoices.length} invoices for active subscriptions`,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});