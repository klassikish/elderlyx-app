import { CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_TASKS = [
  { id: 'greeting', label: 'Greet & check in with senior' },
  { id: 'medication', label: 'Medication reminder' },
  { id: 'meal', label: 'Meal / snack preparation' },
  { id: 'activity', label: 'Engage in activity / conversation' },
  { id: 'safety', label: 'Home safety check' },
  { id: 'notes', label: 'Log care notes' },
  { id: 'family', label: 'Update family if needed' },
];

export default function TaskChecklist({ completedTasks, onToggleTask }) {
  const progress = Math.round((completedTasks.length / DEFAULT_TASKS.length) * 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-bold text-foreground">Task Progress</p>
        <span className="text-xs font-bold text-primary">{completedTasks.length}/{DEFAULT_TASKS.length} done</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <p className="text-sm font-bold text-foreground mb-3">Visit Checklist</p>
      <div className="space-y-2">
        {DEFAULT_TASKS.map(task => {
          const done = completedTasks.includes(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'}`}
            >
              <motion.div animate={{ scale: done ? [1.3, 1] : 1 }} transition={{ duration: 0.2 }}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              </motion.div>
              <span className={`text-sm font-medium ${done ? 'text-emerald-800 line-through' : 'text-foreground'}`}>
                {task.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}