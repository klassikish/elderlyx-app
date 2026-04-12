import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Brain, Activity, Utensils, ShieldAlert, Smile, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const DIMS = [
  { key: 'mobility_score', icon: Activity, label: 'Mobility', color: '#3b82f6', bg: 'bg-blue-100 text-blue-600' },
  { key: 'cognition_score', icon: Brain, label: 'Cognition', color: '#a855f7', bg: 'bg-purple-100 text-purple-600' },
  { key: 'daily_living_score', icon: Utensils, label: 'Daily Living', color: '#22c55e', bg: 'bg-green-100 text-green-600' },
  { key: 'safety_score', icon: ShieldAlert, label: 'Safety', color: '#ef4444', bg: 'bg-red-100 text-red-600' },
  { key: 'engagement_score', icon: Smile, label: 'Engagement', color: '#f59e0b', bg: 'bg-amber-100 text-amber-600' },
];

function scoreColor(s) {
  if (s >= 70) return 'text-green-600';
  if (s >= 45) return 'text-amber-600';
  return 'text-red-600';
}

function scoreLabel(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 55) return 'Fair';
  if (s >= 40) return 'Needs Support';
  return 'Requires Immediate Attention';
}

export default function IndependenceReport() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const seniorName = params.get('senior') || '';
  const familyEmail = params.get('email') || '';

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments-report', familyEmail, seniorName],
    queryFn: () => base44.entities.IndependenceAssessment.filter(
      { family_email: familyEmail, senior_name: seniorName }, '-created_date', 50
    ),
  });

  const latest = assessments[0];
  const prev = assessments[1];
  const trend = (latest && prev) ? latest.total_score - prev.total_score : 0;

  const chartData = [...assessments].reverse().map(a => ({
    date: format(new Date(a.created_date), 'MMM d'),
    score: a.total_score,
    mobility: Math.round((a.mobility_score / 5) * 100),
    cognition: Math.round((a.cognition_score / 5) * 100),
    safety: Math.round((a.safety_score / 5) * 100),
  }));

  const radarData = latest ? DIMS.map(d => ({
    subject: d.label,
    score: Math.round(((latest[d.key] || 0) / 5) * 100),
    fullMark: 100,
  })) : [];

  // Collect all unique concerns across all assessments
  const allConcerns = {};
  assessments.forEach(a => {
    (a.concerns || []).forEach(c => { allConcerns[c] = (allConcerns[c] || 0) + 1; });
  });
  const concernsSorted = Object.entries(allConcerns).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground text-sm">Independence Report</h1>
          <p className="text-xs text-muted-foreground">{seniorName}</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 print:hidden" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading report…</div>
      )}

      {!isLoading && assessments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-semibold">No assessments yet</p>
          <p className="text-sm text-muted-foreground mt-1">Assessments are recorded after each caregiver visit</p>
        </div>
      )}

      {!isLoading && latest && (
        <div className="px-5 py-5 space-y-5 pb-10 max-w-2xl mx-auto">

          {/* Report header for print */}
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-black">Elderlyx Independence Report</h1>
            <p className="text-gray-600">Patient: {seniorName} · Generated: {format(new Date(), 'PPP')}</p>
            <p className="text-gray-600">{assessments.length} assessments on file</p>
          </div>

          {/* Score summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-5 ${latest.total_score >= 70 ? 'bg-green-50 border border-green-200' : latest.total_score >= 45 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Overall Score</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className={`text-6xl font-black ${scoreColor(latest.total_score)}`}>{latest.total_score}</span>
                  <div className="pb-2">
                    <p className={`text-sm font-bold ${scoreColor(latest.total_score)}`}>{scoreLabel(latest.total_score)}</p>
                    <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend} from last visit` : 'No change'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last assessed</p>
                <p className="text-sm font-semibold">{format(new Date(latest.created_date), 'MMM d, yyyy')}</p>
                <p className="text-xs text-muted-foreground mt-1">{assessments.length} total visits</p>
              </div>
            </div>
          </motion.div>

          {/* Dimension breakdown */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-bold text-foreground mb-3">Dimension Scores</h2>
            <div className="space-y-3">
              {DIMS.map(d => {
                const val = latest[d.key] || 0;
                const pct = (val / 5) * 100;
                const Icon = d.icon;
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{d.label}</p>
                        <p className="text-sm font-bold" style={{ color: d.color }}>{Math.round(pct)}%</p>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          {radarData.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h2 className="font-bold text-foreground mb-1">Capability Profile</h2>
              <p className="text-xs text-muted-foreground mb-3">Visual overview of all domains</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name={seniorName} dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score trend chart */}
          {chartData.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h2 className="font-bold text-foreground mb-1">Score Trend</h2>
              <p className="text-xs text-muted-foreground mb-3">Overall independence score over time</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" name="Overall" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recurring concerns */}
          {concernsSorted.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Flagged Concerns
              </h2>
              <div className="space-y-2">
                {concernsSorted.map(([concern, count]) => (
                  <div key={concern} className="flex items-center justify-between">
                    <p className="text-sm text-foreground">{concern}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {count}× reported
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent caregiver notes */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-bold text-foreground mb-3">Caregiver Notes</h2>
            <div className="space-y-3">
              {assessments.filter(a => a.caregiver_notes).slice(0, 5).map(a => (
                <div key={a.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs text-muted-foreground">{format(new Date(a.created_date), 'MMM d, yyyy')} · {a.caregiver_name}</p>
                  <p className="text-sm text-foreground mt-0.5">{a.caregiver_notes}</p>
                </div>
              ))}
              {assessments.filter(a => a.caregiver_notes).length === 0 && (
                <p className="text-sm text-muted-foreground italic">No notes recorded yet</p>
              )}
            </div>
          </div>

          {/* Doctor disclaimer */}
          <div className="bg-muted rounded-2xl p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Clinical Disclaimer</p>
            This report is generated from caregiver observations and is intended to supplement — not replace — clinical assessment by a licensed healthcare professional. Scores reflect functional independence trends observed during care visits.
          </div>
        </div>
      )}
    </div>
  );
}