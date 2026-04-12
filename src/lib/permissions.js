// Role-based permission matrix
const PERMISSIONS = {
  primary_owner: {
    booking: true,
    messaging: true,
    view_data: true,
    view_playback: true,
    view_alerts: true,
    manage_members: true,
    access_billing: true,
    emergency_actions: true,
  },
  manager: {
    booking: true,
    messaging: true,
    view_data: true,
    view_playback: true,
    view_alerts: true,
    manage_members: false,
    access_billing: false,
    emergency_actions: true,
  },
  viewer: {
    booking: false,
    messaging: false,
    view_data: true,
    view_playback: true,
    view_alerts: true,
    manage_members: false,
    access_billing: false,
    emergency_actions: false,
  },
  emergency_contact: {
    booking: false,
    messaging: false,
    view_data: false,
    view_playback: false,
    view_alerts: true,
    manage_members: false,
    access_billing: false,
    emergency_actions: true,
  },
};

export function checkPermission(role, permission) {
  if (!PERMISSIONS[role]) return false;
  return PERMISSIONS[role][permission] === true;
}

export function hasPermission(user, permission) {
  if (!user || !user.family_role) return false;
  return checkPermission(user.family_role, permission);
}

export function canChangeRole(currentUserRole, targetRole) {
  // Only primary owner can change roles
  return currentUserRole === 'primary_owner';
}

export function canRemoveMember(currentUserRole, targetRole) {
  // Primary owner can remove anyone except themselves
  // Manager can remove viewer/emergency_contact but not owner/manager
  if (currentUserRole === 'primary_owner') {
    return true;
  }
  if (currentUserRole === 'manager') {
    return ['viewer', 'emergency_contact'].includes(targetRole);
  }
  return false;
}

export const ROLE_CONFIG = {
  primary_owner: {
    label: 'Primary Owner',
    description: 'Full control over account, billing, and members',
    icon: 'Crown',
    color: 'text-purple-600 bg-purple-100',
    badge: 'purple',
    canEdit: false,
  },
  manager: {
    label: 'Manager',
    description: 'Can book services and manage care communication',
    icon: 'Shield',
    color: 'text-green-600 bg-green-100',
    badge: 'green',
    canEdit: true,
  },
  viewer: {
    label: 'Viewer',
    description: 'View-only access to care updates and alerts',
    icon: 'Eye',
    color: 'text-blue-600 bg-blue-100',
    badge: 'blue',
    canEdit: true,
  },
  emergency_contact: {
    label: 'Emergency Contact',
    description: 'Receives alerts and can handle emergencies',
    icon: 'AlertTriangle',
    color: 'text-red-600 bg-red-100',
    badge: 'red',
    canEdit: true,
  },
};