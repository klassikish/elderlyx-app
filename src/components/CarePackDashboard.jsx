import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function CarePackDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: packs = [], isLoading } = useQuery({
    queryKey: ['care-packs-dashboard', user?.email],
    queryFn: () => base44.entities.CarePack.filter({ owner_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['pack-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ family_email: user?.email }, '-scheduled_date', 20),
    enabled: !!user?.email,
  });

  if (isLoading) return null;

  // Aggregate across all active packs
  const totalRemaining = packs.reduce((s, p) => s + (p.remaining_visits || 0), 0);
  const totalPurchased = packs.reduce((s, p) => s + (p.total_visits || 0), 0);
  const totalUsed = packs.reduce((s, p) => s + (p.used_visits || 0), 0);

  const activePack = packs[0];

  const visitHistory = bookings.filter(b => b.service_type === 'companionship').slice(0, 5);

  // Idle nudge: last companionship booking > 7 days ago or never
  const lastVisit = visitHistory[0];
  const daysSinceLastVisit = lastVisit
    ? differenceInDays(new Date(), new Date(lastVisit.scheduled_date))
    : 999;
  const showIdleNudge = totalRemaining > 0 && daysSinceLastVisit > 7;

  // Empty state
  if (packs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mt-4 bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-bold text-foreground text-sm">My Care Pack</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">You have no active Care Packs.</p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 rounded-xl" onClick={() => navigate('/CarePacks')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Buy a Pack
          </Button>
          <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => navigate('/Book')}>
            Book Single Visit
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mt-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">My Care Pack</h3>
        </div>
        <button
          onClick={() => navigate('/MyCarePack')}
          className="text-xs text-primary font-semibold flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Balance card */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {activePack?.total_visits}-Visit Pack
            </p>
            <p className="text-3xl font-black text-foreground mt-0.5">
              {totalRemaining}
              <span className="text-base font-semibold text-muted-foreground ml-1">visits left</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="text-lg font-bold text-foreground">{totalUsed}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {Array.from({ length: totalPurchased }).map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                i < totalUsed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {i < totalUsed ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${totalPurchased > 0 ? (totalRemaining / totalPurchased) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {totalRemaining} of {totalPurchased} visits remaining
        </p>

        {/* Idle nudge */}
        {showIdleNudge && totalRemaining > 2 && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-800 font-medium flex-1">
              {daysSinceLastVisit === 999 ? 'Ready to book your first visit?' : `No visit in ${daysSinceLastVisit} days`}
            </p>
            <button onClick={() => navigate('/Book?pack=true')} className="text-[10px] text-blue-700 font-bold underline">
              Book now
            </button>
          </div>
        )}

        {/* Low balance alert */}
        {totalRemaining <= 2 && totalRemaining > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium flex-1">Running low on visits</p>
            <button
              onClick={() => navigate('/CarePacks')}
              className="text-[10px] text-amber-700 font-bold underline"
            >
              Refill
            </button>
          </div>
        )}

        {activePack?.expires_at && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Expires {format(new Date(activePack.expires_at), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1 h-10 rounded-xl font-semibold text-sm"
          onClick={() => navigate('/Book?pack=true')}
          disabled={totalRemaining === 0}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          {totalRemaining > 0 ? `Book (${totalRemaining} left)` : 'No visits left'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-10 rounded-xl font-semibold text-sm"
          onClick={() => navigate('/BookMultiple')}
          disabled={totalRemaining < 2}
        >
          Schedule Multiple
        </Button>
      </div>

      {/* Recent visits */}
      {visitHistory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Recent Visits</p>
          <div className="space-y-2.5">
            {visitHistory.map(b => (
              <div key={b.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {b.senior_name || 'Visit'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.scheduled_date ? format(new Date(b.scheduled_date), 'MMM d, yyyy') : '—'}
                    {b.caregiver_name ? ` · ${b.caregiver_name}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  b.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : b.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {b.status === 'completed' ? 'Done' : b.status === 'cancelled' ? 'Cancelled' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}