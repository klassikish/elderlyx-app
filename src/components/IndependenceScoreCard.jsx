import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Activity, Brain, Utensils, ShieldAlert, Smile, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const DIM_ICONS = {
  mobility: { icon: Activity, label: 'Mobility', color: 'text-blue-600 bg-blue-100' },
  cognition: { icon: Brain, label: 'Cognition', color: 'text-purple-600 bg-purple-100' },
  daily_living: { icon: Utensils, label: 'Daily Living', color: 'text-green-600 bg-green-100' },
  safety: { icon: ShieldAlert, label: 'Safety', color: 'text-red-600 bg-red-100' },
  engagement: { icon: Smile, label: 'Engagement', color: 'text-amber-600 bg-amber-100' },
};

function scoreColor(s) {
  if (s >= 70) return 'text-green-600';
  if (s >= 45) return 'text-amber-600';
  return 'text-red-600';
}

function scoreLabel(s) {
  if (s >= 70) return 'Good';
  if (s >= 45) return 'Fair';
  return 'Needs Attention';
}

export default function IndependenceScoreCard({ familyEmail, seniorName }) {
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments', familyEmail, seniorName],
    queryFn: () => base44.entities.IndependenceAssessment.filter(
      { family_email: familyEmail, senior_name: seniorName }, '-created_date', 20
    ),
    enabled: !!familyEmail,
  });

  if (assessments.length === 0) return null;

  const latest = assessments[0];
  const prev = assessments[1];
  const trend = prev ? latest.total_score - prev.total_score : 0;
  const chartData = [...assessments].reverse().map(a => ({
    date: format(new Date(a.created_date), 'MMM d'),
    score: a.total_score,
  }));

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Independence Score</p>
          <p className="text-xs text-muted-foreground">{seniorName}</p>
        </div>
        <Link
          to={`/IndependenceReport?senior=${encodeURIComponent(seniorName)}&email=${encodeURIComponent(familyEmail)}`}
          className="flex items-center gap-1 text-xs text-primary font-semibold"
        >
          Full Report <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-end gap-3">
        <span className={`text-5xl font-black ${scoreColor(latest.total_score)}`}>{latest.total_score}</span>
        <div className="pb-1">
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-bold">{trend > 0 ? '+' : ''}{trend !== 0 ? trend : '—'}</span>
          </div>
          <p className={`text-xs font-semibold ${scoreColor(latest.total_score)}`}>{scoreLabel(latest.total_score)}</p>
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v) => [`${v}`, 'Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Sub-dimension bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {Object.entries(DIM_ICONS).map(([key, { icon: Icon, label, color }]) => {
          const val = latest[`${key}_score`] || 0;
          const pct = (val / 5) * 100;
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-muted-foreground text-center leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      {latest.concerns?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <p className="text-xs font-semibold text-red-700">⚠ {latest.concerns.length} concern(s) flagged last visit</p>
          <p className="text-[10px] text-red-600 mt-0.5">{latest.concerns.slice(0, 2).join(' · ')}{latest.concerns.length > 2 ? ` +${latest.concerns.length - 2} more` : ''}</p>
        </div>
      )}
    </div>
  );
}