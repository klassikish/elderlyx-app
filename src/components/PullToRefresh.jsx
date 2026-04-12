import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullY = useMotionValue(0);
  const rotate = useTransform(pullY, [0, THRESHOLD], [0, 360]);
  const opacity = useTransform(pullY, [0, THRESHOLD / 2], [0, 1]);

  const handleTouchStart = useCallback((e) => {
    // Only trigger if scrolled to top
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    const dampened = Math.min(THRESHOLD * 1.5, delta * 0.45);
    pullY.set(dampened);
  }, [refreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullY.set(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    pullY.set(0);
  }, [pullY, refreshing, onRefresh]);

  const indicatorY = useTransform(pullY, [0, THRESHOLD], [-40, 12]);

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ y: indicatorY, opacity }}
        className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-none"
      >
        <div className="w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center">
          <motion.div style={{ rotate }}>
            <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}