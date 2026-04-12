import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Filter, ArrowUpDown, X, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_TYPES = [
  'member_added',
  'member_removed',
  'role_changed',
  'member_revoked',
  'access_granted',
  'access_denied',
];

const USER_ROLES = ['admin', 'primary_owner', 'manager', 'viewer'];

const SORT_OPTIONS = [
  { label: 'Date (Newest)', value: '-created_date' },
  { label: 'Date (Oldest)', value: 'created_date' },
  { label: 'Actor (A-Z)', value: 'actor_email' },
];

export default function AuditLogViewer({ familyEmail = null, limit = 50 }) {
  const [search, setSearch] = useState('');
  const [actionTypes, setActionTypes] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // 'all', '7days', '30days', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [showFilters, setShowFilters] = useState(false);

  // Build query filter
  const buildQuery = () => {
    const query = {};
    if (familyEmail) query.family_email = familyEmail;

    if (actionTypes.length > 0) {
      query.action_type = { $in: actionTypes };
    }

    if (search.trim()) {
      query.$or = [
        { actor_email: { $regex: search, $options: 'i' } },
        { target_email: { $regex: search, $options: 'i' } },
        { actor_name: { $regex: search, $options: 'i' } },
        { target_name: { $regex: search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;

      if (dateRange === '7days') {
        startDate = subDays(now, 7);
      } else if (dateRange === '30days') {
        startDate = subDays(now, 30);
      } else if (dateRange === 'custom') {
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
      }

      if (startDate) {
        query.created_date = { $gte: startDate.toISOString() };
      }

      if (dateRange === 'custom' && customEndDate) {
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59);
        query.created_date = {
          ...query.created_date,
          $lte: endDate.toISOString(),
        };
      }
    }

    return query;
  };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', familyEmail, actionTypes, dateRange, search, sort],
    queryFn: () =>
      base44.entities.AuditLog.filter(buildQuery(), sort, limit),
  });

  const toggleActionType = (type) => {
    setActionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setActionTypes([]);
    setDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    actionTypes.length +
    (dateRange !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeFilterCount > 0
              ? 'bg-primary text-white border-primary'
              : 'bg-background border-input hover:bg-muted'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 text-xs font-bold">{activeFilterCount}</span>
          )}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-lg p-4 space-y-4 bg-muted/50"
          >
            {/* Action Types */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Action Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleActionType(type)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                      actionTypes.includes(type)
                        ? 'bg-primary text-white'
                        : 'bg-background border border-input hover:border-primary/50'
                    }`}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Date Range
              </p>
              <div className="flex gap-2 flex-wrap">
                {['all', '7days', '30days', 'custom'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                      dateRange === range
                        ? 'bg-primary text-white'
                        : 'bg-background border border-input hover:border-primary/50'
                    }`}
                  >
                    {range === 'all'
                      ? 'All Time'
                      : range === '7days'
                        ? 'Last 7 days'
                        : range === '30days'
                          ? 'Last 30 days'
                          : 'Custom'}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              {dateRange === 'custom' && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="End date"
                  />
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="text-xs text-muted-foreground">
        {isLoading ? (
          'Loading logs…'
        ) : (
          <>
            Showing <strong>{logs.length}</strong> of recent actions
          </>
        )}
      </div>

      {/* Logs Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No audit logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Actor</th>
                  <th className="px-4 py-3 text-left font-semibold">Target</th>
                  <th className="px-4 py-3 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_date), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-foreground">{log.actor_name}</div>
                      <div className="text-muted-foreground">{log.actor_email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.target_name ? (
                        <>
                          <div className="font-medium text-foreground">{log.target_name}</div>
                          <div className="text-muted-foreground">{log.target_email}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.old_value && (
                        <div className="text-muted-foreground">
                          {log.old_value} → <span className="text-foreground font-medium">{log.new_value}</span>
                        </div>
                      )}
                      {log.reason && <div className="text-muted-foreground italic">{log.reason}</div>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}