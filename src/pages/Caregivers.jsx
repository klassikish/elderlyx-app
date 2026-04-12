import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Star, Heart, Car, Shield, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const MOCK_CAREGIVERS = [
  { id: 'c1', full_name: 'Maria Santos', rating: 4.9, total_bookings: 87, bio: 'Compassionate and patient caregiver with 5 years experience.', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', caregiver_services: ['companionship', 'transportation'], is_verified: true, city: 'Austin, TX' },
  { id: 'c2', full_name: 'James Thompson', rating: 4.7, total_bookings: 52, bio: 'Former EMT, specialized in senior transportation and medical visits.', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', caregiver_services: ['transportation'], is_verified: true, city: 'Austin, TX' },
  { id: 'c3', full_name: 'Linda Park', rating: 5.0, total_bookings: 134, bio: 'Retired nurse offering warm companionship and gentle care.', photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80', caregiver_services: ['companionship'], is_verified: true, city: 'Austin, TX' },
];

export default function Caregivers() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: caregivers = [] } = useQuery({
    queryKey: ['caregivers'],
    queryFn: () => base44.entities.User.list(),
    select: (data) => data.filter(u => u.role === 'caregiver'),
  });

  const list = (caregivers.length ? caregivers : MOCK_CAREGIVERS).filter(c => {
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (c.caregiver_services || []).includes(filter);
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-bold text-foreground">Find a Caregiver</h1>
      </div>

      <div className="px-5 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search caregivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-11 rounded-xl" />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'companionship', label: '❤️ Companionship' },
            { id: 'transportation', label: '🚗 Transport' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3 pb-6">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/CaregiverProfile?id=${c.id}`}>
              <div className="bg-card rounded-2xl border border-border p-4 flex gap-4">
                <img src={c.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'} alt={c.full_name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground">{c.full_name}</p>
                    {c.is_verified && <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.bio}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold">{c.rating?.toFixed(1) || '—'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.total_bookings || 0} visits</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {(c.caregiver_services || []).includes('companionship') && (
                      <span className="flex items-center gap-0.5 bg-pink-50 text-pink-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <Heart className="w-2.5 h-2.5" /> Companion
                      </span>
                    )}
                    {(c.caregiver_services || []).includes('transportation') && (
                      <span className="flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <Car className="w-2.5 h-2.5" /> Transport
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}