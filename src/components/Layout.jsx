// Updated navigation paths

const familyNav = [
  { path: '/', label: 'Home' },
  { path: '/caregivers', label: 'Find Care' },
  { path: '/my-bookings', label: 'Bookings' },
  { path: '/chat-list', label: 'Messages' },
  { path: '/profile', label: 'Profile' },
];

const caregiverNav = [
  { path: '/', label: 'Home' },
  { path: '/my-bookings', label: 'Jobs' },
  { path: '/chat-list', label: 'Messages' },
  { path: '/profile', label: 'Profile' },
];

const adminNav = [
  { path: '/', label: 'Home' },
  { path: '/admin/bookings', label: 'Bookings' },
  { path: '/admin/users', label: 'Users' },
  { path: '/profile', label: 'Profile' },
];

// Update navItems_flat array
const navItems_flat = [
  { path: '/', label: 'Home' },
  { path: '/caregivers', label: 'Find Care' },
  { path: '/my-bookings', label: 'Bookings' },
  { path: '/chat-list', label: 'Messages' },
  { path: '/profile', label: 'Profile' },
  // ... other items
];

// Update notifications check
const hasNotifications = checkNotifications('/notifications');
