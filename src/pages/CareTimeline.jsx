import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Car, Users, Home, UtensilsCrossed, CheckCircle2, Clock, XCircle, AlertTriangle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

const TASK_CONFIG = {
  grocery: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600', label: 'Grocery' },
  transport: { icon: Car, color: 'bg-purple-100 text-purple-600', label: 'Transport' },
  companionship: { icon: Users, color: 'bg-pink-100 text-pink-600', label: 'Companionship' },
  household: { icon: Home, color: 'bg-amber-100 text-amber-600', label: 'Household' },
  cooking: { icon: UtensilsCrossed, color: 'bg-green-100 text-green-600', label: 'Cooking' },
  other: { icon: CheckCircle2, color: 'bg-gray-100 text-gray-600', label: 'Other' },
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-600', label: 'Completed' },
  in_progress: { icon: Clock, color: 'text-blue-600', label: 'In Progress' },
  confirmed: { icon: Clock, color: 'text-primary', label: 'Confirmed' },
  requested: { icon: Clock, color: 'text-muted-foreground', label: 'Requested' },
  cancelled: { icon: XCircle, color: 'text-destructive', label: 'Cancelled' },
};

const MOOD_EMOJI = {
  happy: '😊',
  neutral: '😐',
  tired: '😴',
  anxious: '😟',
  confused: '😕',
};

const MOCK_VISITS = [
  { id: '1', task_type: 'grocery', status: 'completed', helper_name: 'Maria Santos', scheduled_date: new Date(Date.now() - 2 * 3600000).toISOString(), duration_minutes: 90, notes: 'All items purchased. Margaret was cheerful and helped with the list.', mood_observation: 'happy', rating: 5, cost: 45 },
  { id: '2', task_type: 'companionship', status: 'completed', helper_name: 'James Thompson', scheduled_date: new Date(Date.now() - 28 * 3600000).toISOString(), duration_minutes: 120, notes: 'Card games and lunch. Talked about family stories.', mood_observation: 'happy', rating: 5, cost: 60 },
  { id: '3', task_type: 'household', status: 'completed', helper_name: 'Rosa Martinez', scheduled_date: new Date(Date.now() - 72 * 3600000).toISOString(), duration_minutes: 150, notes: 'Full house clean, laundry and ironing.', mood_observation: 'neutral', rating: 4, cost: 75 },
  { id: '4', task_type: 'transport', status: 'confirmed', helper_name: 'David Chen', scheduled_date: new Date(Date.now() + 24 * 3600000).toISOString(), duration_minutes: 60, notes: '', cost: 35 },
  { id: '5', task_type: 'grocery', status: 'completed', helper_name: 'Maria Santos', scheduled_date: new Date(Date.now() - 8 * 24 * 3600000).toISOString(), duration_minutes: 75, notes: 'Weekly grocery run completed without issues.', mood_observation: 'neutral', rating: 4, cost: 45 },
];

function groupByDate(visits) {
  const groups = {};
  visits.forEach(v => {
    const date = parseISO(v.scheduled_date);
    let label;
    if (isToday(date)) label = 'Today';
    else if (isYesterday(date)) label = 'Yesterday';
    else label = format(date, 'MMMM d, yyyy');
    if (!groups[label]) groups[label] = [];
    groups[label].push(v);
  });
  return groups;
}

export default function CareTimeline() {
  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 50),
  });

  const items = visits.length > 0 ? visits : MOCK_VISITS;
  const sorted = [...items].sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
  const groups = groupByDate(sorted);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Care Timeline"
        subtitle="Full history of visits & activities"
      />

      <div className="px-5 pb-6">
        {Object.entries(groups).map(([dateLabel, groupVisits], gi) => (
          <div key={dateLabel} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{dateLabel}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{groupVisits.length} visit{groupVisits.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3 relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />

              {groupVisits.map((visit, i) => {
                const task = TASK_CONFIG[visit.task_type] || TASK_CONFIG.other;
                const status = STATUS_CONFIG[visit.status] || STATUS_CONFIG.requested;
                const TaskIcon = task.icon;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + gi * 0.1 }}
                    className="flex gap-3 relative"
                  >
                    {/* Timeline dot */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${task.color}`}>
                      <TaskIcon className="w-4.5 h-4.5" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-card rounded-2xl border border-border p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{task.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{visit.helper_name || 'Helper TBD'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(visit.scheduled_date), 'h:mm a')}
                          </span>
                        </div>
                      </div>

                      {visit.notes && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{visit.notes}</p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          {visit.duration_minutes && (
                            <span className="text-[10px] text-muted-foreground bg-secondary rounded-lg px-2 py-0.5">
                              {visit.duration_minutes} min
                            </span>
                          )}
                          {visit.mood_observation && (
                            <span className="text-[10px]">
                              {MOOD_EMOJI[visit.mood_observation]} {visit.mood_observation}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {visit.rating && Array.from({ length: visit.rating }).map((_, ri) => (
                            <Star key={ri} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                          {visit.cost && <span className="text-[10px] text-muted-foreground ml-1">${visit.cost}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groups).length === 0 && (
          <EmptyState icon={Clock} title="No visits yet" description="Your care timeline will build up as helpers complete visits." />
        )}
      </div>
    </div>
  );
}