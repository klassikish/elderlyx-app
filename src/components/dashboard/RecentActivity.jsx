import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, Star, Camera, TrendingDown, MessageCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const typeConfig = {
  visit_complete: { icon: CheckCircle2, color: 'hsl(160, 55%, 45%)', bg: 'hsl(160, 55%, 45%, 0.1)' },
  alert: { icon: AlertTriangle, color: 'hsl(15, 85%, 60%)', bg: 'hsl(15, 85%, 60%, 0.1)' },
  milestone: { icon: Star, color: 'hsl(45, 85%, 55%)', bg: 'hsl(45, 85%, 55%, 0.1)' },
  photo: { icon: Camera, color: 'hsl(215, 80%, 52%)', bg: 'hsl(215, 80%, 52%, 0.1)' },
  score_change: { icon: TrendingDown, color: 'hsl(280, 55%, 55%)', bg: 'hsl(280, 55%, 55%, 0.1)' },
  message: { icon: MessageCircle, color: 'hsl(215, 80%, 52%)', bg: 'hsl(215, 80%, 52%, 0.1)' },
};

export default function RecentActivity({ feedItems = [] }) {
  const items = feedItems.slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No recent activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const config = typeConfig[item.type] || typeConfig.message;
        const Icon = config.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: config.bg }}>
              <Icon className="w-4 h-4" style={{ color: config.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
              {item.created_date ? format(new Date(item.created_date), 'h:mm a') : ''}
            </span>
          </motion.div>
        );
      })}
      <Link
        to="/FamilyFeed"
        className="flex items-center justify-center gap-1 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View all activity <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}