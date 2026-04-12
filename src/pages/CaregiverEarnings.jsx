import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, Star, Gift, Clock, Banknote, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
};

export default function CaregiverEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPayoutConfirm, setShowPayoutConfirm] = useState(false);

  // Check if returned from Stripe Connect onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === '1') {
      toast.success('Bank account connected!');
      qc.invalidateQueries({ queryKey: ['stripe-status'] });
    }
  }, []);

  const { data: stripeStatus, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: async () => {
      const res = await base44.functions.invoke('requestPayout', { action: 'status' });
      return res.data;
    },
    enabled: !!user?.id,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('requestPayout', { action: 'connect' });
      return res.data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to connect bank account'),
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('requestPayout', { action: 'payout' });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`$${data.amount.toFixed(2)} payout initiated!`);
      setShowPayoutConfirm(false);
      qc.invalidateQueries({ queryKey: ['caregiver-earnings'] });
    },
    onError: (e) => toast.error(e?.message || 'Payout failed'),
  });

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ['caregiver-earnings', user?.id],
    queryFn: () => base44.entities.CaregiverEarning.filter({ caregiver_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeek = earnings.filter(e => {
    const d = new Date(e.created_date);
    return d >= weekStart && d <= weekEnd;
  });

  const weeklyTotal = thisWeek.reduce((s, e) => s + e.total_pay, 0);
  const allTimeTotal = earnings.reduce((s, e) => s + e.total_pay, 0);
  const pendingTotal = earnings.filter(e => e.payout_status === 'pending').reduce((s, e) => s + e.total_pay, 0);
  const bonusTotal = earnings.reduce((s, e) => s + (e.bonus_pay || 0), 0);

  // Group by week
  const byWeek = {};
  earnings.forEach(e => {
    const key = e.week_start || format(new Date(e.created_date), 'yyyy-MM-dd');
    if (!byWeek[key]) byWeek[key] = { earnings: [], total: 0, paid: 0 };
    byWeek[key].earnings.push(e);
    byWeek[key].total += e.total_pay;
    if (e.payout_status === 'paid') byWeek[key].paid += e.total_pay;
  });

  const weeks = Object.entries(byWeek).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">My Earnings</h1>
      </div>

      {/* Hero stats */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 pt-6 pb-12">
        <p className="text-white/70 text-sm">This week</p>
        <p className="text-white text-5xl font-black">${weeklyTotal.toFixed(2)}</p>
        <p className="text-white/60 text-xs mt-1">{thisWeek.length} job{thisWeek.length !== 1 ? 's' : ''} · {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}</p>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-4 pb-10">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: DollarSign, label: 'All-time earned', value: `$${allTimeTotal.toFixed(2)}`, color: 'bg-blue-100 text-blue-600' },
            { icon: Clock, label: 'Pending payout', value: `$${pendingTotal.toFixed(2)}`, color: 'bg-amber-100 text-amber-600' },
            { icon: Star, label: 'Bonus earned', value: `$${bonusTotal.toFixed(2)}`, color: 'bg-purple-100 text-purple-600' },
            { icon: TrendingUp, label: 'Total jobs', value: earnings.length, color: 'bg-green-100 text-green-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-black text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Bonus info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <Gift className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Premium Bonus — $40</p>
            <p className="text-xs text-amber-700 mt-0.5">Earn a $40 bonus every 10 completed jobs when you maintain a 4★+ rating and high activity.</p>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              {earnings.length % 10 === 0 && earnings.length > 0
                ? '🎉 Bonus awarded this milestone!'
                : `${10 - (earnings.length % 10)} more job${(10 - (earnings.length % 10)) !== 1 ? 's' : ''} until next bonus`}
            </p>
          </div>
        </div>

        {/* Weekly breakdown */}
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Weekly Breakdown</h2>

        {isLoading && <div className="text-center py-8 text-muted-foreground text-sm">Loading earnings…</div>}

        {!isLoading && weeks.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No earnings yet. Complete jobs to see your earnings here.</p>
          </div>
        )}

        {weeks.map(([weekKey, data], i) => (
          <motion.div key={weekKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-foreground">Week of {format(new Date(weekKey), 'MMM d, yyyy')}</p>
              <p className="text-sm font-black text-emerald-600">${data.total.toFixed(2)}</p>
            </div>
            <div className="divide-y divide-border">
              {data.earnings.map(e => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground capitalize">{e.service_type} — {e.senior_name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Base ${e.base_pay}</span>
                      {e.overage_pay > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">+${e.overage_pay} overage</span>}
                      {e.bonus_pay > 0 && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🎁 +${e.bonus_pay} bonus</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <p className="text-sm font-black text-foreground">${e.total_pay.toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[e.payout_status]}`}>
                      {e.payout_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Payout CTA */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Cash Out Your Balance</p>
              <p className="text-xs text-muted-foreground">Transfer earnings to your bank account</p>
            </div>
          </div>

          {/* Stripe Connect status */}
          {stripeLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking bank connection…
            </div>
          ) : stripeStatus?.connected ? (
            <>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800">Bank account connected</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Pending balance</p>
                <p className="text-2xl font-black text-emerald-600">${pendingTotal.toFixed(2)}</p>
              </div>
              {pendingTotal > 0 ? (
                <Button
                  className="w-full h-11 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowPayoutConfirm(true)}
                >
                  Cash Out ${pendingTotal.toFixed(2)}
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">No pending balance to cash out</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">
                  {stripeStatus?.details_submitted ? 'Verification pending' : 'No bank account linked'}
                </span>
              </div>
              <Button
                className="w-full h-11 rounded-2xl font-bold gap-2"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                  : <><ExternalLink className="w-4 h-4" /> Connect Bank Account via Stripe</>
                }
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">Powered by Stripe Connect — secure & encrypted</p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">Automatic payouts also process every Monday via Stripe</p>
      </div>
    </div>

    {/* Payout Confirm Modal */}
    {showPayoutConfirm && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowPayoutConfirm(false)}>
        <div className="bg-card rounded-t-3xl p-6 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Banknote className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Confirm Payout</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            You're about to transfer <span className="font-bold text-foreground">${pendingTotal.toFixed(2)}</span> to your linked bank account. This may take 1–2 business days.
          </p>
          <Button
            className="w-full h-12 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => payoutMutation.mutate()}
            disabled={payoutMutation.isPending}
          >
            {payoutMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              : `Transfer $${pendingTotal.toFixed(2)}`
            }
          </Button>
          <button onClick={() => setShowPayoutConfirm(false)} className="w-full mt-2 text-sm text-muted-foreground py-2">Cancel</button>
        </div>
      </div>
    )}
    </>
  );
}