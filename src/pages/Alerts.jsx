import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Info, Zap, CheckCheck, Activity, ShieldAlert, Users, Heart, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

const MOCK_ALERTS = [
  { id: '1', title: 'Mobility pattern change detected', description: 'Margaret\'s walking pace has been 15% slower than baseline for 3 consecutive days. Consider scheduling a physiotherapy consultation or increasing companionship visits.', severity: 'warning', category: 'mobility', is_read: false, action_taken: false, created_date: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: '2', title: 'Medication reminder gap', description: 'No helper visit logged on Wednesday, which is typically when weekly medication is organized. Consider booking a companion visit this week.', severity: 'info', category: 'health', is_read: false, action_taken: false, created_date: new Date(Date.now() - 18 * 3600000).toISOString() },
  { id: '3', title: 'Social engagement declining', description: 'Fewer outings and social interactions recorded over the last 2 weeks compared to the previous month. Social isolation can accelerate cognitive decline in seniors.', severity: 'warning', category: 'social', is_read: true, action_taken: false, created_date: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
  { id: '4', title: 'Independence Score™ improved', description: 'Margaret\'s overall independence score increased by 3 points this week, driven by strong daily living routines and improved mood observations.', severity: 'info', category: 'general', is_read: true, action_taken: true, created_date: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
  { id: '5', title: 'Emergency contact not updated', description: 'The secondary emergency contact is missing. We recommend adding a second family member contact for faster response in case of emergencies.', severity: 'critical', category: 'safety', is_read: false, action_taken: false, created_date: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
];

const SEVERITY_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200 border-l-blue-400', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200 border-l-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  critical: { icon: ShieldAlert, bg: 'bg-red-50', border: 'border-red-200 border-l-red-400', iconBg: 'bg-red-100', iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
};

const CATEGORY_ICONS = {
  mobility: Activity,
  safety: ShieldAlert,
  social: Users,
  health: Heart,
  daily_living: Brain,
  general: Zap,
};

export default function Alerts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-all'],
    queryFn: () => base44.entities.Alert.list('-created_date', 30),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts-all'] }),
  });

  const items = alerts.length > 0 ? alerts : MOCK_ALERTS;
  const unread = items.filter(a => !a.is_read);
  const read = items.filter(a => a.is_read);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Alerts & Insights"
        subtitle="Predictive care recommendations"
        onBack={() => navigate(-1)}
        action={
          unread.length > 0 && (
            <span className="bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {unread.length} new
            </span>
          )
        }
      />

      <div className="px-5 pb-6 space-y-5">
        {/* Unread */}
        {unread.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Action Needed</h2>
            <div className="space-y-3">
              {unread.map((alert, i) => (
                <AlertItem key={alert.id} alert={alert} i={i} onMarkRead={() => markReadMutation.mutate(alert.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Read */}
        {read.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Previous Alerts</h2>
            <div className="space-y-3 opacity-70">
              {read.map((alert, i) => (
                <AlertItem key={alert.id} alert={alert} i={i} isRead />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <EmptyState icon={CheckCheck} title="All clear!" description="No alerts right now. We'll notify you when anything needs attention." />
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert, i, onMarkRead, isRead }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;
  const CategoryIcon = CATEGORY_ICONS[alert.category] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className={`rounded-2xl border border-l-4 p-4 ${config.border} bg-card shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">{alert.title}</p>
            {!isRead && (
              <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.description}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${config.badge}`}>
                <CategoryIcon className="w-2.5 h-2.5" />
                {alert.category}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {alert.created_date ? formatDistanceToNow(new Date(alert.created_date), { addSuffix: true }) : ''}
              </span>
            </div>
            {!isRead && onMarkRead && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2" onClick={onMarkRead}>
                Mark read
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}