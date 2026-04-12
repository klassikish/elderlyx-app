import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const OPTIONS = {
  eating: [
    { id: 'none', label: 'Didn\'t eat', color: 'bg-red-100 text-red-700' },
    { id: 'partial', label: 'Ate some', color: 'bg-amber-100 text-amber-700' },
    { id: 'full', label: 'Ate well', color: 'bg-green-100 text-green-700' },
  ],
  mobility: [
    { id: 'better', label: 'Better today', color: 'bg-green-100 text-green-700' },
    { id: 'same', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { id: 'worse', label: 'More difficulty', color: 'bg-orange-100 text-orange-700' },
  ],
  mood: [
    { id: 'positive', label: 'Happy & engaged', color: 'bg-green-100 text-green-700' },
    { id: 'neutral', label: 'Calm', color: 'bg-blue-100 text-blue-700' },
    { id: 'low', label: 'Quieter than usual', color: 'bg-amber-100 text-amber-700' },
  ],
};

export default function CaregiverVisitForm({ booking, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    eating: '',
    mobility: '',
    mood: '',
    confusion_observed: false,
    medication_taken: true,
    notes: '',
  });

  const allFieldsFilled = form.eating && form.mobility && form.mood;

  const handleSubmit = async () => {
    if (!allFieldsFilled) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Generate simple timeline from visit
      const now = new Date();
      const visitStart = new Date(booking.scheduled_date);
      const timelineEvents = [
        { time: visitStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), activity: `Visit started` },
        { time: new Date(visitStart.getTime() + 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), activity: form.eating === 'full' ? 'Ate a full meal' : form.eating === 'partial' ? 'Ate a light meal' : 'Skipped meal' },
        { time: new Date(visitStart.getTime() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), activity: form.mobility === 'better' ? 'Mobility improved' : form.mobility === 'worse' ? 'Needed more support' : 'Normal mobility' },
        form.confusion_observed && { time: new Date(visitStart.getTime() + 45 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), activity: 'Mild confusion observed' },
        form.medication_taken && { time: new Date(visitStart.getTime() + 50 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), activity: 'Medication taken' },
      ].filter(Boolean);

      const playback = await base44.entities.VisitPlayback.create({
        booking_id: booking.id,
        caregiver_id: booking.caregiver_id,
        caregiver_name: booking.caregiver_name,
        senior_name: booking.senior_name,
        family_email: booking.family_email,
        visit_date: booking.scheduled_date,
        eating: form.eating,
        mobility: form.mobility,
        mood: form.mood,
        confusion_observed: form.confusion_observed,
        medication_taken: form.medication_taken,
        notes: form.notes,
        timeline_events: timelineEvents,
        submitted_at: new Date().toISOString(),
      });

      // Send notification (handles BASIC, FAMILY, PREMIUM tiers)
      await base44.functions.invoke('sendVisitNotification', { booking_id: booking.id, playback_id: playback.id });

      // Trigger risk analysis for PREMIUM subscribers only (handled inside sendVisitNotification)
      // analyzeVisitRisks will be called via automation if PREMIUM subscription detected

      toast.success('Visit report submitted');
      if (onSubmit) onSubmit(playback);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-card rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-foreground">Visit Report</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Please complete this report before closing the visit. The family is waiting to see what happened.</p>
          </div>

          {/* Eating */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Did {booking.senior_name} eat?</p>
            <div className="flex flex-col gap-2">
              {OPTIONS.eating.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(p => ({ ...p, eating: opt.id }))}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    form.eating === opt.id
                      ? `${opt.color} border-current`
                      : `bg-muted text-muted-foreground border-border`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobility */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">How was mobility today?</p>
            <div className="flex flex-col gap-2">
              {OPTIONS.mobility.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(p => ({ ...p, mobility: opt.id }))}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    form.mobility === opt.id
                      ? `${opt.color} border-current`
                      : `bg-muted text-muted-foreground border-border`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">What was the mood?</p>
            <div className="flex flex-col gap-2">
              {OPTIONS.mood.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(p => ({ ...p, mood: opt.id }))}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    form.mood === opt.id
                      ? `${opt.color} border-current`
                      : `bg-muted text-muted-foreground border-border`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Confusion */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Any confusion observed?</p>
            <div className="flex gap-2">
              {[
                { id: true, label: 'Yes' },
                { id: false, label: 'No' },
              ].map(opt => (
                <button
                  key={String(opt.id)}
                  onClick={() => setForm(p => ({ ...p, confusion_observed: opt.id }))}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    form.confusion_observed === opt.id
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medication */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Medication taken?</p>
            <div className="flex gap-2">
              {[
                { id: true, label: 'Yes' },
                { id: false, label: 'No' },
              ].map(opt => (
                <button
                  key={String(opt.id)}
                  onClick={() => setForm(p => ({ ...p, medication_taken: opt.id }))}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    form.medication_taken === opt.id
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Any notes?</p>
            <textarea
              placeholder="Add anything important the family should know..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-input rounded-xl p-3 text-sm resize-none h-20 bg-transparent"
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 rounded-2xl font-bold"
            onClick={handleSubmit}
            disabled={!allFieldsFilled || loading}
          >
            {loading ? 'Submitting...' : 'Submit Visit Report'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}