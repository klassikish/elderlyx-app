import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Loader2, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const OPT = (label, value) => ({ label, value });

const FIELDS = [
  { key: 'eating', label: 'Did the client eat?', opts: [OPT('None', 'none'), OPT('Partial', 'partial'), OPT('Full', 'full')] },
  { key: 'mobility', label: 'Mobility compared to normal?', opts: [OPT('Better', 'better'), OPT('Same', 'same'), OPT('Worse', 'worse')] },
  { key: 'mood', label: "Client's mood?", opts: [OPT('Positive', 'positive'), OPT('Neutral', 'neutral'), OPT('Low', 'low')] },
  { key: 'confusion', label: 'Confusion observed?', opts: [OPT('No', false), OPT('Yes', true)] },
  { key: 'medication', label: 'Medication taken?', opts: [OPT('Yes', true), OPT('No', false)] },
];

export default function PackVisitReport({ booking, onComplete }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [nextVisits, setNextVisits] = useState([]);

  // Find client's active pack for deduction
  const { data: clientPack } = useQuery({
    queryKey: ['client-pack', booking?.family_email],
    queryFn: () => base44.entities.CarePack.filter({ owner_email: booking.family_email, status: 'active' }),
    enabled: !!booking?.family_email,
    select: data => data[0] || null,
  });

  // Find upcoming visits for this client
  const { data: upcomingVisits = [] } = useQuery({
    queryKey: ['upcoming-client-visits', booking?.family_email],
    queryFn: () => base44.entities.Booking.filter({ family_email: booking.family_email, status: 'pending' }, 'scheduled_date', 5),
    enabled: !!booking?.family_email,
  });

  const allFilled = FIELDS.every(f => form[f.key] !== undefined);

  const handleSubmit = async () => {
    if (!allFilled) { toast.error('Please complete all fields'); return; }
    setSubmitting(true);

    // 1. Save visit playback record
    await base44.entities.VisitPlayback.create({
      booking_id: booking.id,
      caregiver_id: booking.caregiver_id,
      caregiver_name: booking.caregiver_name,
      senior_name: booking.senior_name,
      family_email: booking.family_email,
      visit_date: new Date().toISOString(),
      eating: form.eating,
      mobility: form.mobility,
      mood: form.mood,
      confusion_observed: form.confusion,
      medication_taken: form.medication,
      notes,
      submitted_at: new Date().toISOString(),
    });

    // 2. Mark booking complete
    await base44.entities.Booking.update(booking.id, { status: 'completed' });

    // 3. Deduct from care pack
    if (clientPack) {
      const newUsed = (clientPack.used_visits || 0) + 1;
      const newRemaining = Math.max((clientPack.remaining_visits || 0) - 1, 0);
      const newStatus = newRemaining === 0 ? 'exhausted' : 'active';
      await base44.entities.CarePack.update(clientPack.id, {
        used_visits: newUsed,
        remaining_visits: newRemaining,
        status: newStatus,
      });
    }

    qc.invalidateQueries({ queryKey: ['caregiver-bookings'] });
    qc.invalidateQueries({ queryKey: ['client-pack'] });

    setNextVisits(upcomingVisits.filter(v => v.id !== booking.id));
    setDone(true);
    setSubmitting(false);
    onComplete?.();
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-start pt-16 px-5"
      >
        {/* Success */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-1">Visit Complete!</h2>

        {clientPack && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 w-full flex items-center gap-3">
            <Package className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Visit recorded & deducted from Care Pack</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {clientPack.remaining_visits - 1 > 0
                  ? `${clientPack.remaining_visits - 1} visits remaining for this client`
                  : 'Client has used all their visits'}
              </p>
            </div>
          </div>
        )}

        {/* Repeat opportunity */}
        {nextVisits.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> More visits available for this client
            </p>
            <div className="space-y-2">
              {nextVisits.slice(0, 2).map(v => (
                <div key={v.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{v.senior_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-black">${v.price || 35}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextVisits.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Great work! Check your dashboard for new job matches.
          </p>
        )}

        <div className="mt-6 w-full space-y-3">
          {nextVisits.length > 0 && (
            <Button className="w-full h-12 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/')}>
              Accept Next Visit
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="font-bold text-foreground">Post-Visit Report</h1>
          <p className="text-xs text-muted-foreground">Required to complete — takes ~30 seconds</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {Object.keys(form).length}/{FIELDS.length} done
        </span>
      </div>

      <div className="px-5 pt-5 pb-36 space-y-5">
        {/* Care Pack context */}
        {clientPack && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
            <Package className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <p className="text-xs text-emerald-800 font-medium">
              1 visit will be deducted from {booking.senior_name}'s Care Pack after submission
            </p>
          </div>
        )}

        {FIELDS.map(field => (
          <div key={field.key}>
            <p className="text-sm font-bold text-foreground mb-2.5">{field.label}</p>
            <div className="flex gap-2 flex-wrap">
              {field.opts.map(opt => {
                const selected = form[field.key] === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setForm(prev => ({ ...prev, [field.key]: opt.value }))}
                    className={`flex-1 min-w-[80px] py-3 rounded-2xl border-2 font-semibold text-sm transition-all ${
                      selected
                        ? 'bg-primary border-primary text-white'
                        : 'bg-card border-border text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div>
          <p className="text-sm font-bold text-foreground mb-2">Notes <span className="font-normal text-muted-foreground">(optional)</span></p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any observations, concerns, or highlights from the visit…"
            className="w-full border border-input rounded-2xl px-4 py-3 text-sm bg-transparent resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-5 pt-4 max-w-lg mx-auto"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <Button
          className="w-full h-13 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSubmit}
          disabled={!allFilled || submitting}
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</>
            : allFilled
              ? 'Submit & Complete Visit'
              : `Complete ${FIELDS.length - Object.keys(form).length} more fields`}
        </Button>
      </div>
    </div>
  );
}