import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, action, onBack, className }) {
  return (
    <div className={cn('px-5 pt-14 pb-4', className)}>
      <div className="flex items-start justify-between gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="mt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}