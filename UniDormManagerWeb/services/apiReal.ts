// 真实后端 API 客户端
import { User, Role, Permission, PaginatedResponse, Student, Building } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// 获取认证 token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// 通用请求函数
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const apiReal = {
  // --- 认证 API ---
  login: async (username: string, password: string) => {
    const response = await request<{ token: string; user: any; expiresIn: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  logout: async () => {
    await request('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    return request<{ user: any; permissions: string[] }>('/auth/me');
  },

  // --- User API ---
  getUsers: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: { status?: string; roleId?: string; search?: string }
  ): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.roleId && filters.roleId !== 'All') params.append('roleId', filters.roleId);

    const data = await request<User[]>(`/users?${params.toString()}`);
    // 注意：后端可能需要返回分页信息，这里假设返回数组
    // 如果后端返回分页响应，直接使用
    return {
      data: Array.isArray(data) ? data : (data as any).data || [],
      total: (data as any).total || (Array.isArray(data) ? data.length : 0),
      page,
      pageSize,
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  getUserById: async (id: string): Promise<User> => {
    return request<User>(`/users/${id}`);
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await request(`/users/${id}`, { method: 'DELETE' });
  },

  assignRoles: async (userId: string, roleIds: string[], buildingId?: string): Promise<User> => {
    return request<User>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleIds, buildingId }),
    });
  },

  // --- Role API ---
  getRoles: async (): Promise<Role[]> => {
    const roles = await request<Role[]>('/roles');
    // 转换后端返回的格式（如果有 permissions 数组，转换为 permissionIds）
    return roles.map(role => ({
      ...role,
      permissionIds: role.permissions?.map((p: any) => p.id) || role.permissionIds || [],
    }));
  },

  getRoleById: async (id: string): Promise<Role> => {
    const role = await request<Role>(`/roles/${id}`);
    return {
      ...role,
      permissionIds: role.permissions?.map((p: any) => p.id) || role.permissionIds || [],
    };
  },

  createRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    return request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify({
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        permissionIds: role.permissionIds,
      }),
    });
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return request<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        level: updates.level,
        permissionIds: updates.permissionIds,
      }),
    });
  },

  deleteRole: async (id: string): Promise<void> => {
    await request(`/roles/${id}`, { method: 'DELETE' });
  },

  // --- Permission API ---
  getPermissions: async (): Promise<Permission[]> => {
    return request<Permission[]>('/permissions');
  },

  // --- Resource Helpers ---
  getStudents: async (): Promise<Student[]> => {
    return request<Student[]>('/students');
  },

  getBuildings: async (): Promise<Building[]> => {
    return request<Building[]>('/buildings');
  },
};

