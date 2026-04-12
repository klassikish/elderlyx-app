import { Lock, TrendingUp, Heart, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function WellnessUpgradePrompt() {
  const navigate = useNavigate();

  const benefits = [
    { icon: TrendingUp, text: 'Weekly AI wellness analysis' },
    { icon: AlertTriangle, text: 'Early risk detection alerts' },
    { icon: Heart, text: 'Actionable health recommendations' },
    { icon: Users, text: 'Share reports with family members' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 rounded-3xl border border-blue-200 p-6 space-y-4">
        {/* Header with emoji */}
        <div className="text-center space-y-2">
          <div className="text-4xl">📊</div>
          <h3 className="text-lg font-bold text-foreground">
            Get Weekly Health Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            Stop worrying. Get data-driven peace of mind with AI wellness reports.
          </p>
        </div>

        {/* What Premium members get */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 space-y-2">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* Emotional message */}
        <div className="bg-blue-100/50 rounded-2xl p-3 border border-blue-200">
          <p className="text-xs text-blue-900 font-semibold">
            ✓ <span className="font-bold">Premium members know exactly what's happening.</span> No guessing. No worrying. Just clarity.
          </p>
        </div>

        {/* CTA */}
        <Button
          className="w-full h-12 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
          onClick={() => navigate('/Plans')}
        >
          <Lock className="w-4 h-4" />
          Unlock AI Wellness Reports
        </Button>

        <p className="text-center text-[10px] text-muted-foreground">
          Premium: $69/month • $5/trip savings • Full family sharing • 24/7 peace of mind
        </p>
      </div>
    </motion.div>
  );
}