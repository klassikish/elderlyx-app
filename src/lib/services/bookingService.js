/**
 * Booking Service
 * Handles all booking-related operations: creation, status updates, cancellations
 */

import { base44 } from '@/api/base44Client';
import { BOOKING_STATUS } from '@/lib/config/constants';

export const bookingService = {
  /**
   * Fetch bookings with optional filters
   * @param {object} filters - { caregiverId, familyEmail, status, limit }
   */
  async getBookings(filters = {}) {
    const query = {};
    if (filters.caregiverId) query.caregiver_id = filters.caregiverId;
    if (filters.familyEmail) query.family_email = filters.familyEmail;
    if (filters.status) query.status = filters.status;

    return base44.entities.Booking.filter(query, '-created_date', filters.limit || 50);
  },

  /**
   * Get a single booking by ID
   */
  async getBooking(bookingId) {
    const bookings = await base44.entities.Booking.filter({ id: bookingId }, '-created_date', 1);
    return bookings[0] || null;
  },

  /**
   * Create a new booking
   */
  async createBooking(data) {
    if (!data.serviceType || !data.scheduledDate || !data.price) {
      throw new Error('Missing required booking fields: serviceType, scheduledDate, price');
    }
    return base44.entities.Booking.create(data);
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status) {
    if (!Object.values(BOOKING_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    return base44.entities.Booking.update(bookingId, { status });
  },

  /**
   * Complete a booking and save the visit report
   */
  async completeBooking(bookingId, visitData) {
    await this.updateBookingStatus(bookingId, BOOKING_STATUS.completed);
    return base44.entities.VisitPlayback.create({
      booking_id: bookingId,
      ...visitData,
    });
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, reason = '') {
    return base44.entities.Booking.update(bookingId, {
      status: BOOKING_STATUS.cancelled,
      cancellationReason: reason,
    });
  },

  /**
   * Get earnings for a caregiver in a date range
   */
  async getCaregiverEarnings(caregiverId, startDate, endDate) {
    const bookings = await base44.entities.Booking.filter({
      caregiver_id: caregiverId,
      status: BOOKING_STATUS.completed,
    });

    return bookings
      .filter(b => new Date(b.created_date) >= startDate && new Date(b.created_date) <= endDate)
      .reduce((sum, b) => sum + (b.price || 0), 0);
  },
};