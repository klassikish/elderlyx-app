import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Lock, Unlock, Edit2, Trash2, MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import QuickActionPanel from '@/components/admin/QuickActionPanel';
import MemberControlPanel from '@/components/admin/MemberControlPanel';
import RiskFlagPanel from '@/components/admin/RiskFlagPanel';
import GroupLockModal from '@/components/admin/GroupLockModal';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

const FAMILY_ID = new URLSearchParams(window.location.search).get('id');

export default function AdminFamilyGroupDetail() {
  const navigate = useNavigate();
  const [showLockModal, setShowLockModal] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ['family-group-detail', FAMILY_ID],
    queryFn: () => base44.entities.FamilyGroup.filter({ id: FAMILY_ID }, '-created_date', 1),
    select: data => data[0],
    enabled: !!FAMILY_ID,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', FAMILY_ID],
    queryFn: () => base44.entities.FamilyMember.filter({ primary_account_email: group?.primary_owner_email }, '-created_date', 50),
    enabled: !!group,
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['group-flags', FAMILY_ID],
    queryFn: () => base44.entities.FamilyGroupFlag.filter({ family_group_id: FAMILY_ID }, '-flagged_at', 20),
    enabled: !!FAMILY_ID,
  });

  // Removed: auditLogs query handled by AuditLogViewer component

  const { data: healthScore } = useQuery({
    queryKey: ['health-score', FAMILY_ID],
    queryFn: () => base44.entities.FamilyHealthScore.filter({ family_group_id: FAMILY_ID }, '-last_calculated_at', 1),
    select: data => data[0],
    enabled: !!FAMILY_ID,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Group not found</p>
          <Button onClick={() => navigate('/AdminFamilyGroups')} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/AdminFamilyGroups')} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{group.group_name}</h1>
          <p className="text-xs text-muted-foreground">{group.primary_owner_email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowLockModal(true)} className="gap-1.5">
          {group.status === 'locked' ? (
            <><Unlock className="w-3.5 h-3.5" /> Unlock</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> Lock</>
          )}
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Banner */}
        {group.status !== 'active' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl border p-4 ${
            group.status === 'locked' ? 'bg-orange-50 border-orange-200' :
            group.status === 'suspended' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                group.status === 'locked' ? 'text-orange-600' :
                group.status === 'suspended' ? 'text-red-600' :
                'text-yellow-600'
              }`} />
              <div>
                <p className="font-bold capitalize text-sm">{group.status} Status</p>
                {group.lock_reason && <p className="text-xs text-muted-foreground mt-1">{group.lock_reason}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <QuickActionPanel group={group} />

            {/* Member Control */}
            <MemberControlPanel members={members} group={group} />

            {/* Risk Flags */}
            <RiskFlagPanel flags={flags} group={group} />

            {/* Audit Log with Advanced Filtering */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Audit Log</h3>
              <AuditLogViewer familyEmail={group?.primary_owner_email} limit={100} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overview Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Overview</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <span className="font-bold text-sm capitalize">{group.subscription_plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Members</span>
                  <span className="font-bold text-sm">{group.member_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Spent</span>
                  <span className="font-bold text-sm">${group.total_spent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Bookings</span>
                  <span className="font-bold text-sm">{group.total_bookings}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Payment Score</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {group.payment_reliability_score || 0}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Activity Score</span>
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">
                    {group.activity_score || 0}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Health Score</span>
                  <div className="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center"
                    style={{
                      background: (healthScore?.overall_score || 0) >= 80 ? '#dffcf0' : (healthScore?.overall_score || 0) >= 60 ? '#fef3c7' : '#fee2e2',
                      color: (healthScore?.overall_score || 0) >= 80 ? '#059669' : (healthScore?.overall_score || 0) >= 60 ? '#d97706' : '#dc2626',
                    }}
                  >
                    {healthScore?.overall_score || 0}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Flags Summary */}
            {flags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 rounded-2xl border border-red-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-sm text-red-900">Active Flags</h3>
                </div>
                <p className="text-xs text-red-800 font-bold mb-2">{flags.length} flag{flags.length !== 1 ? 's' : ''} active</p>
                <div className="space-y-1">
                  {flags.slice(0, 3).map((flag, i) => (
                    <p key={i} className="text-[10px] text-red-700 capitalize">{flag.flag_type.replace(/_/g, ' ')}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      {showLockModal && <GroupLockModal group={group} onClose={() => setShowLockModal(false)} />}
    </div>
  );
}