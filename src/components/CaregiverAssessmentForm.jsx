import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Brain, Activity, Utensils, ShieldAlert, Smile, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DIMENSIONS = [
  {
    key: 'mobility_score',
    icon: Activity,
    label: 'Mobility',
    color: 'text-blue-600 bg-blue-100',
    description: 'Ability to move, walk, stand, and transfer independently',
    levels: ['Immobile / fully dependent', 'Needs significant assistance', 'Needs some help', 'Mostly independent', 'Fully independent'],
  },
  {
    key: 'cognition_score',
    icon: Brain,
    label: 'Cognition',
    color: 'text-purple-600 bg-purple-100',
    description: 'Memory, orientation, communication and decision-making',
    levels: ['Severe impairment', 'Moderate impairment', 'Mild impairment', 'Slight difficulty', 'No issues'],
  },
  {
    key: 'daily_living_score',
    icon: Utensils,
    label: 'Daily Living',
    color: 'text-green-600 bg-green-100',
    description: 'Eating, dressing, grooming and personal hygiene',
    levels: ['Fully dependent', 'Needs major help', 'Needs some help', 'Mostly manages', 'Fully manages'],
  },
  {
    key: 'safety_score',
    icon: ShieldAlert,
    label: 'Safety',
    color: 'text-red-600 bg-red-100',
    description: 'Fall risk, medication adherence, home environment safety',
    levels: ['Very high risk', 'High risk', 'Moderate risk', 'Low risk', 'No safety concerns'],
  },
  {
    key: 'engagement_score',
    icon: Smile,
    label: 'Engagement',
    color: 'text-amber-600 bg-amber-100',
    description: 'Social interaction, emotional wellbeing and motivation',
    levels: ['Withdrawn / distressed', 'Mostly withdrawn', 'Neutral', 'Engaged', 'Very engaged & positive'],
  },
];

const CONCERN_OPTIONS = [
  'Fall risk observed', 'Confusion / disorientation', 'Medication not taken',
  'Poor appetite', 'Signs of pain', 'Mood changes', 'Home safety hazards', 'Mobility declined',
];

export default function CaregiverAssessmentForm({ booking, onComplete }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0); // 0–4 = dimensions, 5 = concerns+notes, 6 = done
  const [scores, setScores] = useState({ mobility_score: 0, cognition_score: 0, daily_living_score: 0, safety_score: 0, engagement_score: 0 });
  const [concerns, setConcerns] = useState([]);
  const [notes, setNotes] = useState('');

  const dim = DIMENSIONS[step];

  const mutation = useMutation({
    mutationFn: () => {
      const total = Math.round(
        ((scores.mobility_score + scores.cognition_score + scores.daily_living_score +
          scores.safety_score + scores.engagement_score) / 5) * 20
      );
      return base44.entities.IndependenceAssessment.create({
        booking_id: booking.id,
        senior_name: booking.senior_name,
        family_email: booking.family_email,
        caregiver_id: booking.caregiver_id,
        caregiver_name: booking.caregiver_name,
        ...scores,
        total_score: total,
        caregiver_notes: notes,
        concerns,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Assessment submitted — thank you!');
      onComplete?.();
    },
  });

  const toggleConcern = (c) => setConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const totalScore = Math.round(
    ((scores.mobility_score + scores.cognition_score + scores.daily_living_score +
      scores.safety_score + scores.engagement_score) / 5) * 20
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-card rounded-t-3xl w-full max-w-md pb-10 overflow-hidden"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header — no close button, mandatory */}
        <div className="bg-primary px-6 pt-5 pb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-bold text-base">Post-Visit Assessment</p>
            <span className="text-white/70 text-xs">{Math.min(step + 1, 6)}/6</span>
          </div>
          <p className="text-white/70 text-xs">{booking.senior_name} · This assessment is required</p>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Dimension rating steps 0–4 */}
          {step < 5 && dim && (
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${dim.color}`}>
                <dim.icon className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-xl text-foreground">{dim.label}</h2>
              <p className="text-muted-foreground text-sm mt-1 mb-5">{dim.description}</p>

              <div className="space-y-2">
                {dim.levels.map((label, idx) => {
                  const val = idx + 1;
                  const selected = scores[dim.key] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setScores(s => ({ ...s, [dim.key]: val }))}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{val}</span>
                      <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full h-12 rounded-2xl mt-6 font-semibold"
                disabled={scores[dim.key] === 0}
                onClick={() => setStep(s => s + 1)}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 5 — concerns + notes */}
          {step === 5 && (
            <motion.div key="concerns" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {/* Live score preview */}
              <div className={`rounded-2xl p-4 mb-5 text-center ${totalScore >= 70 ? 'bg-green-50 border border-green-200' : totalScore >= 45 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Independence Score</p>
                <p className={`text-4xl font-black ${totalScore >= 70 ? 'text-green-600' : totalScore >= 45 ? 'text-amber-600' : 'text-red-600'}`}>{totalScore}</p>
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
              </div>

              <h2 className="font-bold text-lg text-foreground mb-1">Concerns & Notes</h2>
              <p className="text-sm text-muted-foreground mb-4">Flag any issues observed during this visit</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {CONCERN_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleConcern(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${concerns.includes(c) ? 'bg-red-500 text-white border-red-500' : 'bg-background border-border text-foreground'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Additional notes for the care team or family..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full border border-input rounded-xl p-3 text-sm resize-none bg-background mb-5"
              />

              {concerns.length > 0 && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{concerns.length} concern(s) flagged — family will be notified</p>
                </div>
              )}

              <Button
                className="w-full h-12 rounded-2xl font-semibold"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Assessment
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}