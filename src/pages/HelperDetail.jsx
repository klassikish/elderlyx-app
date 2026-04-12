import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, ShieldCheck, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const skillLabels = {
  grocery: 'Grocery Shopping',
  transport: 'Transportation',
  companionship: 'Companionship',
  household: 'Household Chores',
  medical_escort: 'Medical Escort',
  cooking: 'Cooking',
};

export default function HelperDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const helperId = urlParams.get('id');

  const { data: helpers = [] } = useQuery({
    queryKey: ['helpers'],
    queryFn: () => base44.entities.Helper.list(),
  });

  const helper = helpers.find(h => h.id === helperId);

  if (!helper) {
    return (
      <div className="px-4 pt-6">
        <Link to="/Helpers" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <p className="text-center text-muted-foreground py-16">Helper not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <Link to="/Helpers" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Helpers
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden">
              {helper.photo_url ? (
                <img src={helper.photo_url} alt={helper.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{helper.full_name?.[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{helper.full_name}</h1>
                {helper.background_checked && <ShieldCheck className="w-5 h-5 text-chart-3" />}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {helper.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-sm">
                    <Star className="w-4 h-4 text-chart-5 fill-chart-5" />
                    <span className="font-medium">{helper.rating?.toFixed(1)}</span>
                  </span>
                )}
                {helper.total_visits > 0 && (
                  <span className="text-sm text-muted-foreground">{helper.total_visits} visits</span>
                )}
              </div>
              {helper.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />{helper.city}
                </p>
              )}
            </div>
          </div>

          {helper.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{helper.bio}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {helper.skills?.map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skillLabels[skill] || skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">${helper.hourly_rate || 0}</p>
            <p className="text-[10px] text-muted-foreground">per hour</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{helper.total_visits || 0}</p>
            <p className="text-[10px] text-muted-foreground">total visits</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{helper.rating?.toFixed(1) || 'N/A'}</p>
            <p className="text-[10px] text-muted-foreground">rating</p>
          </div>
        </div>

        {/* Book Button */}
        <Link to={`/BookHelper?helper=${helper.id}`}>
          <Button className="w-full h-12 text-sm font-semibold rounded-xl">
            Book {helper.full_name}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}