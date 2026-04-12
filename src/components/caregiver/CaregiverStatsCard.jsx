import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Star, ChevronRight } from 'lucide-react';

const STATS = [
  { icon: DollarSign, label: 'Earned', color: 'bg-green-100 text-green-600', link: '/CaregiverEarnings' },
  { icon: Calendar, label: 'Bookings', color: 'bg-blue-100 text-blue-600' },
  { icon: Star, label: 'Rating', color: 'bg-amber-100 text-amber-600' },
];

export default function CaregiverStatsCard({ earnings, completedCount, avgRating }) {
  const values = [
    { value: `$${earnings}`, stat: STATS[0] },
    { value: completedCount, stat: STATS[1] },
    { value: avgRating ? avgRating.toFixed(1) : '—', stat: STATS[2] },
  ];

  return (
    <div className="px-5 -mt-10 relative z-10">
      <div className="bg-card rounded-3xl border border-border shadow-lg p-5 grid grid-cols-3 gap-4">
        {values.map(({ value, stat }, i) => {
          const Comp = stat.link ? Link : 'div';
          return (
            <Comp
              key={stat.label}
              {...(stat.link && { to: stat.link })}
              className="flex flex-col items-center gap-2 relative"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              {stat.link && <ChevronRight className="absolute -right-1 top-3 w-3 h-3 text-muted-foreground" />}
            </Comp>
          );
        })}
      </div>
    </div>
  );
}