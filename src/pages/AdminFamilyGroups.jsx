import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Lock, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminFamilyGroups() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin-family-groups'],
    queryFn: () => base44.entities.FamilyGroup.list('-last_activity_at', 100),
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['admin-flags'],
    queryFn: () => base44.entities.FamilyGroupFlag.filter({ status: 'active' }, '-flagged_at', 50),
  });

  const filtered = groups.filter(g => {
    const matchesSearch = g.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.primary_owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.senior_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || g.subscription_plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || g.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const stats = {
    total: groups.length,
    premium: groups.filter(g => g.subscription_plan === 'premium').length,
    flagged: groups.filter(g => g.has_risk_flags).length,
    locked: groups.filter(g => g.status === 'locked').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Family Groups Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin dashboard for family account management</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Families', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-100' },
            { label: 'Premium Plans', value: stats.premium, icon: TrendingUp, color: 'text-green-600 bg-green-100' },
            { label: 'Flagged Groups', value: stats.flagged, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
            { label: 'Locked Groups', value: stats.locked, icon: Lock, color: 'text-orange-600 bg-orange-100' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-black text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or senior..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              {['all', 'basic', 'family', 'premium'].map(plan => (
                <button
                  key={plan}
                  onClick={() => setFilterPlan(plan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    filterPlan === plan
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10'
                  }`}
                >
                  {plan === 'all' ? 'All Plans' : plan}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              {['all', 'active', 'locked', 'suspended'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    filterStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          {isLoading && <p className="text-center py-10 text-muted-foreground">Loading families...</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-10 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">No families found</p>
            </div>
          )}

          {filtered.map((group, i) => {
            const groupFlags = flags.filter(f => f.family_group_id === group.id).length;
            const planColors = {
              basic: 'bg-gray-100 text-gray-700',
              family: 'bg-blue-100 text-blue-700',
              premium: 'bg-purple-100 text-purple-700',
            };

            return (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate(`/AdminFamilyGroupDetail?id=${group.id}`)}
                className="w-full bg-card rounded-2xl border border-border p-4 hover:border-primary/50 transition-all text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">{group.group_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planColors[group.subscription_plan]}`}>
                        {group.subscription_plan}
                      </span>
                      {group.status === 'locked' && (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Owner: {group.primary_owner_name || group.primary_owner_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Senior: {group.senior_name || 'N/A'} · {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">${group.total_spent}</p>
                      <p className="text-xs text-muted-foreground">{group.total_bookings} bookings</p>
                    </div>

                    {group.health_score && (
                      <div className="text-right">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{
                            background: group.health_score >= 80 ? '#dffcf0' : group.health_score >= 60 ? '#fef3c7' : '#fee2e2',
                            color: group.health_score >= 80 ? '#059669' : group.health_score >= 60 ? '#d97706' : '#dc2626',
                          }}
                        >
                          {group.health_score}
                        </div>
                      </div>
                    )}

                    {groupFlags > 0 && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{groupFlags}</span>
                      </div>
                    )}

                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}