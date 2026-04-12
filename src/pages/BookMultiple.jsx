import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowLeft, Calendar, Check, Loader2, CheckCircle2, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

export default function BookMultiple() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [seniorName, setSeniorName] = useState('');
  const [address, setAddress] = useState('');
  const [step, setStep] = useState('select'); // select | confirm | done
  const [booking, setBooking] = useState(false);

  const { data: packs = [] } = useQuery({
    queryKey: ['care-packs-multi', user?.email],
    queryFn: () => base44.entities.CarePack.filter({ owner_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: recentBookings = [] } = useQuery({
    queryKey: ['recent-bookings-prefill', user?.email],
    queryFn: () => base44.entities.Booking.filter({ family_email: user?.email, service_type: 'companionship' }, '-created_date', 1),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (recentBookings[0]) {
      if (!seniorName && recentBookings[0].senior_name) setSeniorName(recentBookings[0].senior_name);
      if (!address && recentBookings[0].address) setAddress(recentBookings[0].address);
    }
  }, [recentBookings]);

  const totalRemaining = packs.reduce((s, p) => s + (p.remaining_visits || 0), 0);
  const maxSelectable = Math.min(totalRemaining, 6);

  // Generate next 28 days for date picker
  const today = startOfDay(new Date());
  const dateOptions = Array.from({ length: 28 }, (_, i) => addDays(today, i + 1));

  const toggleDate = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    setSelectedDates(prev => {
      if (prev.includes(key)) return prev.filter(d => d !== key);
      if (prev.length >= maxSelectable) {
        toast.error(`You can only select up to ${maxSelectable} visits`);
        return prev;
      }
      return [...prev, key].sort();
    });
  };

  const handleConfirm = async () => {
    if (!seniorName || !address) {
      toast.error('Please fill in all details');
      return;
    }
    setBooking(true);

    // Create bookings for each selected date
    for (const dateStr of selectedDates) {
      const datetime = new Date(`${dateStr}T${selectedTime}:00`);
      await base44.entities.Booking.create({
        service_type: 'companionship',
        scheduled_date: datetime.toISOString(),
        price: 35,
        family_id: user?.id,
        family_name: user?.full_name,
        family_email: user?.email,
        senior_name: seniorName,
        address: address,
        selected_tasks: ['conversation'],
        status: 'pending',
        payment_status: 'paid',
        notes: 'Booked via Care Pack',
      });
    }

    // Deduct from care pack
    const activePack = packs[0];
    if (activePack) {
      const newUsed = (activePack.used_visits || 0) + selectedDates.length;
      const newRemaining = Math.max(0, (activePack.remaining_visits || 0) - selectedDates.length);
      await base44.entities.CarePack.update(activePack.id, {
        used_visits: newUsed,
        remaining_visits: newRemaining,
        status: newRemaining === 0 ? 'exhausted' : 'active',
      });
    }

    qc.invalidateQueries({ queryKey: ['care-packs'] });
    qc.invalidateQueries({ queryKey: ['my-bookings'] });
    setBooking(false);
    setStep('done');
  };

  if (totalRemaining < 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-foreground">Schedule Multiple Visits</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="font-bold text-foreground text-lg mb-2">Not Enough Visits</p>
          <p className="text-sm text-muted-foreground mb-6">You need at least 2 visits remaining to schedule multiple.</p>
          <Button className="w-full max-w-xs h-12 rounded-2xl" onClick={() => navigate('/CarePacks')}>
            Buy a Care Pack
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center gap-3">
        <button
          onClick={() => step === 'confirm' ? setStep('select') : navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-base">
            {step === 'select' ? 'Pick Your Dates' : step === 'confirm' ? 'Confirm Visits' : 'Visits Scheduled!'}
          </h1>
          {step === 'select' && (
            <p className="text-xs text-muted-foreground">
              {totalRemaining} visits available · Select up to {maxSelectable}
            </p>
          )}
        </div>
        {step === 'select' && selectedDates.length > 0 && (
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {selectedDates.length} selected
          </span>
        )}
      </div>

      <div className="px-5 pt-5 pb-32">
        <AnimatePresence mode="wait">

          {/* Step: Select dates */}
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-foreground font-medium">
                  Each selected date uses 1 visit from your Care Pack
                </p>
              </div>

              {/* Date grid */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-3">Select dates (next 4 weeks)</p>
                <div className="grid grid-cols-4 gap-2">
                  {dateOptions.map(date => {
                    const key = format(date, 'yyyy-MM-dd');
                    const sel = selectedDates.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleDate(date)}
                        className={`rounded-xl p-2.5 text-center transition-all border-2 ${
                          sel
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-card border-border text-foreground hover:border-primary/40'
                        }`}
                      >
                        <p className="text-[10px] font-medium opacity-70">{format(date, 'EEE')}</p>
                        <p className="text-base font-black">{format(date, 'd')}</p>
                        <p className="text-[9px] opacity-70">{format(date, 'MMM')}</p>
                        {sel && <Check className="w-3 h-3 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Preferred time (same for all visits)
                </label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </motion.div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Visits to book</p>
                <p className="text-2xl font-black text-foreground">{selectedDates.length} visits</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDates.length} visit{selectedDates.length > 1 ? 's' : ''} will be deducted from your Care Pack
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Senior's name</label>
                <Input
                  placeholder="e.g. Margaret Johnson"
                  value={seniorName}
                  onChange={e => setSeniorName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Home address</label>
                <Input
                  placeholder="Senior's home address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Scheduled dates</p>
                <div className="space-y-2">
                  {selectedDates.map((d, i) => (
                    <div key={d} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {format(new Date(d + 'T12:00'), 'EEEE, MMM d')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{selectedTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs text-green-800 font-semibold">
                  ✓ No payment needed — covered by your Care Pack
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {totalRemaining - selectedDates.length} visits will remain after booking
                </p>
              </div>
            </motion.div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{selectedDates.length} Visits Scheduled</h2>
              <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
                We're matching caregivers for each visit. You'll be notified when confirmed.
              </p>
              <div className="bg-muted rounded-2xl p-4 mt-6 w-full text-left space-y-2">
                {selectedDates.map((d, i) => (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {format(new Date(d + 'T12:00'), 'EEEE, MMM d')}
                    </span>
                    <span className="text-muted-foreground text-xs">· {selectedTime}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 w-full space-y-3">
                <Button className="w-full h-12 rounded-2xl font-semibold" onClick={() => navigate('/MyBookings')}>
                  View My Bookings
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate('/MyCarePack')}>
                  My Care Pack
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky CTA */}
      {step === 'select' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-5 pt-4 max-w-lg mx-auto"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <Button
            className="w-full h-12 rounded-2xl font-bold"
            onClick={() => setStep('confirm')}
            disabled={selectedDates.length < 1}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Review {selectedDates.length > 0 ? `${selectedDates.length} Visit${selectedDates.length > 1 ? 's' : ''}` : 'Visits'}
          </Button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-5 pt-4 max-w-lg mx-auto"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <Button
            className="w-full h-12 rounded-2xl font-bold"
            onClick={handleConfirm}
            disabled={booking}
          >
            {booking
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Booking…</>
              : <>Confirm {selectedDates.length} Visits (Care Pack)</>}
          </Button>
        </div>
      )}
    </div>
  );
}