import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star, Sparkles, Heart, Calendar, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import StripePaymentForm from '@/components/StripePaymentForm';
import { toast } from 'sonner';

const PACKS = [
  {
    id: 'standard',
    name: 'Standard Pack',
    visits: 4,
    price: 140,
    caption: 'Good for light weekly support',
    frequency: 'About once per week',
  },
  {
    id: 'enhanced',
    name: 'Enhanced Pack',
    visits: 6,
    price: 210,
    caption: 'Better for consistent check-ins and monitoring',
    frequency: '2–3 check-ins per week',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    visits: 8,
    price: 280,
    caption: 'Best for frequent support',
    frequency: 'Frequent support across the month',
  },
];

export default function CarePacks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selected, setSelected] = useState('enhanced');
  const [step, setStep] = useState('choose'); // choose | checkout | done
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const { data: existingPacks = [] } = useQuery({
    queryKey: ['care-packs'],
    queryFn: () => base44.entities.CarePack.filter({ owner_email: user?.email, status: 'active' }),
  });

  const totalRemaining = existingPacks.reduce((sum, p) => sum + (p.remaining_visits || 0), 0);
  const selectedPack = PACKS.find(p => p.id === selected);

  const handleProceedToCheckout = async () => {
    setPaymentLoading(true);
    const res = await base44.functions.invoke('createPaymentIntent', {
      amount: selectedPack.price,
      service_type: 'care_pack',
      senior_name: user?.full_name,
    });
    setClientSecret(res.data.client_secret);
    setPaymentLoading(false);
    setStep('checkout');
  };

  const handlePaymentSuccess = async (intentId) => {
    await base44.entities.CarePack.create({
      owner_email: user?.email,
      owner_id: user?.id,
      owner_name: user?.full_name,
      pack_type: selectedPack.id,
      total_visits: selectedPack.visits,
      used_visits: 0,
      remaining_visits: selectedPack.visits,
      amount_paid: selectedPack.price,
      stripe_payment_intent_id: intentId,
      status: 'active',
      purchased_at: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ['care-packs'] });
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center gap-3">
        <button
          onClick={() => step === 'checkout' ? setStep('choose') : navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-base">
            {step === 'choose' ? 'Choose a Care Pack' : step === 'checkout' ? 'Secure Checkout' : 'Pack Added!'}
          </h1>
        </div>
        {totalRemaining > 0 && step === 'choose' && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {totalRemaining} visits left
          </span>
        )}
      </div>

      <div className="px-5 pt-5 pb-36">
        <AnimatePresence mode="wait">

          {/* ── STEP: Choose ── */}
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Subtitle + explanation */}
              <div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Prepay for visits and make check-ins easier to schedule.
                </p>
                <div className="mt-4 bg-muted/50 rounded-2xl p-4 space-y-2">
                  {[
                    'Each companionship visit is $35',
                    'Care Packs are prepaid visit bundles',
                    'Subscription plans stay separate from Care Packs',
                    'You can still book single visits anytime',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/Book')}
                  className="mt-3 text-xs text-primary font-semibold underline-offset-2 hover:underline"
                >
                  Book 1 visit instead →
                </button>
              </div>

              {/* Pack cards */}
              <div className="space-y-3">
                {PACKS.map(pack => {
                  const isSelected = selected === pack.id;
                  return (
                    <motion.button
                      key={pack.id}
                      onClick={() => setSelected(pack.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all relative overflow-hidden
                        ${isSelected
                          ? pack.popular
                            ? 'border-primary bg-primary/5'
                            : 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                        }
                        ${pack.popular && !isSelected ? 'border-primary/40' : ''}
                      `}
                    >
                      {pack.popular && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Most Popular
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between pr-20">
                        <div>
                          <p className="font-bold text-foreground">{pack.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{pack.visits} companionship visits</p>
                          <p className="text-xs text-muted-foreground mt-1">{pack.caption}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-black text-foreground">${pack.price}</p>
                          <p className="text-[11px] text-muted-foreground">${(pack.price / pack.visits).toFixed(0)}/visit</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Value messaging */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Visit Frequency Guide
                </p>
                {PACKS.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-blue-900">{p.visits} visits</span>
                    <span className="text-blue-700">{p.frequency}</span>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div>
                <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> How Care Packs Work
                </p>
                <div className="space-y-2.5">
                  {[
                    'Visits are added to your account after purchase',
                    'Book visits using your available pack balance',
                    'Packs apply only to companionship visits',
                    'Transportation is billed separately',
                    'Subscription features remain unchanged',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ── STEP: Checkout ── */}
          {step === 'checkout' && (
            <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{selectedPack.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPack.visits} companionship visits</p>
                  </div>
                  <p className="text-2xl font-black text-primary">${selectedPack.price}</p>
                </div>
              </div>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={selectedPack.price}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => toast.error(msg)}
              />
            </motion.div>
          )}

          {/* ── STEP: Done ── */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Care Pack Added!</h2>
              <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
                Your visits are now ready to use.
              </p>
              <div className="bg-muted rounded-2xl p-4 mt-5 w-full text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pack type</span>
                  <span className="font-semibold text-foreground">{selectedPack.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total visits purchased</span>
                  <span className="font-semibold text-foreground">{selectedPack.visits} visits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining visits</span>
                  <span className="font-bold text-primary">{selectedPack.visits} visits</span>
                </div>
              </div>

              {/* Visual dots */}
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {Array.from({ length: selectedPack.visits }).map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Most families schedule their next visit right away</p>

              <div className="mt-6 w-full space-y-3">
                <Button className="w-full h-12 rounded-2xl font-semibold" onClick={() => navigate('/Book?pack=true')}>
                  <Heart className="w-4 h-4 mr-2" /> Book Your First Visit
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate('/MyCarePack')}>
                  View My Visits
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky bottom CTA */}
      {step === 'choose' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-5 pt-4 max-w-lg mx-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">{selectedPack.name}</p>
              <p className="text-sm font-semibold text-foreground">{selectedPack.visits} visits</p>
            </div>
            <span className="text-2xl font-black text-primary">${selectedPack.price}</span>
          </div>
          <Button
            className="w-full h-12 rounded-2xl font-bold"
            onClick={handleProceedToCheckout}
            disabled={paymentLoading}
          >
            {paymentLoading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…</>
              : <><Package className="w-4 h-4 mr-2" /> Buy Care Pack</>}
          </Button>
          <button
            onClick={() => navigate('/Book')}
            className="w-full text-center text-xs text-muted-foreground mt-2 py-1"
          >
            Book 1 Visit Instead
          </button>
        </div>
      )}
    </div>
  );
}