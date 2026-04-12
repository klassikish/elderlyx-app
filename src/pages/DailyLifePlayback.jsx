import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UpgradePromptModal from '@/components/UpgradePromptModal';
import SosButton from '@/components/SosButton';
import DailyPlayback from '@/components/DailyPlayback';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const SENIOR_PARAM = new URLSearchParams(window.location.search).get('senior') || '';

export default function DailyLifePlayback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const seniorName = SENIOR_PARAM || '';
  const subscription = user?.subscription_plan || 'basic';
  const [showUpgradeModal, setShowUpgradeModal] = useState(!subscription || subscription !== 'premium');

  // Fetch current booking for SOS button
  const { data: booking } = useQuery({
    queryKey: ['current-booking', seniorName, user?.email],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter(
        { family_email: user?.email, status: 'in_progress' },
        '-scheduled_date',
        1
      );
      return bookings[0] || null;
    },
    enabled: !!user?.email && subscription === 'premium',
  });

  // Gate to PREMIUM only
  if (subscription !== 'premium') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-foreground">Daily Life Playback</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">PREMIUM Feature</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Full Daily Life Playback with trends, alerts, and smart recommendations is available on the Premium plan.
          </p>
          <Button onClick={() => setShowUpgradeModal(true)} className="rounded-2xl">Upgrade to PREMIUM</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-foreground">Daily Life Playback</h1>
          {seniorName && <p className="text-xs text-muted-foreground">{seniorName}</p>}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-5 pb-10 space-y-4"
      >
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-sm text-foreground">
            <span className="font-bold">What's happening during visits?</span>
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">See meal habits, mobility changes, mood patterns, and medication compliance—all reported by caregivers.</span>
          </p>
        </div>

        {seniorName ? (
          <DailyPlayback seniorName={seniorName} isPremium={true} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No senior selected. Go back and choose a senior to view their playback.</p>
          </div>
        )}

        {/* Emergency SOS Button for Premium */}
        {booking && subscription === 'premium' && (
          <div className="mt-6">
            <SosButton booking={booking} />
          </div>
        )}
      </motion.div>

      {showUpgradeModal && (
        <UpgradePromptModal 
          onClose={() => setShowUpgradeModal(false)} 
          trigger="visited_feature"
        />
      )}
    </div>
  );
}