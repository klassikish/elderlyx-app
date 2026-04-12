import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  User, Phone, MapPin, ClipboardList, ShieldCheck, Camera,
  Video, BookOpen, Calendar, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2, Upload, Clock
} from 'lucide-react';

// ── Pre-screen questions ─────────────────────────────────────
const PRESCREEN = [
  { id: 'experience', question: 'How many years of caregiving experience do you have?', options: ['Less than 1 year', '1–3 years', '3–5 years', '5+ years'] },
  { id: 'services', question: 'Which services can you provide?', options: ['Companionship', 'Transportation', 'Grocery & Errands', 'Medication reminders', 'Meal preparation', 'Light housekeeping'], multi: true },
  { id: 'availability', question: 'What is your general availability?', options: ['Weekdays only', 'Weekends only', 'Both weekdays & weekends', 'Flexible / anytime'] },
  { id: 'transport', question: 'Do you have a valid driver\'s license and reliable vehicle?', options: ['Yes, both', 'License only', 'No vehicle', 'No license'] },
  { id: 'criminal', question: 'Have you ever been convicted of a criminal offense?', options: ['No', 'Yes — I can provide details'] },
  { id: 'elderly', question: 'Are you comfortable working with seniors with dementia or memory issues?', options: ['Yes, experienced', 'Yes, willing to learn', 'Prefer not to'] },
];

