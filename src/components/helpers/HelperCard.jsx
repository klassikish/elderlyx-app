import { Star, ShieldCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SKILL_LABELS = {
  grocery: 'Grocery',
  transport: 'Transport',
  companionship: 'Companionship',
  household: 'Household',
  cooking: 'Cooking',
  medical_escort: 'Medical Escort',
};

export default function HelperCard({ helper, onBook }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <img
            src={helper.photo_url || `https://api.dicebear.com/7.x/personas/svg?seed=${helper.full_name}`}
            alt={helper.full_name}
            className="w-14 h-14 rounded-2xl object-cover bg-muted"
          />
          {helper.available && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-foreground">{helper.full_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-foreground">{helper.rating?.toFixed(1) || '4.9'}</span>
                <span className="text-xs text-muted-foreground">({helper.total_visits || 47} visits)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">${helper.hourly_rate || 18}/hr</p>
              {helper.background_checked !== false && (
                <div className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium mt-0.5 justify-end">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </div>
              )}
            </div>
          </div>

          {helper.bio && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{helper.bio}</p>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            {(helper.skills || ['grocery', 'companionship']).slice(0, 3).map(skill => (
              <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-2">
                {SKILL_LABELS[skill] || skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={() => onBook(helper)}
        className="w-full mt-3 h-9 text-sm font-semibold rounded-xl"
      >
        Book {helper.full_name?.split(' ')[0]}
      </Button>
    </div>
  );
}