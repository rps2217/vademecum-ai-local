import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock SupabaseService
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    refreshSession: vi.fn(),
  },
};

vi.mock('../services/SupabaseService', () => ({
  supabaseService: {
    getClient: vi.fn(() => mockSupabaseClient),
    isConfigured: vi.fn(() => true),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  describe('Initial state', () => {
    it('should provide initial unauthenticated state when Supabase is configured', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.isAccessGranted).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isSupabaseConfigured).toBe(true);
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email formats', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const [emailResult] = await act(async () => {
        return [await result.current.signIn('invalid-email', 'password123')];
      });
      
      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toContain('email inválido');
    });

    it('should reject empty email', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const [emailResult] = await act(async () => {
        return [await result.current.signIn('', 'password123')];
      });
      
      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toContain('email inválido');
    });
  });

  describe('Password validation', () => {
    it('should reject passwords shorter than 6 characters for signIn', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const [pwdResult] = await act(async () => {
        return [await result.current.signIn('test@example.com', '12345')];
      });
      
      expect(pwdResult.success).toBe(false);
      expect(pwdResult.error).toContain('al menos 6 caracteres');
    });

    it('should reject passwords shorter than 8 characters for signUp', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const [pwdResult] = await act(async () => {
        return [await result.current.signUp('test@example.com', '1234567')];
      });
      
      expect(pwdResult.success).toBe(false);
      expect(pwdResult.error).toContain('al menos 8 caracteres');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(signInResult?.success).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.isAccessGranted).toBe(true);
    });

    it('should fail sign in with wrong credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });
      
      expect(signInResult?.success).toBe(false);
      expect(signInResult?.error).toBe('Invalid login credentials');
      expect(result.current.user).toBe(null);
    });

    it('should normalize email to lowercase', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { 
          user: { id: 'user-123', email: 'test@example.com' }, 
          session: { 
            access_token: 'token', 
            expires_at: Math.floor(Date.now() / 1000) + 3600 
          } 
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signIn('TEST@EXAMPLE.COM', 'password123');
      });
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('signUp', () => {
    it('should successfully create account with valid data', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123', email: 'new@example.com' }, 
          session: { 
            access_token: 'token', 
            expires_at: Math.floor(Date.now() / 1000) + 3600 
          } 
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('NewUser@example.com', 'password123!');
      });
      
      expect(signUpResult?.success).toBe(true);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123!',
        options: expect.objectContaining({
          data: expect.objectContaining({
            role: 'professional',
          }),
        }),
      });
    });

    it('should handle email confirmation required', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123', email: 'new@example.com' },
          session: null, // No session means email confirmation required
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123!');
      });
      
      expect(signUpResult?.success).toBe(true);
    });
  });

  describe('signOut', () => {
    it('should clear user state and call Supabase signOut', async () => {
      // First sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { 
          user: { id: 'user-123', email: 'test@example.com' }, 
          session: { 
            access_token: 'token', 
            expires_at: Math.floor(Date.now() / 1000) + 3600 
          } 
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });
      
      expect(result.current.user).not.toBeNull();
      
      // Then sign out
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.isAccessGranted).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should successfully send reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });
      
      expect(resetResult?.success).toBe(true);
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('reset-password'),
        })
      );
    });

    it('should handle reset password error', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('nonexistent@example.com');
      });
      
      expect(resetResult?.success).toBe(false);
      expect(resetResult?.error).toBe('User not found');
    });
  });
});
