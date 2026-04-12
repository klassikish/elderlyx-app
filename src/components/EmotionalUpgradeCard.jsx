import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight } from 'lucide-react';

export default function EmotionalUpgradeCard({ trigger = 'default' }) {
  const navigate = useNavigate();

  const triggers = {
    after_visit: {
      emoji: '✅',
      headline: 'Great Visit Complete!',
      subheadline: 'Track this & future visits with AI insights.',
      reason: 'Premium members see trends & get early alerts.',
    },
    visit_playback_locked: {
      emoji: '📊',
      headline: 'Want to See the Full Picture?',
      subheadline: 'Get weekly AI wellness reports for your loved one.',
      reason: 'Premium members get trend analysis & risk alerts.',
    },
    family_sharing_locked: {
      emoji: '👨‍👩‍👧',
      headline: 'Keep Family in the Loop',
      subheadline: 'Share care updates & wellness reports instantly.',
      reason: 'Premium members add unlimited family members.',
    },
    risk_alert: {
      emoji: '⚠️',
      headline: 'Get Ahead of Concerns',
      subheadline: 'Premium members get early risk detection.',
      reason: 'AI analyzes patterns & alerts you automatically.',
    },
    default: {
      emoji: '💎',
      headline: 'Upgrade to Premium',
      subheadline: "Peace of mind for your loved one's care.",
      reason: 'See all the features premium provides.',
    },
  };

  const data = triggers[trigger] || triggers.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl mb-2">{data.emoji}</p>
          <h3 className="font-bold text-foreground text-sm">{data.headline}</h3>
          <p className="text-xs text-muted-foreground mt-1">{data.subheadline}</p>
        </div>
      </div>

      <div className="bg-white/60 rounded-xl p-2.5 border border-amber-100">
        <p className="text-[11px] font-semibold text-amber-900">
          ✓ {data.reason}
        </p>
      </div>

      <Button
        className="w-full h-10 rounded-xl font-bold gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        onClick={() => navigate('/Plans')}
      >
        <Crown className="w-4 h-4" />
        Upgrade Now
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
}