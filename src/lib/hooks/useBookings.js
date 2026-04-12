/**
 * Custom Hook: useBookings
 * Fetches and manages booking data with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useBookings(filters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const query = {};
      if (filters.caregiverId) query.caregiver_id = filters.caregiverId;
      if (filters.familyEmail) query.family_email = filters.familyEmail;
      if (filters.status) query.status = filters.status;

      return base44.entities.Booking.filter(query, '-created_date', filters.limit || 50);
    },
  });
}

export function useBooking(bookingId) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const bookings = await base44.entities.Booking.filter({ id: bookingId }, '-created_date', 1);
      return bookings[0] || null;
    },
    enabled: !!bookingId,
  });
}

export function useCarePacks(ownerEmail) {
  return useQuery({
    queryKey: ['care-packs', ownerEmail],
    queryFn: async () => {
      if (!ownerEmail) return [];
      return base44.entities.CarePack.filter(
        { owner_email: ownerEmail, status: 'active' },
        '-purchased_at'
      );
    },
    enabled: !!ownerEmail,
  });
}

export function useNotifications(userEmail) {
  return useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return base44.entities.Notification.filter(
        { user_email: userEmail, is_read: false },
        '-created_date',
        10
      );
    },
    enabled: !!userEmail,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}