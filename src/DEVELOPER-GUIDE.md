# Developer Guide - Elderlyx Senior Care Platform

## Quick Start for Developers

This guide helps you understand the codebase architecture and how to develop new features efficiently.

### 1. Understanding the Architecture

The app is organized into **layers**:

```
Pages (full-page components)
  ↓
Components (UI pieces, reusable)
  ↓
Hooks (data fetching, state management)
  ↓
Services (business logic)
  ↓
Utils (formatters, validators, error handling)
  ↓
Config (constants, rules, thresholds)
```

**Never** skip layers—always flow through them:
- ❌ DON'T call `base44` directly in components
- ✅ DO use services → hooks → components

---

## 2. Core Concepts

### Config Layer (`lib/config/constants.js`)

Centralized constants for pricing, plans, bonuses, care packs, rules, thresholds.

**Example usage:**
```javascript
import { PRICING, CARE_PACKS, ALERT_THRESHOLDS } from '@/lib/config/constants';

const hourlyRate = PRICING.companionship.baseRate; // 35
const totalVisits = CARE_PACKS.standard.visits; // 5
const lowScoreThreshold = ALERT_THRESHOLDS.lowIndependenceScore; // 40
```

**When to edit:**
- Changing pricing → edit PRICING object
- New subscription plan → add to SUBSCRIPTION_PLANS
- New bonus tier → add to CAREGIVER_BONUSES
- New rule or threshold → add to appropriate object

---

### Service Layer (`lib/services/`)

Encapsulates all business logic. Services handle:
- Database operations (via Base44 SDK)
- Data transformation
- Validation
- Error handling

**Example - Using bookingService:**
```javascript
import { bookingService } from '@/lib/services/bookingService';

// List bookings
const bookings = await bookingService.getBookings({ 
  status: 'confirmed', 
  limit: 20 
});

// Create booking
const booking = await bookingService.createBooking({
  serviceType: 'companionship',
  scheduledDate: '2024-04-01T10:00:00Z',
  price: 35,
  // ... other fields
});

// Complete a visit
await bookingService.completeBooking(bookingId, {
  eating: 'full',
  mobility: 'same',
  mood: 'positive',
});
```

**Available Services:**
- `bookingService` - All booking operations
- `carePackService` - Care pack management
- `paymentService` - Stripe integration
- `caregiverService` - Caregiver management
- `notificationService` - Alerts & messages

---

### Hooks Layer (`lib/hooks/`)

Custom React Query hooks for data fetching. They:
- Handle caching automatically
- Manage loading/error states
- Refetch on demand
- Subscribe to real-time updates

**Example usage:**
```javascript
import { useBookings, useCarePacks } from '@/lib/hooks/useBookings';

export default function MyPage() {
  // Fetch bookings with filter
  const { data: bookings, isLoading, error } = useBookings({
    status: 'confirmed',
    limit: 20
  });

  // Fetch care packs for user
  const { data: packs } = useCarePacks(user.email);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <BookingList bookings={bookings} />;
}
```

**When to create a hook:**
- Reusable data fetching logic
- Complex query filters
- Real-time subscriptions

---

### Utils Layer

#### Formatters (`lib/utils/formatters.js`)
```javascript
import {
  formatCurrency,      // $35.00
  formatDateTime,      // Mar 31, 2:30 PM
  formatElapsedTime,   // 01:45:30
  formatRating,        // { value: 4.5, stars: 5 }
} from '@/lib/utils/formatters';
```

#### Validators (`lib/utils/validators.js`)
```javascript
import {
  isValidEmail,
  isValidPhone,
  validateBookingData,      // Returns array of errors
  validatePaymentAmount,    // Returns { valid, error }
} from '@/lib/utils/validators';
```

#### Error Handling (`lib/utils/errorHandling.js`)
```javascript
import {
  ValidationError,
  NotFoundError,
  PaymentError,
  getErrorMessage,    // User-friendly error text
  retryAsync,         // Retry with exponential backoff
} from '@/lib/utils/errorHandling';

try {
  const data = await bookingService.getBookings();
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message); // "Unauthorized" instead of raw error
}
```

---

## 3. Common Development Tasks

### Add a Pricing Rule

**File:** `lib/config/constants.js`

```javascript
export const PRICING = {
  companionship: {
    baseRate: 35,
    // Add new rule:
    seniorDiscountThreshold: 85, // Age 85+, 10% discount
  },
};
```

Then use in services:
```javascript
const discountedRate = senior.age >= 85 
  ? PRICING.companionship.baseRate * 0.9 
  : PRICING.companionship.baseRate;
```

---

### Create a New Service

**File:** `lib/services/myNewService.js`

```javascript
import { base44 } from '@/api/base44Client';

export const myNewService = {
  async getItems(filters = {}) {
    try {
      return await base44.entities.MyEntity.filter(filters, '-created_date', 50);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      throw error;
    }
  },

  async createItem(data) {
    if (!data.requiredField) {
      throw new ValidationError('Missing required field');
    }
    return base44.entities.MyEntity.create(data);
  },

  async updateItem(id, data) {
    return base44.entities.MyEntity.update(id, data);
  },
};
```

**Then export from services:**
```javascript
// lib/services/index.js (create if not exists)
export { myNewService } from './myNewService';
```

---

### Add a Custom Hook

