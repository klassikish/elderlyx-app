import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { booking_id, lat, lng } = payload;

    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    // Fetch booking
    const booking = await base44.entities.Booking.get(booking_id);
    if (!booking || booking.caregiver_id !== user.id) {
      return Response.json({ error: 'Unauthorized for this booking' }, { status: 403 });
    }

    // Find active check-in log
    const logs = await base44.entities.CheckInLog.filter({ booking_id }, '-check_in_time', 1);
    const log = logs.find(l => !l.check_out_time);
    if (!log) return Response.json({ error: 'No active check-in found' }, { status: 400 });

    const checkOutTime = new Date();
    const durationMinutes = Math.round((checkOutTime - new Date(log.check_in_time)) / 60000);
    const durationHours = durationMinutes / 60;

    // Calculate base pay (from booking price or hourly rate)
    let basePay = 0;
    let waitCharge = 0;

    if (booking.service_type === 'transportation') {
      // $40 customer pays, $28 to caregiver, $12 to company
      const freeWaitMinutes = booking.free_wait_minutes || 30;
      const overage = Math.max(0, durationMinutes - freeWaitMinutes);
      
      basePay = 28; // Caregiver gets $28 per trip
      if (overage > 0) {
        waitCharge = Math.ceil(overage / 15) * 8; // $8 per 15 min overage
      }
    } else {
      // Companionship: $24 to caregiver, $11 to company per hour
      const caregiverHourlyRate = 24;
      basePay = Math.ceil(durationHours * caregiverHourlyRate);
    }

    const totalPay = basePay + waitCharge;

    // Update check-in log with checkout details
    await base44.entities.CheckInLog.update(log.id, {
      check_out_time: checkOutTime.toISOString(),
      check_out_lat: lat,
      check_out_lng: lng,
      duration_minutes: durationMinutes,
      base_pay: basePay,
      wait_charge: waitCharge,
      total_pay: totalPay,
    });

    // Mark booking as completed and update pricing
    await base44.entities.Booking.update(booking_id, {
      status: 'completed',
      price: totalPay,
      wait_charge: waitCharge,
      trip_completed_at: checkOutTime.toISOString(),
    });

    // Calculate caregiver share: +$10 per extra task (first task included in base)
    const extraTaskCount = Math.max(0, (booking.selected_tasks?.length || 1) - 1);
    const extraTaskPay = extraTaskCount * 10; // Caregiver gets $10 per extra task

    // Create caregiver earning record
    await base44.entities.CaregiverEarning.create({
      caregiver_id: user.id,
      caregiver_name: user.full_name,
      caregiver_email: user.email,
      booking_id,
      service_type: booking.service_type,
      senior_name: booking.senior_name,
      base_pay: basePay + extraTaskPay,
      bonus_pay: 0,
      total_pay: totalPay + extraTaskPay,
    });

    return Response.json({
      success: true,
      duration_hours: parseFloat(durationHours.toFixed(2)),
      base_pay: basePay,
      wait_charge: waitCharge,
      pay: totalPay,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});