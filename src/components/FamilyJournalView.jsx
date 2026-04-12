import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const MOOD_MAP = {
  great: '😄 Great',
  good: '🙂 Good',
  neutral: '😐 Neutral',
  tired: '😴 Tired',
  unwell: '🤒 Unwell',
};

export default function FamilyJournalView({ bookingId }) {
  const [open, setOpen] = useState(false);

  const { data: journals = [] } = useQuery({
    queryKey: ['journal', bookingId],
    queryFn: () => base44.entities.VisitJournal.filter({ booking_id: bookingId }, '-created_date', 5),
    enabled: open,
  });

  const journal = journals[0];

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Caregiver Journal
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          {!journal ? (
            <p className="text-xs text-muted-foreground italic">No journal entry yet.</p>
          ) : (
            <>
              {journal.mood && (
                <p className="text-xs font-medium">
                  <span className="text-muted-foreground">Mood: </span>{MOOD_MAP[journal.mood] || journal.mood}
                </p>
              )}
              {journal.activities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Activities</p>
                  <div className="flex flex-wrap gap-1">
                    {journal.activities.map(a => (
                      <span key={a} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {journal.notes && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-xs text-foreground">{journal.notes}</p>
                </div>
              )}
              {journal.photo_urls?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {journal.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="visit" className="w-16 h-16 rounded-xl object-cover border border-border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Logged by {journal.caregiver_name} · {new Date(journal.created_date).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}