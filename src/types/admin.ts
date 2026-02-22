// Admin Types for RabbitHub Dashboard

export type AdminRole = 'owner' | 'admin' | 'moderator';
export type FlagStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: string[];
  assigned_by: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export interface SystemConfig {
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface FlaggedChat {
  id: string;
  chat_id: string;
  message_id: string | null;
  flagged_by: string | null;
  reason: string;
  details: string | null;
  status: FlagStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  // Joined data
  chat?: {
    title: string | null;
    user_id: string;
  };
  message?: {
    content: string;
    role: string;
  };
}

export interface UserBan {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  expires_at: string | null;
  is_permanent: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined data
  admin_user?: {
    role: AdminRole;
    user_profile?: {
      full_name: string | null;
    };
  };
}

export interface AnalyticsDaily {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_chats: number;
  total_messages: number;
  total_tokens_used: number;
  revenue_amount: number;
  revenue_currency: string;
  avg_messages_per_user: number;
  model_usage: Record<string, number>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalMessages: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  activeSubscriptions: number;
  pendingFlags: number;
  modelUsage: { model: string; count: number }[];
}

// User with full profile for admin
export interface AdminUserView {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  subscription_tier: 'free' | 'starter' | 'pro' | 'premium' | null;
  subscription_status: 'active' | 'cancelled' | 'expired' | null;
  total_messages: number;
  total_chats: number;
  is_banned: boolean;
  ban_reason: string | null;
}

// AI Model for admin
export interface AdminAIModel {
  id: string;
  model_id: string;
  name: string;
  provider: string;
  description: string | null;
  icon: string | null;
  tier: 'free' | 'starter' | 'pro' | 'premium';
  is_active: boolean;
  daily_limit: number | null;
  hourly_limit: number | null;
  cooldown_seconds: number;
  priority: number;
  context_length: number | null;
  created_at: string;
}

// Subscription for admin
export interface AdminSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  // Joined
  user_profile?: {
    full_name: string | null;
    email: string;
  };
  plan?: {
    name: string;
    price: number;
  };
}

// Permission definitions
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  EXPORT_DATA: 'export_data',

  // Users
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  BAN_USERS: 'ban_users',
  DELETE_USERS: 'delete_users',

  // AI Models
  VIEW_MODELS: 'view_models',
  TOGGLE_MODELS: 'toggle_models',
  SET_MODEL_LIMITS: 'set_model_limits',
  MANAGE_MODELS: 'manage_models',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SITE_CONFIG: 'edit_site_config',
  MANAGE_API_KEYS: 'manage_api_keys',
  MANAGE_PAYMENTS: 'manage_payments',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',

  // Moderation
  VIEW_FLAGS: 'view_flags',
  REVIEW_FLAGS: 'review_flags',
  DELETE_CONTENT: 'delete_content',

  // Subscriptions
  VIEW_SUBSCRIPTIONS: 'view_subscriptions',
  CANCEL_SUBSCRIPTIONS: 'cancel_subscriptions',
  ISSUE_REFUNDS: 'issue_refunds',

  // Admin Management
  VIEW_ADMINS: 'view_admins',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',

  // Notifications
  MANAGE_NOTIFICATIONS: 'manage_notifications',
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.BAN_USERS,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.TOGGLE_MODELS,
    PERMISSIONS.SET_MODEL_LIMITS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_FLAGS,
    PERMISSIONS.REVIEW_FLAGS,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.CANCEL_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_ADMINS,
    PERMISSIONS.VIEW_ACTIVITY_LOGS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  moderator: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_FLAGS,
    PERMISSIONS.REVIEW_FLAGS,
  ],
};

// Check if role has permission
export function hasPermission(role: AdminRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Admin navigation items
export interface AdminNavItem {
  name: string;
  href: string;
  icon: string;
  permission?: string;
  badge?: number;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { name: 'แดชบอร์ด', href: '/admin', icon: 'LayoutDashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
  { name: 'ผู้ใช้งาน', href: '/admin/users', icon: 'Users', permission: PERMISSIONS.VIEW_USERS },
  { name: 'ส่องแชท', href: '/admin/chats', icon: 'MessageSquare', permission: PERMISSIONS.VIEW_USERS },
  { name: 'AI Models', href: '/admin/models', icon: 'Bot', permission: PERMISSIONS.VIEW_MODELS },
  { name: 'จัดการเนื้อหา', href: '/admin/content', icon: 'FileEdit', permission: PERMISSIONS.EDIT_SITE_CONFIG },
  { name: 'วิเคราะห์', href: '/admin/analytics', icon: 'BarChart3', permission: PERMISSIONS.VIEW_DASHBOARD },
  { name: 'ตรวจสอบ', href: '/admin/moderation', icon: 'Shield', permission: PERMISSIONS.VIEW_FLAGS },
  { name: 'สมาชิก', href: '/admin/subscriptions', icon: 'CreditCard', permission: PERMISSIONS.VIEW_SUBSCRIPTIONS },
  { name: 'จัดการ Admin', href: '/admin/admins', icon: 'UserCog', permission: PERMISSIONS.MANAGE_ADMINS },
  { name: 'Rate Limits', href: '/admin/rate-limits', icon: 'Gauge', permission: PERMISSIONS.SET_MODEL_LIMITS },
  { name: 'ประวัติ', href: '/admin/activity', icon: 'History', permission: PERMISSIONS.VIEW_ACTIVITY_LOGS },
  { name: 'การแจ้งเตือน', href: '/admin/notifications', icon: 'Bell', permission: PERMISSIONS.MANAGE_NOTIFICATIONS },
  { name: 'System Health', href: '/admin/system', icon: 'Activity', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS },
];
