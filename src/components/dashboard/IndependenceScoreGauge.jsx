import { motion } from 'framer-motion';

export default function IndependenceScoreGauge({ score = 72 }) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const half = circumference / 2;
  const progress = (score / 100) * half;

  const getColor = (s) => {
    if (s >= 75) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (s) => {
    if (s >= 75) return 'Strong';
    if (s >= 50) return 'Moderate';
    return 'Needs Attention';
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={radius * 2} height={radius + 20} viewBox={`0 0 ${radius * 2} ${radius + 20}`}>
        {/* Track */}
        <path
          d={`M ${stroke / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke / 2} ${radius}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.path
          d={`M ${stroke / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke / 2} ${radius}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${half} ${circumference}`}
          initial={{ strokeDashoffset: half }}
          animate={{ strokeDashoffset: half - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Score Text */}
        <text
          x={radius}
          y={radius - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="800"
          fill={color}
          fontFamily="var(--font-inter)"
        >
          {score}
        </text>
        <text
          x={radius}
          y={radius + 14}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--muted-foreground))"
          fontFamily="var(--font-inter)"
        >
          {getLabel(score)}
        </text>
      </svg>
    </div>
  );
}