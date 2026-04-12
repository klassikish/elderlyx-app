import { Send, Loader2 } from 'lucide-react';

export default function NoteInputSection({ noteText, onNoteChange, onSend, isLoading }) {
  return (
    <div>
      <p className="text-sm font-bold text-foreground mb-2">Add Care Note</p>
      <div className="flex gap-2">
        <textarea
          value={noteText}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Type a note visible to the family…"
          className="flex-1 border border-input rounded-2xl px-4 py-3 text-sm bg-transparent resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={onSend}
          disabled={!noteText.trim() || isLoading}
          className="self-end w-12 h-12 bg-primary rounded-2xl flex items-center justify-center disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}