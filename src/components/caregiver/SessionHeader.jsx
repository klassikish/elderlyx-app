import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SessionHeader({ sessionStarted, elapsed }) {
  const navigate = useNavigate();

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`sticky top-0 z-20 border-b border-border px-5 py-3.5 flex items-center gap-3 transition-colors ${sessionStarted ? 'bg-emerald-600' : 'bg-background/95 backdrop-blur'}`}>
      <button onClick={() => navigate(-1)} aria-label="Go back"
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${sessionStarted ? 'bg-white/20' : 'bg-muted'}`}>
        <ArrowLeft className={`w-4 h-4 ${sessionStarted ? 'text-white' : ''}`} />
      </button>
      <div className="flex-1">
        <h1 className={`font-bold text-sm ${sessionStarted ? 'text-white' : 'text-foreground'}`}>
          {sessionStarted ? '🟢 Session Active' : 'Session View'}
        </h1>
        {sessionStarted && (
          <p className="text-white/80 text-xs">{formatElapsed(elapsed)} elapsed</p>
        )}
      </div>
      {sessionStarted && (
        <div className="bg-white/20 rounded-xl px-3 py-1.5">
          <span className="text-white text-xs font-bold animate-pulse">LIVE</span>
        </div>
      )}
    </div>
  );
}