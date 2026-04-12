import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { MapPin, Timer, CheckCircle2, DollarSign, Navigation, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FREE_MINUTES_BY_PLAN = { basic: 30, family: 45, premium: 45 };
const CHARGE_PER_BLOCK = 8;
const BLOCK_MINUTES = 15;
const MAX_DISTANCE_METERS = 300; // must be within 300m
const ABUSE_THRESHOLD = 3;       // 3 bad attempts → alert admin

function calcCharges(elapsedSeconds, freeMinutes) {
  const totalMinutes = elapsedSeconds / 60;
  if (totalMinutes <= freeMinutes) return 0;
  const blocks = Math.ceil((totalMinutes - freeMinutes) / BLOCK_MINUTES);
  return blocks * CHARGE_PER_BLOCK;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GPS check hook — returns { checking, nearbyStatus: 'near'|'far'|'unknown', getLocation }
function useProximityCheck(bookingLat, bookingLng) {
  const [status, setStatus] = useState('idle'); // idle | checking | near | far | unsupported
  const [distanceM, setDistanceM] = useState(null);

  const check = () => {
    if (!navigator.geolocation) { setStatus('unsupported'); return Promise.resolve('unsupported'); }
    if (!bookingLat || !bookingLng) { setStatus('unknown'); return Promise.resolve('unknown'); }
    setStatus('checking');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = haversineMeters(pos.coords.latitude, pos.coords.longitude, bookingLat, bookingLng);
          setDistanceM(Math.round(d));
          const result = d <= MAX_DISTANCE_METERS ? 'near' : 'far';
          setStatus(result);
          resolve(result);
        },
        () => { setStatus('unknown'); resolve('unknown'); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return { status, distanceM, check };
}

export default function TransportTimer({ booking, familyPlan = 'basic' }) {
  const { user } = useAuth();
  const freeMinutes = FREE_MINUTES_BY_PLAN[familyPlan] || 30;
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const badAttempts = useRef(0);

  useEffect(() => {
    if (!booking.arrived_at_destination || booking.trip_completed_at) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [booking.arrived_at_destination, booking.trip_completed_at]);

  // Use booking lat/lng as the reference point (geocoded by matchCaregivers)
  const refLat = booking.lat;
  const refLng = booking.lng;
  const arrivedProx = useProximityCheck(refLat, refLng);
  const completeProx = useProximityCheck(refLat, refLng);

  const arrivedMutation = useMutation({
    mutationFn: () => base44.entities.Booking.update(booking.id, {
      arrived_at_destination: new Date().toISOString(),
      status: 'in_progress',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caregiver-bookings'] });
      toast.success(`✅ Timer started! ${freeMinutes} min free wait begins now.`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const elapsed = (Date.now() - new Date(booking.arrived_at_destination).getTime()) / 1000;
      const waitCharge = calcCharges(elapsed, freeMinutes);
      const totalPrice = (booking.price || 0) + waitCharge;
      await base44.entities.Booking.update(booking.id, {
        trip_completed_at: new Date().toISOString(),
        wait_charge: waitCharge,
        price: totalPrice,
        status: 'completed',
      });
      base44.functions.invoke('recordCaregiverEarning', { booking_id: booking.id }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caregiver-bookings'] });
      toast.success('🎉 Trip completed! Charges finalized.');
    },
  });

  // Wrapper: GPS check → if far, track abuse; if near, execute action
  const withProximityCheck = async (proxHook, action, label) => {
    const result = await proxHook.check();
    if (result === 'near' || result === 'unknown') {
      // unknown = no job coords, allow with warning
      if (result === 'unknown') toast.warning('Location data unavailable — proceeding without GPS verification.');
      action();
    } else if (result === 'far') {
      badAttempts.current += 1;
      const dist = proxHook.distanceM;
      toast.error(`❌ You must be within ${MAX_DISTANCE_METERS}m of the pickup location. You are ~${dist}m away.`);
      if (badAttempts.current >= ABUSE_THRESHOLD) {
        base44.functions.invoke('reportTimerAbuse', {
          booking_id: booking.id,
          caregiver_id: user?.id,
          caregiver_name: user?.full_name,
          action_attempted: label,
          attempts: badAttempts.current,
          distance_meters: dist,
        }).catch(() => {});
        toast.error('⚠️ Repeated attempts flagged. Admin has been notified.');
        badAttempts.current = 0;
      }
    } else if (result === 'unsupported') {
      toast.error('GPS not supported on this device.');
    }
  };

  // ── Not yet arrived ──────────────────────────────────────────
  if (!booking.arrived_at_destination) {
    const checking = arrivedProx.status === 'checking';
    return (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">Transportation Timer</p>
            <p className="text-xs text-blue-600 mt-0.5">First <strong>{freeMinutes} min</strong> free · $8 per 15 min after</p>
          </div>
        </div>

        {refLat ? (
          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 bg-blue-100 rounded-xl px-3 py-2">
            <Navigation className="w-3 h-3" />
            GPS verification active — must be within {MAX_DISTANCE_METERS}m of pickup
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
            <AlertTriangle className="w-3 h-3" />
            No GPS reference for this job — location check skipped
          </div>
        )}

        <Button
          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
          onClick={() => withProximityCheck(arrivedProx, () => arrivedMutation.mutate(), 'arrived')}
          disabled={checking || arrivedMutation.isPending}
        >
          {checking || arrivedMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying location…</>
            : <><MapPin className="w-4 h-4 mr-2" /> Arrived at Destination</>}
        </Button>
      </div>
    );
  }

  // ── Timer running ────────────────────────────────────────────
  if (!booking.trip_completed_at) {
    const elapsedSec = (now - new Date(booking.arrived_at_destination).getTime()) / 1000;
    const elapsedMin = elapsedSec / 60;
    const charge = calcCharges(elapsedSec, freeMinutes);
    const freeRemaining = Math.max(0, freeMinutes - elapsedMin);
    const isCharging = elapsedMin > freeMinutes;
    const checking = completeProx.status === 'checking';

    return (
      <div className={`mt-3 rounded-2xl border p-4 space-y-3 ${isCharging ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        {/* Live clock */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isCharging ? 'bg-red-500' : 'bg-green-500'}`} />
            <Timer className={`w-4 h-4 ${isCharging ? 'text-red-600' : 'text-green-600'}`} />
            <span className={`text-xs font-bold ${isCharging ? 'text-red-700' : 'text-green-700'}`}>
              {isCharging ? 'Overage Running' : 'Free Wait'}
            </span>
          </div>
          <span className={`text-3xl font-mono font-black tabular-nums ${isCharging ? 'text-red-600' : 'text-green-700'}`}>
            {formatTime(elapsedSec)}
          </span>
        </div>

        {/* Wait breakdown */}
        <div className={`rounded-xl p-3 space-y-1.5 text-xs ${isCharging ? 'bg-red-100/60' : 'bg-green-100/60'}`}>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Free wait included</span>
            <span className="font-semibold">{freeMinutes} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Elapsed</span>
            <span className="font-semibold">{Math.floor(elapsedMin)} min {Math.floor((elapsedMin % 1) * 60)}s</span>
          </div>
          {!isCharging ? (
            <div className="flex justify-between text-green-700 font-semibold border-t border-green-200 pt-1">
              <span>Free time remaining</span>
              <span>{Math.floor(freeRemaining)} min {Math.floor((freeRemaining % 1) * 60)}s</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-red-600 border-t border-red-200 pt-1">
                <span>Overage</span>
                <span className="font-semibold">{Math.ceil(elapsedMin - freeMinutes)} min</span>
              </div>
              <div className="flex justify-between text-red-700 font-bold text-sm">
                <span>Extra charge so far</span>
                <span>${charge}</span>
              </div>
            </>
          )}
        </div>

        <Button
          className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm"
          onClick={() => withProximityCheck(completeProx, () => completeMutation.mutate(), 'complete')}
          disabled={checking || completeMutation.isPending}
        >
          {checking || completeMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying location…</>
            : <><CheckCircle2 className="w-4 h-4 mr-2" /> Trip Complete</>}
        </Button>

        {refLat && (
          <p className="text-center text-[10px] text-muted-foreground">
            Must be within {MAX_DISTANCE_METERS}m of pickup to complete trip
          </p>
        )}
      </div>
    );
  }

  // ── Completed — show summary ─────────────────────────────────
  const elapsedSec = (new Date(booking.trip_completed_at).getTime() - new Date(booking.arrived_at_destination).getTime()) / 1000;
  const elapsedMin = Math.floor(elapsedSec / 60);

  return (
    <div className="mt-3 bg-muted rounded-2xl border border-border p-4">
      <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
        <DollarSign className="w-3.5 h-3.5 text-green-600" /> Trip Summary
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between"><span className="text-muted-foreground">Total wait time</span><span className="font-semibold">{elapsedMin} min</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Free wait</span><span className="font-semibold text-green-600">{Math.min(elapsedMin, freeMinutes)} min</span></div>
        {(booking.wait_charge || 0) > 0 && (
          <div className="flex justify-between text-red-600"><span>Wait overage</span><span className="font-bold">+${booking.wait_charge}</span></div>
        )}
        <div className="flex justify-between border-t border-border pt-2 mt-1">
          <span className="font-bold text-foreground">Total charged</span>
          <span className="font-black text-primary text-base">${booking.price}</span>
        </div>
      </div>
    </div>
  );
}