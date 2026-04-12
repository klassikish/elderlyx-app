import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LocationTracker from '@/components/location/LocationTracker.jsx';
import FamilyLocationMap from '@/components/location/FamilyLocationMap.jsx';

export default function FamilyLocation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: groups = [] } = useQuery({
    queryKey: ['family-groups', user?.email],
    queryFn: () =>
      base44.entities.FamilyGroup.filter(
        { primary_owner_email: user?.email },
        '-created_date',
        10
      ),
    enabled: !!user?.email,
  });

  const selectedGroup = groups[0];

  // Auto-refresh every 5 seconds for live updates
  const { data: trackingData = [] } = useQuery({
    queryKey: ['location-tracking', selectedGroup?.id],
    queryFn: () =>
      base44.entities.LocationTracking.filter(
        { family_group_id: selectedGroup?.id },
        '-last_updated_at',
        50
      ),
    enabled: !!selectedGroup?.id,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const currentUserTracking = trackingData.find((t) => t.tracker_email === user?.email);
  const familyTrackingData = trackingData.filter((t) => t.tracker_email !== user?.email);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Family Location</h1>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            autoRefresh
              ? 'bg-green-100 text-green-700'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {autoRefresh ? '🔄 Live' : '⊘ Paused'}
        </button>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Location data is encrypted and only visible to family members in your group.
          </p>
        </motion.div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <FamilyLocationMap trackingData={trackingData} />
        </motion.div>

        {/* Your Location Control */}
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Your Location
            </h2>
            <LocationTracker
              locationTracking={currentUserTracking}
              groupId={selectedGroup.id}
            />
          </motion.div>
        )}

        {/* Family Tracking Status */}
        {familyTrackingData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <h2 className="font-bold text-foreground mb-4">Family Members</h2>
            <div className="space-y-2">
              {familyTrackingData.map((tracker, i) => (
                <motion.div
                  key={tracker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">
                      {tracker.tracker_name}
                    </p>
                    {tracker.current_lat && tracker.current_lng && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📍 {tracker.current_lat.toFixed(4)}, {tracker.current_lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tracker.tracking_enabled ? (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-600" /> Live
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400" /> Offline
                      </span>
                    )}
                    {tracker.accuracy_meters && (
                      <span className="text-[10px] text-muted-foreground">
                        ±{Math.round(tracker.accuracy_meters)}m
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {familyTrackingData.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No other family members tracking yet</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}