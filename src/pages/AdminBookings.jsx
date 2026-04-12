import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Car, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminBookings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: () => base44.entities.Alert.filter({ severity: 'critical', is_read: false }, '-created_date', 20),
    refetchInterval: 15000,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-bookings'] }); toast.success('Status updated'); },
  });

  const list = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">All Bookings</h1>
        <span className="ml-auto text-xs text-muted-foreground">{bookings.length} total</span>
      </div>

      {/* SOS Alerts Banner */}
      {sosAlerts.length > 0 && (
        <div className="mx-5 mt-4 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            <p className="font-black text-red-700 text-sm">{sosAlerts.length} Active SOS Alert{sosAlerts.length > 1 ? 's' : ''}</p>
          </div>
          <div className="space-y-2">
            {sosAlerts.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-3 border border-red-200">
                <p className="text-xs font-bold text-red-700">{a.title}</p>
                <p className="text-[11px] text-red-500 mt-0.5 whitespace-pre-line line-clamp-3">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Assignment Banner */}
      {bookings.filter(b => b.needs_manual_assignment && b.status === 'pending').length > 0 && (
        <div className="mx-5 mt-3 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="font-black text-amber-700 text-sm">Manual Assignment Required</p>
          </div>
          <div className="space-y-2">
            {bookings.filter(b => b.needs_manual_assignment && b.status === 'pending').map(b => (
              <div key={b.id} className="bg-white rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-bold text-amber-800">{b.service_type} — {b.senior_name}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">All 3 matched caregivers declined. Assign a caregiver below.</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="rounded-xl text-xs h-8" onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}>
                    Confirm Manually
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="px-5 pt-4 flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3 pb-6">
        {isLoading && <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>}
        {list.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card rounded-2xl border border-border p-4"
          >
            <div className="flex gap-3 items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.service_type === 'companionship' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                {b.service_type === 'companionship' ? <Heart className="w-5 h-5 text-pink-500" /> : <Car className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-semibold text-sm capitalize">{b.service_type}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Family: {b.family_name || b.family_email}</p>
                <p className="text-xs text-muted-foreground">Senior: {b.senior_name}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(b.scheduled_date), 'MMM d, h:mm a')}</p>
                <p className="text-xs font-semibold text-green-600 mt-1">${b.price || 35}</p>
              </div>
            </div>

            {b.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1 rounded-xl" onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-red-600 border-red-200" onClick={() => updateStatus.mutate({ id: b.id, status: 'cancelled' })}>
                  Cancel
                </Button>
              </div>
            )}
            {b.status === 'confirmed' && (
              <Button size="sm" className="w-full mt-3 rounded-xl" onClick={() => updateStatus.mutate({ id: b.id, status: 'completed' })}>
                Mark Completed
              </Button>
            )}
          </motion.div>
        ))}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No {filter} bookings</div>
        )}
      </div>
    </div>
  );
}