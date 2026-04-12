import { useState } from 'react';
import PullToRefresh from '@/components/PullToRefresh';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Car, Star, X, FileDown, Loader2, Activity, AlertTriangle, Calendar, User } from 'lucide-react';
import SosButton from '@/components/SosButton';
import FamilyJournalView from '@/components/FamilyJournalView';
import FamilyTripMap from '@/components/FamilyTripMap';
import ActivityFeed from '@/components/ActivityFeed';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-violet-50 text-violet-700 border border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
};

const STATUS_LABELS = {
  pending: '◎ Pending',
  confirmed: '✓ Confirmed',
  in_progress: '● Live',
  completed: '✓ Completed',
  cancelled: '✕ Cancelled',
};

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const handleExportInvoice = async () => {
    const now = new Date();
    setInvoiceLoading(true);
    const res = await base44.functions.invoke('generateInvoice', {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    // res.data is arraybuffer — but axios may decode it; handle both
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Elderlyx_Invoice_${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setInvoiceLoading(false);
  };
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activityBooking, setActivityBooking] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => base44.entities.Booking.filter({ family_email: user?.email }, '-scheduled_date', 50),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await base44.functions.invoke('processRefund', { booking_id: id });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      const msg = data.refund_amount > 0
        ? `Cancelled. $${data.refund_amount} refund on its way (${data.refund_percent}% back).`
        : `Cancelled. ${data.message}`;
      toast.success(msg);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ booking, rating, comment }) =>
      base44.entities.Review.create({
        booking_id: booking.id,
        rating,
        comment,
        reviewer_name: user?.full_name,
        reviewer_email: user?.email,
        caregiver_id: booking.caregiver_id,
        caregiver_name: booking.caregiver_name,
        service_type: booking.service_type,
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      setReviewBooking(null);
      toast.success('Review submitted!');
    },
  });

  const upcoming = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <PullToRefresh onRefresh={() => qc.invalidateQueries({ queryKey: ['my-bookings'] })}>
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted/70 flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-black text-foreground text-lg flex-1">My Bookings</h1>
        <button
          onClick={handleExportInvoice}
          disabled={invoiceLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl disabled:opacity-60 border border-primary/20"
        >
          {invoiceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          Invoice
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2">
        {['upcoming', 'past'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold capitalize transition-all ${
              tab === t
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Past'}
            <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              tab === t ? 'bg-white/25 text-white' : 'bg-muted-foreground/15 text-muted-foreground'
            }`}>{t === 'upcoming' ? upcoming.length : past.length}</span>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3 pb-8">
        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Loading bookings…</p>
          </div>
        )}
        {!isLoading && list.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-base">No {tab} bookings</p>
              <p className="text-muted-foreground text-sm mt-1">Ready when you are</p>
            </div>
            <Link to="/Book"><Button className="rounded-2xl px-6 h-11 font-bold shadow-md shadow-primary/20">Book Care Now</Button></Link>
          </div>
        )}
        {list.map((b, i) => {
          const isPremium = user?.subscription_plan === 'premium';
          const isActiveBooking = b.status === 'in_progress';
          return (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-3xl border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-3 items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${b.service_type === 'companionship' ? 'bg-rose-50' : 'bg-sky-50'}`}>
                {b.service_type === 'companionship' ? <Heart className="w-5.5 h-5.5 text-rose-500" /> : <Car className="w-5.5 h-5.5 text-sky-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-black text-foreground capitalize text-sm">{b.service_type}</p>
                  <span className={`text-[9.5px] font-bold px-2 py-1 rounded-xl whitespace-nowrap ${STATUS_STYLES[b.status]}`}>{STATUS_LABELS[b.status] || b.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{b.senior_name} · {format(new Date(b.scheduled_date), 'EEE, MMM d · h:mm a')}</p>
                {b.caregiver_name && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <p className="text-xs text-primary font-semibold">{b.caregiver_name}</p>
                  </div>
                )}
                {b.service_type === 'transportation' && b.status === 'in_progress' && (
                  <FamilyTripMap booking={b} />
                )}
                {b.service_type === 'transportation' && b.trip_completed_at && (
                  <div className="mt-2 bg-muted rounded-xl p-2.5 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Wait Charge Breakdown</p>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base trip</span><span className="font-semibold">${(b.price || 0) - (b.wait_charge || 0)}</span></div>
                    {(b.wait_charge || 0) > 0 && <div className="flex justify-between text-xs text-red-600"><span>Wait overage</span><span className="font-bold">+${b.wait_charge}</span></div>}
                    <div className="flex justify-between text-xs border-t border-border pt-1"><span className="font-bold text-foreground">Total</span><span className="font-black text-primary">${b.price}</span></div>
                  </div>
                )}
              </div>
            </div>
            {/* SOS Button for active bookings (Premium only) */}
            {isPremium && isActiveBooking && (
              <div className="mt-3 pt-3 border-t border-border">
                <SosButton booking={b} />
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {['pending', 'confirmed'].includes(b.status) && (
                <Button size="sm" variant="outline" className="rounded-xl flex-1 text-red-600 border-red-200" onClick={() => cancelMutation.mutate(b.id)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
              )}
              {['in_progress', 'completed'].includes(b.status) && (
                <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => setActivityBooking(b)}>
                  <Activity className="w-3.5 h-3.5" /> Activity
                </Button>
              )}
              {b.status === 'completed' && <FamilyJournalView bookingId={b.id} />}
              {b.status === 'completed' && !b.reviewed && (
                <Button size="sm" className="rounded-xl flex-1" onClick={() => setReviewBooking(b)}>
                  <Star className="w-3.5 h-3.5 mr-1" /> Leave Review
                </Button>
              )}
            </div>
          </motion.div>
        );
        })}
      </div>

      {/* Activity Feed Modal */}
      {activityBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setActivityBooking(null)}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} className="bg-background rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-foreground">Activity Log</h3>
              <button onClick={() => setActivityBooking(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <ActivityFeed bookingId={activityBooking.id} booking={activityBooking} canEdit={false} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Review Modal */}
       {reviewBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setReviewBooking(null)}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} className="bg-card rounded-t-3xl p-6 pb-10 w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">Rate your caregiver</h3>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full border border-input rounded-xl p-3 text-sm resize-none h-24 bg-transparent mb-4"
            />
            <Button className="w-full h-12 rounded-2xl" onClick={() => reviewMutation.mutate({ booking: reviewBooking, rating, comment })} disabled={reviewMutation.isPending}>
              Submit Review
            </Button>
          </motion.div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}