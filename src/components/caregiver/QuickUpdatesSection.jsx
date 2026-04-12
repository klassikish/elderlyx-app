const QUICK_UPDATES = [
  { emoji: '😊', text: 'Senior is in good spirits' },
  { emoji: '🍽️', text: 'Meal completed successfully' },
  { emoji: '💊', text: 'Medication taken on time' },
  { emoji: '🚶', text: 'Completed light activity' },
  { emoji: '😴', text: 'Senior resting comfortably' },
  { emoji: '⚠️', text: 'Minor concern — see notes' },
];

export default function QuickUpdatesSection({ onSend }) {
  return (
    <div>
      <p className="text-sm font-bold text-foreground mb-2">Quick Updates <span className="text-muted-foreground font-normal text-xs">(visible to family)</span></p>
      <div className="flex flex-wrap gap-2">
        {QUICK_UPDATES.map(q => (
          <button
            key={q.text}
            onClick={() => onSend(q.text)}
            className="flex items-center gap-1.5 bg-secondary border border-border text-xs font-medium px-3 py-2 rounded-xl hover:bg-primary/10 hover:border-primary transition-colors"
          >
            {q.emoji} {q.text}
          </button>
        ))}
      </div>
    </div>
  );
}