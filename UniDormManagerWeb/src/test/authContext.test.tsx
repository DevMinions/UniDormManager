import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as apiModule from '../../services/api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
global.localStorage = localStorageMock as any;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@unidorm.edu',
        realName: '系统管理员',
        roles: [{ id: '1', code: 'system_admin', name: '系统管理员' }],
      };

      const mockRoles = [
        {
          id: '1',
          code: 'system_admin',
          name: '系统管理员',
          permissions: [],
        },
      ];

      // Spy on api methods
      const loginSpy = vi.spyOn(apiModule, 'api', 'get').mockImplementation((key) => {
        if (key === 'login') {
          return vi.fn().mockResolvedValue({
            token: 'mock-jwt-token',
            user: mockUser,
            expiresIn: 3600,
          });
        } else if (key === 'getRoles') {
          return vi.fn().mockResolvedValue(mockRoles);
        } else if (key === 'getCurrentUser') {
          return vi.fn().mockResolvedValue({
            user: mockUser,
            permissions: ['students:read', 'students:create', 'rooms:read'],
          });
        }
        return vi.fn();
      });

      const logoutSpy = vi.spyOn(apiModule, 'api', 'get').mockImplementation((key) => {
        if (key === 'logout') {
          return vi.fn().mockResolvedValue(undefined);
        }
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin', 'admin123');
      });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.username).toBe('admin');
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(result.current.permissions).toEqual(['students:read', 'students:create', 'rooms:read']);

      loginSpy.mockRestore();
      logoutSpy.mockRestore();
    });

    it('should handle login failure', async () => {
      const loginSpy = vi.spyOn(apiModule, 'api', 'get').mockImplementation((key) => {
        if (key === 'login') {
          return vi.fn().mockRejectedValue(new Error('Invalid credentials'));
        }
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('admin', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      loginSpy.mockRestore();
    });

    it('should logout successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@unidorm.edu',
        roles: [{ id: '1', code: 'system_admin', name: '系统管理员' }],
      };

      const mockRoles = [
        {
          id: '1',
          code: 'system_admin',
          name: '系统管理员',
          permissions: [],
        },
      ];

      const loginSpy = vi.spyOn(apiModule, 'api', 'get').mockImplementation((key) => {
        if (key === 'login') {
          return vi.fn().mockResolvedValue({
            token: 'mock-token',
            user: mockUser,
            expiresIn: 3600,
          });
        } else if (key === 'getRoles') {
          return vi.fn().mockResolvedValue(mockRoles);
        } else if (key === 'getCurrentUser') {
          return vi.fn().mockResolvedValue({
            user: mockUser,
            permissions: ['students:read'],
          });
        } else if (key === 'logout') {
          return vi.fn().mockResolvedValue(undefined);
        }
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin', 'admin123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(result.current.permissions).toEqual([]);

      loginSpy.mockRestore();
    });
  });

  describe('Permission checking', () => {
    it('should check permissions correctly', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@unidorm.edu',
        roles: [{ id: '1', code: 'system_admin', name: '系统管理员' }],
      };

      const mockRoles = [
        {
          id: '1',
          code: 'system_admin',
          name: '系统管理员',
          permissions: [],
        },
      ];

      const loginSpy = vi.spyOn(apiModule, 'api', 'get').mockImplementation((key) => {
        if (key === 'login') {
          return vi.fn().mockResolvedValue({
            token: 'mock-token',
            user: mockUser,
            expiresIn: 3600,
          });
        } else if (key === 'getRoles') {
          return vi.fn().mockResolvedValue(mockRoles);
        } else if (key === 'getCurrentUser') {
          return vi.fn().mockResolvedValue({
            user: mockUser,
            permissions: ['students:read', 'students:create', 'rooms:read'],
          });
        }
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin', 'admin123');
      });

      expect(result.current.hasPermission('students:read')).toBe(true);
      expect(result.current.hasPermission('students:create')).toBe(true);
      expect(result.current.hasPermission('rooms:read')).toBe(true);
      expect(result.current.hasPermission('rooms:create')).toBe(false);
      expect(result.current.hasPermission('admin:delete')).toBe(false);

      loginSpy.mockRestore();
    });

    it('should return false for unauthenticated user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.current.user).toBeNull();
      expect(result.current.hasPermission('students:read')).toBe(false);
      expect(result.current.hasPermission('students:create')).toBe(false);
      expect(result.current.hasPermission('rooms:read')).toBe(false);
    });
  });
});
