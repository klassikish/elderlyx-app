import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, LogIn, LogOut, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GEOLOCATION_RADIUS = 100; // meters

export default function CaregiverCheckIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get active booking for today
  const { data: bookings = [] } = useQuery({
    queryKey: ['caregiver-active-booking', user?.id],
    queryFn: () => base44.entities.Booking.filter({ caregiver_id: user?.id, status: 'confirmed' }, '-scheduled_date', 10),
    enabled: !!user?.id,
  });

  const activeBooking = bookings.find(b => {
    const bookingDate = new Date(b.scheduled_date);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  useEffect(() => {
    if (activeBooking) setBooking(activeBooking);
  }, [activeBooking]);

  // Get current geolocation
  const handleGetLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy });

        // Calculate distance to booking address
        if (booking?.lat && booking?.lng) {
          const dist = calcDistance(latitude, longitude, booking.lat, booking.lng);
          setDistance(Math.round(dist));
        }
        setLoading(false);
      },
      () => {
        toast.error('Could not get location');
        setLoading(false);
      }
    );
  };

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!location) throw new Error('Location required');
      if (!booking) throw new Error('No active booking');
      if (distance > GEOLOCATION_RADIUS) throw new Error(`Too far away (${distance}m)`);

      const res = await base44.functions.invoke('checkInCaregiver', {
        booking_id: booking.id,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Checked in successfully');
      setCheckedIn(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error('No active booking');
      const res = await base44.functions.invoke('checkOutCaregiver', {
        booking_id: booking.id,
        lat: location?.lat,
        lng: location?.lng,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Checked out. Duration: ${data.duration_hours}h, Pay: $${data.pay.toFixed(2)}`);
      setCheckedIn(false);
      setBooking(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const canCheckIn = location && distance !== null && distance <= GEOLOCATION_RADIUS && !checkedIn;
  const canCheckOut = checkedIn && booking;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">Check In/Out</h1>
      </div>

      <div className="px-5 pt-6 pb-10 max-w-md mx-auto">
        {!booking ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active bookings for today</p>
            <Button variant="outline" className="mt-4 rounded-xl w-full" onClick={() => navigate('/MyBookings')}>
              View My Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Booking info */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <p className="font-semibold text-foreground text-sm">{booking.senior_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(booking.scheduled_date).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {booking.address || booking.pickup_address}
              </div>
            </div>

            {/* Geolocation section */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-foreground text-sm">Location Verification</p>
              
              <Button
                className="w-full rounded-xl h-11 gap-2"
                onClick={handleGetLocation}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Getting location…
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" /> Get My Location
                  </>
                )}
              </Button>

              {location && (
                <div className="bg-muted rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Latitude</span>
                    <span className="font-mono font-semibold">{location.lat.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Longitude</span>
                    <span className="font-mono font-semibold">{location.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-semibold">{location.accuracy.toFixed(0)}m</span>
                  </div>
                </div>
              )}

              {distance !== null && (
                <div className={`rounded-xl p-3 flex items-center gap-2 ${
                  distance <= GEOLOCATION_RADIUS
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {distance <= GEOLOCATION_RADIUS ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-semibold">{distance}m away</p>
                    <p className="text-[10px] opacity-80">
                      {distance <= GEOLOCATION_RADIUS
                        ? 'You are at the location ✓'
                        : `Too far away (max ${GEOLOCATION_RADIUS}m)`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Check In/Out buttons */}
            <div className="space-y-2">
              {!checkedIn ? (
                <Button
                  className="w-full h-12 rounded-2xl gap-2 font-semibold"
                  onClick={() => checkInMutation.mutate()}
                  disabled={!canCheckIn || checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking in…
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Check In
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full h-12 rounded-2xl gap-2 font-semibold bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={!canCheckOut || checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking out…
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" /> Check Out
                    </>
                  )}
                </Button>
              )}
            </div>

            {checkedIn && (
              <div className="bg-green-100 border border-green-300 rounded-2xl p-4 text-center">
                <p className="text-sm font-semibold text-green-700 flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4" /> You are checked in
                </p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Your check-in time and location are recorded for accurate payment calculation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}