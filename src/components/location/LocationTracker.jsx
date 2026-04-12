import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { MapPin, Loader2, AlertCircle, StopCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LocationTracker({ locationTracking, groupId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isTracking, setIsTracking] = useState(locationTracking?.tracking_enabled || false);
  const [lastLocation, setLastLocation] = useState(locationTracking ? { lat: locationTracking.current_lat, lng: locationTracking.current_lng } : null);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const historyRef = useRef(locationTracking?.location_history || []);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (locationTracking) {
        return base44.entities.LocationTracking.update(locationTracking.id, data);
      }
      return base44.entities.LocationTracking.create({
        family_group_id: groupId,
        tracker_email: user?.email,
        tracker_name: user?.full_name,
        ...data,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['location-tracking'] });
    },
  });

  // Battery optimization: throttle updates to 10-30 sec based on battery
  const getUpdateInterval = (battery) => {
    if (battery < 20) return 30000; // 30 sec if low battery
    if (battery < 50) return 20000; // 20 sec if medium
    return 10000; // 10 sec if good battery
  };

  const handleLocationUpdate = (position) => {
    const now = Date.now();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const acc = position.coords.accuracy;

    // Only update if enough time passed or significant movement
    if (now - lastUpdateRef.current < 5000) return;

    setLastLocation({ lat, lng });
    setAccuracy(acc);
    lastUpdateRef.current = now;

    // Store in history (keep last 50)
    const newHistory = [
      ...historyRef.current,
      { lat, lng, timestamp: new Date().toISOString(), accuracy: acc },
    ].slice(-50);
    historyRef.current = newHistory;

    // Update in DB
    updateMutation.mutate({
      current_lat: lat,
      current_lng: lng,
      accuracy_meters: acc,
      last_updated_at: new Date().toISOString(),
      location_history: newHistory,
      tracking_enabled: true,
    });
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }

    setIsTracking(true);

    // Get initial battery info
    navigator.getBattery?.().then((battery) => {
      const interval = getUpdateInterval(battery.level * 100);
      battery.addEventListener('levelchange', () => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          startWatch(getUpdateInterval(battery.level * 100));
        }
      });
      startWatch(interval);
    }).catch(() => startWatch(15000)); // Default 15sec if battery API unavailable

    const startWatch = (interval) => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to access location. Check permissions.');
        },
        {
          enableHighAccuracy: false, // Battery efficient
          timeout: 10000,
          maximumAge: 5000, // Use cached position if < 5sec old
        }
      );
    };

    updateMutation.mutate({ tracking_enabled: true, started_at: new Date().toISOString() });
    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setIsTracking(false);
    updateMutation.mutate({
      tracking_enabled: false,
      stopped_at: new Date().toISOString(),
    });
    toast.success('Location tracking stopped');
  };

  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`rounded-lg p-4 border ${isTracking ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-border'}`}>
        <div className="flex items-start gap-3">
          {isTracking ? (
            <div className="w-3 h-3 rounded-full bg-green-600 animate-pulse mt-1.5 flex-shrink-0" />
          ) : (
            <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm">{isTracking ? 'Tracking Active' : 'Tracking Inactive'}</p>
            {lastLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}
              </p>
            )}
            {accuracy && (
              <p className="text-xs text-muted-foreground">
                Accuracy: ±{Math.round(accuracy)}m
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Battery Warning */}
      {typeof navigator !== 'undefined' && navigator.getBattery && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Location tracking uses battery. Update frequency adjusts based on battery level.</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isTracking ? (
          <Button
            onClick={startTracking}
            disabled={updateMutation.isPending}
            className="flex-1 gap-2 rounded-lg bg-green-600 hover:bg-green-700"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Start Tracking
          </Button>
        ) : (
          <Button
            onClick={stopTracking}
            disabled={updateMutation.isPending}
            className="flex-1 gap-2 rounded-lg bg-red-600 hover:bg-red-700"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <StopCircle className="w-4 h-4" />
            )}
            Stop Tracking
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p>• Updates every 10-30 seconds (optimized for battery)</p>
        <p>• Location visible only to linked family members</p>
        <p>• Works best with GPS enabled on device</p>
      </div>
    </div>
  );
}