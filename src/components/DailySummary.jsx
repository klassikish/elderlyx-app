import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { subDays } from 'date-fns';

export default function DailySummary() {
  const { user } = useAuth();
  const subscription = user?.subscription_plan || 'basic';

  const { data: playbacks = [] } = useQuery({
    queryKey: ['daily-summary', user?.email],
    queryFn: async () => {
      const allPlaybacks = await base44.entities.VisitPlayback.filter({}, '-visit_date', 50);
      const weekAgo = subDays(new Date(), 7);
      return allPlaybacks.filter(p => new Date(p.visit_date) >= weekAgo && p.family_email === user?.email);
    },
    enabled: subscription !== 'basic',
  });

  if (subscription === 'basic') return null;
  if (playbacks.length === 0) return null;

  const avgMood = playbacks.length > 0
    ? playbacks.filter(p => p.mood).length / playbacks.length * 100
    : 0;
  const medTaken = playbacks.filter(p => p.medication_taken).length;
  const eatingGood = playbacks.filter(p => p.eating === 'full').length;

  const mobilityScore = playbacks.filter(p => p.mobility === 'better' || p.mobility === 'same').length / Math.max(playbacks.length, 1) * 100;
  const eatingScore = eatingGood / playbacks.length * 100;
  const medScore = medTaken / playbacks.length * 100;
  const independenceScore = Math.round((mobilityScore + eatingScore + medScore) / 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 mt-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-foreground text-sm">This Week's Summary</h3>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Elderlyx Independence Score</p>
            <p className="font-black text-3xl text-primary">{independenceScore}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Based on {playbacks.length} visits</p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${(independenceScore / 100) * (54 * 2 * Math.PI)} ${54 * 2 * Math.PI}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
              {independenceScore}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 rounded-xl p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Meals</p>
          <p className="font-bold text-green-700 text-sm mt-1">{eatingGood}/{playbacks.length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Medication</p>
          <p className="font-bold text-blue-700 text-sm mt-1">{medTaken}/{playbacks.length}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Mood</p>
          <p className="font-bold text-purple-700 text-sm mt-1">{Math.round(avgMood)}%</p>
        </div>
      </div>

      {subscription === 'premium' && playbacks.some(p => p.risk_flags?.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-900">Health Pattern Detected</p>
            <p className="text-[10px] text-amber-800 mt-0.5">Review trends in Daily Life Playback</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}