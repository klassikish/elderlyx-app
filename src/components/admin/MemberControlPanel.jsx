import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Users, Edit2, Trash2, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROLE_CONFIG } from '@/lib/permissions';
import { toast } from 'sonner';

export default function MemberControlPanel({ members, group }) {
  const qc = useQueryClient();
  const [editingMember, setEditingMember] = useState(null);

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }) =>
      base44.entities.FamilyMember.update(memberId, { role: newRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members'] });
      toast.success('Member role updated');
      setEditingMember(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) =>
      base44.entities.FamilyMember.update(memberId, { status: 'revoked' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members'] });
      toast.success('Member removed');
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" /> Members ({members.length})
      </h3>

      <div className="space-y-2">
        {members.map((member) => {
          const roleConfig = ROLE_CONFIG[member.role] || {};
          const isOwner = member.role === 'primary_owner';

          return (
            <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{member.member_name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.member_email}</p>
                {editingMember?.id === member.id ? (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                      <button
                        key={role}
                        onClick={() => changeRoleMutation.mutate({ memberId: member.id, newRole: role })}
                        className={`px-2 py-1 text-[10px] font-bold rounded capitalize transition-all ${
                          role === member.role
                            ? 'bg-primary text-white'
                            : 'bg-background border border-border hover:bg-primary/10'
                        }`}
                        disabled={changeRoleMutation.isPending}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: roleConfig.color?.split(' ')[0] || '#f0f0f0' }}>
                    {roleConfig.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!isOwner && (
                  <>
                    <button
                      onClick={() => setEditingMember(member)}
                      className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"
                      title="Edit role"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all disabled:opacity-50"
                      title="Remove member"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}