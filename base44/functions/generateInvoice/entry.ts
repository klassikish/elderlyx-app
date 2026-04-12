import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { month, year } = await req.json(); // e.g. { month: 3, year: 2026 }

    const allBookings = await base44.entities.Booking.filter(
      { family_email: user.email, status: 'completed' },
      '-scheduled_date',
      200
    );

    // Filter to the requested month/year
    const bookings = allBookings.filter(b => {
      const d = new Date(b.scheduled_date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header ─────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235); // primary blue
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Elderlyx', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Care Services Invoice', 14, 24);
    doc.text(`${monthName} ${year}`, 14, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Billed to: ${user.full_name}`, 14, 48);
    doc.text(`Email: ${user.email}`, 14, 55);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 62);

    // ── Table header ────────────────────────────────────────────
    let y = 75;
    doc.setFillColor(240, 244, 255);
    doc.rect(14, y - 5, pageW - 28, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Date', 14, y);
    doc.text('Service', 45, y);
    doc.text('Senior', 90, y);
    doc.text('Base', 140, y);
    doc.text('Wait Charge', 160, y);
    doc.text('Total', 190, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    let grandTotal = 0;
    let totalBase = 0;
    let totalWait = 0;

    bookings.forEach((b, i) => {
      if (y > 265) { doc.addPage(); y = 20; }

      const date = new Date(b.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const base = (b.price || 0) - (b.wait_charge || 0);
      const wait = b.wait_charge || 0;
      const total = b.price || 0;
      totalBase += base;
      totalWait += wait;
      grandTotal += total;

      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y - 4, pageW - 28, 8, 'F');
      }

      doc.setFontSize(8);
      doc.text(date, 14, y);
      doc.text(b.service_type === 'companionship' ? 'Companionship' : 'Transportation', 45, y);
      doc.text((b.senior_name || '—').slice(0, 18), 90, y);
      doc.text(`$${base.toFixed(2)}`, 140, y);
      doc.text(wait > 0 ? `+$${wait.toFixed(2)}` : '—', 160, y);
      doc.text(`$${total.toFixed(2)}`, 190, y);
      y += 8;
    });

    if (bookings.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No completed bookings for this period.', 14, y + 8);
      doc.setTextColor(0, 0, 0);
    }

    // ── Totals summary ──────────────────────────────────────────
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal (base fees):', 130, y); doc.text(`$${totalBase.toFixed(2)}`, 190, y); y += 7;
    if (totalWait > 0) {
      doc.setTextColor(200, 50, 50);
      doc.text('Wait-time surcharges:', 130, y); doc.text(`+$${totalWait.toFixed(2)}`, 190, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.rect(125, y - 5, pageW - 139, 10, 'F');
    doc.text('Total Due:', 130, y);
    doc.text(`$${grandTotal.toFixed(2)}`, 190, y);
    doc.setTextColor(0, 0, 0);

    y += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for choosing Elderlyx. Payment is collected after each visit.', 14, y);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Elderlyx_Invoice_${monthName}_${year}.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});