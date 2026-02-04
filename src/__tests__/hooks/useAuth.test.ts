/**
 * useAuth Hook Tests
 *
 * Tests for authentication state management including:
 * - Successful login state updates
 * - Logout state clearing
 * - Timeout behavior with successful auth
 * - AbortError handling and loading state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock the supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Import after mocking
import { createClient } from '@/lib/supabase/client';

// Test fixtures
const mockUser: Partial<User> = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  created_at: '2024-01-01T00:00:00.000Z',
  aud: 'authenticated',
  role: 'authenticated',
};

const mockSession: Partial<Session> = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser as User,
};

// Helper to create mock supabase client
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  };
}

describe('useAuth Hook', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Initial State', () => {
    it('initializes with loading true', async () => {
      // Make getSession hang so we can see initial state
      let resolveSession: (value: unknown) => void;
      mockSupabase.auth.getSession = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveSession = resolve;
        })
      );

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      // Initial state should have loading true
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();

      // Clean up by resolving
      resolveSession!({ data: { session: null }, error: null });
    });

    it('loads existing session on mount', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('sets loading false when no session exists', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Successful Login Updates State', () => {
    it('updates user and session on successful signInWithPassword', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Perform login
      await act(async () => {
        await result.current.signInWithEmail('test@example.com', 'password123');
      });

      expect(result.current.user?.id).toBe('user-123');
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.session?.access_token).toBe('mock-access-token');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns data on successful login', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult: { data?: unknown; error?: unknown };
      await act(async () => {
        loginResult = await result.current.signInWithEmail('test@example.com', 'password');
      });

      expect(loginResult!.data).toBeDefined();
      expect(loginResult!.error).toBeUndefined();
    });

    it('handles login error and updates error state', async () => {
      const authError: AuthError = {
        message: 'Invalid login credentials',
        status: 400,
        name: 'AuthApiError',
      } as AuthError;

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult: { error?: AuthError };
      await act(async () => {
        loginResult = await result.current.signInWithEmail('test@example.com', 'wrong');
      });

      expect(loginResult!.error?.message).toBe('Invalid login credentials');
      expect(result.current.error?.message).toBe('Invalid login credentials');
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('sets loading true during login', async () => {
      let resolveLogin: (value: unknown) => void;
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });
      mockSupabase.auth.signInWithPassword = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start login but don't await
      let loginPromise: Promise<unknown>;
      act(() => {
        loginPromise = result.current.signInWithEmail('test@example.com', 'password');
      });

      // Should be loading during login
      expect(result.current.loading).toBe(true);

      // Complete login
      await act(async () => {
        resolveLogin!({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
        await loginPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Logout Clears State', () => {
    it('clears user and session on signOut', async () => {
      // Start with logged in state
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      // Perform logout
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns empty object on successful signOut', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      let logoutResult: { error?: AuthError };
      await act(async () => {
        logoutResult = await result.current.signOut();
      });

      expect(logoutResult!.error).toBeUndefined();
    });

    it('handles logout error gracefully', async () => {
      const logoutError: AuthError = {
        message: 'Network error',
        status: 500,
        name: 'AuthApiError',
      } as AuthError;

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.signOut = vi.fn().mockResolvedValue({
        error: logoutError,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const logoutResult = await act(async () => {
        return await result.current.signOut();
      });

      expect(logoutResult.error?.message).toBe('Network error');
      expect(result.current.error?.message).toBe('Network error');
    });

    it('sets loading true during logout', async () => {
      let resolveLogout: (value: unknown) => void;
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabase.auth.signOut = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveLogout = resolve;
        })
      );

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      // Start logout
      let logoutPromise: Promise<unknown>;
      act(() => {
        logoutPromise = result.current.signOut();
      });

      expect(result.current.loading).toBe(true);

      // Complete logout
      await act(async () => {
        resolveLogout!({ error: null });
        await logoutPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Timeout Behavior', () => {
    it('has a timeout mechanism for slow getSession', async () => {
      // This test verifies the timeout exists by checking the code behavior
      // The timeout is 3000ms - if getSession takes too long, loading should be set to false

      // Create a promise that never resolves to simulate slow network
      mockSupabase.auth.getSession = vi.fn().mockReturnValue(new Promise(() => {}));

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      // Initially loading
      expect(result.current.loading).toBe(true);

      // After timeout (3000ms), loading should be false
      // We use waitFor with a timeout to check this
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 4000 }
      );
    });

    it('clears timeout on successful getSession', async () => {
      // If getSession resolves quickly, clearTimeout should be called
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // User should be set from the session
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('AbortError Handling', () => {
    it('does not leave loading state on AbortError during init', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockSupabase.auth.getSession = vi.fn().mockRejectedValue(abortError);

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not set error for AbortError
      expect(result.current.error).toBeNull();
    });

    it('handles "aborted" in error message', async () => {
      const abortError = new Error('The operation was aborted');

      mockSupabase.auth.getSession = vi.fn().mockRejectedValue(abortError);

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('returns null error on AbortError during signIn', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signInWithPassword = vi.fn().mockRejectedValue(abortError);

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const loginResult = await act(async () => {
        return await result.current.signInWithEmail('test@example.com', 'password');
      });

      // AbortError should return null error
      expect(loginResult.error).toBeNull();
    });

    it('returns empty object on AbortError during signOut', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.signOut = vi.fn().mockRejectedValue(abortError);

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const logoutResult = await act(async () => {
        return await result.current.signOut();
      });

      // AbortError should return empty object (no error property set)
      expect(logoutResult.error).toBeUndefined();
    });
  });

  describe('Auth State Change Listener', () => {
    it('sets up onAuthStateChange listener on mount', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });
    });

    it('unsubscribes on unmount', async () => {
      const unsubscribeMock = vi.fn();

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.onAuthStateChange = vi.fn(() => ({
        data: {
          subscription: { unsubscribe: unsubscribeMock },
        },
      }));

      const { useAuth } = await import('@/hooks/useAuth');
      const { unmount } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('OAuth Sign In', () => {
    it('calls signInWithOAuth with correct provider', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithOAuth('google');
      });

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      });
    });

    it('handles OAuth error gracefully', async () => {
      const oauthError: AuthError = {
        message: 'OAuth error',
        status: 400,
        name: 'AuthApiError',
      } as AuthError;

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        error: oauthError,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const oauthResult = await act(async () => {
        return await result.current.signInWithOAuth('google');
      });

      expect(oauthResult.error?.message).toBe('OAuth error');
    });
  });

  describe('Password Reset', () => {
    it('calls resetPasswordForEmail with correct email', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/reset-password'),
        })
      );
    });

    it('returns error on reset failure', async () => {
      const resetError: AuthError = {
        message: 'User not found',
        status: 404,
        name: 'AuthApiError',
      } as AuthError;

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabase.auth.resetPasswordForEmail = vi.fn().mockResolvedValue({
        error: resetError,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resetResult = await act(async () => {
        return await result.current.resetPassword('unknown@example.com');
      });

      expect(resetResult.error?.message).toBe('User not found');
    });
  });

  describe('Update Password', () => {
    it('calls updateUser with new password', async () => {
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      await act(async () => {
        await result.current.updatePassword('newPassword123');
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('returns error on update failure', async () => {
      const updateError: AuthError = {
        message: 'Password too weak',
        status: 400,
        name: 'AuthApiError',
      } as AuthError;

      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.updateUser = vi.fn().mockResolvedValue({
        error: updateError,
      });

      const { useAuth } = await import('@/hooks/useAuth');
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const updateResult = await act(async () => {
        return await result.current.updatePassword('weak');
      });

      expect(updateResult.error?.message).toBe('Password too weak');
    });
  });
});
