import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, CalendarPlus, ShoppingCart, Car, Users, Home, UtensilsCrossed, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import IndependenceScoreGauge from '@/components/dashboard/IndependenceScoreGauge';
import ScoreBreakdown from '@/components/dashboard/ScoreBreakdown';
import QuickStatCard from '@/components/dashboard/QuickStatCard';


const TASK_ICONS = {
  grocery: ShoppingCart,
  transport: Car,
  companionship: Users,
  household: Home,
  cooking: UtensilsCrossed,
};

const MOCK_SENIOR = {
  full_name: 'Margaret Johnson',
  independence_score: 74,
  mobility_score: 68,
  safety_score: 82,
  daily_living_score: 71,
  social_score: 75,
  photo_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=200&q=80',
};

export default function Dashboard() {
  const { data: seniors = [] } = useQuery({
    queryKey: ['seniors'],
    queryFn: () => base44.entities.Senior.list('-updated_date', 1),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-recent'],
    queryFn: () => base44.entities.Visit.list('-updated_date', 20),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
  });

  const senior = seniors[0] ?? MOCK_SENIOR;
  const completedVisits = visits.filter(v => v.status === 'completed').length;
  const upcomingVisits = visits.filter(v => v.status === 'confirmed' || v.status === 'requested').length;
  const unreadAlerts = alerts.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-blue-600 pt-14 pb-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium">Welcome back</p>
            <h1 className="text-primary-foreground text-2xl font-bold mt-0.5">Family Dashboard</h1>
          </div>
          <Link to="/Alerts" className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </Link>
        </div>

        {/* Senior Card Preview */}
        <div className="relative z-10 mt-4 flex items-center gap-3">
          <img
            src={senior.photo_url || 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=200&q=80'}
            alt={senior.full_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
          />
          <div>
            <p className="text-white font-semibold text-base">{senior.full_name}</p>
            <p className="text-primary-foreground/70 text-xs">Monitored daily · Last update 2h ago</p>
          </div>
        </div>
      </div>

      {/* Independence Score Card - floating */}
      <div className="px-5 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-3xl border border-border shadow-lg p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-foreground">Independence Score™</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Analyzed from activity patterns</p>
            </div>
            <Link to="/SeniorProfile" className="text-xs text-primary font-medium flex items-center gap-0.5">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <IndependenceScoreGauge score={senior.independence_score ?? 74} />
            <div className="flex-1">
              <ScoreBreakdown senior={senior} />
            </div>
          </div>

          {/* Trend indicator */}
          <div className="mt-3 flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">Score improved +3 points this week</p>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <QuickStatCard
              icon={CheckCircle2}
              label="Visits Done"
              value={completedVisits || 14}
              sub="This month"
              color="bg-green-100 text-green-600"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <QuickStatCard
              icon={CalendarPlus}
              label="Upcoming"
              value={upcomingVisits || 3}
              sub="Scheduled"
              color="bg-primary/10 text-primary"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <QuickStatCard
              icon={AlertTriangle}
              label="Alerts"
              value={unreadAlerts || 1}
              sub="Unread"
              color="bg-amber-100 text-amber-600"
            />
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-5">
        <h2 className="text-base font-bold text-foreground mb-3">Book Help Now</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: ShoppingCart, label: 'Grocery', type: 'grocery', color: 'text-blue-500 bg-blue-50' },
            { icon: Car, label: 'Transport', type: 'transport', color: 'text-purple-500 bg-purple-50' },
            { icon: Users, label: 'Company', type: 'companionship', color: 'text-pink-500 bg-pink-50' },
            { icon: Home, label: 'Chores', type: 'household', color: 'text-amber-500 bg-amber-50' },
          ].map(({ icon: Icon, label, type, color }) => (
            <Link
              key={type}
              to={`/FindHelp?task=${type}`}
              className="flex flex-col items-center gap-2 bg-card rounded-2xl p-3 border border-border shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="px-5 mt-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
          <Link to="/FamilyFeed" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {[
            { title: 'Grocery run completed', time: '2 hours ago', helper: 'Maria S.', type: 'success', desc: 'All items purchased. Margaret was in good spirits.' },
            { title: 'Mobility alert detected', time: '5 hours ago', helper: 'System', type: 'warning', desc: 'Slower gait pattern observed compared to baseline.' },
            { title: 'Companion visit done', time: 'Yesterday', helper: 'James T.', type: 'success', desc: 'Played cards, had lunch together. Very enjoyable!' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="bg-card rounded-2xl border border-border p-4 flex gap-3"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                <p className="text-[10px] text-primary font-medium mt-1">by {item.helper}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}