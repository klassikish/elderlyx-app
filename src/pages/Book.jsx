import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import StripePaymentForm from '@/components/StripePaymentForm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Car, CheckCircle2, MapPin, User, Plus, Minus, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PRICING, SERVICE_TYPE } from '@/lib/config/constants';
import { paymentService } from '@/lib/services/paymentService';
import { bookingService } from '@/lib/services/bookingService';
import { formatCurrency } from '@/lib/utils/formatters';
import { validateBookingData, validatePaymentAmount } from '@/lib/utils/validators';
import { getErrorMessage } from '@/lib/utils/errorHandling';

const COMPANIONSHIP_BASE = PRICING.companionship.baseRate;
const COMPANIONSHIP_EXTRA = 15;
const TRANSPORT_BASE = PRICING.transportation.baseRate;
const TRANSPORT_OVERAGE = 8;
const WAIT_INCLUDED = { basic: 30, family: 45, premium: 45 };

const TASKS = [
  { id: 'conversation', label: 'Company & Chat' },
  { id: 'meal_prep', label: 'Meal Prep' },
  { id: 'errands', label: 'Errands' },
  { id: 'medication_reminder', label: 'Medication' },
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'light_exercises', label: 'Light Exercise' },
  { id: 'tech_help', label: 'Tech Help' },
  { id: 'reading', label: 'Reading' },
];

function calculatePrice(form, plan) {
  if (form.service_type === SERVICE_TYPE.companionship) {
    const taskExtras = Math.max(0, form.selected_tasks.length - 1) * COMPANIONSHIP_EXTRA;
    const timeExtras = form.extra_hours > 0 ? form.extra_hours * COMPANIONSHIP_EXTRA : 0;
    return COMPANIONSHIP_BASE + taskExtras + timeExtras;
  }
  const freeWait = WAIT_INCLUDED[plan] || 30;
  const overage = Math.ceil(Math.max(0, form.wait_minutes - freeWait) / 15) * TRANSPORT_OVERAGE;
  return TRANSPORT_BASE + overage;
}

