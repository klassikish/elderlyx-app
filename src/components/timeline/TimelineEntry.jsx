import React from 'react';
import { format } from 'date-fns';
import { ShoppingCart, Car, Users, Utensils, Stethoscope, Wrench, HelpCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const taskIcons = {
  grocery: ShoppingCart,
  transport: Car,
  companionship: Users,
  household: Wrench,
  medical_escort: Stethoscope,
  cooking: Utensils,
  other: HelpCircle,
};

const taskLabels = {
  grocery: 'Grocery Shopping',
  transport: 'Transportation',
  companionship: 'Companionship',
  household: 'Household Chores',
  medical_escort: 'Medical Escort',
  cooking: 'Cooking',
  other: 'Other',
};

const statusStyles = {
  requested: { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  confirmed: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  in_progress: { bg: 'bg-chart-5/10', text: 'text-chart-5', dot: 'bg-chart-5' },
  completed: { bg: 'bg-chart-3/10', text: 'text-chart-3', dot: 'bg-chart-3' },
  cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

const moodEmojis = {
  happy: '😊',
  neutral: '😐',
  tired: '😴',
  anxious: '😟',
  confused: '😕',
};

export default function TimelineEntry({ visit, index = 0, isLast = false }) {
  const Icon = taskIcons[visit.task_type] || HelpCircle;
  const style = statusStyles[visit.status] || statusStyles.requested;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex gap-3"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${style.dot} shrink-0 mt-1.5`} />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${style.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${style.text}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {taskLabels[visit.task_type] || visit.task_type}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {visit.helper_name || 'Unassigned'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[10px] ${style.bg} ${style.text}`}>
              {visit.status}
            </Badge>
          </div>

          {visit.scheduled_date && (
            <p className="text-xs text-muted-foreground mb-2">
              {format(new Date(visit.scheduled_date), 'MMM d, yyyy · h:mm a')}
              {visit.duration_minutes ? ` · ${visit.duration_minutes} min` : ''}
            </p>
          )}

          {visit.notes && (
            <p className="text-xs text-foreground/80 bg-muted/50 rounded-lg p-2.5 mb-2">{visit.notes}</p>
          )}

          <div className="flex items-center gap-3">
            {visit.mood_observation && (
              <span className="text-xs text-muted-foreground">
                Mood: {moodEmojis[visit.mood_observation]} {visit.mood_observation}
              </span>
            )}
            {visit.rating > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Star className="w-3 h-3 text-chart-5 fill-chart-5" />
                {visit.rating}
              </span>
            )}
            {visit.cost > 0 && (
              <span className="text-xs font-medium text-foreground">${visit.cost}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}