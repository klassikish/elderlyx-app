import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, CalendarDays, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const TASK_OPTIONS = [
  { id: 'grocery', label: 'Grocery Shopping', rate: 35 },
  { id: 'transport', label: 'Transportation', rate: 40 },
  { id: 'companionship', label: 'Companionship', rate: 35 },
  { id: 'household', label: 'Household Chores', rate: 35 },
  { id: 'cooking', label: 'Cooking', rate: 35 },
  { id: 'medical_escort', label: 'Medical Escort', rate: 40 },
];

const DELAY_RATE = 5; // $5 per 15-min block after 15 min delay

function calcCost(taskId, delayMinutes = 0) {
  const base = TASK_OPTIONS.find(t => t.id === taskId)?.rate || 35;
  const delayBlocks = Math.floor(Math.max(0, delayMinutes - 15) / 15);
  return base + delayBlocks * DELAY_RATE;
}

export default function BookingModal({ helper, onClose }) {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState('grocery');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const bookMutation = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setStep(3);
    },
  });

  const handleBook = () => {
    bookMutation.mutate({
      helper_id: helper.id,
      helper_name: helper.full_name,
      task_type: task,
      status: 'requested',
      scheduled_date: new Date(`${date}T${time || '09:00'}`).toISOString(),
      notes,
      cost: calcCost(task),
      senior_name: 'Margaret Johnson',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card w-full max-w-md mx-auto rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {step < 3 && (
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-foreground">Book {helper.full_name?.split(' ')[0]}</h3>
              <p className="text-xs text-muted-foreground">Step {step} of 2</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress dots */}
        {step < 3 && (
          <div className="flex gap-1.5 mb-5">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary flex-1' : 'bg-border flex-shrink-0 w-4'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm font-semibold text-foreground mb-3">What type of help?</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {TASK_OPTIONS.filter(t => (helper.skills || []).includes(t.id) || helper.skills?.length === 0).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTask(t.id)}
                    className={`p-3 rounded-xl text-sm font-medium text-left border transition-all ${
                      task === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="block">{t.label}</span>
                    <span className={`text-xs font-bold mt-0.5 block ${task === t.id ? 'text-primary' : 'text-muted-foreground'}`}>${t.rate} flat</span>
                  </button>
                ))}
              </div>
              <Button className="w-full h-12 rounded-xl font-semibold" onClick={() => setStep(2)}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Date
                </label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time
                </label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notes for {helper.full_name?.split(' ')[0]}
                </label>
                <Textarea
                  placeholder="Any special instructions or preferences..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl resize-none h-20"
                />
              </div>
              <div className="bg-primary/5 rounded-xl px-4 py-3 border border-primary/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Flat-rate task fee</span>
                  <span className="text-base font-bold text-foreground">${calcCost(task)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  +$5 per every 15 min beyond the first 15 min of delay
                </p>
              </div>
              <Button className="w-full h-12 rounded-xl font-semibold" onClick={handleBook} disabled={!date || bookMutation.isPending}>
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Booked!</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {helper.full_name?.split(' ')[0]} has been notified and will confirm shortly.
              </p>
              <Button className="mt-6 w-full h-12 rounded-xl font-semibold" onClick={onClose}>
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}