const SERVICE_PARAM = new URLSearchParams(window.location.search).get('service') || 'companionship';

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const plan = user?.subscription_plan || 'basic';

  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [form, setForm] = useState({
    service_type: SERVICE_PARAM,
    scheduled_date: '',
    scheduled_time: '',
    extra_hours: 0,
    selected_tasks: ['conversation'],
    wait_minutes: WAIT_INCLUDED[plan] || 30,
    senior_name: '',
    address: '',
    pickup_address: '',
    destination_address: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTask = id => setForm(p => ({
    ...p,
    selected_tasks: p.selected_tasks.includes(id)
      ? p.selected_tasks.filter(t => t !== id)
      : [...p.selected_tasks, id],
  }));

  const price = calculatePrice(form, plan);
  const freeWait = WAIT_INCLUDED[plan] || 30;

  const canProceed = form.senior_name && form.scheduled_date &&
    (form.service_type === SERVICE_TYPE.companionship ? !!form.address : !!(form.pickup_address && form.destination_address));

  const createBooking = useMutation({
    mutationFn: async (data) => {
      return bookingService.createBooking(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setStep(3);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleProceedToPayment = async () => {
    // Validate before proceeding
    const errors = validateBookingData({
      serviceType: form.service_type,
      scheduledDate: form.scheduled_date,
      price,
      duration: form.extra_hours + 1,
    });

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const priceValid = validatePaymentAmount(price);
    if (!priceValid.valid) {
      toast.error(priceValid.error);
      return;
    }

    try {
      setPaymentLoading(true);
      const intent = await paymentService.createBookingIntent(
        form.service_type,
        price
      );
      setClientSecret(intent.clientSecret);
      setPaymentIntentId(intent.paymentIntentId || intent.id);
      setStep(2);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = (intentId) => {
    const datetime = new Date(`${form.scheduled_date}T${form.scheduled_time || '09:00'}`);
    createBooking.mutate({
      service_type: form.service_type,
      scheduled_date: datetime.toISOString(),
      price,
      family_id: user?.id,
      family_name: user?.full_name,
      family_email: user?.email,
      senior_name: form.senior_name,
      address: form.service_type === SERVICE_TYPE.companionship ? form.address : form.pickup_address,
      pickup_address: form.pickup_address,
      destination_address: form.destination_address,
      selected_tasks: form.service_type === SERVICE_TYPE.companionship ? form.selected_tasks : [],
      status: 'pending',
      payment_status: 'paid',
      stripe_payment_intent_id: intentId || paymentIntentId,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center gap-3">
        <button aria-label="Go back" onClick={() => step > 1 ? setStep(s => Math.floor(s) - 1 || 1) : navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">
          {step === 1 ? 'Book a Service' : step === 2 ? 'Secure Payment' : 'Confirmed!'}
        </h1>
        {step === 1 && (
          <span className="text-primary font-black text-lg">{formatCurrency(price)}</span>
        )}
      </div>

      {/* Progress dots */}
      {step < 3 && (
        <div className="flex gap-1.5 px-5 pt-3 pb-1">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      )}

      <div className="px-5 pt-4 pb-32">
        <AnimatePresence mode="wait">

          {/* ── Step 1: All details ──────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

              <div className="flex gap-3">
                {[
                  { id: SERVICE_TYPE.companionship, icon: Heart, label: 'Companionship', sub: `From ${formatCurrency(COMPANIONSHIP_BASE)}`, color: 'text-pink-500 bg-pink-50' },
                  { id: SERVICE_TYPE.transportation, icon: Car, label: 'Transportation', sub: `From ${formatCurrency(TRANSPORT_BASE)}`, color: 'text-blue-500 bg-blue-50' },
                ].map(({ id, icon: Icon, label, sub, color }) => (
                  <button key={id} onClick={() => set('service_type', id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${form.service_type === id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{sub}</p>
                  </button>
                ))}
              </div>

              {/* Senior name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                  <User className="w-3.5 h-3.5" /> Senior's Name
                </label>
                <Input placeholder="e.g. Margaret Johnson" value={form.senior_name}
                  onChange={e => set('senior_name', e.target.value)} className="h-11 rounded-xl" />
              </div>

              {form.service_type === SERVICE_TYPE.companionship ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Home Address
                  </label>
                  <Input placeholder="Senior's home address" value={form.address}
                    onChange={e => set('address', e.target.value)} className="h-11 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Pickup Address
                    </label>
                    <Input placeholder="Where to pick up" value={form.pickup_address}
                      onChange={e => set('pickup_address', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Destination
                    </label>
                    <Input placeholder="e.g. Dr. Smith's Office" value={form.destination_address}
                      onChange={e => set('destination_address', e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              )}

              {/* Date + Time — inline row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date</label>
                  <Input type="date" value={form.scheduled_date}
                    onChange={e => set('scheduled_date', e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time</label>
                  <Input type="time" value={form.scheduled_time}
                    onChange={e => set('scheduled_time', e.target.value)} className="h-11 rounded-xl" />
                </div>
              </div>

              {form.service_type === SERVICE_TYPE.companionship && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Tasks <span className="text-muted-foreground/60 font-normal">(1st included, +$17 each)</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TASKS.map(t => {
                      const sel = form.selected_tasks.includes(t.id);
                      return (
                        <button key={t.id} onClick={() => toggleTask(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${sel ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Extra hours */}
                  <div className="flex items-center justify-between mt-4 bg-muted rounded-xl px-4 py-3">
                    <button onClick={() => set('extra_hours', Math.max(0, form.extra_hours - 1))}
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{1 + form.extra_hours} hr{1 + form.extra_hours > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-muted-foreground">Base 1hr + $17/extra hr</p>
                    </div>
                    <button onClick={() => set('extra_hours', form.extra_hours + 1)}
                      className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {form.service_type === SERVICE_TYPE.transportation && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2">
                    {freeWait} min free wait included · $8 per 15 min after
                  </p>
                  <div className="flex items-center justify-between">
                    <button onClick={() => set('wait_minutes', Math.max(0, form.wait_minutes - 15))}
                      className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5 text-blue-700" />
                    </button>
                    <div className="text-center">
                      <p className="font-bold text-blue-900">{form.wait_minutes} min</p>
                      {form.wait_minutes > freeWait && (
                        <p className="text-[10px] text-orange-600">+${Math.ceil((form.wait_minutes - freeWait) / 15) * 8} overage</p>
                      )}
                    </div>
                    <button onClick={() => set('wait_minutes', form.wait_minutes + 15)}
                      className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-blue-700" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sticky price + CTA */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-5 pt-4 max-w-lg mx-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-black text-primary">{formatCurrency(price)}</span>
                </div>
                <Button
                  className="w-full h-12 rounded-2xl font-bold"
                  onClick={handleProceedToPayment}
                  disabled={!canProceed || paymentLoading}
                >
                  {paymentLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…</>
                    : <><Lock className="w-4 h-4 mr-2" /> Pay {formatCurrency(price)} & Confirm Booking</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Payment ──────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground capitalize">{form.service_type}</p>
                  <p className="text-xs text-muted-foreground">{form.senior_name} · {form.scheduled_date}</p>
                </div>
                <p className="text-2xl font-black text-primary">{formatCurrency(price)}</p>
              </div>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={price}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => toast.error(msg)}
              />
              <p className="text-center text-[10px] text-muted-foreground">
                Caregiver matching begins immediately after payment
              </p>
            </motion.div>
          )}

          {/* ── Step 3: Confirmed ────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">You're all set!</h2>
              <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                Your booking is confirmed. We're matching you with a caregiver now.
              </p>
              <div className="bg-muted rounded-2xl p-4 mt-6 w-full text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{form.service_type}</span>
                  <span className="font-bold text-primary">{formatCurrency(price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">For</span>
                  <span className="font-semibold">{form.senior_name}</span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                <Button className="w-full h-12 rounded-2xl font-semibold" onClick={() => navigate('/MyBookings')}>
                  Track My Booking
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}