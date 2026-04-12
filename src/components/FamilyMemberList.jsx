import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, Trash2, CheckCircle2, Clock, User, Shield, Eye, Crown, AlertTriangle, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/lib/permissions';
import RoleEditorModal from '@/components/RoleEditorModal';

const ROLE_LABELS = {
  viewer: { label: 'Viewer', icon: Eye, color: 'text-blue-600 bg-blue-100' },
  contributor: { label: 'Contributor', icon: Shield, color: 'text-green-600 bg-green-100' },
};

const STATUS_LABELS = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-100' },
  accepted: { label: 'Active', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  rejected: { label: 'Rejected', icon: 'X', color: 'text-red-600 bg-red-100' },
  revoked: { label: 'Revoked', icon: 'X', color: 'text-red-600 bg-red-100' },
};

const ROLE_ICONS = {
  primary_owner: Crown,
  manager: Shield,
  viewer: Eye,
  emergency_contact: AlertTriangle,
};

export default function FamilyMemberList({ seniorName = 'Your loved one' }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editingMember, setEditingMember] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: () =>
      base44.entities.FamilyMember.filter(
        { primary_account_email: user?.email },
        '-created_date',
        50
      ),
    enabled: !!user?.email,
  });

  // Note: removal is now handled by RoleEditorModal
  const currentUserRole = members.find(m => m.member_email === user?.email)?.role || 'viewer';

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Loading members…</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No family members added yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {members.map((member, i) => {
          const role_config = ROLE_CONFIG[member.role];
          const status_info = STATUS_LABELS[member.status];
          const RoleIcon = ROLE_ICONS[member.role];
          const StatusIcon = status_info.icon;

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-3.5 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground text-sm">{member.member_name}</p>
                {member.role === 'primary_owner' && (
                  <div className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">
                    You
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{member.member_email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${role_config.color}`}>
                  <RoleIcon className="w-2.5 h-2.5" />
                  {role_config.label}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status_info.color}`}>
                  {StatusIcon === 'X' ? '✕' : <StatusIcon className="w-2.5 h-2.5" />}
                  {status_info.label}
                </div>
              </div>
            </div>

            {['pending', 'accepted'].includes(member.status) && (
              <button
                onClick={() => setEditingMember(member)}
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 flex-shrink-0"
                title="Edit role"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        );
        })}
        </div>

        {/* Role Editor Modal */}
        {editingMember && (
          <RoleEditorModal
            member={editingMember}
            currentUserRole={currentUserRole}
            onClose={() => setEditingMember(null)}
            seniorName={seniorName}
          />
        )}
        </>
        );
        }