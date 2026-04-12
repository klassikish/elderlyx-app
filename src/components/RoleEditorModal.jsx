import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_CONFIG, canChangeRole } from '@/lib/permissions';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function RoleEditorModal({ member, currentUserRole, onClose, seniorName }) {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canEdit = canChangeRole(currentUserRole, member.role);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      // Log the change
      await base44.asServiceRole.entities.AuditLog.create({
        senior_name: seniorName,
        family_email: member.primary_account_email,
        action_type: 'role_changed',
        actor_email: base44.auth.me().email,
        actor_name: (await base44.auth.me()).full_name,
        target_email: member.member_email,
        target_name: member.member_name,
        old_value: member.role,
        new_value: selectedRole,
      }).catch(() => {});

      // Update the member
      await base44.entities.FamilyMember.update(member.id, { role: selectedRole });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Role updated successfully');
      onClose();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      // Log the removal
      await base44.asServiceRole.entities.AuditLog.create({
        senior_name: seniorName,
        family_email: member.primary_account_email,
        action_type: 'member_removed',
        actor_email: (await base44.auth.me()).email,
        actor_name: (await base44.auth.me()).full_name,
        target_email: member.member_email,
        target_name: member.member_name,
      }).catch(() => {});

      // Revoke access
      await base44.entities.FamilyMember.update(member.id, { status: 'revoked' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Member access revoked');
      onClose();
    },
  });

  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Permissions Locked</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Only the Primary Owner can change member roles.
          </p>
          <Button className="w-full h-11 rounded-xl" onClick={onClose}>
            Got it
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Edit Member Role</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-muted rounded-xl p-3">
          <p className="font-semibold text-foreground text-sm">{member.member_name}</p>
          <p className="text-xs text-muted-foreground">{member.member_email}</p>
        </div>

        {/* Role selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Select Role:</p>
          <div className="space-y-2">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selectedRole === role
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <p className="font-semibold text-sm text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Warning if changing from primary owner */}
        {member.role === 'primary_owner' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              Changing Primary Owner role will transfer account control. This cannot be undone immediately.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl font-semibold gap-2"
            onClick={() => updateRoleMutation.mutate()}
            disabled={updateRoleMutation.isPending || selectedRole === member.role}
          >
            {updateRoleMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Update Role'
            )}
          </Button>
        </div>

        {/* Remove button */}
        {!confirmDelete ? (
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl text-red-600 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            Remove Member
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
            <p className="text-xs text-red-900 font-semibold">Remove {member.member_name}?</p>
            <p className="text-[10px] text-red-800">They will lose access immediately and cannot be undone.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs bg-red-600 hover:bg-red-700"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? 'Removing…' : 'Remove'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}