export const APP_NAME = 'Banyan Payment Gateway';

export const ROLES = {
  super_admin: 'Super Admin',
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
  { label: 'Reports', href: '/reports', icon: 'BarChart3' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
  { label: 'Partners', href: '/partners', icon: 'Building2' },
] as const;

// Admin-only items visible based on role
export const ADMIN_NAV = [
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
