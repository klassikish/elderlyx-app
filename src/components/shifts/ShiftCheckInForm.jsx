import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { X, Loader2, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ShiftCheckInForm({ shift, onClose, mode = 'checkin' }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const createCheckInMutation = useMutation({
    mutationFn: () =>
      base44.entities.ShiftCheckIn.create({
        care_shift_id: shift.id,
        family_group_id: shift.family_group_id,
        senior_id: shift.senior_id,
        senior_name: shift.senior_name,
        caregiver_id: user?.id,
        caregiver_email: user?.email,
        caregiver_name: user?.full_name,
        shift_date: shift.shift_date,
        checked_in_at: new Date().toISOString(),
        check_in_lat: location?.lat,
        check_in_lng: location?.lng,
        notes,
        status: 'checked_in',
        scheduled_minutes: Math.round((new Date(`2000-01-01 ${shift.end_time}`) - new Date(`2000-01-01 ${shift.start_time}`)) / 60000),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-checkins'] });
      base44.entities.CareShift.update(shift.id, { status: 'claimed' });
      toast.success('Checked in successfully');
      onClose?.();
    },
  });

  const updateCheckOutMutation = useMutation({
    mutationFn: async () => {
      const checkIns = await base44.entities.ShiftCheckIn.filter({ care_shift_id: shift.id }, '-checked_in_at', 1);
      const checkIn = checkIns[0];
      if (!checkIn) throw new Error('Check-in not found');

      const duration = Math.round((new Date() - new Date(checkIn.checked_in_at)) / 60000);
      return base44.entities.ShiftCheckIn.update(checkIn.id, {
        checked_out_at: new Date().toISOString(),
        check_out_lat: location?.lat,
        check_out_lng: location?.lng,
        duration_minutes: duration,
        status: 'checked_out',
        notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-checkins'] });
      base44.entities.CareShift.update(shift.id, { status: 'completed' });
      toast.success('Checked out successfully');
      onClose?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'checkin') {
      createCheckInMutation.mutate();
    } else {
      updateCheckOutMutation.mutate();
    }
  };

  const isPending = createCheckInMutation.isPending || updateCheckOutMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {mode === 'checkin' ? 'Check In' : 'Check Out'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shift Info */}
        <div className="bg-muted/30 rounded-lg p-3 mb-4 space-y-2">
          <p className="font-bold text-sm text-foreground">{shift.title}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(`${shift.shift_date}T00:00`), 'MMM d, yyyy')} · {shift.start_time}–{shift.end_time}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-lg">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {mode === 'checkin' ? 'Check In Notes' : 'Check Out Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comments..."
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 rounded-lg gap-2 ${mode === 'checkout' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'checkout' ? (
                <><LogOut className="w-4 h-4" /> Check Out</>
              ) : (
                <>Check In</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}