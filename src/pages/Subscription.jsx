import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Heart, Star, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Heart,
    price: 19,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    description: 'Essential monitoring for one senior family member.',
    features: [
      '1 senior profile',
      'Family Feed updates',
      'Up to 4 helper bookings/month',
      'Email alerts',
    ],
    notIncluded: [
      'Independence Score™ tracking',
      'AI wellness insights',
      'Priority support',
      'Unlimited bookings',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    icon: Shield,
    price: 39,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    description: 'Full care coordination for the whole family.',
    popular: true,
    features: [
      'Up to 3 senior profiles',
      'Independence Score™ tracking',
      'Family Feed updates',
      'Unlimited helper bookings',
      'Push & SMS alerts',
      'AI wellness insights',
      'Care Timeline history',
      'Priority support',
    ],
    notIncluded: [],
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: 69,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    description: 'Concierge-level care management for extended families.',
    features: [
      'Unlimited senior profiles',
      'Everything in Family',
      'Dedicated care coordinator',
      'Monthly wellness report',
      'Helper background re-checks',
      '24/7 emergency support line',
      'Early access to new features',
    ],
    notIncluded: [],
  },
];

export default function Subscription() {
  const [billing, setBilling] = useState('monthly');
  const [selected, setSelected] = useState(null);

  const getPrice = (price) => billing === 'annual' ? Math.round(price * 0.8) : price;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-blue-700 pt-14 pb-10 px-5 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="bg-white/20 text-white border-0 mb-3">Simple, transparent pricing</Badge>
          <h1 className="text-2xl font-bold text-white mb-2">Choose your care plan</h1>
          <p className="text-primary-foreground/70 text-sm max-w-xs mx-auto">
            Give your loved one the independence they deserve — and the peace of mind your family needs.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billing === 'annual' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
            >
              Annual
              <span className="bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="px-5 -mt-2 pb-10 space-y-4 mt-6">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const isSelected = selected === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card rounded-2xl border-2 shadow-sm overflow-hidden transition-all cursor-pointer ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : plan.popular ? 'border-primary/30' : 'border-border'
              }`}
              onClick={() => setSelected(isSelected ? null : plan.id)}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1.5 tracking-wide">
                  ⭐ MOST POPULAR
                </div>
              )}

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${plan.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-base">{plan.name}</h2>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-muted-foreground">$</span>
                      <span className="text-2xl font-bold text-foreground">{getPrice(plan.price)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">/month</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-green-600" />
                      </div>
                      <span className="text-xs text-foreground">{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <div key={f} className="flex items-center gap-2 opacity-40">
                      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-0.5 bg-muted-foreground rounded" />
                      </div>
                      <span className="text-xs text-muted-foreground line-through">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  className={`w-full mt-4 h-10 rounded-xl font-semibold text-sm ${
                    plan.popular ? '' : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border shadow-none'
                  }`}
                  variant={plan.popular ? 'default' : 'secondary'}
                  onClick={(e) => { e.stopPropagation(); setSelected(plan.id); }}
                >
                  {plan.popular ? (
                    <>Get Started <ArrowRight className="w-4 h-4 ml-1" /></>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-5 pt-2 pb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" /> Secure payments
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" /> Cancel anytime
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5" /> 30-day free trial
          </div>
        </div>
      </div>
    </div>
  );
}