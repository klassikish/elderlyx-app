import { Lock, Crown, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UpgradePromptModal({ onClose, trigger = 'visited_feature' }) {
  const navigate = useNavigate();

  const triggers = {
    visited_feature: {
      icon: '🔒',
      title: 'Unlock Elderlyx Life Monitor™',
      subtitle: 'See the full picture of your loved one\'s health',
      items: ['90-day health timeline', 'Real-time risk alerts', 'Smart recommendations'],
    },
    risk_detected: {
      icon: '⚠️',
      title: 'Health Alert Detected',
      subtitle: 'Premium subscribers get real-time notifications & insights',
      items: ['Early warning system', 'Trend analysis', 'Medication tracking'],
    },
    after_visit: {
      icon: '✓',
      title: 'Great Visit Complete!',
      subtitle: 'Upgrade to see trends and get peace of mind',
      items: ['Track weekly progress', 'Get health alerts', 'See patterns over time'],
    },
  };

  const trigger_data = triggers[trigger] || triggers.visited_feature;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <span className="text-4xl">{trigger_data.icon}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">{trigger_data.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{trigger_data.subtitle}</p>
        </div>

        <ul className="space-y-2">
          {trigger_data.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              {item}
            </li>
          ))}
        </ul>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">PREMIUM Plan</span>
            </div>
            <span className="text-primary font-black">$69/mo</span>
          </div>
          <p className="text-xs text-muted-foreground">Full access to all features & premium support</p>
        </div>

        <Button
          className="w-full h-12 rounded-2xl font-bold gap-2"
          onClick={() => {
            navigate('/Plans');
            onClose();
          }}
        >
          Upgrade to PREMIUM
          <ChevronRight className="w-4 h-4" />
        </Button>

        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-muted-foreground font-medium"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}