import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import CaregiverJobCard from '@/components/CaregiverJobCard';
import CaregiverAssessmentForm from '@/components/CaregiverAssessmentForm';
import OngoingClientsSection from '@/components/OngoingClientsSection';
import CaregiverHomeHeader from '@/components/caregiver/CaregiverHomeHeader';
import CaregiverStatsCard from '@/components/caregiver/CaregiverStatsCard';
import JobMatchesList from '@/components/caregiver/JobMatchesList';
import InProgressTrips from '@/components/caregiver/InProgressTrips';
import UpcomingBookings from '@/components/caregiver/UpcomingBookings';
import CompletedBookings from '@/components/caregiver/CompletedBookings';

export default function CaregiverHome() {
  const { user } = useAuth();
  const [activeJobCard, setActiveJobCard] = useState(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ['caregiver-bookings'],
    queryFn: () => base44.entities.Booking.filter({ caregiver_id: user?.id }, '-created_date', 20),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }, '-created_date', 10),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['caregiver-assessments', user?.id],
    queryFn: () => base44.entities.IndependenceAssessment.filter({ caregiver_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const completed = bookings.filter(b => b.status === 'completed');
  const inProgress = bookings.filter(b => b.status === 'in_progress');
  const upcoming = bookings.filter(b => b.status === 'confirmed');
  const matchedJobs = bookings.filter(b => b.status === 'pending' && b.matched_caregivers?.includes(user?.id));
  const pendingAssessment = completed.find(b => !assessments.some(a => a.booking_id === b.id));

  const earnings = completed.reduce((s, b) => s + (b.price || 0), 0);
  const avgRating = user?.rating || 0;

  const handleJobResponse = (bookingId, action) => {
    base44.functions.invoke('respondToBooking', { booking_id: bookingId, action }).then(() => {
      setActiveJobCard(null);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <CaregiverHomeHeader user={user} notifications={notifications} />
      <CaregiverStatsCard earnings={earnings} completedCount={completed.length} avgRating={avgRating} />
      <JobMatchesList matchedJobs={matchedJobs} onSelectJob={setActiveJobCard} />

      {activeJobCard && (
        <CaregiverJobCard
          booking={activeJobCard}
          loading={false}
          onAccept={() => handleJobResponse(activeJobCard.id, 'accept')}
          onDecline={() => handleJobResponse(activeJobCard.id, 'decline')}
        />
      )}

      <InProgressTrips trips={inProgress} />
      <UpcomingBookings bookings={upcoming} />
      <CompletedBookings bookings={completed} />
      <OngoingClientsSection />

      <div className="pb-6" />

      {pendingAssessment && (
        <CaregiverAssessmentForm booking={pendingAssessment} onComplete={() => {}} />
      )}
    </div>
  );
}