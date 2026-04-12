import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Heart, AlertTriangle, CheckCircle2, Users, Pill, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

const ACTIVITY_ICONS = {
  visit_completed: CheckCircle2,
  medication_taken: Pill,
  medication_missed: AlertTriangle,
  alert_triggered: AlertTriangle,
  caregiver_arrived: Users,
  caregiver_departed: Users,
  mood_update: Heart,
  meal_logged: Heart,
  independence_score: TrendingUp,
};

const ACTIVITY_COLORS = {
  visit_completed: 'bg-green-50 border-green-200 text-green-700',
  medication_taken: 'bg-blue-50 border-blue-200 text-blue-700',
  medication_missed: 'bg-red-50 border-red-200 text-red-700',
  alert_triggered: 'bg-amber-50 border-amber-200 text-amber-700',
  caregiver_arrived: 'bg-purple-50 border-purple-200 text-purple-700',
  caregiver_departed: 'bg-gray-50 border-gray-200 text-gray-700',
  mood_update: 'bg-pink-50 border-pink-200 text-pink-700',
  meal_logged: 'bg-orange-50 border-orange-200 text-orange-700',
  independence_score: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

export default function SharedActivityFeed({ seniorName }) {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['shared-activity', seniorName, user?.email],
    queryFn: async () => {
      const logs = await base44.entities.SharedActivityLog.filter(
        { family_email: user?.email },
        '-created_date',
        20
      );
      if (seniorName) {
        return logs.filter((l) => l.senior_name === seniorName);
      }
      return logs;
    },
    enabled: !!user?.email,
    refetchInterval: 15000, // Refresh every 15s
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading activity…</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, i) => {
        const Icon = ACTIVITY_ICONS[activity.activity_type] || CheckCircle2;
        const colorClass = ACTIVITY_COLORS[activity.activity_type];

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`${colorClass} border rounded-xl p-3.5`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs opacity-80 mt-0.5">{activity.description}</p>
                )}
                {activity.actor_name && (
                  <p className="text-xs opacity-70 mt-0.5">by {activity.actor_name}</p>
                )}
                <p className="text-[10px] opacity-60 mt-1">
                  {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}