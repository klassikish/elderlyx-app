import React from 'react';
import { motion } from 'framer-motion';

export default function IndependenceGauge({ score = 0, size = 160 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s) => {
    if (s >= 75) return 'hsl(160, 55%, 45%)';
    if (s >= 50) return 'hsl(45, 85%, 55%)';
    if (s >= 25) return 'hsl(15, 85%, 60%)';
    return 'hsl(0, 72%, 51%)';
  };

  const getLabel = (s) => {
    if (s >= 75) return 'Excellent';
    if (s >= 50) return 'Good';
    if (s >= 25) return 'Needs Attention';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Score
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold" style={{ color: getColor(score) }}>
          {getLabel(score)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Independence Score™</p>
      </div>
    </div>
  );
}