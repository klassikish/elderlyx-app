import { cn } from '@/lib/utils';

export default function QuickStatCard({ icon: Icon, label, value, sub, color = 'bg-primary/10 text-primary' }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-2">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs font-medium text-foreground mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}