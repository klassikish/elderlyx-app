import { useState } from 'react';
import { AlertTriangle, Loader2, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SosButton({ booking, onAlertCreated }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        setLocationError('Could not get location');
        setLocation(null);
      }
    );
  };

  const handleTriggerSos = async () => {
    if (!booking) {
      toast.error('No active booking');
      return;
    }

    setIsLoading(true);
    try {
      const res = await base44.functions.invoke('sos', {
        booking_id: booking.id,
        caregiver_id: booking.caregiver_id,
        caregiver_name: booking.caregiver_name,
        caregiver_phone: booking.caregiver_phone || '',
        family_email: booking.family_email,
        senior_name: booking.senior_name,
        latitude: location?.lat,
        longitude: location?.lng,
      });

      toast.success('Emergency alert sent to caregiver and family');
      if (onAlertCreated) {
        onAlertCreated(res.data);
      }
      setShowConfirm(false);

      // Attempt to initiate call if phone available
      if (booking.caregiver_phone) {
        const shouldCall = window.confirm(
          `Call ${booking.caregiver_name}?\n\n${booking.caregiver_phone}`
        );
        if (shouldCall) {
          window.location.href = `tel:${booking.caregiver_phone}`;
        }
      }
    } catch (err) {
      toast.error('Failed to send alert');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Main SOS Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        className="w-full h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
      >
        <AlertTriangle className="w-5 h-5 animate-pulse" />
        <span>Emergency SOS</span>
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-card rounded-t-3xl w-full max-w-md mx-auto p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">Emergency Alert</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This will immediately notify your caregiver and family contacts.
                </p>
              </div>

              {/* Location section */}
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">Location</span>
                  </div>
                  <button
                    onClick={handleGetLocation}
                    disabled={isLoading}
                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {location ? 'Update' : 'Detect'}
                  </button>
                </div>
                {location ? (
                  <p className="text-xs text-foreground font-mono">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                ) : locationError ? (
                  <p className="text-xs text-red-600">{locationError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not detected</p>
                )}
              </div>

              {/* Contacts being notified */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-900 mb-2">
                  ✓ Notifications will be sent to:
                </p>
                <ul className="space-y-1.5 text-xs text-blue-800">
                  <li>• {booking?.caregiver_name || 'Assigned Caregiver'}</li>
                  <li>• Family members ({booking?.family_email})</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  onClick={handleTriggerSos}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Send Emergency Alert
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-2.5 text-sm text-muted-foreground font-medium"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                Alert will be logged with timestamp and location for medical records.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}