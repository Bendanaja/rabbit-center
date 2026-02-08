'use client';

import { useAdmin } from '@/hooks/useAdmin';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { checkPermission, loading } = useAdmin();

  if (loading) {
    return null;
  }

  if (!checkPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGateProps {
  roles: ('owner' | 'admin' | 'moderator')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({
  roles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { role, loading } = useAdmin();

  if (loading) {
    return null;
  }

  if (!role || !roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Owner only component
export function OwnerOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isOwner, loading } = useAdmin();

  if (loading) {
    return null;
  }

  if (!isOwner) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
