import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function JobMatchesList({ matchedJobs, onSelectJob }) {
  if (matchedJobs.length === 0) return null;

  return (
    <div className="px-5 mt-5">
      <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Job Matches ({matchedJobs.length})
      </h2>
      <div className="space-y-3">
        {matchedJobs.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 flex items-center justify-between cursor-pointer"
            onClick={() => onSelectJob(b)}
          >
            <div>
              <p className="font-semibold text-foreground capitalize">{b.service_type} Visit</p>
              <p className="text-xs text-muted-foreground mt-0.5">{b.senior_name} · {format(new Date(b.scheduled_date), 'MMM d, h:mm a')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-black text-xl">${b.price || 35}</span>
              <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">→</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}