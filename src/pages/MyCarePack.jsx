import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Calendar, AlertTriangle, CheckCircle2,
  Plus, Clock, ChevronRight, Zap,
} from 'lucide-react';
import { addDays, format as dateFmt, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function MyCarePack() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: packs = [], isLoading } = useQuery({
    queryKey: ['my-care-packs', user?.email],
    queryFn: () => base44.entities.CarePack.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-pack-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ family_email: user?.email }, '-scheduled_date', 50),
    enabled: !!user?.email,
  });

  const activePacks = packs.filter(p => p.status === 'active');
  const exhaustedPacks = packs.filter(p => p.status === 'exhausted');

  const totalRemaining = activePacks.reduce((s, p) => s + (p.remaining_visits || 0), 0);
  const totalPurchased = activePacks.reduce((s, p) => s + (p.total_visits || 0), 0);
  const totalUsed = activePacks.reduce((s, p) => s + (p.used_visits || 0), 0);

  const visitHistory = bookings.filter(b => b.service_type === 'companionship');

  const isEmpty = activePacks.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">My Care Pack</h1>
        <button
          onClick={() => navigate('/CarePacks')}
          className="text-sm text-primary font-semibold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Buy Pack
        </button>
      </div>

      <div className="px-5 pt-5 pb-10 space-y-5">

        {/* Empty state */}
        {isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-12"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No Active Care Pack</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              You've used all your visits. Buy a new pack to keep scheduling regular check-ins.
            </p>
            <Button className="w-full max-w-xs h-12 rounded-2xl font-bold" onClick={() => navigate('/CarePacks')}>
              Buy New Care Pack
            </Button>
            <Button variant="outline" className="w-full max-w-xs h-12 rounded-2xl mt-3" onClick={() => navigate('/Book')}>
              Book Single Visit
            </Button>
          </motion.div>
        )}

        {/* Active pack summary */}
        {!isEmpty && (
          <>
            {/* Balance card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {activePacks[0]?.total_visits}-Visit Pack · Active
                  </p>
                  <p className="text-4xl font-black text-foreground">
                    {totalRemaining}
                    <span className="text-xl font-semibold text-muted-foreground ml-2">remaining</span>
                  </p>
                </div>
                <div className="bg-primary/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="text-xl font-black text-primary">{totalUsed}</p>
                </div>
              </div>

              {/* Visual progress dots */}
              <div className="flex gap-2 flex-wrap mb-4">
                {Array.from({ length: totalPurchased }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      i < totalUsed
                        ? 'bg-muted text-muted-foreground ring-2 ring-border'
                        : 'bg-primary text-primary-foreground shadow-sm'
                    }`}
                  >
                    {i < totalUsed ? '✓' : i + 1 - totalUsed}
                  </div>
                ))}
              </div>

              {/* Bar */}
              <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalRemaining / totalPurchased) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {totalRemaining} of {totalPurchased} visits remaining
              </p>

              {/* Low balance */}
              {totalRemaining <= 2 && totalRemaining > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">You're running low on visits</p>
                    <p className="text-xs text-amber-700 mt-0.5">Refill your pack to keep scheduling check-ins.</p>
                  </div>
                  <Button size="sm" className="rounded-xl text-xs" onClick={() => navigate('/CarePacks')}>
                    Refill
                  </Button>
                </div>
              )}

              {activePacks[0]?.expires_at && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Expires {format(new Date(activePacks[0].expires_at), 'MMMM d, yyyy')}
                </p>
              )}
            </motion.div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-12 rounded-2xl font-semibold"
                onClick={() => navigate('/Book?pack=true')}
                disabled={totalRemaining === 0}
              >
                <Calendar className="w-4 h-4 mr-2" /> Book Next Visit
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-semibold"
                onClick={() => navigate('/BookMultiple')}
                disabled={totalRemaining < 2}
              >
                Schedule Multiple
              </Button>
            </div>

            {/* Smart schedule suggestion */}
            {totalRemaining >= 2 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5" /> Suggested Schedule
                </p>
                <p className="text-xs text-emerald-700 mb-3">
                  Space your {totalRemaining} remaining visits evenly over the next {totalRemaining} weeks:
                </p>
                <div className="space-y-1.5 mb-3">
                  {Array.from({ length: Math.min(totalRemaining, 4) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-800">
                      <div className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                      <span>{dateFmt(addWeeks(new Date(), i + 1), 'EEEE, MMM d')}</span>
                    </div>
                  ))}
                  {totalRemaining > 4 && <p className="text-xs text-emerald-600 pl-6">+ {totalRemaining - 4} more…</p>}
                </div>
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => navigate('/BookMultiple')}
                >
                  Schedule All at Once
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Most families schedule their next visit right away
            </p>
          </>
        )}

        {/* Visit history */}
        {visitHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Visit History</p>
            <div className="space-y-3">
              {visitHistory.map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    b.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {b.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <Clock className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {b.senior_name || 'Companionship Visit'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.scheduled_date ? format(new Date(b.scheduled_date), 'MMM d, yyyy · h:mm a') : '—'}
                      {b.caregiver_name ? ` · ${b.caregiver_name}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    b.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : b.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {b.status === 'completed' ? 'Completed' : b.status === 'cancelled' ? 'Cancelled' : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Past packs */}
        {exhaustedPacks.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Past Packs</p>
            <div className="space-y-2">
              {exhaustedPacks.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.total_visits}-Visit Pack</p>
                    <p className="text-xs text-muted-foreground">
                      {p.purchased_at ? format(new Date(p.purchased_at), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-semibold">
                    All used
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}