import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // Skip if already assigned or not pending
    if (booking.caregiver_id || booking.status !== 'pending') {
      return Response.json({ success: false, reason: 'booking_not_available' });
    }

    // Fetch all available caregivers
    const allCaregivers = await base44.asServiceRole.entities.Helper.list('-rating', 1000);
    const caregiverAvailability = await base44.asServiceRole.entities.CaregiverAvailability.list('', 1000);

    // Helper function: calculate distance (Haversine formula in km)
    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Helper function: check time slot availability
    const isAvailableAtTime = (caregiver, slotStart, slotEnd, availabilityRecords) => {
      const caregiverAvail = availabilityRecords.filter(a => a.caregiver_id === caregiver.id);
      if (caregiverAvail.length === 0) return true; // No availability set = available
      
      const slotDate = new Date(slotStart);
      const dayOfWeek = slotDate.getDay();
      
      const dayAvail = caregiverAvail.filter(a => a.day_of_week === dayOfWeek);
      if (dayAvail.length === 0) return false; // Not available this day
      
      // Check if slot falls within availability window
      const slotHour = slotDate.getHours();
      return dayAvail.some(a => {
        const startHour = parseInt(a.start_time.split(':')[0]);
        const endHour = parseInt(a.end_time.split(':')[0]);
        return slotHour >= startHour && slotHour < endHour;
      });
    };

    // Helper function: match service specialization
    const skillMatch = (caregiver, serviceType) => {
      const skills = caregiver.skills || [];
      if (serviceType === 'companionship') {
        return skills.includes('companionship') ? 1.0 : 0.5;
      }
      if (serviceType === 'transportation') {
        return skills.includes('transport') ? 1.0 : 0.5;
      }
      return 0.5;
    };

    // Geocode booking address (simplified: use provided lat/lng or defaults)
    const bookingLat = booking.lat || 40.7128; // NYC fallback
    const bookingLng = booking.lng || -74.0060;

    // Score all caregivers
    const scoredCaregivers = allCaregivers
      .filter(c => c.available && c.background_check_clear)
      .map(caregiver => {
        let score = 0;

        // 1. Proximity score (0-40 points)
        // Closer = higher score. 10km+ = 0 points, <1km = 40 points
        const distance = calcDistance(
          bookingLat,
          bookingLng,
          caregiver.lat || bookingLat,
          caregiver.lng || bookingLng
        );
        const proximityScore = Math.max(0, 40 * (1 - distance / 10));
        score += proximityScore;

        // 2. Availability score (0-30 points)
        const available = isAvailableAtTime(
          caregiver,
          booking.scheduled_date,
          new Date(new Date(booking.scheduled_date).getTime() + (booking.duration_hours || 1) * 3600000),
          caregiverAvailability
        );
        if (available) score += 30;

        // 3. Specialization score (0-20 points)
        const specScore = skillMatch(caregiver, booking.service_type) * 20;
        score += specScore;

        // 4. Rating boost (0-10 points)
        const ratingScore = Math.min(10, (caregiver.rating || 0) / 5 * 10);
        score += ratingScore;

        return {
          caregiver_id: caregiver.id,
          caregiver_name: caregiver.full_name,
          caregiver_email: caregiver.created_by,
          score: Math.round(score),
          distance: Math.round(distance * 10) / 10,
          available,
          skillMatch: skillMatch(caregiver, booking.service_type),
          rating: caregiver.rating || 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Top 3 matches
    const topMatches = scoredCaregivers.slice(0, 3);

    if (topMatches.length === 0) {
      // Mark for manual assignment if no good matches
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        needs_manual_assignment: true,
      });
      return Response.json({
        success: false,
        reason: 'no_suitable_matches',
        message: 'No caregivers matched criteria',
      });
    }

    // Store matched caregivers on booking
    const matchedIds = topMatches.map(m => m.caregiver_id);
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      matched_caregivers: matchedIds,
    });

    // Send notification to top match
    const topMatch = topMatches[0];
    const bookingUrl = `${Deno.env.get('APP_URL') || 'https://elderlyx.com'}/MyBookings`;
    
    await base44.integrations.Core.SendEmail({
      to: topMatch.caregiver_email,
      subject: `New Booking Match: ${booking.service_type} for ${booking.senior_name}`,
      body: `
Hi ${topMatch.caregiver_name},

We found a great match for you!

Service: ${booking.service_type === 'companionship' ? 'Companionship Care' : 'Transportation'}
Senior: ${booking.senior_name}
Date: ${new Date(booking.scheduled_date).toLocaleString()}
Location: ${booking.address || booking.pickup_address}
Distance: ${topMatch.distance} km away
Rate: $${booking.price}

Match Score: ${topMatch.score}% (based on proximity, availability, and skills)

${topMatch.available ? '✓ You are available at this time' : '⚠ Time slot may conflict with your schedule'}

View this booking and accept/decline: ${bookingUrl}

Best regards,
Elderlyx Matching Engine
      `.trim(),
      from_name: 'Elderlyx Matching',
    });

    return Response.json({
      success: true,
      booking_id,
      matched_count: topMatches.length,
      top_match: topMatch,
      all_matches: topMatches.map(m => ({ ...m, caregiver_email: undefined })),
    });
  } catch (error) {
    console.error('Matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});