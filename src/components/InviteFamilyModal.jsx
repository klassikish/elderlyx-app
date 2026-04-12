import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Send, Mail, User, Users, Shield, Eye, AlertTriangle, Crown } from 'lucide-react';
import { ROLE_CONFIG } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function InviteFamilyModal({ onClose, seniorName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1); // 1: details, 2: role, 3: confirm
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    member_phone: '',
    relationship: 'sibling',
    role: 'viewer',
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('inviteFamilyMember', {
        member_email: data.member_email,
        member_name: data.member_name,
        member_phone: data.member_phone,
        relationship: data.relationship,
        role: data.role,
        senior_name: seniorName,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Invitation sent!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to send invitation');
    },
  });

  const handleSubmit = () => {
    if (!formData.member_name.trim() || !formData.member_email.trim()) {
      toast.error('Please fill in name and email');
      return;
    }
    inviteMutation.mutate(formData);
  };

  const relationships = ['sibling', 'child', 'parent', 'spouse', 'relative', 'friend', 'caregiver'];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Invite Family Member</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <Input
                placeholder="e.g. Sarah Johnson"
                value={formData.member_name}
                onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="sarah@example.com"
                value={formData.member_email}
                onChange={(e) => setFormData({ ...formData, member_email: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Relationship
              </label>
              <div className="flex flex-wrap gap-2">
                {relationships.map((rel) => (
                  <button
                    key={rel}
                    onClick={() => setFormData({ ...formData, relationship: rel })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                      formData.relationship === rel
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-xl font-semibold mt-6"
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Choose what {formData.member_name} can do:
            </p>

            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
              // Skip primary_owner for invites
              if (roleKey === 'primary_owner') return null;
              return (
                <button
                  key={roleKey}
                  onClick={() => setFormData({ ...formData, role: roleKey })}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    formData.role === roleKey
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold text-foreground text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                </button>
              );
            })}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1 h-11 rounded-xl font-semibold" onClick={() => setStep(3)}>
                Next
              </Button>
            </div>

            {/* Emotional message */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <p className="text-[11px] text-purple-900 font-semibold">
                ✓ Family members with {formData.role === 'viewer' ? 'view' : 'full'} access stay informed & involved in care.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Inviting:</p>
              <p className="font-bold text-foreground">{formData.member_name}</p>
              <p className="text-sm text-muted-foreground">{formData.member_email}</p>
              <div className="pt-2 border-t border-primary/20 flex items-center gap-2">
                {formData.role === 'viewer' ? (
                  <>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Viewer
                    </span>
                    <span className="text-xs text-muted-foreground">View-only access</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Contributor
                    </span>
                    <span className="text-xs text-muted-foreground">Can book & message</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {formData.member_name} will receive an email invitation to join. They can accept or decline from their email.
            </p>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl font-semibold gap-2"
                onClick={handleSubmit}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}