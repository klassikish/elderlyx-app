import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Native-feeling bottom sheet replacement for <select>.
 * Props: value, onChange, options: [{ value, label }], placeholder, className
 */
export default function BottomSheetSelect({ value, onChange, options = [], placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm text-left ${className}`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-w-md mx-auto overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 pb-2">{placeholder}</p>

              <ul role="listbox" className="overflow-y-auto max-h-72 pb-4">
                {options.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-medium active:bg-muted cursor-pointer"
                  >
                    <span className={opt.value === value ? 'text-primary font-semibold' : 'text-foreground'}>{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 text-primary" />}
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}