import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Star, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#1f64b6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AdminAnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(90); // days

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);

  const { data: bookings = [] } = useQuery({
    queryKey: ['analytics-bookings'],
    queryFn: () => base44.entities.Booking.list('-scheduled_date', 500),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['analytics-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 500),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['analytics-assessments'],
    queryFn: () => base44.entities.IndependenceAssessment.list('-created_date', 500),
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied</p>
          <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
        </div>
      </div>
    );
  }

  // Filter by time range
  const filteredBookings = bookings.filter(b => new Date(b.scheduled_date) >= cutoffDate);
  const filteredReviews = reviews.filter(r => new Date(r.created_date) >= cutoffDate);
  const filteredAssessments = assessments.filter(a => new Date(a.created_date) >= cutoffDate);

  // Aggregate caregiver metrics
  const caregiverMetrics = {};
  
  // Add booking data
  filteredBookings.forEach(b => {
    if (!b.caregiver_id) return;
    if (!caregiverMetrics[b.caregiver_id]) {
      caregiverMetrics[b.caregiver_id] = {
        name: b.caregiver_name,
        totalBookings: 0,
        completedBookings: 0,
        onTimeCount: 0,
        reviews: [],
        assessmentScores: [],
      };
    }
    caregiverMetrics[b.caregiver_id].totalBookings++;
    if (b.status === 'completed') {
      caregiverMetrics[b.caregiver_id].completedBookings++;
    }
    // Simple heuristic: on-time if no cancellation
    if (b.status !== 'cancelled') {
      caregiverMetrics[b.caregiver_id].onTimeCount++;
    }
  });

  // Add review data
  filteredReviews.forEach(r => {
    if (!r.caregiver_id) return;
    if (caregiverMetrics[r.caregiver_id]) {
      caregiverMetrics[r.caregiver_id].reviews.push(r.rating);
    }
  });

  // Add assessment data
  filteredAssessments.forEach(a => {
    if (!a.caregiver_id) return;
    if (caregiverMetrics[a.caregiver_id]) {
      caregiverMetrics[a.caregiver_id].assessmentScores.push(a.total_score);
    }
  });

  // Transform to chart data
  const chartData = Object.values(caregiverMetrics)
    .filter(c => c.totalBookings > 0)
    .map(c => ({
      name: c.name,
      avgRating: c.reviews.length > 0 ? (c.reviews.reduce((a, b) => a + b) / c.reviews.length).toFixed(1) : 0,
      punctuality: c.totalBookings > 0 ? Math.round((c.onTimeCount / c.totalBookings) * 100) : 0,
      completion: c.totalBookings > 0 ? Math.round((c.completedBookings / c.totalBookings) * 100) : 0,
      assessmentScore: c.assessmentScores.length > 0 ? Math.round(c.assessmentScores.reduce((a, b) => a + b) / c.assessmentScores.length) : 0,
      jobCount: c.totalBookings,
      reviewCount: c.reviews.length,
    }))
    .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));

  // Time-series data (weekly completion rate)
  const weeklyData = [];
  for (let i = Math.ceil(timeRange / 7); i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekBookings = bookings.filter(b => {
      const d = new Date(b.scheduled_date);
      return d >= weekStart && d < weekEnd;
    });

    const completed = weekBookings.filter(b => b.status === 'completed').length;
    const rate = weekBookings.length > 0 ? Math.round((completed / weekBookings.length) * 100) : 0;

    weeklyData.push({
      week: `Week ${Math.ceil(timeRange / 7) - i}`,
      completionRate: rate,
      bookings: weekBookings.length,
    });
  }

  const stats = {
    totalCaregivers: Object.keys(caregiverMetrics).length,
    avgRating: chartData.length > 0 ? (chartData.reduce((sum, c) => sum + parseFloat(c.avgRating), 0) / chartData.length).toFixed(1) : 0,
    avgPunctuality: chartData.length > 0 ? Math.round(chartData.reduce((sum, c) => sum + c.punctuality, 0) / chartData.length) : 0,
    avgCompletion: chartData.length > 0 ? Math.round(chartData.reduce((sum, c) => sum + c.completion, 0) / chartData.length) : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">Analytics Dashboard</h1>
      </div>

      <div className="px-5 pt-5 pb-10">
        {/* Time range selector */}
        <div className="flex gap-2 mb-6">
          {[30, 60, 90, 180].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === days
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Active Caregivers</p>
            <p className="text-2xl font-black text-primary">{stats.totalCaregivers}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Avg Rating</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-black text-amber-500">{stats.avgRating}</p>
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Punctuality</p>
            <p className="text-2xl font-black text-emerald-600">{stats.avgPunctuality}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Completion Rate</p>
            <p className="text-2xl font-black text-blue-600">{stats.avgCompletion}%</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Caregiver performance comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Caregiver Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="avgRating" name="Avg Rating" fill="#1f64b6" />
                <Bar dataKey="punctuality" name="Punctuality %" fill="#10b981" />
                <Bar dataKey="completion" name="Completion %" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly completion trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Completion Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="completionRate" name="Completion Rate %" stroke="#1f64b6" strokeWidth={2} dot={{ fill: '#1f64b6' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top performers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Top Performers
            </h3>
            <div className="space-y-3">
              {chartData.slice(0, 5).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{i + 1}. {c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.jobCount} jobs · {c.reviewCount} reviews</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="font-bold text-amber-500 text-sm">{c.avgRating}★</p>
                      <p className="text-[10px] text-muted-foreground">rating</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-600 text-sm">{c.punctuality}%</p>
                      <p className="text-[10px] text-muted-foreground">on-time</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}