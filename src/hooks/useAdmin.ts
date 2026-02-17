'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from './useRealtime';
import type { AdminUser, AdminRole } from '@/types/admin';
import { hasPermission } from '@/types/admin';
import { authFetch } from '@/lib/api-client';

interface UseAdminReturn {
  isAdmin: boolean;
  isOwner: boolean;
  adminData: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  error: string | null;
  checkPermission: (permission: string) => boolean;
  refetch: () => Promise<void>;
}

export function useAdmin(): UseAdminReturn {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkedUserIdRef = useRef<string | null>(null);

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsOwner(false);
      setAdminData(null);
      setRole(null);
      setLoading(false);
      checkedUserIdRef.current = null;
      return;
    }

    // Skip re-check if same user was already verified (token refresh, tab focus, etc.)
    if (checkedUserIdRef.current === user.id && adminData !== null) {
      return;
    }

    try {
      // Only show loading spinner on first check
      if (checkedUserIdRef.current !== user.id) {
        setLoading(true);
      }
      setError(null);

      const supabase = createClient();

      // First: check admin_users (simple query, no join issues)
      const { data, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        // Not an admin - this is normal for regular users
        if (fetchError.code === 'PGRST116') {
          setIsAdmin(false);
          setIsOwner(false);
          setAdminData(null);
          setRole(null);
        } else {
          throw fetchError;
        }
      } else if (data) {
        // Fetch profile info separately (no FK relationship needed)
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const adminWithProfile = {
          ...data,
          user_profile: profileData ? {
            full_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            email: user.email || '',
          } : { full_name: null, avatar_url: null, email: user.email || '' },
        } as AdminUser;

        setIsAdmin(true);
        setIsOwner(data.role === 'owner');
        setAdminData(adminWithProfile);
        setRole(data.role as AdminRole);
        checkedUserIdRef.current = user.id;

        // Log admin login (fire-and-forget)
        supabase.rpc('log_admin_activity', {
          p_admin_user_id: user.id,
          p_action: 'login',
          p_resource_type: null,
          p_resource_id: null,
          p_details: { timestamp: new Date().toISOString() }
        }).then(() => {});
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
      setIsOwner(false);
      setAdminData(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role]);

  return {
    isAdmin,
    isOwner,
    adminData,
    role,
    loading,
    error,
    checkPermission,
    refetch: checkAdmin,
  };
}

// Hook for fetching admin dashboard stats
export function useAdminStats() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsersToday: number;
    totalMessages: number;
    totalRevenue: number;
    newUsersThisWeek: number;
    activeSubscriptions: number;
    pendingFlags: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/admin/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time: auto-refetch when relevant tables change
  const statsSubs = useMemo(() => [
    { table: 'daily_usage' },
    { table: 'customer_profiles' },
    { table: 'chats' },
    { table: 'subscriptions' },
  ], []);
  useRealtime(statsSubs, fetchStats, !loading);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook for admin activity logging
export function useAdminActivity() {
  const { user } = useAuth();

  const logActivity = useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      const supabase = createClient();
      await supabase.rpc('log_admin_activity', {
        p_admin_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType || null,
        p_resource_id: resourceId || null,
        p_details: details || {}
      });
    } catch (err) {
      console.error('Failed to log admin activity:', err);
    }
  }, [user]);

  return { logActivity };
}
