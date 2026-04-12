import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Heart, Zap, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Heart,
    monthly: 19,
    color: 'border-border',
    headerColor: 'bg-muted',
    textColor: 'text-foreground',
    subColor: 'text-muted-foreground',
    iconBg: 'bg-secondary',
    iconColor: 'text-muted-foreground',
    features: [
      'Access to platform',
      'Standard caregiver matching',
      'Simple visit completion alerts',
      'Basic support',
    ],
    limitations: [
      'No discounts',
      'Standard wait time (30 min)',
      'No analytics or playback',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    icon: Zap,
    monthly: 39,
    color: 'border-primary',
    headerColor: 'bg-primary/90',
    textColor: 'text-white',
    subColor: 'text-white/80',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',

    features: [
      '$5 discount on every transportation',
      'Priority booking',
      'Daily Care Summary (limited)',
      'Basic Independence Score (weekly avg)',
      'Extended wait time (45 min included)',
      'Family activity feed',
    ],
    limitations: [
      'No trend history',
      'No risk detection',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    monthly: 69,
    color: 'border-amber-300',
    headerColor: 'bg-gradient-to-br from-amber-500 to-orange-500',
    textColor: 'text-white',
    subColor: 'text-white/80',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    features: [
      '$10 discount on every transportation',
      '1 free trip per month',
      'Extended wait time (45 min included)',
      'Priority caregiver assignment',
      'Daily Life Playback (full history)',
      'Advanced Independence Score with trends',
      'Risk detection & health alerts',
      'Emergency Services Button (SOS)',
      'All platform features',
    ],
  },
];

export default function Plans({ embedded = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(null);
  const currentPlan = user?.subscription_plan || 'basic';

  const handleSelect = async (plan) => {
    if (plan.id === currentPlan) return;
    setLoading(plan.id);
    await base44.auth.updateMe({ subscription_plan: plan.id });
    toast.success(`Switched to ${plan.name} plan!`);
    setLoading(null);
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && (
        <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-foreground">Choose a Plan</h1>
        </div>
      )}

      <div className="px-5 pt-5 pb-10">
        <p className="text-center text-sm text-muted-foreground mb-5">
          Upgrade or downgrade anytime — no contracts
        </p>

        {/* Billing toggle */}
        <div className="flex bg-muted rounded-xl p-1 mb-6 mx-auto max-w-xs">
          {['monthly', 'annual'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${billing === b ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {b} {b === 'annual' && <span className="text-green-600 text-[10px] ml-1">-20%</span>}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = billing === 'annual' ? Math.round(plan.monthly * 0.8) : plan.monthly;
            const isActive = currentPlan === plan.id;
            const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative bg-card rounded-3xl border-2 overflow-hidden ${plan.color} ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {plan.popular && !isActive && (
                  <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                    POPULAR
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                    ACTIVE
                  </div>
                )}

                {/* Header */}
                <div className={`${plan.headerColor} px-5 py-4 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${plan.textColor}`}>{plan.name}</p>
                    <p className={`text-sm font-semibold ${plan.subColor}`}>
                      ${price}<span className="text-xs font-normal">/mo</span>
                      {billing === 'annual' && (
                        <span className="ml-1.5 text-[10px] opacity-80">billed annually</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 py-4">
                  <ul className="space-y-2 mb-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.limitations?.map(l => (
                    <li key={l} className="flex items-center gap-2 text-sm text-muted-foreground list-none mt-2">
                      <span className="w-4 h-4 flex items-center justify-center text-muted-foreground flex-shrink-0">–</span>
                      {l}
                    </li>
                  ))}

                  <Button
                    className={`w-full h-11 rounded-2xl font-semibold mt-4 ${
                      isActive ? '' :
                      plan.id === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0' : ''
                    }`}
                    variant={isActive ? 'outline' : 'default'}
                    disabled={isActive || loading !== null}
                    onClick={() => handleSelect(plan)}
                  >
                    {loading === plan.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isActive
                        ? '✓ Current Plan'
                        : isDowngrade
                          ? `Downgrade to ${plan.name}`
                          : `Upgrade to ${plan.name} — $${price}/mo`
                    }
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Changes take effect immediately. Cancel anytime.
        </p>
      </div>
    </div>
  );
}