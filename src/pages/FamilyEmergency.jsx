import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import EmergencyContactEditor from '@/components/emergency/EmergencyContactEditor.jsx';
import EmergencyInfoViewer from '@/components/emergency/EmergencyInfoViewer.jsx';
import { Button } from '@/components/ui/button';

export default function FamilyEmergency() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ['family-groups', user?.email],
    queryFn: () =>
      base44.entities.FamilyGroup.filter(
        { primary_owner_email: user?.email },
        '-created_date',
        10
      ),
    enabled: !!user?.email,
  });

  const selectedGroup = groups[0];

  const { data: emergencyInfo, isLoading } = useQuery({
    queryKey: ['emergency-info', selectedGroup?.id],
    queryFn: () =>
      base44.entities.EmergencyInfo.filter(
        { family_group_id: selectedGroup?.id },
        '-created_date',
        1
      ),
    select: data => data[0],
    enabled: !!selectedGroup?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-muted animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading emergency information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Emergency Information</h1>
        {emergencyInfo && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="ml-auto w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">Critical Medical Information</p>
              <p className="text-xs text-red-700 mt-1">
                This information is visible to your authorized caregivers and is essential for their safety and well-being.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          {editMode ? (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-5">Edit Emergency Information</h2>
              <EmergencyContactEditor
                emergencyInfo={emergencyInfo}
                onSave={() => setEditMode(false)}
              />
            </div>
          ) : emergencyInfo ? (
            <EmergencyInfoViewer emergencyInfo={emergencyInfo} />
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                No emergency information set up yet
              </p>
              <Button
                onClick={() => setEditMode(true)}
                className="rounded-xl"
              >
                Create Emergency Profile
              </Button>
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-bold text-blue-900 text-sm mb-2">💡 Tip</h3>
          <p className="text-xs text-blue-800">
            Keep this information updated regularly. Caregivers can access this instantly in case of emergencies.
          </p>
        </div>
      </div>
    </div>
  );
}