import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, Star, Camera, TrendingDown, MessageCircle, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const typeConfig = {
  visit_complete: { icon: CheckCircle2, color: 'hsl(160, 55%, 45%)', bg: 'hsl(160, 55%, 45%, 0.08)', label: 'Visit Complete' },
  alert: { icon: AlertTriangle, color: 'hsl(15, 85%, 60%)', bg: 'hsl(15, 85%, 60%, 0.08)', label: 'Alert' },
  milestone: { icon: Star, color: 'hsl(45, 85%, 55%)', bg: 'hsl(45, 85%, 55%, 0.08)', label: 'Milestone' },
  photo: { icon: Camera, color: 'hsl(215, 80%, 52%)', bg: 'hsl(215, 80%, 52%, 0.08)', label: 'Photo Update' },
  score_change: { icon: TrendingDown, color: 'hsl(280, 55%, 55%)', bg: 'hsl(280, 55%, 55%, 0.08)', label: 'Score Update' },
  message: { icon: MessageCircle, color: 'hsl(215, 80%, 52%)', bg: 'hsl(215, 80%, 52%, 0.08)', label: 'Message' },
};

const severityStyles = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  warning: 'bg-accent/10 text-accent border-accent/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function FeedCard({ item, index = 0 }) {
  const config = typeConfig[item.type] || typeConfig.message;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: config.bg }}>
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] ${severityStyles[item.severity] || severityStyles.info}`}>
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {item.created_date ? format(new Date(item.created_date), 'MMM d, h:mm a') : ''}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>
      </div>

      {item.photo_url && (
        <div className="px-4 pb-3">
          <img
            src={item.photo_url}
            alt=""
            className="w-full h-48 object-cover rounded-xl"
          />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">
          <Heart className="w-3.5 h-3.5" />
          Acknowledge
        </button>
        <span className="text-[10px] text-muted-foreground">
          {item.created_date ? format(new Date(item.created_date), 'EEEE') : ''}
        </span>
      </div>
    </motion.div>
  );
}