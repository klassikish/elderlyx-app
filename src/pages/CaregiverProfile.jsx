import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Shield, ShieldCheck, Heart, Car, MapPin, Award, FileText, MessageCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CAREGIVER_ID = new URLSearchParams(window.location.search).get('id');

const MOCK = {
  id: 'c1',
  full_name: 'Maria Santos',
  rating: 4.9,
  total_bookings: 87,
  bio: 'Compassionate and patient caregiver with 5 years experience. I specialize in providing warm companionship and safe, reliable transportation for seniors.',
  photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  caregiver_services: ['companionship', 'transportation'],
  is_verified: true,
  city: 'Austin, TX',
  experience_years: 5,
  skills: ['grocery', 'transport', 'companionship', 'cooking', 'medical_escort'],
};

const SKILL_LABELS = {
  grocery: '🛒 Grocery',
  transport: '🚗 Transport',
  companionship: '❤️ Companionship',
  household: '🏠 Household',
  medical_escort: '🏥 Medical Escort',
  cooking: '🍳 Cooking',
  tech_help: '💻 Tech Help',
};

const DOC_LABELS = {
  background_check: 'Background Check',
  id_license: "ID / Driver's License",
  certification: 'Certification',
  insurance: 'Insurance',
  other: 'Other',
};

export default function CaregiverProfile() {
  const navigate = useNavigate();

  const { data: caregiver } = useQuery({
    queryKey: ['caregiver-profile', CAREGIVER_ID],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === CAREGIVER_ID) || MOCK;
    },
    enabled: !!CAREGIVER_ID,
    placeholderData: MOCK,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['caregiver-reviews', CAREGIVER_ID],
    queryFn: () => base44.entities.Review.filter({ caregiver_id: CAREGIVER_ID }, '-created_date', 20),
    enabled: !!CAREGIVER_ID,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['caregiver-docs', CAREGIVER_ID],
    queryFn: () => base44.entities.CaregiverDocument.filter({ caregiver_id: CAREGIVER_ID, status: 'approved' }, '-created_date', 10),
    enabled: !!CAREGIVER_ID,
  });

  const c = caregiver || MOCK;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : c.rating?.toFixed(1) || '—';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">Caregiver Profile</h1>
      </div>

      {/* Hero */}
      <div className="px-5 pt-6 flex gap-4 items-start">
        <img
          src={c.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'}
          alt={c.full_name}
          className="w-24 h-24 rounded-3xl object-cover flex-shrink-0 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">{c.full_name}</h2>
            {c.is_verified && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          {c.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {c.city}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-sm">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length || c.total_bookings || 0} reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {c.experience_years && <span>🏅 {c.experience_years} yrs experience</span>}
            {(c.total_bookings || 0) > 0 && <span>📋 {c.total_bookings} visits</span>}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="px-5 mt-5 flex gap-2 flex-wrap">
        {(c.caregiver_services || []).includes('companionship') && (
          <span className="flex items-center gap-1 bg-pink-50 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-pink-200">
            <Heart className="w-3.5 h-3.5" /> Companionship
          </span>
        )}
        {(c.caregiver_services || []).includes('transportation') && (
          <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200">
            <Car className="w-3.5 h-3.5" /> Transportation
          </span>
        )}
      </div>

      {/* Bio */}
      {c.bio && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-bold text-foreground mb-2">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.bio}</p>
        </div>
      )}

      {/* Skills */}
      {(c.skills || []).length > 0 && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Skills & Services</h3>
          <div className="flex flex-wrap gap-2">
            {c.skills.map(s => (
              <span key={s} className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-xl">
                {SKILL_LABELS[s] || s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified Documents */}
      {docs.length > 0 && (
        <div className="px-5 mt-5">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-green-600" /> Verified Documents
          </h3>
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-900">{doc.doc_label || DOC_LABELS[doc.doc_type] || doc.doc_type}</p>
                  <p className="text-[10px] text-green-700">Verified by Elderlyx</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-green-600 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust badges (always shown) */}
      <div className="px-5 mt-5">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" /> Trust & Safety
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🔍', label: 'Background Checked', active: c.background_check_clear },
            { icon: '🆔', label: 'Identity Verified', active: c.is_verified },
            { icon: '📋', label: 'Platform Trained', active: true },
            { icon: '⭐', label: 'Top Rated', active: (c.rating || 0) >= 4.5 },
          ].map(b => (
            <div key={b.label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium ${b.active ? 'bg-green-50 border-green-200 text-green-800' : 'bg-muted border-border text-muted-foreground'}`}>
              <span>{b.icon}</span> {b.label}
              {b.active && <ShieldCheck className="w-3 h-3 text-green-600 ml-auto" />}
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-5 mt-5">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Reviews
          {reviews.length > 0 && <span className="text-muted-foreground font-normal text-xs">({reviews.length})</span>}
        </h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{r.reviewer_name || 'Family Member'}</p>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>}
                <p className="text-[10px] text-muted-foreground/60 mt-2">
                  {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : ''}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur border-t border-border px-5 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Link to={`/Chat?booking_id=new&caregiver_id=${CAREGIVER_ID}`} className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold gap-2">
              <MessageCircle className="w-4 h-4" /> Message
            </Button>
          </Link>
          <Link to={`/Book`} className="flex-2 flex-grow-[2]">
            <Button className="w-full h-12 rounded-2xl font-bold gap-2">
              <CalendarPlus className="w-4 h-4" /> Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}