import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Navigation } from 'lucide-react';

// Silently pushes GPS coords to the booking every 10 seconds while trip is in_progress
export default function CaregiverLocationTracker({ bookingId }) {
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (!bookingId) return;

    if (!navigator.geolocation) return;

    const pushLocation = (lat, lng) => {
      base44.entities.Booking.update(bookingId, {
        caregiver_lat: lat,
        caregiver_lng: lng,
        location_updated_at: new Date().toISOString(),
      }).catch(() => {});
    };

    // Get immediate position then poll every 10s
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastPosRef.current = pos;
        pushLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true }
    );

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lastPosRef.current = pos;
          pushLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }, 10000);

    return () => {
      clearInterval(intervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [bookingId]);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold">
      <Navigation className="w-3 h-3 animate-pulse" />
      Sharing your location with family
    </div>
  );
}