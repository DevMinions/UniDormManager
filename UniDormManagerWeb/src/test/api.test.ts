import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../../services/api';
import { mockStudents, mockRooms, mockRepairs, mockAuthResponse, mockRoles } from './mockData';

describe('API Service', () => {
  beforeEach(() => {
    // Setup localStorage mock
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

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAuthResponse,
      });
      global.fetch = mockFetch;

      const result = await api.login('admin', 'admin123');

      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        })
      );
    });

    it('should handle login failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });
      global.fetch = mockFetch;

      await expect(api.login('admin', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('should logout successfully', async () => {
      localStorage.setItem('token', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await api.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should get current user', async () => {
      localStorage.setItem('token', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockAuthResponse.user, permissions: ['*'] }),
      });
      global.fetch = mockFetch;

      const result = await api.getCurrentUser();

      expect(result).toEqual({
        user: mockAuthResponse.user,
        permissions: ['*'],
      });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('Students API', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should get students', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStudents,
      });
      global.fetch = mockFetch;

      const result = await api.getStudents();

      expect(result).toEqual(mockStudents);
    });

    it('should create student', async () => {
      const newStudent = {
        name: '测试学生',
        studentId: '2023999',
        major: '计算机科学',
        status: 'Active' as const,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...newStudent, id: '4' }),
      });
      global.fetch = mockFetch;

      const result = await api.createStudent(newStudent);

      expect(result).toEqual({ ...newStudent, id: '4' });
    });

    it('should update student', async () => {
      const updatedStudent = { ...mockStudents[0], name: '张三（更新）' };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedStudent,
      });
      global.fetch = mockFetch;

      const result = await api.updateStudent('1', updatedStudent);

      expect(result).toEqual(updatedStudent);
    });

    it('should delete student', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      await api.deleteStudent('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/students/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Rooms API', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should get rooms', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRooms,
      });
      global.fetch = mockFetch;

      const result = await api.getRooms();

      expect(result).toEqual(mockRooms);
    });

    it('should create room', async () => {
      const newRoom = {
        number: 'A-999',
        buildingId: '1',
        capacity: 4,
        type: 'Male' as const,
        status: 'Available' as const,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...newRoom, id: '999' }),
      });
      global.fetch = mockFetch;

      const result = await api.createRoom(newRoom);

      expect(result).toEqual({ ...newRoom, id: '999' });
    });
  });

  describe('Repairs API', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should get repair requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRepairs,
      });
      global.fetch = mockFetch;

      const result = await api.getRepairRequests();

      expect(result).toEqual(mockRepairs);
    });

    it('should create repair request', async () => {
      const newRepair = {
        title: '空调故障',
        description: '空调不制冷',
        roomNumber: 'A-101',
        priority: 'High' as const,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...newRepair, id: '999' }),
      });
      global.fetch = mockFetch;

      const result = await api.createRepairRequest(newRepair);

      expect(result).toEqual({ ...newRepair, id: '999' });
    });
  });

  describe('Dashboard API', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should get dashboard stats', async () => {
      const mockStats = {
        totalStudents: 1250,
        totalRooms: 500,
        totalBuildings: 10,
        pendingRepairs: 23,
        availableRooms: 45,
        occupancyRate: 91.0,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      });
      global.fetch = mockFetch;

      const result = await api.getDashboardStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('Roles API', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should get roles', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRoles,
      });
      global.fetch = mockFetch;

      const result = await api.getRoles();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await expect(api.getStudents()).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized', message: 'Token expired' }),
      });
      global.fetch = mockFetch;

      await expect(api.getStudents()).rejects.toThrow();
    });

    it('should handle 500 server error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'internal_error', message: 'Server error' }),
      });
      global.fetch = mockFetch;

      await expect(api.getStudents()).rejects.toThrow();
    });
  });
});
