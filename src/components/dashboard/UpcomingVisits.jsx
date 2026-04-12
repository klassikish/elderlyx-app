import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const taskLabels = {
  grocery: 'Grocery Shopping',
  transport: 'Transportation',
  companionship: 'Companionship',
  household: 'Household Chores',
  medical_escort: 'Medical Escort',
  cooking: 'Cooking',
  other: 'Other',
};

const statusColors = {
  requested: 'bg-accent/10 text-accent border-accent/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

export default function UpcomingVisits({ visits = [] }) {
  const upcoming = visits
    .filter(v => ['requested', 'confirmed', 'in_progress'].includes(v.status))
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming visits</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((visit, idx) => (
        <motion.div
          key={visit.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
        >
          <div className="p-2 bg-primary/5 rounded-lg">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {taskLabels[visit.task_type] || visit.task_type}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{visit.helper_name || 'Unassigned'}</span>
              {visit.scheduled_date && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {format(new Date(visit.scheduled_date), 'MMM d, h:mm a')}
                  </span>
                </>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${statusColors[visit.status] || ''}`}>
            {visit.status}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}