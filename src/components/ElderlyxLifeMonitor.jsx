import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Lock, TrendingDown, AlertTriangle, Pill, Heart, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import UpgradeTeaserCard from '@/components/UpgradeTeaserCard';
import SmartRecommendations from '@/components/SmartRecommendations';

export default function ElderlyxLifeMonitor({ seniorName, showTeaser = true }) {
  const { user } = useAuth();
  const subscription = user?.subscription_plan || 'basic';
  const isPremium = subscription === 'premium';
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: playbacks = [] } = useQuery({
    queryKey: ['monitor-playbacks', seniorName, user?.email],
    queryFn: async () => {
      const allPlaybacks = await base44.asServiceRole.entities.VisitPlayback.filter({}, '-visit_date', 100);
      const weekAgo = subDays(new Date(), isPremium ? 90 : 7); // Full history for PREMIUM, 1 week for others
      return allPlaybacks.filter(p => 
        new Date(p.visit_date) >= weekAgo && 
        p.family_email === user?.email &&
        (!seniorName || p.senior_name === seniorName)
      );
    },
  });

  if (!isPremium && subscription === 'basic') {
    return null; // BASIC has no playback
  }

  // Calculate metrics
  const recentPlaybacks = playbacks.slice(0, isPremium ? playbacks.length : 7);
  const avgScore = isPremium 
    ? Math.round(playbacks.reduce((sum, p) => {
        const mobility = p.mobility === 'better' || p.mobility === 'same' ? 100 : 50;
        const eating = p.eating === 'full' ? 100 : p.eating === 'partial' ? 60 : 20;
        const med = p.medication_taken ? 100 : 20;
        return sum + (mobility + eating + med) / 3;
      }, 0) / Math.max(playbacks.length, 1))
    : 0;

  const riskFlags = isPremium 
    ? playbacks.flatMap(p => p.risk_flags || []).slice(0, 3)
    : [];

  const medCompliance = Math.round(playbacks.filter(p => p.medication_taken).length / Math.max(playbacks.length, 1) * 100);

  if (subscription === 'family' && showTeaser) {
    // FAMILY: Show limited summary with teaser
    return (
      <div className="space-y-3">
        <h3 className="font-bold text-foreground text-sm">Elderlyx Life Monitor™</h3>
        
        <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Independence Score</p>
              <p className="text-2xl font-black text-primary">{Math.round(avgScore)}</p>
            </div>
            <Lock className="w-5 h-5 text-primary/40" />
          </div>
          <p className="text-[10px] text-muted-foreground">Limited to last 7 days • {playbacks.length} visits tracked</p>
          
          <div className="mt-3 pt-3 border-t border-primary/20 flex items-center gap-2 text-xs text-primary font-semibold">
            <Zap className="w-3.5 h-3.5" />
            Unlock 90-day trends & alerts
          </div>
        </div>

        <UpgradeTeaserCard 
          title="Full Health Timeline"
          description="Weekly trends, risk alerts & medication tracking"
          icon={TrendingDown}
          onClick={() => setShowUpgradeModal(true)}
        />
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  // PREMIUM: Full Elderlyx Life Monitor™
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-red-500" />
          <h3 className="font-bold text-foreground text-sm">Elderlyx Life Monitor™</h3>
          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">PREMIUM</span>
        </div>
        <p className="text-xs text-muted-foreground">90-day intelligence report for {seniorName || 'your loved one'}</p>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Independence Score */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-4">
          <p className="text-xs text-muted-foreground font-semibold mb-2">Independence Score</p>
          <p className="text-3xl font-black text-primary">{Math.round(avgScore)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{playbacks.length} visits analyzed</p>
        </div>

        {/* Medication Compliance */}
        <div className="bg-gradient-to-br from-blue-100/50 to-blue-50 rounded-2xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-900 font-semibold">Med Compliance</p>
          </div>
          <p className="text-3xl font-black text-blue-600">{medCompliance}%</p>
          <p className="text-[10px] text-blue-700/70 mt-1">Last 90 days</p>
        </div>
      </div>

      {/* Trend indicators */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Weekly Trends</p>
        <div className="space-y-1.5">
          {[
            { label: 'Eating Pattern', trend: 'stable', color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Mobility', trend: 'improving', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Mood', trend: 'stable', color: 'bg-purple-50 border-purple-200 text-purple-700' },
          ].map(({ label, trend, color }) => (
            <div key={label} className={`${color} border rounded-lg px-3 py-1.5 flex items-center justify-between`}>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-[10px] font-bold capitalize">{trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk alerts */}
      {riskFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold text-amber-900">Health Alerts</p>
          </div>
          <ul className="space-y-1">
            {riskFlags.map((flag, i) => (
              <li key={i} className="text-xs text-amber-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Smart recommendations */}
      <SmartRecommendations playbacks={playbacks} />

      {/* Timeline preview */}
      {playbacks.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-2">Recent Activity</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {playbacks.slice(0, 5).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-2.5 text-[10px]"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-foreground">{format(new Date(p.visit_date), 'MMM d')}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    p.mood === 'positive' ? 'bg-green-100 text-green-700' :
                    p.mood === 'low' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{p.mood}</span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2">{p.notes}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Data updated in real-time as caregivers complete visits
      </p>
    </motion.div>
  );
}