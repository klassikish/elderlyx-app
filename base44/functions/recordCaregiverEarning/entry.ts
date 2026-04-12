import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Called after a booking is completed to record caregiver earnings
// Handles: base pay, premium bonus (every 10 tasks, high rating), overage split
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id } = await req.json();

    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status !== 'completed') return Response.json({ error: 'Booking not completed' }, { status: 400 });

    const caregiver_id = booking.caregiver_id;
    if (!caregiver_id) return Response.json({ error: 'No caregiver assigned' }, { status: 400 });

    // Fetch caregiver user record
    const caregiverUsers = await base44.asServiceRole.entities.User.list();
    const caregiver = caregiverUsers.find(u => u.id === caregiver_id);

    // --- Base pay ---
    let base_pay = booking.service_type === 'transportation' ? 40 : 35;

    // --- Overage split (caregiver gets 50% of $10 extra charge = $5) ---
    // Extra tasks / time overage on companionship billed at +$10, caregiver gets $5
    const overage_charge = booking.overage_charge || 0;
    const overage_pay = overage_charge * 0.5;

    // --- Wait charge on transportation: caregiver gets 70%, company 30% ---
    const wait_charge = booking.wait_charge || 0;
    const wait_pay = wait_charge * 0.7;

    // --- Premium bonus: $40 for every 10 completed tasks, high activity + good rating ---
    let bonus_pay = 0;
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({
      caregiver_id,
      status: 'completed',
    });
    const completedCount = completedBookings.length;
    const caregiverRating = caregiver?.rating || 0;
    const isHighActivity = completedCount >= 10;
    const isGoodRating = caregiverRating >= 4.0;

    if (isHighActivity && isGoodRating) {
      // Award $40 bonus for each new milestone of 10 (e.g. 10th, 20th, 30th job)
      if (completedCount % 10 === 0) {
        bonus_pay = 40;
      }
    }

    const total_pay = base_pay + overage_pay + wait_pay + bonus_pay;

    // Week start (Monday of current week)
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    const week_start = weekStart.toISOString().split('T')[0];

    const earning = await base44.asServiceRole.entities.CaregiverEarning.create({
      caregiver_id,
      caregiver_name: caregiver?.full_name || booking.caregiver_name,
      caregiver_email: caregiver?.email || '',
      booking_id,
      service_type: booking.service_type,
      senior_name: booking.senior_name,
      base_pay,
      bonus_pay,
      overage_pay: overage_pay + wait_pay,
      total_pay,
      week_start,
      payout_status: 'pending',
    });

    return Response.json({ success: true, earning });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});