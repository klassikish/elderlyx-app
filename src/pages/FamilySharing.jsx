import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FamilySharingTeaser from '@/components/FamilySharingTeaser';
import FamilyMemberList from '@/components/FamilyMemberList';
import SharedActivityFeed from '@/components/SharedActivityFeed';
import InviteFamilyModal from '@/components/InviteFamilyModal';
import UpgradeTeaserCard from '@/components/UpgradeTeaserCard';
import WellnessSummaryGenerator from '@/components/WellnessSummaryGenerator';
import WellnessUpgradePrompt from '@/components/WellnessUpgradePrompt';

export default function FamilySharing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const subscription = user?.subscription_plan || 'basic';
  const isPremium = subscription === 'premium';
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground">Family Sharing</h1>
          <p className="text-xs text-muted-foreground">Manage access for family members</p>
        </div>
        {isPremium && (
          <Button
            size="sm"
            className="rounded-xl gap-1"
            onClick={() => setShowInviteModal(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Invite
          </Button>
        )}
      </div>

      <div className="px-5 pt-5 pb-20 space-y-6">
        {/* Premium teaser or actual feature */}
        {!isPremium ? (
          <div className="space-y-6">
            <FamilySharingTeaser />
            <WellnessUpgradePrompt />
          </div>
        ) : (
          <>
            {/* Wellness Report Section */}
            <div>
              <WellnessSummaryGenerator seniorName="Your loved one" isPremium={true} />
            </div>

            {/* Family Members Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">Family Members</h2>
              </div>
              <FamilyMemberList seniorName="Your loved one" />
            </div>

            {/* Shared Activity Section */}
            <div>
              <h2 className="font-bold text-foreground mb-3">Live Activity Feed</h2>
              <div className="bg-card border border-border rounded-2xl p-4">
                <SharedActivityFeed />
              </div>
            </div>

            {/* Info section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">✓ Premium Family Sharing includes:</p>
              <ul className="space-y-1.5 text-xs text-blue-800">
                <li>• Add unlimited family members</li>
                <li>• Assign custom roles (Viewer / Contributor)</li>
                <li>• Real-time shared activity log</li>
                <li>• Individual notification controls</li>
                <li>• Instant access revocation</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && isPremium && (
        <InviteFamilyModal
          onClose={() => setShowInviteModal(false)}
          seniorName="Your loved one"
        />
      )}
    </div>
  );
}