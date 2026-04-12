import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Calendar, Star, DollarSign, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  booking_confirmed: { icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  booking_cancelled: { icon: Calendar, color: 'bg-red-100 text-red-600' },
  booking_completed: { icon: CheckCheck, color: 'bg-green-100 text-green-600' },
  review_received: { icon: Star, color: 'bg-amber-100 text-amber-600' },
  payment: { icon: DollarSign, color: 'bg-green-100 text-green-600' },
  general: { icon: Info, color: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 50),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const markRead = async (n) => {
    if (!n.is_read) {
      await base44.entities.Notification.update(n.id, { is_read: true });
      qc.invalidateQueries({ queryKey: ['all-notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-foreground">Notifications</h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={() => markAllRead.mutate()} className="text-xs text-primary font-medium">
            Mark all read
          </button>
        )}
      </div>

      <div className="px-5 pt-4 pb-6 space-y-2">
        {isLoading && <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>}
        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
        {notifications.map((n, i) => {
          const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
          const Icon = config.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => markRead(n)}
              className={`flex gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${n.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.is_read ? 'text-foreground' : 'text-foreground'}`}>{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}