// ── Training quiz ────────────────────────────────────────────
const QUIZ = [
  {
    q: 'A senior you\'re caring for falls. What do you do first?',
    options: ['Help them up immediately', 'Assess injuries and call for help if needed', 'Call the family', 'Wait for them to get up'],
    correct: 1,
  },
  {
    q: 'A client asks you to give them their medication. You should:',
    options: ['Give it as requested', 'Remind them per care plan only', 'Refuse entirely', 'Contact a nurse first always'],
    correct: 1,
  },
  {
    q: 'You notice a client seems confused and doesn\'t recognise you. You should:',
    options: ['Argue with them', 'Leave them alone', 'Stay calm, use their name and speak gently', 'Call 911 immediately'],
    correct: 2,
  },
  {
    q: 'Privacy of client information means:',
    options: ['You can share with close friends', 'Never discuss client details outside of care team', 'Posting updates on social media is fine', 'Family always has full access'],
    correct: 1,
  },
  {
    q: 'What is the most important thing when assisting a client with mobility?',
    options: ['Speed', 'Your own comfort', 'Client dignity and safety', 'Following your own routine'],
    correct: 2,
  },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Morning (6am–12pm)', 'Afternoon (12pm–6pm)', 'Evening (6pm–10pm)', 'Overnight (10pm–6am)'];

const STEP_META = [
  { icon: User, label: 'Basic Info', color: 'bg-blue-100 text-blue-600' },
  { icon: ClipboardList, label: 'Pre-Screen', color: 'bg-purple-100 text-purple-600' },
  { icon: ShieldCheck, label: 'ID Verify', color: 'bg-green-100 text-green-600' },
  { icon: ShieldCheck, label: 'Background', color: 'bg-red-100 text-red-600' },
  { icon: Video, label: 'Video Intro', color: 'bg-pink-100 text-pink-600' },
  { icon: BookOpen, label: 'Training', color: 'bg-amber-100 text-amber-600' },
  { icon: Calendar, label: 'Availability', color: 'bg-teal-100 text-teal-600' },
];

export default function CaregiverOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — Basic info
  const [basic, setBasic] = useState({ phone: user?.phone || '', city: '', bio: '' });

  // Step 1 — Pre-screen
  const [answers, setAnswers] = useState({});

  // Step 2 — ID
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [idUploading, setIdUploading] = useState('');

  // Step 3 — Background check consent
  const [bgConsent, setBgConsent] = useState(false);
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');

  // Step 4 — Video
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);

  // Step 5 — Quiz
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Step 6 — Availability
  const [availability, setAvailability] = useState({});

  const totalSteps = 7;

  const uploadFile = async (file, setUrl, setUploading, key = '') => {
    setUploading(key || true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    setUploading('');
    return file_url;
  };

  const toggleAvailability = (day, slot) => {
    setAvailability(prev => {
      const key = `${day}__${slot}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const quizScore = () => {
    let correct = 0;
    QUIZ.forEach((q, i) => { if (quizAnswers[i] === q.correct) correct++; });
    return Math.round((correct / QUIZ.length) * 100);
  };

  const handleComplete = async () => {
    setSaving(true);
    const score = quizScore();
    const availSlots = Object.entries(availability).filter(([, v]) => v).map(([k]) => k);

    await base44.auth.updateMe({
      onboarding_complete: true,
      onboarding_submitted_at: new Date().toISOString(),
      phone: basic.phone,
      city: basic.city,
      bio: basic.bio,
      prescreen_answers: answers,
      id_front_url: idFront,
      id_back_url: idBack,
      bg_check_consented: bgConsent,
      video_intro_url: videoUrl,
      quiz_score: score,
      availability_slots: availSlots,
    });

    setSaving(false);
    toast.success('🎉 Onboarding submitted! We\'ll review within 24–48 hours.');
    navigate('/');
  };

  const canProceed = () => {
    if (step === 0) return basic.phone.length >= 7 && basic.city.length >= 2;
    if (step === 1) return PRESCREEN.every(q => q.multi ? answers[q.id]?.length > 0 : answers[q.id]);
    if (step === 2) return !!idFront && !!idBack;
    if (step === 3) return bgConsent && ssn.length >= 4 && dob.length >= 8;
    if (step === 4) return !!videoUrl;
    if (step === 5) return quizSubmitted && quizScore() >= 60;
    if (step === 6) return Object.values(availability).some(Boolean);
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-white/70" />
          <p className="text-white/70 text-xs">Complete within 24–48 hours</p>
        </div>
        <h1 className="text-white text-2xl font-black">Caregiver Onboarding</h1>
        <p className="text-white/70 text-sm mt-1">Step {step + 1} of {totalSteps} — {STEP_META[step].label}</p>

        {/* Progress bar */}
        <div className="flex gap-1 mt-4">
          {STEP_META.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      {/* Step icons row */}
      <div className="flex justify-between px-4 py-3 bg-card border-b border-border overflow-x-auto">
        {STEP_META.map(({ icon: Icon, label, color }, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${i < step ? 'bg-green-100' : i === step ? color : 'bg-muted'}`}>
              {i < step
                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                : <Icon className={`w-4 h-4 ${i === step ? color.split(' ')[1] : 'text-muted-foreground'}`} />}
            </div>
            <p className={`text-[8px] font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="px-5 py-6 space-y-4"
          >

            {/* ── STEP 0: Basic Info ──────────────────────── */}
            {step === 0 && (
              <>
                <h2 className="font-bold text-xl">Tell us about yourself</h2>
                <p className="text-sm text-muted-foreground">Basic information for your caregiver profile</p>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name</label>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{user?.full_name || '—'}</span>
                    <span className="text-xs text-muted-foreground ml-auto">(from account)</span>
                  </div>
                </div>

                {[
                  { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+1 555 000 0000', type: 'tel' },
                  { key: 'city', label: 'City / Area', icon: MapPin, placeholder: 'e.g. Brooklyn, NY', type: 'text' },
                ].map(({ key, label, icon: Icon, placeholder, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2 border border-input rounded-xl px-3 py-2.5 bg-background">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={basic[key]}
                        onChange={e => setBasic(b => ({ ...b, [key]: e.target.value }))}
                        className="flex-1 text-sm bg-transparent outline-none"
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Short Bio (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Tell families a bit about yourself and why you became a caregiver…"
                    value={basic.bio}
                    onChange={e => setBasic(b => ({ ...b, bio: e.target.value }))}
                    className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background resize-none"
                  />
                </div>
              </>
            )}

            {/* ── STEP 1: Pre-screen ──────────────────────── */}
            {step === 1 && (
              <>
                <h2 className="font-bold text-xl">Pre-Screen Questions</h2>
                <p className="text-sm text-muted-foreground">Help us understand your experience and background</p>

                {PRESCREEN.map(q => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map(opt => {
                        const selected = q.multi
                          ? (answers[q.id] || []).includes(opt)
                          : answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              if (q.multi) {
                                const prev = answers[q.id] || [];
                                setAnswers(a => ({ ...a, [q.id]: selected ? prev.filter(x => x !== opt) : [...prev, opt] }));
                              } else {
                                setAnswers(a => ({ ...a, [q.id]: opt }));
                              }
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground'}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── STEP 2: ID Verification ─────────────────── */}
            {step === 2 && (
              <>
                <h2 className="font-bold text-xl">ID Verification</h2>
                <p className="text-sm text-muted-foreground">Upload a government-issued photo ID. We accept driver's license, passport, or national ID.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-semibold">🔒 Your ID is encrypted and only used for verification — never shared.</p>
                </div>

                {[
                  { key: 'front', label: 'Front of ID', state: idFront, setter: setIdFront },
                  { key: 'back', label: 'Back of ID', state: idBack, setter: setIdBack },
                ].map(({ key, label, state, setter }) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
                    {state ? (
                      <div className="relative">
                        <img src={state} alt={label} className="w-full h-40 object-cover rounded-xl border border-border" />
                        <button onClick={() => setter(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">×</button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${idUploading === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                        {idUploading === key
                          ? <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                          : <Camera className="w-6 h-6 text-muted-foreground mb-2" />}
                        <p className="text-sm text-muted-foreground">{idUploading === key ? 'Uploading…' : 'Tap to upload photo'}</p>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files[0] && uploadFile(e.target.files[0], setter, setIdUploading, key)} />
                      </label>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── STEP 3: Background Check ────────────────── */}
            {step === 3 && (
              <>
                <h2 className="font-bold text-xl">Background Check</h2>
                <p className="text-sm text-muted-foreground">Elderlyx requires a background check for all caregivers to protect our clients.</p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
                  <p className="text-sm font-bold text-amber-800">What we check:</p>
                  {['Criminal history (national & state)', 'Sex offender registry', 'Identity verification', 'Address history'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-amber-700">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> {item}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Last 4 digits of SSN</label>
                  <input type="password" maxLength={4} placeholder="••••" value={ssn} onChange={e => setSsn(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background tracking-widest" />
                  <p className="text-[10px] text-muted-foreground mt-1">Used only for identity verification — fully encrypted</p>
                </div>

                <label className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={bgConsent} onChange={e => setBgConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">I consent to a background check and confirm the information provided is accurate and true.</p>
                </label>
              </>
            )}

            {/* ── STEP 4: Video Introduction ──────────────── */}
            {step === 4 && (
              <>
                <h2 className="font-bold text-xl">Video Introduction</h2>
                <p className="text-sm text-muted-foreground">Record a short 1–2 minute video introducing yourself to potential clients. Be warm, genuine, and professional.</p>

                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-pink-800">What to cover:</p>
                  {['Your name and where you\'re from', 'Your caregiving experience', 'Why you love caring for seniors', 'Your personality and approach'].map(tip => (
                    <p key={tip} className="text-sm text-pink-700 flex items-center gap-2"><ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />{tip}</p>
                  ))}
                </div>

                {videoUrl ? (
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video src={videoUrl} controls className="w-full rounded-xl max-h-52" />
                    <button onClick={() => setVideoUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">×</button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${videoUploading ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                    {videoUploading
                      ? <><Loader2 className="w-8 h-8 text-primary animate-spin mb-2" /><p className="text-sm text-muted-foreground">Uploading video…</p></>
                      : <><Video className="w-8 h-8 text-muted-foreground mb-2" /><p className="text-sm font-medium text-foreground">Upload your video</p><p className="text-xs text-muted-foreground mt-1">MP4, MOV — max 200MB</p></>}
                    <input type="file" accept="video/*" className="hidden"
                      onChange={e => e.target.files[0] && uploadFile(e.target.files[0], setVideoUrl, setVideoUploading)} />
                  </label>
                )}
              </>
            )}

            {/* ── STEP 5: Training + Quiz ─────────────────── */}
            {step === 5 && (
              <>
                <h2 className="font-bold text-xl">Training & Quiz</h2>
                {!quizSubmitted ? (
                  <>
                    <p className="text-sm text-muted-foreground">Question {quizStep + 1} of {QUIZ.length}</p>
                    <div className="flex gap-1 mb-2">
                      {QUIZ.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= quizStep ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="font-semibold text-foreground">{QUIZ[quizStep].q}</p>
                    </div>

                    <div className="space-y-2">
                      {QUIZ[quizStep].options.map((opt, idx) => {
                        const selected = quizAnswers[quizStep] === idx;
                        return (
                          <button key={idx} onClick={() => setQuizAnswers(a => ({ ...a, [quizStep]: idx }))}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground'}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      {quizStep > 0 && (
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setQuizStep(s => s - 1)}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                      )}
                      {quizStep < QUIZ.length - 1 ? (
                        <Button className="flex-1 rounded-xl" disabled={quizAnswers[quizStep] === undefined} onClick={() => setQuizStep(s => s + 1)}>
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button className="flex-1 rounded-xl" disabled={quizAnswers[quizStep] === undefined} onClick={() => setQuizSubmitted(true)}>
                          Submit Quiz
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className={`rounded-2xl p-6 text-center ${quizScore() >= 60 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-5xl font-black mb-2 ${quizScore() >= 60 ? 'text-green-600' : 'text-red-600'}`}>{quizScore()}%</p>
                      <p className={`font-bold ${quizScore() >= 60 ? 'text-green-700' : 'text-red-700'}`}>
                        {quizScore() >= 60 ? '✅ Passed! Well done.' : '❌ Score too low — please retake'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{Object.values(quizAnswers).filter((a, i) => a === QUIZ[i].correct).length} / {QUIZ.length} correct</p>
                    </div>
                    {quizScore() < 60 && (
                      <Button variant="outline" className="w-full rounded-xl" onClick={() => { setQuizAnswers({}); setQuizStep(0); setQuizSubmitted(false); }}>
                        Retake Quiz
                      </Button>
                    )}
                    {quizScore() >= 60 && (
                      <div className="space-y-2">
                        {QUIZ.map((q, i) => (
                          <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${quizAnswers[i] === q.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {quizAnswers[i] === q.correct ? '✅' : '❌'} {q.q.slice(0, 50)}…
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* ── STEP 6: Availability ────────────────────── */}
            {step === 6 && (
              <>
                <h2 className="font-bold text-xl">Set Your Availability</h2>
                <p className="text-sm text-muted-foreground">Select all days and times you're generally available. You can always update this later.</p>

                <div className="space-y-3">
                  {DAYS.map(day => (
                    <div key={day}>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{day}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TIME_SLOTS.map(slot => {
                          const key = `${day}__${slot}`;
                          const active = availability[key];
                          return (
                            <button key={slot} onClick={() => toggleAvailability(day, slot)}
                              className={`text-xs px-2.5 py-2 rounded-xl border font-medium transition-all text-left ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground'}`}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 flex gap-3">
        {step > 0 && (
          <Button variant="outline" className="rounded-xl px-5" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        {step < totalSteps - 1 ? (
          <Button className="flex-1 h-12 rounded-2xl font-semibold" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button className="flex-1 h-12 rounded-2xl font-semibold bg-emerald-600 hover:bg-emerald-700" disabled={!canProceed() || saving} onClick={handleComplete}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}