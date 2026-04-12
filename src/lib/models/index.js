/**
 * Data Models & Schemas
 * Defines the structure of major entities in the system
 */

export const BookingModel = {
  id: 'string',
  serviceType: 'companionship | transportation',
  status: 'pending | confirmed | in_progress | completed | cancelled',
  scheduledDate: 'ISO date-time',
  duration: 'number (hours)',
  price: 'number',
  familyId: 'string',
  familyEmail: 'string',
  familyName: 'string',
  caregiverId: 'string',
  caregiverName: 'string',
  seniorName: 'string',
  seniorAge: 'number',
  address: 'string',
  notes: 'string',
  paymentStatus: 'pending | paid | refunded',
  stripePaymentIntentId: 'string',
  createdDate: 'ISO date-time',
  updatedDate: 'ISO date-time',
  createdBy: 'email',
};

export const CarePackModel = {
  id: 'string',
  ownerEmail: 'string',
  ownerName: 'string',
  packType: 'standard | enhanced | pro',
  totalVisits: 'number',
  usedVisits: 'number',
  remainingVisits: 'number',
  amountPaid: 'number',
  stripePaymentIntentId: 'string',
  status: 'active | exhausted | refunded',
  purchasedAt: 'ISO date-time',
  expiresAt: 'ISO date-time',
  createdDate: 'ISO date-time',
};

export const CaregiverModel = {
  id: 'string',
  email: 'string',
  fullName: 'string',
  phone: 'string',
  rating: 'number (0-5)',
  totalBookings: 'number',
  totalEarnings: 'number',
  backgroundCheckClear: 'boolean',
  available: 'boolean',
  verificationStatus: 'pending | approved | rejected',
  role: 'caregiver',
  createdDate: 'ISO date-time',
};

export const FamilyGroupModel = {
  id: 'string',
  groupName: 'string',
  primaryOwnerEmail: 'string',
  seniorId: 'string',
  seniorName: 'string',
  subscriptionPlan: 'basic | family | premium',
  memberCount: 'number',
  status: 'active | locked | suspended',
  totalBookings: 'number',
  totalSpent: 'number',
  healthScore: 'number (0-100)',
  createdDate: 'ISO date-time',
};

export const IndependenceAssessmentModel = {
  id: 'string',
  seniorId: 'string',
  caregiverId: 'string',
  overallScore: 'number (0-100)',
  mobilityScore: 'number (0-100)',
  safetyScore: 'number (0-100)',
  cognitiveScore: 'number (0-100)',
  dailyLivingScore: 'number (0-100)',
  flaggedConcerns: 'array of strings',
  notes: 'string',
  createdDate: 'ISO date-time',
};

export const NotificationModel = {
  id: 'string',
  userEmail: 'string',
  type: 'alert | booking | payment | system',
  title: 'string',
  body: 'string',
  isRead: 'boolean',
  actionUrl: 'string (optional)',
  createdDate: 'ISO date-time',
};