**File:** `lib/hooks/useMyData.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { myNewService } from '@/lib/services/myNewService';

export function useMyData(filters = {}) {
  return useQuery({
    queryKey: ['my-data', filters],
    queryFn: () => myNewService.getItems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Usage in page:**
```javascript
const { data, isLoading, error } = useMyData({ status: 'active' });
```

---

### Handle Errors Properly

```javascript
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/errorHandling';

async function handleAction() {
  try {
    const result = await bookingService.createBooking(data);
    toast.success('Booking created!');
  } catch (error) {
    // This gives user-friendly message
    const message = getErrorMessage(error);
    toast.error(message);
    
    // Log technical error for debugging
    console.error('Booking creation failed:', error);
  }
}
```

---

### Format Data for Display

```javascript
import { formatCurrency, formatDateTime, formatRating } from '@/lib/utils/formatters';

// In your component
<div>
  <p>Price: {formatCurrency(booking.price)}</p>
  <p>Scheduled: {formatDateTime(booking.scheduledDate)}</p>
  <p>Rating: {formatRating(caregiver.rating).value} ⭐</p>
</div>
```

---

### Validate User Input

```javascript
import { validateBookingData, validatePaymentAmount } from '@/lib/utils/validators';

function handleSubmit(formData) {
  // Validate booking
  const errors = validateBookingData(formData);
  if (errors.length > 0) {
    toast.error(errors[0]);
    return;
  }

  // Validate payment amount
  const priceCheck = validatePaymentAmount(formData.price);
  if (!priceCheck.valid) {
    toast.error(priceCheck.error);
    return;
  }

  // Proceed with submission
  createBooking(formData);
}
```

---

## 4. Data Models

All major entities have documented models in `lib/models/index.js`.

**Example:**
```javascript
export const BookingModel = {
  id: 'string',
  serviceType: 'companionship | transportation',
  status: 'pending | confirmed | in_progress | completed | cancelled',
  scheduledDate: 'ISO date-time',
  price: 'number',
  // ... all other fields
};
```

Use these as reference when:
- Creating new entities
- Understanding data structure
- Writing TypeScript types

---

## 5. Working with Payments

Stripe integration is encapsulated in `paymentService`:

```javascript
import { paymentService } from '@/lib/services/paymentService';

// Create payment intent
const intent = await paymentService.createCarePackIntent('standard', 175);
// Returns: { clientSecret, paymentIntentId }

// Process refund
await paymentService.processRefund(paymentIntentId, 'Customer requested');

// Update booking payment status
await paymentService.updatePaymentStatus(bookingId, 'paid', intentId);
```

---

## 6. Testing Guidelines

### Test a Service Method
```javascript
import { bookingService } from '@/lib/services/bookingService';

// Mock data
const testBooking = {
  serviceType: 'companionship',
  scheduledDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
  price: 35,
};

// Test
try {
  const result = await bookingService.createBooking(testBooking);
  console.log('✓ Booking created:', result.id);
} catch (error) {
  console.error('✗ Failed:', error.message);
}
```

### Test a Component with Hooks
```javascript
import { useBookings } from '@/lib/hooks/useBookings';
import { render, screen, waitFor } from '@testing-library/react';

// Your component uses the hook
function TestComponent() {
  const { data } = useBookings();
  return <div>{data?.length} bookings</div>;
}

// Test (wrap in QueryClientProvider in real tests)
render(<TestComponent />);
await waitFor(() => {
  expect(screen.getByText(/bookings/)).toBeInTheDocument();
});
```

---

## 7. Best Practices Checklist

- ✅ Always validate input before calling services
- ✅ Use error boundaries and try-catch blocks
- ✅ Format data for display using utils
- ✅ Keep components small and focused
- ✅ Use React Query hooks for data fetching
- ✅ Never modify config values directly in code
- ✅ Handle loading and error states in UI
- ✅ Use consistent naming (camelCase for variables, PascalCase for components)
- ✅ Document complex logic with comments
- ✅ Test edge cases (empty states, errors, edge values)

---

## 8. Common Pitfalls to Avoid

| ❌ DON'T | ✅ DO |
|---------|------|
| Call `base44` directly in components | Use services & hooks |
| Hardcode prices in components | Import from `PRICING` constant |
| Format currency with string concat | Use `formatCurrency()` util |
| Catch errors silently | Use `getErrorMessage()` & log |
| Create one massive page file | Split into small components |
| Mix business logic in UI | Keep logic in services |

---

## 9. File Structure Summary

```
lib/
├── config/
│   └── constants.js          ← Pricing, rules, thresholds
├── services/                 ← Business logic
│   ├── bookingService.js
│   ├── carePackService.js
│   ├── paymentService.js
│   └── ...
├── hooks/                    ← Data fetching
│   └── useBookings.js
├── utils/                    ← Helpers
│   ├── formatters.js
│   ├── validators.js
│   └── errorHandling.js
├── models/
│   └── index.js             ← Data model documentation
└── AuthContext.jsx          ← Auth state
```

---

## 10. Questions?

Refer to:
1. **README-PROJECT-STRUCTURE.md** - High-level overview
2. **lib/services/[service].js** - See JSDoc comments
3. **lib/utils/[util].js** - Function documentation
4. **pages/Book.jsx** - Example of properly refactored page

---

**Last Updated:** March 2024
**Status:** Production-Ready