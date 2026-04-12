# Project Structure & Architecture

This is a professional, modular, production-ready codebase for a senior care platform. The structure prioritizes maintainability, scalability, and developer experience.

## 📁 Directory Overview

```
src/
├── lib/
│   ├── config/              # Centralized configuration
│   │   └── constants.js     # Pricing, plans, rules, thresholds
│   ├── services/            # Business logic modules
│   │   ├── bookingService.js       # Booking CRUD & operations
│   │   ├── carePackService.js      # Care pack management
│   │   ├── paymentService.js       # Stripe integration
│   │   ├── caregiverService.js     # Caregiver profiles & ratings
│   │   └── notificationService.js  # Alerts & messaging
│   ├── models/              # Data model definitions
│   │   └── index.js         # Entity schemas
│   ├── hooks/               # Custom React hooks
│   │   └── useBookings.js   # Data fetching hooks
│   ├── utils/               # Helper utilities
│   │   ├── formatters.js    # Date, currency, time formatting
│   │   ├── errorHandling.js # Error classes & recovery
│   │   └── validators.js    # Input validation
│   └── AuthContext.jsx      # Authentication state
├── components/
│   ├── ui/                  # Shadcn/ui components (installed)
│   ├── caregiver/           # Caregiver-specific components
│   ├── family/              # Family-specific components
│   ├── shared/              # Reusable components
│   └── ...
├── pages/                   # Full-page components
│   ├── Home.jsx
│   ├── Book.jsx
│   ├── MyBookings.jsx
│   └── ...
├── functions/               # Deno backend functions
│   ├── createPaymentIntent.js
│   ├── processRefund.js
│   └── ...
├── entities/                # Data entity schemas
│   ├── Booking.json
│   ├── CarePack.json
│   └── ...
└── App.jsx                  # Main router

```

## 🏛️ Core Modules

### Config (`lib/config/`)
- **constants.js**: Centralized pricing, subscription plans, bonuses, care packs, alert thresholds, booking statuses, roles, service types, and payout frequencies

**Usage**:
```javascript
import { PRICING, SUBSCRIPTION_PLANS, CARE_PACKS } from '@/lib/config/constants';
```

### Services (`lib/services/`)
Business logic encapsulated in service modules. Each service handles a specific domain.

**Example - bookingService.js**:
```javascript
import { bookingService } from '@/lib/services/bookingService';

// Get bookings
const bookings = await bookingService.getBookings({ caregiverId, status: 'confirmed' });

// Create booking
const booking = await bookingService.createBooking(data);

// Update status
await bookingService.updateBookingStatus(bookingId, 'completed');
```

**Available Services**:
- `bookingService` - Create, update, cancel, complete bookings
- `carePackService` - Manage prepaid visits and redemptions
- `paymentService` - Stripe integration, refunds, payment status
- `caregiverService` - Profiles, availability, ratings, bonuses
- `notificationService` - Send alerts, mark read, history

### Models (`lib/models/`)
Data model definitions document the structure of all major entities.

**Usage**:
```javascript
import { BookingModel, CarePackModel } from '@/lib/models';

// Models serve as reference documentation for data shape
const booking = {
  // Fields defined in BookingModel
  serviceType: 'companionship',
  status: 'confirmed',
  // ...
};
```

### Hooks (`lib/hooks/`)
Custom React Query hooks for data fetching and state management.

**Usage**:
```javascript
import { useBookings, useCarePacks, useNotifications } from '@/lib/hooks/useBookings';

const { data: bookings } = useBookings({ status: 'confirmed', limit: 20 });
const { data: packs } = useCarePacks(userEmail);
const { data: unread } = useNotifications(userEmail);
```

### Utils (`lib/utils/`)
Utility functions for common tasks.

**formatters.js**:
```javascript
import { formatCurrency, formatDateTime, formatRating } from '@/lib/utils/formatters';

formatCurrency(150)           // "$150.00"
formatDateTime(new Date())    // "Mar 31, 2:30 PM"
formatRating(4.5)             // { value: 4.5, stars: 5 }
```

**validators.js**:
```javascript
import { validateBookingData, validatePaymentAmount, isValidEmail } from '@/lib/utils/validators';

const errors = validateBookingData(data);
if (errors.length > 0) { /* handle */ }

const result = validatePaymentAmount(amount);
if (!result.valid) console.error(result.error);
```

**errorHandling.js**:
```javascript
import { ValidationError, getErrorMessage, retryAsync } from '@/lib/utils/errorHandling';

try {
  // ...
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}

// Retry with exponential backoff
const data = await retryAsync(() => bookingService.getBookings(), 3, 1000);
```

## 🔄 Data Flow Pattern

### Typical page pattern:

```javascript
import { useBookings } from '@/lib/hooks/useBookings';
import { bookingService } from '@/lib/services/bookingService';
import { formatCurrency } from '@/lib/utils/formatters';
import { getErrorMessage } from '@/lib/utils/errorHandling';

export default function MyBookings() {
  const { data: bookings, isLoading, error } = useBookings({ 
    status: 'confirmed' 
  });
  
  const handleComplete = async (bookingId) => {
    try {
      await bookingService.completeBooking(bookingId, visitData);
      // Refetch or update cache
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Render UI using data
  return (
    <div>
      {bookings?.map(b => (
        <div key={b.id}>
          <p>{b.senior_name}</p>
          <p>{formatCurrency(b.price)}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🛠️ Adding New Features

### 1. Add a new config constant
Edit `lib/config/constants.js`, then import where needed.

### 2. Create a new service
Create `lib/services/myService.js`:
```javascript
export const myService = {
  async getItems(filters) { /* ... */ },
  async createItem(data) { /* ... */ },
  // ...
};
```

### 3. Create a custom hook
Create `lib/hooks/useMyItems.js`:
```javascript
export function useMyItems(filters) {
  return useQuery({
    queryKey: ['my-items', filters],
    queryFn: () => myService.getItems(filters),
  });
}
```

### 4. Add utilities
Add helpers to appropriate utils file or create new one in `lib/utils/`.

## ⚙️ Integrations

- **Base44 SDK**: Pre-initialized at `@/api/base44Client`
- **Stripe**: Via `paymentService` and backend functions
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling
- **shadcn/ui**: Pre-built components

## 📋 Best Practices

1. **Use services for all data operations** - Never call `base44` directly in components
2. **Use hooks for data fetching** - Leverage React Query's caching
3. **Validate input** - Use validators before API calls
4. **Handle errors gracefully** - Use `getErrorMessage()` for user-friendly messages
5. **Centralize constants** - No magic numbers in code
6. **Format data consistently** - Use formatters for display values
7. **Keep components small** - Prefer composition over large monolithic files

## 🚀 Next Steps for Developers

1. Review `lib/config/constants.js` to understand pricing and rules
2. Check relevant services (e.g., `bookingService`) for available operations
3. Use hooks (`useBookings`, etc.) in pages for data
4. Import utilities as needed for formatting, validation, error handling
5. Follow the same patterns when adding features

---

**Generated**: Production refactor for modular, maintainable architecture