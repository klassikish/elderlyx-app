import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Camera, CheckCircle2, AlertTriangle, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

const MOCK_FEED = [
  {
    id: '1',
    type: 'visit_complete',
    title: 'Grocery run completed',
    description: 'Maria picked up everything on the list including Margaret\'s favourite biscuits. She was in great spirits and even helped unpack!',
    severity: 'success',
    photo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    helper: 'Maria Santos',
    created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'alert',
    title: 'Mobility pattern alert',
    description: 'We noticed a slightly slower walking pace compared to Margaret\'s baseline. This may warrant a check-in. No immediate action needed.',
    severity: 'warning',
    helper: 'Elderlyx AI',
    created_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'photo',
    title: 'Afternoon companionship visit',
    description: 'James and Margaret enjoyed a game of cards and a lovely lunch. She talked about her grandchildren the whole time — big smile!',
    severity: 'success',
    photo_url: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=400&q=80',
    helper: 'James Thompson',
    created_date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'score_change',
    title: 'Independence Score™ improved',
    description: 'Margaret\'s score went up by 3 points this week, driven by improved social engagement and consistent daily routines.',
    severity: 'success',
    helper: 'Elderlyx AI',
    created_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'visit_complete',
    title: 'Home cleaning done',
    description: 'Full house clean including laundry and kitchen. Margaret supervised and was very particular about her kitchen — she knows exactly where everything goes!',
    severity: 'success',
    helper: 'Rosa Martinez',
    created_date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

const ICONS = {
  visit_complete: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  alert: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
  photo: { icon: Camera, bg: 'bg-blue-100', color: 'text-blue-600' },
  score_change: { icon: TrendingUp, bg: 'bg-purple-100', color: 'text-purple-600' },
  milestone: { icon: Sparkles, bg: 'bg-pink-100', color: 'text-pink-600' },
  message: { icon: MessageSquare, bg: 'bg-gray-100', color: 'text-gray-600' },
};

const SEVERITY_BORDER = {
  success: 'border-l-green-400',
  warning: 'border-l-amber-400',
  critical: 'border-l-red-400',
  info: 'border-l-blue-400',
};

export default function FamilyFeed() {
  const { data: feedItems = [] } = useQuery({
    queryKey: ['feed'],
    queryFn: () => base44.entities.FeedItem.list('-created_date', 30),
  });

  const items = feedItems.length > 0 ? feedItems : MOCK_FEED;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Family Feed"
        subtitle="Real-time updates from Margaret's day"
        action={
          <div className="flex items-center gap-1.5 bg-green-100 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">Live</span>
          </div>
        }
      />

      <div className="px-5 pb-4 space-y-4">
        <AnimatePresence>
          {items.map((item, i) => {
            const iconConfig = ICONS[item.type] || ICONS.visit_complete;
            const Icon = iconConfig.icon;
            const borderClass = SEVERITY_BORDER[item.severity] || 'border-l-gray-300';

            return (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-card rounded-2xl border border-border border-l-4 ${borderClass} shadow-sm overflow-hidden`}
              >
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt=""
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconConfig.bg}`}>
                      <Icon className={`w-4 h-4 ${iconConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {item.created_date
                            ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                      {item.helper && (
                        <p className="text-[10px] text-primary font-semibold mt-2">
                          {item.helper === 'Elderlyx AI' ? '🤖' : '👤'} {item.helper}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
                      <Heart className="w-3.5 h-3.5" /> Like
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Comment
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {items.length === 0 && (
          <EmptyState icon={Heart} title="No updates yet" description="Feed updates will appear here after helper visits." />
        )}
      </div>
    </div>
  );
}