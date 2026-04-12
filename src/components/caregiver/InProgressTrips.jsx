import CaregiverLocationTracker from '@/components/CaregiverLocationTracker';
import TransportTimer from '@/components/TransportTimer';

export default function InProgressTrips({ trips }) {
  if (trips.length === 0) return null;

  return trips.map(b => (
    <div key={b.id} className="px-5 mt-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-sm">🚗 Trip in Progress — {b.senior_name}</p>
          <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">In Progress</span>
        </div>
        <CaregiverLocationTracker bookingId={b.id} />
        <TransportTimer booking={b} />
      </div>
    </div>
  ));
}