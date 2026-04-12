import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Heart, Car, HelpCircle, Clock, CalendarDays, Star, Shield, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ─── Mock caregivers shown before signup ─────────────────────────────────────
const CAREGIVERS = [
  { id: 'c1', name: 'Maria Santos', rating: 4.9, visits: 87, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', tag: 'Top Rated' },
  { id: 'c2', name: 'Linda Park', rating: 5.0, visits: 134, photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80', tag: 'Most Booked' },
  { id: 'c3', name: 'James Thompson', rating: 4.7, visits: 52, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', tag: 'Near You' },
];

const TOTAL_STEPS = 8;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ who: '', service: '', when: '', location: '', phone: '', otp: '' });
  const [locLoading, setLocLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState(CAREGIVERS[0]);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const next = () => setStep(s => s + 1);
  const back = () => step > 1 ? setStep(s => s - 1) : navigate('/');

  const detectLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => { set('location', 'Austin, TX 78701'); setLocLoading(false); next(); },
      () => { set('location', 'Location not available'); setLocLoading(false); next(); },
      { timeout: 5000 }
    );
  };

  const sendOtp = async () => {
    if (!data.phone || data.phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setOtpLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setOtpLoading(false);
    setOtpSent(true);
    toast.success('Code sent! (use 123456 in demo)');
  };

  const verifyOtp = async () => {
    if (data.otp.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setOtpLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setOtpLoading(false);
    next();
  };

  const completeBooking = () => {
    toast.success('Booking confirmed! Welcome to Elderlyx 🎉');
    setTimeout(() => navigate('/'), 1200);
  };

  const price = data.service === 'transportation' ? 35 : 35;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={back} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-10 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Who needs help ─────────────────────────── */}
          {step === 1 && (
            <Step key="s1">
              <Emoji>👴</Emoji>
              <Title>Who needs help?</Title>
              <Sub>We'll find the right caregiver for them</Sub>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { id: 'parent', label: 'Parent', emoji: '🧓' },
                  { id: 'grandparent', label: 'Grandparent', emoji: '👴' },
                  { id: 'spouse', label: 'Spouse', emoji: '💑' },
                  { id: 'other', label: 'Someone else', emoji: '🙋' },
                ].map(opt => (
                  <OptionCard key={opt.id} selected={data.who === opt.id} onClick={() => { set('who', opt.id); next(); }}>
                    <span className="text-3xl mb-2">{opt.emoji}</span>
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </OptionCard>
                ))}
              </div>
            </Step>
          )}

          {/* ── Step 2: What they need ─────────────────────────── */}
          {step === 2 && (
            <Step key="s2">
              <Emoji>💙</Emoji>
              <Title>What do they need?</Title>
              <Sub>Pick the service that fits best</Sub>
              <div className="space-y-3 mt-6">
                {[
                  { id: 'companionship', icon: Heart, color: 'text-pink-500 bg-pink-50', label: 'Companionship', desc: 'Friendly visits, activities, and conversation', price: '$35 / visit' },
                  { id: 'transportation', icon: Car, color: 'text-blue-500 bg-blue-50', label: 'Transportation', desc: 'Doctor visits & urgent rides', price: '$35 / ride' },
                  { id: 'notsure', icon: HelpCircle, color: 'text-muted-foreground bg-muted', label: 'Not sure yet', desc: "We'll help you decide", price: 'Free consult' },
                ].map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.id} onClick={() => { set('service', opt.id); next(); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${data.service === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${opt.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                      <p className="text-xs font-bold text-primary whitespace-nowrap">{opt.price}</p>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {/* ── Step 3: When ──────────────────────────────────── */}
          {step === 3 && (
            <Step key="s3">
              <Emoji>📅</Emoji>
              <Title>When do they need help?</Title>
              <Sub>We'll match available caregivers to your schedule</Sub>
              <div className="space-y-3 mt-6">
                {[
                  { id: 'today', icon: Clock, label: 'Today', desc: 'ASAP or within hours' },
                  { id: 'thisweek', icon: CalendarDays, label: 'This week', desc: 'Schedule within 7 days' },
                  { id: 'flexible', icon: CalendarDays, label: 'Flexible', desc: "I'm not in a rush" },
                ].map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.id} onClick={() => { set('when', opt.id); next(); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${data.when === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {/* ── Step 4: Location ──────────────────────────────── */}
          {step === 4 && (
            <Step key="s4">
              <Emoji>📍</Emoji>
              <Title>Where are they located?</Title>
              <Sub>We'll find caregivers near you</Sub>
              <div className="mt-6 space-y-3">
                <Button
                  className="w-full h-14 rounded-2xl font-semibold flex items-center gap-3 text-base"
                  onClick={detectLocation}
                  disabled={locLoading}
                >
                  {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                  {locLoading ? 'Detecting location…' : 'Use my current location'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">— or —</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter city or ZIP code"
                    value={data.location}
                    onChange={e => set('location', e.target.value)}
                    className="h-12 rounded-2xl text-base"
                  />
                  {data.location && (
                    <Button className="w-full h-12 rounded-2xl font-semibold" onClick={next}>
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </Step>
          )}

          {/* ── Step 5: Price ─────────────────────────────────── */}
          {step === 5 && (
            <Step key="s5">
              <Emoji>💰</Emoji>
              <Title>Simple, flat pricing</Title>
              <Sub>No hidden fees. Ever.</Sub>
              <div className="mt-6 space-y-4">
                <div className="bg-primary/5 border-2 border-primary rounded-3xl p-5 text-center">
                  <p className="text-5xl font-black text-primary">${price}</p>
                  <p className="text-muted-foreground font-medium mt-1 capitalize">
                    per {data.service === 'transportation' ? 'ride' : 'visit'}
                  </p>
                  <div className="border-t border-primary/20 mt-4 pt-4 space-y-2 text-sm text-left">
                    {[
                      'Background-checked caregiver',
                      'No subscription required',
                      'Cancel up to 2h before',
                      'Pay only after the visit',
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full h-14 rounded-2xl font-bold text-base" onClick={next}>
                  See available caregivers →
                </Button>
              </div>
            </Step>
          )}

          {/* ── Step 6: Caregiver matches ─────────────────────── */}
          {step === 6 && (
            <Step key="s6">
              <Title>3 caregivers available near you</Title>
              <Sub>All verified, background-checked, and ready</Sub>
              <div className="mt-5 space-y-3">
                {CAREGIVERS.map(c => (
                  <button key={c.id} onClick={() => setSelectedCaregiver(c)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${selectedCaregiver?.id === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <img src={c.photo} alt={c.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-foreground">{c.name}</p>
                        <Shield className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold">{c.rating}</span>
                        <span className="text-xs text-muted-foreground">· {c.visits} visits</span>
                      </div>
                      <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">{c.tag}</span>
                    </div>
                    {selectedCaregiver?.id === c.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button className="w-full h-14 rounded-2xl font-bold text-base mt-4" onClick={next}>
                Book {selectedCaregiver?.name?.split(' ')[0]} →
              </Button>
            </Step>
          )}

          {/* ── Step 7: Phone OTP ─────────────────────────────── */}
          {step === 7 && (
            <Step key="s7">
              <Emoji>📱</Emoji>
              <Title>{otpSent ? 'Enter your code' : 'Almost there!'}</Title>
              <Sub>{otpSent ? `We sent a code to ${data.phone}` : 'Enter your phone number to create your account'}</Sub>
              <div className="mt-6 space-y-3">
                {!otpSent ? (
                  <>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center w-14 h-12 rounded-xl bg-muted text-sm font-semibold text-muted-foreground border border-border">
                        🇺🇸 +1
                      </div>
                      <Input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={data.phone}
                        onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 h-12 rounded-xl text-lg font-semibold tracking-wider"
                        inputMode="numeric"
                      />
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-bold text-base" onClick={sendOtp} disabled={otpLoading || data.phone.length < 10}>
                      {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      type="text"
                      placeholder="— — — — — —"
                      value={data.otp}
                      onChange={e => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-16 rounded-2xl text-3xl font-bold tracking-[0.5em] text-center"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                    />
                    <Button className="w-full h-14 rounded-2xl font-bold text-base" onClick={verifyOtp} disabled={otpLoading || data.otp.length < 6}>
                      {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                    </Button>
                    <button className="w-full text-center text-xs text-primary font-medium" onClick={() => setOtpSent(false)}>
                      Change phone number
                    </button>
                  </>
                )}
              </div>
            </Step>
          )}

          {/* ── Step 8: Payment ───────────────────────────────── */}
          {step === 8 && (
            <Step key="s8">
              <Emoji>💳</Emoji>
              <Title>How would you like to pay?</Title>
              <Sub>Payment is collected after the visit is complete</Sub>
              <div className="mt-6 space-y-3">
                {/* Summary */}
                <div className="bg-muted rounded-2xl p-4 space-y-2 mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Caregiver</span>
                    <span className="font-semibold">{selectedCaregiver?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-semibold capitalize">{data.service === 'notsure' ? 'Companionship' : data.service}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">${price}</span>
                  </div>
                </div>

                {/* Apple Pay */}
                <button
                  onClick={completeBooking}
                  className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  Pay with Apple Pay
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or pay with card</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Card */}
                <div className="space-y-2">
                  <Input placeholder="Card number" className="h-12 rounded-xl" inputMode="numeric" />
                  <div className="flex gap-2">
                    <Input placeholder="MM / YY" className="h-12 rounded-xl flex-1" />
                    <Input placeholder="CVC" className="h-12 rounded-xl w-24" inputMode="numeric" />
                  </div>
                  <Input placeholder="Name on card" className="h-12 rounded-xl" />
                  <Button className="w-full h-14 rounded-2xl font-bold text-base mt-1" onClick={completeBooking}>
                    Confirm Booking — ${price}
                  </Button>
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  🔒 Secured by Stripe · Charged only after your visit
                </p>
              </div>
            </Step>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Step({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}
function Emoji({ children }) {
  return <div className="text-5xl mb-4">{children}</div>;
}
function Title({ children }) {
  return <h1 className="text-2xl font-black text-foreground leading-tight">{children}</h1>;
}
function Sub({ children }) {
  return <p className="text-muted-foreground text-sm mt-1">{children}</p>;
}
function OptionCard({ children, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition-all active:scale-95 ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
    >
      {children}
    </button>
  );
}