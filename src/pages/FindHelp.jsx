import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, ShoppingCart, Car, Users, Home, UtensilsCrossed, Stethoscope, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import HelperCard from '@/components/helpers/HelperCard';
import BookingModal from '@/components/helpers/BookingModal';

const TASKS = [
  { id: 'all', label: 'All', icon: SlidersHorizontal },
  { id: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'companionship', label: 'Companion', icon: Users },
  { id: 'household', label: 'Household', icon: Home },
  { id: 'cooking', label: 'Cooking', icon: UtensilsCrossed },
  { id: 'medical_escort', label: 'Medical', icon: Stethoscope },
];

const MOCK_HELPERS = [
  { id: '1', full_name: 'Maria Santos', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80', rating: 4.9, total_visits: 124, hourly_rate: 18, background_checked: true, available: true, bio: 'Compassionate helper with 5 years experience caring for seniors. Fluent in English and Spanish.', skills: ['grocery', 'household', 'cooking', 'companionship'], city: 'Boston' },
  { id: '2', full_name: 'James Thompson', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', rating: 4.8, total_visits: 89, hourly_rate: 20, background_checked: true, available: true, bio: 'Former nurse with a warm heart. Love building genuine connections with seniors and their families.', skills: ['companionship', 'medical_escort', 'transport'], city: 'Boston' },
  { id: '3', full_name: 'Rosa Martinez', photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80', rating: 4.9, total_visits: 201, hourly_rate: 17, background_checked: true, available: true, bio: 'Professional cleaner and home organizer. I treat every senior\'s home as my own.', skills: ['household', 'cooking', 'grocery'], city: 'Boston' },
  { id: '4', full_name: 'David Chen', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', rating: 4.7, total_visits: 56, hourly_rate: 22, background_checked: true, available: false, bio: 'Licensed driver with senior-adapted vehicle. Specialise in medical appointments and errands.', skills: ['transport', 'medical_escort', 'grocery'], city: 'Boston' },
  { id: '5', full_name: 'Amara Okonkwo', photo_url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=80', rating: 5.0, total_visits: 33, hourly_rate: 19, background_checked: true, available: true, bio: 'Social worker background, passionate about senior wellbeing and independence.', skills: ['companionship', 'household', 'cooking'], city: 'Boston' },
];

export default function FindHelp() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTask = urlParams.get('task') || 'all';

  const [selectedTask, setSelectedTask] = useState(defaultTask);
  const [search, setSearch] = useState('');
  const [bookingHelper, setBookingHelper] = useState(null);

  const { data: helpers = [] } = useQuery({
    queryKey: ['helpers'],
    queryFn: () => base44.entities.Helper.list(),
  });

  const allHelpers = helpers.length > 0 ? helpers : MOCK_HELPERS;

  const filtered = allHelpers.filter(h => {
    const matchesTask = selectedTask === 'all' || (h.skills || []).includes(selectedTask);
    const matchesSearch = !search || h.full_name?.toLowerCase().includes(search.toLowerCase()) || h.bio?.toLowerCase().includes(search.toLowerCase());
    return matchesTask && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Find a Helper"
        subtitle="Verified, background-checked helpers"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-card"
          />
        </div>

        {/* Task Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TASKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTask(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                selectedTask === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3 pb-4">
          <p className="text-xs text-muted-foreground">{filtered.length} helpers available</p>
          {filtered.map((helper, i) => (
            <motion.div
              key={helper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <HelperCard helper={helper} onBook={setBookingHelper} />
            </motion.div>
          ))}
        </div>
      </div>

      {bookingHelper && (
        <BookingModal helper={bookingHelper} onClose={() => setBookingHelper(null)} />
      )}
    </div>
  );
}