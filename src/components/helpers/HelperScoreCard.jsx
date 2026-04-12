import { ShieldCheck, Video, BookOpen, Briefcase, Zap, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const CRITERIA = [
  { key: 'background_check_clear', label: 'Background Check', points: 30, icon: ShieldCheck, check: (h) => h.background_check_clear },
  { key: 'video_score', label: 'Video Score > 7', points: 20, icon: Video, check: (h) => (h.video_score || 0) > 7 },
  { key: 'quiz_score', label: 'Quiz Score > 80', points: 15, icon: BookOpen, check: (h) => (h.quiz_score || 0) > 80 },
  { key: 'experience_years', label: 'Experience > 1 yr', points: 15, icon: Briefcase, check: (h) => (h.experience_years || 0) > 1 },
  { key: 'fast_onboarding', label: 'Fast Onboarding', points: 10, icon: Zap, check: (h) => h.fast_onboarding },
  { key: 'good_answers', label: 'Good Answers', points: 10, icon: MessageSquare, check: (h) => h.good_answers },
];

export function calcEligibilityScore(helper) {
  return CRITERIA.reduce((sum, c) => sum + (c.check(helper) ? c.points : 0), 0);
}

export default function HelperScoreCard({ helper }) {
  const score = calcEligibilityScore(helper);

  const getColor = (s) => {
    if (s >= 75) return { bar: 'bg-green-500', text: 'text-green-600', label: 'Excellent' };
    if (s >= 50) return { bar: 'bg-amber-400', text: 'text-amber-600', label: 'Good' };
    return { bar: 'bg-red-400', text: 'text-red-600', label: 'Needs Work' };
  };

  const { bar, text, label } = getColor(score);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Eligibility Score</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-3xl font-extrabold ${text}`}>{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bar} text-white ml-1`}>{label}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Criteria breakdown */}
      <div className="space-y-2">
        {CRITERIA.map((c) => {
          const passed = c.check(helper);
          const Icon = c.icon;
          return (
            <div key={c.key} className={`flex items-center justify-between rounded-xl px-3 py-2 ${passed ? 'bg-green-50' : 'bg-secondary'}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${passed ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${passed ? 'text-green-800' : 'text-muted-foreground'}`}>{c.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${passed ? 'text-green-700' : 'text-muted-foreground/50'}`}>
                  {passed ? `+${c.points}` : `+${c.points}`}
                </span>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${passed ? 'bg-green-500 text-white' : 'bg-border text-muted-foreground'}`}>
                  {passed ? '✓' : '·'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}