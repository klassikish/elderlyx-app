import React from 'react';
import { motion } from 'framer-motion';
import { Footprints, Shield, Coffee, Heart } from 'lucide-react';

const categories = [
  { key: 'mobility_score', label: 'Mobility', icon: Footprints, color: 'hsl(215, 80%, 52%)' },
  { key: 'safety_score', label: 'Safety', icon: Shield, color: 'hsl(160, 55%, 45%)' },
  { key: 'daily_living_score', label: 'Daily Living', icon: Coffee, color: 'hsl(15, 85%, 60%)' },
  { key: 'social_score', label: 'Social', icon: Heart, color: 'hsl(280, 55%, 55%)' },
];

function getScoreLabel(v) {
  if (v >= 80) return { label: 'Excellent', color: '#22c55e' };
  if (v >= 60) return { label: 'Good', color: '#3b82f6' };
  if (v >= 40) return { label: 'Fair', color: '#f59e0b' };
  return { label: 'Low', color: '#ef4444' };
}

export default function ScoreBreakdown({ senior }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map(({ key, label, icon: Icon, color }, idx) => {
        const value = senior?.[key] ?? 0;
        const status = getScoreLabel(value);
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-xl p-3.5 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: status.color, backgroundColor: `${status.color}15` }}>
                {status.label}
              </span>
            </div>

            <div className="flex items-baseline gap-0.5 mb-2">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-sm font-medium text-muted-foreground">/100</span>
            </div>

            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = value >= (i + 1) * 10;
                const partial = !filled && value > i * 10;
                const pct = partial ? ((value - i * 10) / 10) * 100 : 0;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 h-2 rounded-sm overflow-hidden bg-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 + i * 0.03 }}
                  >
                    {(filled || partial) && (
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: color, width: filled ? '100%' : `${pct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: filled ? '100%' : `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 + idx * 0.1 + i * 0.03 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}