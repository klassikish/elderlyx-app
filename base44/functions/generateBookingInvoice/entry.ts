import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { booking_id } = payload;

    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    // Fetch booking details
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only email completed bookings
    if (booking.status !== 'completed') {
      return Response.json({ error: 'Booking not completed' }, { status: 400 });
    }

    // Calculate invoice details
    const basePrice = (booking.price || 0) - (booking.wait_charge || 0);
    const waitCharge = booking.wait_charge || 0;
    const totalAmount = booking.price || 0;
    const invoiceDate = new Date();
    const invoiceNumber = `INV-${booking_id.substring(0, 8).toUpperCase()}-${format(invoiceDate, 'yyyyMMdd')}`;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(31, 100, 182); // primary blue
    doc.text('INVOICE', margin, yPos);
    yPos += 12;

    // Invoice details
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Invoice Number: ${invoiceNumber}`, margin, yPos);
    yPos += 5;
    doc.text(`Date: ${format(invoiceDate, 'MMM dd, yyyy')}`, margin, yPos);
    yPos += 5;
    doc.text(`Service Date: ${format(new Date(booking.scheduled_date), 'MMM dd, yyyy')}`, margin, yPos);
    yPos += 12;

    // From / To section
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('From:', margin, yPos);
    yPos += 5;
    doc.setFontSize(10);
    doc.text('Elderlyx Care Services', margin, yPos);
    yPos += 4;
    doc.text('support@elderlyx.com', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.text('Billed To:', margin, yPos);
    yPos += 5;
    doc.setFontSize(10);
    doc.text(booking.family_name || 'Family', margin, yPos);
    yPos += 4;
    doc.text(booking.family_email || '', margin, yPos);
    yPos += 10;

    // Service details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Service Details:', margin, yPos);
    yPos += 6;

    // Table header
    doc.setFontSize(10);
    doc.setTextColor(48, 48, 48);
    const tableStartY = yPos;
    doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
    doc.text('Description', margin + 2, yPos + 4);
    doc.text('Amount', pageWidth - margin - 20, yPos + 4);
    yPos += 8;

    // Service line item
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const serviceDesc = `${booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} for ${booking.senior_name}`;
    doc.text(serviceDesc, margin + 2, yPos);
    doc.text(`$${basePrice.toFixed(2)}`, pageWidth - margin - 20, yPos);
    yPos += 7;

    // Wait charges (if any)
    if (waitCharge > 0) {
      doc.setTextColor(200, 100, 0);
      doc.text('Additional wait-time charges', margin + 2, yPos);
      doc.text(`$${waitCharge.toFixed(2)}`, pageWidth - margin - 20, yPos);
      yPos += 7;
    }

    // Total
    doc.setDrawColor(31, 100, 182);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    doc.setFontSize(12);
    doc.setTextColor(31, 100, 182);
    doc.setFont(undefined, 'bold');
    doc.text('Total Due:', margin + 2, yPos);
    doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin - 20, yPos);
    yPos += 12;

    // Payment info
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.setFont(undefined, 'normal');
    doc.text('Payment has been processed. Thank you for using Elderlyx!', margin, yPos);
    yPos += 6;
    doc.text('For questions, contact: support@elderlyx.com', margin, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(192, 192, 192);
    doc.text(`Generated on ${format(invoiceDate, 'PPpp')}`, margin, pageHeight - 10);

    // Get PDF as base64 for email attachment
    const pdfDataUrl = doc.output('dataurlstring');
    const pdfBase64 = pdfDataUrl.split(',')[1];

    // Send email with invoice
    const emailBody = `
Dear ${booking.family_name || 'Family'},

Thank you for using Elderlyx Care Services. Your invoice for the completed service is attached.

Service: ${booking.service_type === 'companionship' ? 'Companionship Care' : 'Transportation'} for ${booking.senior_name}
Date: ${format(new Date(booking.scheduled_date), 'MMMM dd, yyyy')}
Caregiver: ${booking.caregiver_name || 'Assigned caregiver'}
Amount: $${totalAmount.toFixed(2)}

If you have any questions about this invoice, please contact our support team at support@elderlyx.com.

Best regards,
Elderlyx Care Services
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: booking.family_email,
      subject: `Invoice ${invoiceNumber} - ${booking.senior_name}'s Care Service`,
      body: emailBody,
      from_name: 'Elderlyx Invoicing',
    });

    // Optional: Update booking with invoice sent flag
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      invoice_sent: true,
      invoice_sent_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      invoice_number: invoiceNumber,
      amount: totalAmount,
      email_sent_to: booking.family_email,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});