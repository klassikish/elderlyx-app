// Pricing configurations
export const PRICING = {
  companionship: {
    baseRate: 35, // per hour
    peakRate: 40, // evenings/weekends
    rushMultiplier: 1.5,
  },
  transportation: {
    baseRate: 25,
    perMile: 1.5,
    waitChargePerMinute: 0.5,
    freeWaitMinutes: 30,
  },
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    monthlyRate: 29,
    maxFamilyMembers: 2,
    features: ['One senior', 'Basic support', 'Limited activity logs'],
  },
  family: {
    name: 'Family',
    monthlyRate: 79,
    maxFamilyMembers: 5,
    features: ['Multiple seniors', 'Priority support', 'Full activity logs', 'Team scheduling'],
  },
  premium: {
    name: 'Premium',
    monthlyRate: 149,
    maxFamilyMembers: 10,
    features: ['Unlimited seniors', '24/7 support', 'Advanced analytics', 'Custom integrations'],
  },
};

// Caregiver earning thresholds
export const CAREGIVER_BONUSES = {
  tenVisits: { visits: 10, bonusAmount: 50 },
  twentyVisits: { visits: 20, bonusAmount: 100 },
  thirtyVisits: { visits: 30, bonusAmount: 150 },
};

// Care pack tiers
export const CARE_PACKS = {
  standard: {
    visits: 5,
    price: 175, // $35/hr × 5
    validDays: 30,
    name: 'Standard Pack',
  },
  enhanced: {
    visits: 10,
    price: 330, // $33/hr × 10
    validDays: 60,
    name: 'Enhanced Pack',
  },
  pro: {
    visits: 20,
    price: 620, // $31/hr × 20
    validDays: 90,
    name: 'Pro Pack',
  },
};

// Alert thresholds
export const ALERT_THRESHOLDS = {
  lowIndependenceScore: 40,
  missedMedication: true,
  noDailyActivity: 24 * 60 * 60 * 1000, // 24 hours
  emergencyResponseTime: 5 * 60 * 1000, // 5 minutes
  caregiverNoShow: 15 * 60 * 1000, // 15 minutes
};

// Booking statuses
export const BOOKING_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  inProgress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

// Caregiver roles
export const USER_ROLES = {
  family: 'family',
  caregiver: 'caregiver',
  admin: 'admin',
};

// Service types
export const SERVICE_TYPE = {
  companionship: 'companionship',
  transportation: 'transportation',
};

// Payout frequency
export const PAYOUT_FREQUENCY = {
  weekly: 'weekly',
  biweekly: 'biweekly',
  monthly: 'monthly',
};