import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, TrendingDown, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

const LABELS = {
  eating: { none: '🍽️ Didn\'t eat', partial: '🍽️ Ate some', full: '🍽️ Ate well' },
  mobility: { better: '🚶 Better', same: '🚶 Normal', worse: '🚶 More difficulty' },
  mood: { positive: '😊 Happy', neutral: '😐 Calm', low: '😔 Quieter' },
};

export default function DailyPlayback({ seniorName, bookingId }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: playbacks = [] } = useQuery({
    queryKey: ['playbacks', user?.email, seniorName],
    queryFn: () => base44.entities.VisitPlayback.filter(
      { family_email: user?.email, senior_name: seniorName },
      '-visit_date',
      30
    ),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['risk-alerts', seniorName],
    queryFn: async () => {
      const res = await base44.functions.invoke('analyzeVisitRisks', {
        senior_email: user?.email,
        senior_id: seniorName,
      });
      return res.data.alerts || [];
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const todayPlayback = playbacks.find(p => startOfDay(new Date(p.visit_date)).getTime() === startOfDay(selectedDate).getTime());
  const last7Days = playbacks.filter(p => new Date(p.visit_date) >= subDays(selectedDate, 7));

  // Calculate trends
  const calcTrend = (field, values) => {
    if (values.length < 2) return null;
    const order = field === 'eating' ? ['none', 'partial', 'full'] : field === 'mobility' ? ['worse', 'same', 'better'] : ['low', 'neutral', 'positive'];
    const recent = order.indexOf(values[0]);
    const older = order.indexOf(values[values.length - 1]);
    if (recent > older) return 'up';
    if (recent < older) return 'down';
    return 'stable';
  };

  const eatingTrend = calcTrend('eating', last7Days.map(p => p.eating).filter(Boolean));
  const mobilityTrend = calcTrend('mobility', last7Days.map(p => p.mobility).filter(Boolean));
  const moodTrend = calcTrend('mood', last7Days.map(p => p.mood).filter(Boolean));

  const confusionFreq = last7Days.filter(p => p.confusion_observed).length;
  const missedMeds = last7Days.filter(p => !p.medication_taken).length;

  return (
    <div className="space-y-4">
      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {alerts.map((alert, i) => (
            <div key={i} className={`rounded-2xl p-3 mb-2 flex gap-2 ${
              alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
              alert.severity === 'warning' ? 'bg-amber-50 border border-amber-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                alert.severity === 'critical' ? 'text-red-600' :
                alert.severity === 'warning' ? 'text-amber-600' :
                'text-blue-600'
              }`} />
              <div className="text-xs">
                <p className="font-bold">{alert.message}</p>
                <p className="text-[11px] mt-0.5">{alert.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Today's Timeline */}
      {todayPlayback ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Today's Timeline
          </h3>
          <div className="space-y-2">
            {todayPlayback.timeline_events?.map((event, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold text-primary min-w-16">{event.time}</span>
                <p className="text-sm text-foreground">{event.activity}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Summary</p>
            <div className="text-sm space-y-1">
              <p>{LABELS.eating[todayPlayback.eating]}</p>
              <p>{LABELS.mobility[todayPlayback.mobility]}</p>
              <p>{LABELS.mood[todayPlayback.mood]}</p>
              {todayPlayback.confusion_observed && <p className="text-amber-600">⚠️ Mild confusion observed</p>}
              {!todayPlayback.medication_taken && <p className="text-red-600">💊 Medication not taken</p>}
            </div>
          </div>

          {todayPlayback.notes && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-foreground italic">"{todayPlayback.notes}"</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">No visit recorded for today</p>
        </div>
      )}

      {/* Weekly Trends */}
      {last7Days.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-3">This Week's Patterns</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Eating</span>
              <div className="flex items-center gap-2">
                {eatingTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {eatingTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {eatingTrend === 'stable' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                <span className="text-xs font-bold text-foreground">{last7Days.filter(p => p.eating === 'full').length}/7 days well</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mobility</span>
              <div className="flex items-center gap-2">
                {mobilityTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {mobilityTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {mobilityTrend === 'stable' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                <span className="text-xs font-bold text-foreground">{last7Days.filter(p => p.mobility === 'better').length}/7 better days</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mood</span>
              <div className="flex items-center gap-2">
                {moodTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {moodTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {moodTrend === 'stable' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                <span className="text-xs font-bold text-foreground">{last7Days.filter(p => p.mood === 'positive').length}/7 positive</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confusion</span>
              <span className={`text-xs font-bold ${confusionFreq > 2 ? 'text-amber-600' : 'text-green-600'}`}>{confusionFreq} times</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Medication</span>
              <span className={`text-xs font-bold ${missedMeds > 0 ? 'text-red-600' : 'text-green-600'}`}>{missedMeds} missed</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Visit History */}
      {playbacks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-3">Recent Visits</h3>
          <div className="space-y-2">
            {playbacks.slice(0, 10).map((pb, i) => (
              <div key={pb.id} className="flex gap-3 py-2 border-b border-border last:border-0">
                <span className="text-[11px] text-muted-foreground min-w-16 font-bold">{format(new Date(pb.visit_date), 'MMM d')}</span>
                <div className="flex gap-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{LABELS.eating[pb.eating]}</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{LABELS.mood[pb.mood]}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}