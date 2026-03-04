export const APP_NAME = 'Shift4 Hospitality';

export const ROLES = {
  admin: 'Admin',
  analyst: 'Analyst',
  viewer: 'Viewer',
} as const;

export const DEAL_STATUSES = {
  draft: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  sent: 'Sent',
  archived: 'Archived',
} as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'New Deal', href: '/deals/new', icon: 'PlusCircle' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

// Admin-only items visible based on role
export const ADMIN_NAV = [
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
