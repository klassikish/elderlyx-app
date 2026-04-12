import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Heart, CheckCircle2, Zap, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeInterstitial({ onClose, trigger = 'general' }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const scenarios = {
    after_visit: {
      title: "Just Completed a Visit!",
      steps: [
        { icon: CheckCircle2, text: "Your loved one had a great day" },
        { icon: TrendingUp, text: "Premium: Track patterns & trends" },
        { icon: Zap, text: "Get alerts before issues happen" },
      ],
      cta: "See Weekly Wellness Insights →",
    },
    family_invite: {
      title: "Adding Family Members?",
      steps: [
        { icon: Users, text: "Sibling wants to help" },
        { icon: Heart, text: "Premium: Share full care access" },
        { icon: CheckCircle2, text: "Everyone stays informed & involved" },
      ],
      cta: "Unlock Family Sharing →",
    },
    general: {
      title: "Peace of Mind Starts Here",
      steps: [
        { icon: Heart, text: "Stop worrying about what you can't see" },
        { icon: TrendingUp, text: "Get AI-powered health insights" },
        { icon: Users, text: "Keep family connected & informed" },
      ],
      cta: "Upgrade to Premium →",
    },
  };

  const scenario = scenarios[trigger] || scenarios.general;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-3xl max-w-md w-full p-6 space-y-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-2xl font-black text-foreground">{scenario.title}</h2>
        </div>

        {/* Steps with animation */}
        <div className="space-y-2">
          <AnimatePresence>
            {scenario.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{step.text}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pricing highlight */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3.5 border border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Premium Plan</span>
            <span className="text-xl font-black text-primary">$69/mo</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            ✓ AI wellness reports  ✓ Family sharing  ✓ Early alerts  ✓ $5/trip savings
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl font-bold gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={() => {
              navigate('/Plans');
              onClose();
            }}
          >
            <Heart className="w-4 h-4" />
            Upgrade
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Cancel anytime. No contracts.
        </p>
      </motion.div>
    </div>
  );
}