/**
 * Caregiver Service
 * Manages caregiver profiles, availability, verification, ratings
 */

import { base44 } from '@/api/base44Client';
import { CAREGIVER_BONUSES } from '@/lib/config/constants';

export const caregiverService = {
  /**
   * Get caregiver profile
   */
  async getProfile(caregiverId) {
    const users = await base44.entities.User.filter({ id: caregiverId }, '-created_date', 1);
    return users[0] || null;
  },

  /**
   * Update caregiver availability
   */
  async setAvailability(caregiverId, isAvailable) {
    return base44.auth.updateMe({
      caregiver_available: isAvailable,
    });
  },

  /**
   * Get caregiver's completed bookings
   */
  async getCompletedBookings(caregiverId, limit = 50) {
    return base44.entities.Booking.filter(
      { caregiver_id: caregiverId, status: 'completed' },
      '-created_date',
      limit
    );
  },

  /**
   * Calculate earned bonus based on visit count
   */
  calculateBonus(completedVisitCount) {
    if (completedVisitCount >= CAREGIVER_BONUSES.thirtyVisits.visits) {
      return CAREGIVER_BONUSES.thirtyVisits.bonusAmount;
    }
    if (completedVisitCount >= CAREGIVER_BONUSES.twentyVisits.visits) {
      return CAREGIVER_BONUSES.twentyVisits.bonusAmount;
    }
    if (completedVisitCount >= CAREGIVER_BONUSES.tenVisits.visits) {
      return CAREGIVER_BONUSES.tenVisits.bonusAmount;
    }
    return 0;
  },

  /**
   * Get caregiver availability schedule
   */
  async getAvailabilitySchedule(caregiverId) {
    return base44.entities.CaregiverAvailability.filter(
      { caregiver_id: caregiverId },
      '-day_of_week'
    );
  },

  /**
   * Set availability for a day/time slot
   */
  async setAvailabilitySlot(caregiverId, dayOfWeek, startTime, endTime, isAvailable) {
    return base44.entities.CaregiverAvailability.create({
      caregiver_id: caregiverId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable,
    });
  },

  /**
   * Update caregiver rating
   */
  async updateRating(caregiverId, newRating) {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    return base44.auth.updateMe({ rating: newRating });
  },
};