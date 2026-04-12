import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Phone, MapPin, Heart, ShieldCheck, Edit2, ChevronRight, Activity, Star, AlertCircle, Apple, Utensils, Smile } from 'lucide-react';
import { checkPermission } from '@/lib/permissions';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import IndependenceScoreGauge from '@/components/dashboard/IndependenceScoreGauge';
import ScoreBreakdown from '@/components/dashboard/ScoreBreakdown';
import { Button } from '@/components/ui/button';

const MOCK_SENIOR = {
  id: 'mock',
  full_name: 'Margaret Johnson',
  date_of_birth: '1945-03-12',
  photo_url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&q=80',
  address: '42 Maple Street, Boston, MA 02101',
  phone: '(617) 555-0142',
  emergency_contact_name: 'Robert Johnson (Son)',
  emergency_contact_phone: '(617) 555-0189',
  medical_notes: 'Mild arthritis in both knees. Takes blood pressure medication (Lisinopril 10mg) daily at 8am.',
  preferences: 'Loves gardening and BBC documentaries. Prefers helpers to arrive on time. Enjoys a cup of tea on arrival.',
  independence_score: 74,
  mobility_score: 68,
  safety_score: 82,
  daily_living_score: 71,
  social_score: 75,
  medical_history: [
    { condition: 'Hypertension', diagnosed_year: 2015, status: 'managed', notes: 'Well-controlled with medication' },
    { condition: 'Osteoarthritis', diagnosed_year: 2018, status: 'active', notes: 'Bilateral knee involvement' },
  ],
  medications: [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily at 8am', reason: 'Blood pressure control', start_date: '2015-06-15' },
    { name: 'Ibuprofen', dosage: 'As needed', frequency: '2-3x daily', reason: 'Arthritis pain relief' },
  ],
  allergies: [
    { allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' },
  ],
  dietary_restrictions: ['Low sodium', 'No added sugar'],
  dietary_notes: 'Prefers soft foods. Drinks plenty of water. Enjoys warm tea in mornings.',
  preferred_activities: ['Gardening', 'Reading', 'Bird watching', 'BBC documentaries'],
  activity_notes: 'Enjoys gentle outdoor activities. Needs 15-20 min breaks during activities.',
  additional_emergency_contacts: [
    { name: 'Mary Johnson (Daughter)', relationship: 'Daughter', phone: '(617) 555-0156', priority: 2 },
  ],
};

function age(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function SeniorProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: seniors = [] } = useQuery({
    queryKey: ['seniors'],
    queryFn: () => base44.entities.Senior.list('-updated_date', 1),
  });

  const senior = seniors[0] ?? MOCK_SENIOR;
  const userRole = user?.family_role || 'viewer';
  const canViewMedical = checkPermission(userRole, 'view_data');

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Senior Profile"
        subtitle="Care settings & health info"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 pb-8 space-y-4">
        {/* Profile hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
        >
          <div className="h-24 bg-gradient-to-r from-primary to-blue-500" />
          <div className="px-5 pb-5 -mt-12">
            <div className="flex items-end justify-between mb-3">
              <img
                src={senior.photo_url || 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&q=80'}
                alt={senior.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-md"
              />
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5 mb-1">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
            </div>
            <h2 className="text-xl font-bold text-foreground">{senior.full_name}</h2>
            {senior.date_of_birth && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Age {age(senior.date_of_birth)} · Born {new Date(senior.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Active monitoring enabled</span>
            </div>
          </div>
        </motion.div>

        {/* Independence Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-3xl border border-border shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Independence Score™</h3>
          </div>
          <div className="flex items-center gap-4">
            <IndependenceScoreGauge score={senior.independence_score ?? 74} />
            <div className="flex-1">
              <ScoreBreakdown senior={senior} />
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border shadow-sm p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-foreground">Contact & Location</h3>
          {senior.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{senior.phone}</p>
              </div>
            </div>
          )}
          {senior.address && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-foreground">{senior.address}</p>
              </div>
            </div>
          )}
          {senior.emergency_contact_name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-medium text-foreground">{senior.emergency_contact_name}</p>
                <p className="text-xs text-muted-foreground">{senior.emergency_contact_phone}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Medical Notes */}
        {senior.medical_notes && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Medical Notes</h3>
              <span className="ml-auto text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium">Confidential</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{senior.medical_notes}</p>
          </motion.div>
        )}

        {/* Preferences */}
        {senior.preferences && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">General Preferences</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{senior.preferences}</p>
          </motion.div>
        )}

        {/* Medical History Section */}
        {canViewMedical && senior.medical_history && senior.medical_history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Medical History</h3>
              <span className="ml-auto text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium">Confidential</span>
            </div>
            <div className="space-y-3">
              {senior.medical_history.map((item, i) => (
                <div key={i} className="border border-border rounded-xl p-3 bg-muted/30">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm text-foreground">{item.condition}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'active' ? 'bg-red-100 text-red-700' :
                      item.status === 'managed' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Diagnosed: {item.diagnosed_year}</p>
                  {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Medications Section */}
        {canViewMedical && senior.medications && senior.medications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Apple className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-foreground">Medications</h3>
              <span className="ml-auto text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">Critical</span>
            </div>
            <div className="space-y-3">
              {senior.medications.map((med, i) => (
                <div key={i} className="border border-border rounded-xl p-3 bg-muted/30">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm text-foreground">{med.name}</p>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{med.dosage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{med.frequency}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reason: {med.reason}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Allergies Section */}
        {canViewMedical && senior.allergies && senior.allergies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-red-50 rounded-3xl border border-red-200 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-red-900">Allergies</h3>
            </div>
            <div className="space-y-2">
              {senior.allergies.map((allergy, i) => (
                <div key={i} className="bg-white rounded-lg p-2.5">
                  <p className="font-semibold text-sm text-red-900">{allergy.allergen}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      allergy.severity === 'severe' ? 'bg-red-600 text-white' :
                      allergy.severity === 'moderate' ? 'bg-orange-500 text-white' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {allergy.severity}
                    </span>
                    <p className="text-xs text-red-700">Reaction: {allergy.reaction}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dietary Restrictions Section */}
        {(senior.dietary_restrictions?.length > 0 || senior.dietary_notes) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-foreground">Dietary Information</h3>
            </div>
            {senior.dietary_restrictions && senior.dietary_restrictions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Restrictions:</p>
                <div className="flex flex-wrap gap-2">
                  {senior.dietary_restrictions.map((restriction, i) => (
                    <span key={i} className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {senior.dietary_notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{senior.dietary_notes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Preferred Activities Section */}
        {(senior.preferred_activities?.length > 0 || senior.activity_notes) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Smile className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-bold text-foreground">Preferred Activities</h3>
            </div>
            {senior.preferred_activities && senior.preferred_activities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Enjoys:</p>
                <div className="flex flex-wrap gap-2">
                  {senior.preferred_activities.map((activity, i) => (
                    <span key={i} className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {senior.activity_notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{senior.activity_notes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Additional Emergency Contacts Section */}
        {senior.additional_emergency_contacts && senior.additional_emergency_contacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-3xl border border-border shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Additional Emergency Contacts</h3>
            </div>
            <div className="space-y-2">
              {senior.additional_emergency_contacts.map((contact, i) => (
                <div key={i} className="border border-border rounded-xl p-3 bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  <p className="text-xs font-medium text-primary mt-1">{contact.phone}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}