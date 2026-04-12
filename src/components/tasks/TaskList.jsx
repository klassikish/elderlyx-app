import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';

const TASK_TYPE_COLORS = {
  medication: 'bg-red-100 text-red-700',
  chore: 'bg-blue-100 text-blue-700',
  activity: 'bg-green-100 text-green-700',
  medical: 'bg-orange-100 text-orange-700',
  grooming: 'bg-purple-100 text-purple-700',
  meal: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function TaskList({ tasks, onTaskClick, filter = 'all' }) {
  const filtered = tasks.filter((t) => {
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'pending') return ['pending', 'overdue'].includes(t.status);
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Circle className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((task, i) => {
        const isOverdue = task.status !== 'completed' && task.due_date && isPast(new Date(task.due_date));
        const isCompleted = task.status === 'completed';

        return (
          <motion.button
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onTaskClick?.(task)}
            className="w-full text-left bg-card border border-border rounded-lg p-3.5 hover:border-primary/50 transition-all active:bg-muted/30"
          >
            <div className="flex gap-3 items-start">
              <button
                className="mt-0.5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick?.({ ...task, action: 'toggle' });
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isOverdue ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TASK_TYPE_COLORS[task.task_type]}`}>
                    {task.task_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                    {'🔥'.repeat(task.priority === 'urgent' ? 3 : task.priority === 'high' ? 2 : task.priority === 'medium' ? 1 : 0)} {task.priority}
                  </span>

                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d, h:mm a')}
                    </div>
                  )}

                  {task.assigned_to_name && (
                    <span className="text-xs text-muted-foreground">👤 {task.assigned_to_name}</span>
                  )}
                </div>

                {task.requires_photo && !isCompleted && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">📸 Requires photo</p>
                )}

                {task.photo_urls?.length > 0 && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">✓ {task.photo_urls.length} photo{task.photo_urls.length > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}