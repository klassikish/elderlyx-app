import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import HelperCard from '@/components/helpers/HelperCard';

const skillFilters = [
  { key: 'all', label: 'All' },
  { key: 'grocery', label: 'Grocery' },
  { key: 'transport', label: 'Transport' },
  { key: 'companionship', label: 'Companionship' },
  { key: 'household', label: 'Household' },
  { key: 'cooking', label: 'Cooking' },
  { key: 'medical_escort', label: 'Medical' },
];

export default function Helpers() {
  const [search, setSearch] = useState('');
  const [activeSkill, setActiveSkill] = useState('all');

  const { data: helpers = [], isLoading } = useQuery({
    queryKey: ['helpers'],
    queryFn: () => base44.entities.Helper.list(),
  });

  const filtered = helpers.filter(h => {
    const matchesSearch = !search || h.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = activeSkill === 'all' || h.skills?.includes(activeSkill);
    return matchesSearch && matchesSkill && h.available;
  });

  return (
    <div className="px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="text-xl font-bold text-foreground">Find Helpers</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Trusted, background-checked caregivers</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search helpers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Skill Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
        {skillFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSkill(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeSkill === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Helpers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-muted rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No helpers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((helper, idx) => (
            <HelperCard key={helper.id} helper={helper} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}