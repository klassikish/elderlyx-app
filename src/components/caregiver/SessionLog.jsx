import { motion, AnimatePresence } from 'framer-motion';

export default function SessionLog({ notes }) {
  if (notes.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-bold text-foreground mb-2">Session Log</p>
      <div className="space-y-2">
        <AnimatePresence>
          {[...notes].reverse().map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5"
            >
              <p className="text-xs text-blue-900">{note}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}