import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BookOpen, Camera, Loader2, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ACTIVITIES = [
  'Medication reminder', 'Meal preparation', 'Light exercise',
  'Conversation', 'Errands', 'Personal hygiene', 'Reading', 'Games / puzzles',
];

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'unwell', emoji: '🤒', label: 'Unwell' },
];

export default function CaregiverJournalForm({ booking, onDone }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState([]);
  const [mood, setMood] = useState('good');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const toggleActivity = (a) =>
    setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(prev => [...prev, file_url]);
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: () =>
      base44.entities.VisitJournal.create({
        booking_id: booking.id,
        caregiver_id: booking.caregiver_id,
        caregiver_name: booking.caregiver_name,
        family_email: booking.family_email,
        senior_name: booking.senior_name,
        notes,
        activities,
        mood,
        photo_urls: photos,
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Journal saved!');
      onDone?.();
    },
  });

  return (
    <div className="bg-muted/50 rounded-2xl border border-border p-4 mt-3 space-y-4">
      <p className="font-bold text-sm flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" /> Post-Visit Journal
      </p>

      {/* Mood */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Senior's mood</p>
        <div className="flex gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center px-2 py-1.5 rounded-xl border text-xs transition-all ${mood === m.value ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[10px] mt-0.5">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Activities completed</p>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map(a => (
            <button
              key={a}
              onClick={() => toggleActivity(a)}
              className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${activities.includes(a) ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground'}`}
            >
              {activities.includes(a) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did the visit go? Any concerns for the family?"
          rows={3}
          className="w-full border border-input rounded-xl p-3 text-sm resize-none bg-card"
        />
      </div>

      {/* Photos */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Photos</p>
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, i) => (
            <div key={i} className="relative w-16 h-16">
              <img src={url} alt="visit" className="w-16 h-16 rounded-xl object-cover" />
              <button
                onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Journal Entry
      </Button>
    </div>
  );
}