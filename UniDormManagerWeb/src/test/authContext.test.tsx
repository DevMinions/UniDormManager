import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

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

// Create mock api object with localStorage side effect for login
const mockLogin = vi.fn().mockImplementation(async (username: string, password: string) => {
  const response = {
    token: 'mock-jwt-token',
    user: {
      id: '1',
      username: username,
      email: 'admin@unidorm.edu',
      realName: '系统管理员',
      roles: [{ id: '1', code: 'system_admin', name: '系统管理员' }],
    },
    expiresIn: 3600,
  };
  localStorage.setItem('token', response.token);
  return response;
});
const mockLogout = vi.fn().mockImplementation(async () => {
  localStorage.removeItem('token');
});
const mockGetCurrentUser = vi.fn();
const mockGetRoles = vi.fn();

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    login: (...args: any[]) => mockLogin(...args),
    logout: (...args: any[]) => mockLogout(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
    getRoles: (...args: any[]) => mockGetRoles(...args),
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

      mockGetRoles.mockResolvedValue(mockRoles);
      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        permissions: ['students:read', 'students:create', 'rooms:read'],
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
    });

    it('should handle login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('admin', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');
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

      mockGetRoles.mockResolvedValue(mockRoles);
      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        permissions: ['students:read'],
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

      mockGetRoles.mockResolvedValue(mockRoles);
      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        permissions: ['students:read', 'students:create', 'rooms:read'],
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
    });

    it('should return false for unauthenticated user', async () => {
      mockGetRoles.mockResolvedValue([]);
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.hasPermission('students:read')).toBe(false);
      expect(result.current.hasPermission('students:create')).toBe(false);
      expect(result.current.hasPermission('rooms:read')).toBe(false);
    });
  });
});
