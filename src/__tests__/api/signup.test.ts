/**
 * Signup API Route Tests
 *
 * Tests for /api/auth/signup endpoint input validation:
 * - Invalid email format rejection
 * - Weak password rejection
 * - Missing fields rejection
 * - Valid input acceptance
 *
 * Note: The current implementation only validates presence of email/password.
 * These tests document both current behavior and recommended enhancements.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';

// Type for our mock
type MockAdminClient = {
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>;
    };
  };
};

describe('Signup API Route', () => {
  let mockAdminClient: MockAdminClient;
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockAdminClient = {
      auth: {
        admin: {
          createUser: vi.fn(),
        },
      },
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as unknown as ReturnType<typeof createAdminClient>);

    // Import the route handler after mocking
    const module = await import('@/app/api/auth/signup/route');
    POST = module.POST;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // Helper to create a mock request
  function createRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Missing Fields Rejection', () => {
    it('rejects request with missing email', async () => {
      const request = createRequest({ password: 'ValidPass123!' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with missing password', async () => {
      const request = createRequest({ email: 'test@example.com' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with both fields missing', async () => {
      const request = createRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with empty email string', async () => {
      const request = createRequest({ email: '', password: 'ValidPass123!' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with empty password string', async () => {
      const request = createRequest({ email: 'test@example.com', password: '' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with null values', async () => {
      const request = createRequest({ email: null, password: null });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    it('rejects request with undefined values', async () => {
      const request = createRequest({ email: undefined, password: undefined });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('Valid Input Acceptance', () => {
    it('accepts valid email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        full_name: 'Test User',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toEqual(mockUser);
      expect(data.message).toBe('Account created successfully');
    });

    it('calls createUser with correct parameters', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        full_name: 'Test User',
      });

      await POST(request);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      });
    });

    it('uses email prefix as full_name when not provided', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      const request = createRequest({
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      });

      await POST(request);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'john.doe',
        },
      });
    });

    it('accepts email with + symbol', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test+alias@example.com' } },
        error: null,
      });

      const request = createRequest({
        email: 'test+alias@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts email with subdomain', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@mail.example.com' } },
        error: null,
      });

      const request = createRequest({
        email: 'test@mail.example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Invalid Email Format Rejection', () => {
    // Note: Current implementation passes these to Supabase for validation.
    // These tests document expected behavior with enhanced validation.

    it('passes invalid email to Supabase which rejects it', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' },
      });

      const request = createRequest({
        email: 'not-an-email',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('handles email without @ symbol', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' },
      });

      const request = createRequest({
        email: 'invalidemail',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('handles email without domain', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' },
      });

      const request = createRequest({
        email: 'test@',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('handles email with spaces', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' },
      });

      const request = createRequest({
        email: 'test @example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('handles email with only whitespace', async () => {
      const request = createRequest({
        email: '   ',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      // Whitespace-only strings are truthy, so it goes to Supabase
      // This test documents the current behavior
      expect(response.status).toBe(400);
    });
  });

  describe('Weak Password Rejection', () => {
    // Note: Current implementation passes password to Supabase for validation.
    // Supabase has its own password requirements (minimum 8 characters by default).

    it('passes weak password to Supabase which rejects it', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password too weak' },
      });

      const request = createRequest({
        email: 'test@example.com',
        password: '123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Password');
    });

    it('handles single character password', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password too short' },
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'a',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('handles password with only spaces', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid password' },
      });

      const request = createRequest({
        email: 'test@example.com',
        password: '      ',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('accepts valid strong password when Supabase accepts it', async () => {
      // Ensure clean mock state
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'StrongPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Duplicate Email Handling', () => {
    it('returns error when email already exists', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const request = createRequest({
        email: 'existing@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User already registered');
    });
  });

  describe('Error Handling', () => {
    it('handles Supabase connection errors', async () => {
      mockAdminClient.auth.admin.createUser.mockRejectedValue(
        new Error('Connection failed')
      );

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create account');
    });

    it('handles invalid JSON body', async () => {
      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create account');
    });

    it('handles empty request body', async () => {
      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('handles Supabase timeout', async () => {
      mockAdminClient.auth.admin.createUser.mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create account');
    });
  });

  describe('Security Considerations', () => {
    it('does not expose internal error details', async () => {
      mockAdminClient.auth.admin.createUser.mockRejectedValue(
        new Error('Internal database connection string: postgres://user:pass@host')
      );

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create account');
      expect(data.error).not.toContain('postgres://');
    });

    it('handles XSS attempts in email', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' },
      });

      const request = createRequest({
        email: '<script>alert("xss")</script>@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      // Should either reject or sanitize, not execute
      expect(response.status).toBe(400);
    });

    it('handles SQL injection attempts in email', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email' },
      });

      const request = createRequest({
        email: "'; DROP TABLE users; --@example.com",
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Response Format', () => {
    it('returns user object on success', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('message');
      expect(data.user.id).toBe('user-123');
    });

    it('returns proper content-type header', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      const response = await POST(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});

/**
 * RECOMMENDED ENHANCEMENTS:
 *
 * The current signup route could benefit from these validation improvements:
 *
 * 1. Email Format Validation (before sending to Supabase):
 *    - Use regex or zod schema: z.string().email()
 *    - Normalize email (lowercase, trim whitespace)
 *
 * 2. Password Strength Validation:
 *    - Minimum length: 8 characters
 *    - Require mix of: uppercase, lowercase, number, special char
 *    - Check against common password lists
 *
 * 3. Rate Limiting:
 *    - Prevent brute force signup attempts
 *    - Implement IP-based or email-based rate limits
 *
 * 4. Input Sanitization:
 *    - Trim whitespace from email
 *    - Validate full_name length and characters
 *
 * Example enhanced validation:
 *
 * const signupSchema = z.object({
 *   email: z.string().email().toLowerCase().trim(),
 *   password: z.string()
 *     .min(8, 'Password must be at least 8 characters')
 *     .regex(/[A-Z]/, 'Password must contain an uppercase letter')
 *     .regex(/[a-z]/, 'Password must contain a lowercase letter')
 *     .regex(/[0-9]/, 'Password must contain a number'),
 *   full_name: z.string().max(100).optional(),
 * });
 */
