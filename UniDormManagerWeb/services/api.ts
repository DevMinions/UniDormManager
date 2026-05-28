// 真实后端 API 客户端
import {
  User, Role, Permission, PaginatedResponse, PaginatedRequest,
  StudentFilter, Student, Building, Room, RepairRequest, Notice,
  Inspection, InspectionDetail, InspectionRanking, AccessLog, LateReturnAlert,
  RoomSwapApplication, ApprovalFlow, RoomSwapHistory, InspectionFilter,
  AccessLogFilter, LateReturnFilter, RoomSwapFilter, RoomFilter, RepairFilter
} from '../types';

// 在浏览器环境中使用相对路径（通过 nginx 代理），在开发环境使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const api = {
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
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // 忽略错误，继续清除 token
    }
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
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.roleId && filters.roleId !== 'All') params.append('roleId', filters.roleId);

    const users = await request<User[]>(`/users?${params.toString()}`);

    // 转换后端格式到前端格式
    const transformedUsers = users.map((u: any) => ({
      ...u,
      roleIds: u.roles?.map((r: any) => r.id) || [],
      studentId: u.studentId,
      buildingId: u.buildingId,
    }));

    // 模拟分页（后端可能不支持分页）
    const total = transformedUsers.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = transformedUsers.slice(start, end);

    return { data, total, page, pageSize };
  },

  getAllUsers: async (): Promise<User[]> => {
    const users = await request<User[]>('/users');
    return users.map((u: any) => ({
      ...u,
      roleIds: u.roles?.map((r: any) => r.id) || [],
      studentId: u.studentId,
      buildingId: u.buildingId,
    }));
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const created = await request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: user.username,
        password: (user as any).password || 'default123',
        email: user.email,
        phone: user.phone,
        realName: user.realName,
        roleIds: user.roleIds,
        studentId: user.studentId,
      }),
    });
    return {
      ...created,
      roleIds: (created as any).roles?.map((r: any) => r.id) || [],
    };
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const updated = await request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        email: updates.email,
        phone: updates.phone,
        realName: updates.realName,
        status: updates.status,
        roleIds: updates.roleIds,
        studentId: updates.studentId,
      }),
    });
    return {
      ...updated,
      roleIds: (updated as any).roles?.map((r: any) => r.id) || [],
    };
  },

  deleteUser: async (id: string): Promise<void> => {
    await request(`/users/${id}`, { method: 'DELETE' });
  },

  // --- Role API ---
  getRoles: async (): Promise<Role[]> => {
    const roles = await request<Role[]>('/roles');
    return roles.map((role: any) => ({
      ...role,
      permissionIds: role.permissions?.map((p: any) => p.id) || role.permissionIds || [],
    }));
  },

  createRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    const created = await request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify({
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        permissionIds: role.permissionIds,
      }),
    });
    return {
      ...created,
      permissionIds: (created as any).permissions?.map((p: any) => p.id) || [],
    };
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    const updated = await request<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        level: updates.level,
        permissionIds: updates.permissionIds,
      }),
    });
    return {
      ...updated,
      permissionIds: (updated as any).permissions?.map((p: any) => p.id) || [],
    };
  },

  deleteRole: async (id: string): Promise<void> => {
    await request(`/roles/${id}`, { method: 'DELETE' });
  },

  // --- Permission API ---
  getPermissions: async (): Promise<Permission[]> => {
    return request<Permission[]>('/permissions');
  },

  // --- Student API ---
  getStudentsPaginated: async (params: PaginatedRequest & StudentFilter): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status && params.status !== 'All') queryParams.append('status', params.status);
    if (params.major) queryParams.append('major', params.major);
    if (params.room) queryParams.append('room', params.room);
    if (params.building) queryParams.append('building', params.building);

    const url = `/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<Student>>(url);
  },

  getStudents: async (): Promise<Student[]> => {
    return request<Student[]>('/students/all');
  },

  getStudentById: async (id: string): Promise<Student> => {
    return request<Student>(`/students/${id}`);
  },

  createStudent: async (student: Omit<Student, 'id' | 'roomNumber'>): Promise<Student> => {
    return request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify({
        name: student.name,
        studentId: student.studentId,
        major: student.major,
        status: student.status || 'Active',
      }),
    });
  },

  updateStudent: async (id: string, updates: Partial<Student>): Promise<Student> => {
    return request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        studentId: updates.studentId,
        major: updates.major,
        roomNumber: updates.roomNumber,
        status: updates.status,
      }),
    });
  },

  deleteStudent: async (id: string): Promise<void> => {
    await request(`/students/${id}`, { method: 'DELETE' });
  },

  // --- Building API ---
  getBuildings: async (): Promise<Building[]> => {
    return request<Building[]>('/buildings');
  },

  getBuildingById: async (id: string): Promise<Building> => {
    return request<Building>(`/buildings/${id}`);
  },

  createBuilding: async (building: Omit<Building, 'id'>): Promise<Building> => {
    return request<Building>('/buildings', {
      method: 'POST',
      body: JSON.stringify({
        name: building.name,
        type: building.type,
        floors: building.floors,
        manager: building.manager,
        description: building.description || '',
      }),
    });
  },

  updateBuilding: async (id: string, updates: Partial<Building>): Promise<Building> => {
    return request<Building>(`/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        type: updates.type,
        floors: updates.floors,
        manager: updates.manager,
        description: updates.description,
      }),
    });
  },

  deleteBuilding: async (id: string): Promise<void> => {
    await request(`/buildings/${id}`, { method: 'DELETE' });
  },

  // --- Room API ---
  getRoomsPaginated: async (params: PaginatedRequest & RoomFilter): Promise<PaginatedResponse<Room>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status && params.status !== 'All') queryParams.append('status', params.status);
    if (params.building) queryParams.append('building', params.building);
    if (params.type && params.type !== 'All') queryParams.append('type', params.type);
    if (params.floor) queryParams.append('floor', String(params.floor));
    if (params.capacityMin) queryParams.append('capacityMin', String(params.capacityMin));
    if (params.capacityMax) queryParams.append('capacityMax', String(params.capacityMax));

    const url = `/rooms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<Room>>(url);
  },

  getRooms: async (): Promise<Room[]> => {
    return request<Room[]>('/rooms/all');
  },

  getRoomById: async (id: string): Promise<Room> => {
    return request<Room>(`/rooms/${id}`);
  },

  createRoom: async (room: Omit<Room, 'id'>): Promise<Room> => {
    return request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify({
        number: room.number,
        building: room.building,
        capacity: room.capacity,
        occupied: room.occupied || 0,
        type: room.type,
        status: room.status || 'Available',
      }),
    });
  },

  updateRoom: async (id: string, updates: Partial<Room>): Promise<Room> => {
    return request<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        number: updates.number,
        building: updates.building,
        capacity: updates.capacity,
        occupied: updates.occupied,
        type: updates.type,
        status: updates.status,
      }),
    });
  },

  deleteRoom: async (id: string): Promise<void> => {
    await request(`/rooms/${id}`, { method: 'DELETE' });
  },

  // --- Repair Request API ---
  getRepairRequestsPaginated: async (params: PaginatedRequest & RepairFilter): Promise<PaginatedResponse<RepairRequest>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status && params.status !== 'All') queryParams.append('status', params.status);
    if (params.priority && params.priority !== 'All') queryParams.append('priority', params.priority);
    if (params.studentId) queryParams.append('studentId', params.studentId);
    if (params.roomNumber) queryParams.append('roomNumber', params.roomNumber);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());

    const url = `/repairs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<RepairRequest>>(url);
  },

  getRepairRequests: async (): Promise<RepairRequest[]> => {
    return request<RepairRequest[]>('/repairs/all');
  },

  getRepairRequestById: async (id: string): Promise<RepairRequest> => {
    return request<RepairRequest>(`/repairs/${id}`);
  },

  createRepairRequest: async (repair: Omit<RepairRequest, 'id' | 'status' | 'date'>): Promise<RepairRequest> => {
    return request<RepairRequest>('/repairs', {
      method: 'POST',
      body: JSON.stringify({
        title: repair.title,
        description: repair.description || '',
        roomNumber: repair.roomNumber,
        priority: repair.priority || 'Medium',
      }),
    });
  },

  updateRepairRequest: async (id: string, updates: Partial<RepairRequest>): Promise<RepairRequest> => {
    return request<RepairRequest>(`/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
      }),
    });
  },

  deleteRepairRequest: async (id: string): Promise<void> => {
    await request(`/repairs/${id}`, { method: 'DELETE' });
  },

  // --- Notice API ---
  getNotices: async (): Promise<Notice[]> => {
    return request<Notice[]>('/notices');
  },

  getNoticeById: async (id: string): Promise<Notice> => {
    return request<Notice>(`/notices/${id}`);
  },

  createNotice: async (notice: Omit<Notice, 'id' | 'date'>): Promise<Notice> => {
    return request<Notice>('/notices', {
      method: 'POST',
      body: JSON.stringify({
        title: notice.title,
        content: notice.content,
        author: notice.author,
      }),
    });
  },

  updateNotice: async (id: string, updates: Partial<Notice>): Promise<Notice> => {
    return request<Notice>(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: updates.title,
        content: updates.content,
      }),
    });
  },

  deleteNotice: async (id: string): Promise<void> => {
    await request(`/notices/${id}`, { method: 'DELETE' });
  },

  // --- 查寝评分系统 API ---
  getInspectionsPaginated: async (params: PaginatedRequest & InspectionFilter): Promise<PaginatedResponse<Inspection>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status) queryParams.append('status', params.status);
    if (params.building) queryParams.append('building', params.building);
    if (params.inspector) queryParams.append('inspector', params.inspector);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());
    if (params.scoreMin) queryParams.append('scoreMin', String(params.scoreMin));
    if (params.scoreMax) queryParams.append('scoreMax', String(params.scoreMax));

    const url = `/inspections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<Inspection>>(url);
  },

  getInspectionRooms: async (building?: string): Promise<Array<{ roomNumber: string; building: string }>> => {
    const params = building ? `?building=${building}` : '';
    return request<Array<{ roomNumber: string; building: string }>>(`/inspections/rooms${params}`);
  },

  createInspection: async (inspection: {
    roomNumber: string;
    building: string;
    overallScore: number;
    comment: string;
    details: Array<{
      category: string;
      item: string;
      score: number;
      maxScore: number;
      comment?: string;
      photoUrl?: string;
    }>;
  }): Promise<Inspection> => {
    return request<Inspection>('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspection),
    });
  },

  updateInspection: async (id: string, updates: Partial<Inspection>): Promise<Inspection> => {
    return request<Inspection>(`/inspections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteInspection: async (id: string): Promise<void> => {
    await request(`/inspections/${id}`, { method: 'DELETE' });
  },

  // 查寝排行榜
  getInspectionRankings: async (type: 'week' | 'month' = 'week', building?: string): Promise<InspectionRanking[]> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (building) params.append('building', building);

    return request<InspectionRanking[]>(`/inspections/rankings?${params.toString()}`);
  },

  // --- 门禁记录系统 API ---
  getAccessLogsPaginated: async (params: PaginatedRequest & AccessLogFilter): Promise<PaginatedResponse<AccessLog>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.studentName) queryParams.append('studentName', params.studentName);
    if (params.roomNumber) queryParams.append('roomNumber', params.roomNumber);
    if (params.gateName) queryParams.append('gateName', params.gateName);
    if (params.status) queryParams.append('status', params.status);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());

    const url = `/access-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<AccessLog>>(url);
  },

  getLiveAccessLogs: async (): Promise<AccessLog[]> => {
    return request<AccessLog[]>('/access-logs/live');
  },

  // --- 晚归报警系统 API ---
  getLateReturnAlertsPaginated: async (params: PaginatedRequest & LateReturnFilter): Promise<PaginatedResponse<LateReturnAlert>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status) queryParams.append('status', params.status);
    if (params.studentName) queryParams.append('studentName', params.studentName);
    if (params.roomNumber) queryParams.append('roomNumber', params.roomNumber);
    if (params.alertDateFrom) queryParams.append('alertDateFrom', params.alertDateFrom.toISOString());
    if (params.alertDateTo) queryParams.append('alertDateTo', params.alertDateTo.toISOString());

    const url = `/late-returns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<LateReturnAlert>>(url);
  },

  getPendingLateReturns: async (): Promise<LateReturnAlert[]> => {
    return request<LateReturnAlert[]>('/late-returns/pending');
  },

  handleLateReturn: async (id: string, handler: {
    handler: string;
    comment: string;
    status: 'Handled' | 'Ignored';
  }): Promise<LateReturnAlert> => {
    return request<LateReturnAlert>(`/late-returns/${id}/handle`, {
      method: 'POST',
      body: JSON.stringify(handler),
    });
  },

  // --- 换寝申请系统 API ---
  getRoomSwapApplicationsPaginated: async (params: PaginatedRequest & RoomSwapFilter): Promise<PaginatedResponse<RoomSwapApplication>> => {
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 筛选参数
    if (params.status) queryParams.append('status', params.status);
    if (params.currentStep) queryParams.append('currentStep', params.currentStep);
    if (params.applicantName) queryParams.append('applicantName', params.applicantName);
    if (params.urgencyLevel) queryParams.append('urgencyLevel', params.urgencyLevel);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) queryParams.append('dateTo', params.dateTo.toISOString());

    const url = `/room-swaps${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<PaginatedResponse<RoomSwapApplication>>(url);
  },

  getMyRoomSwapApplications: async (): Promise<RoomSwapApplication[]> => {
    return request<RoomSwapApplication[]>('/room-swaps/my-applications');
  },

  getPendingRoomSwapApplications: async (): Promise<RoomSwapApplication[]> => {
    return request<RoomSwapApplication[]>('/room-swaps/pending');
  },

  createRoomSwapApplication: async (application: {
    targetRoom: string;
    reason: string;
    urgencyLevel: 'Normal' | 'Urgent' | 'VeryUrgent';
  }): Promise<RoomSwapApplication> => {
    return request<RoomSwapApplication>('/room-swaps', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  },

  approveRoomSwapApplication: async (id: string, approval: {
    approverId: string;
    approverRole: string;
    status: 'Approved' | 'Rejected';
    comment?: string;
  }): Promise<RoomSwapApplication> => {
    return request<RoomSwapApplication>(`/room-swaps/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(approval),
    });
  },

  cancelRoomSwapApplication: async (id: string): Promise<void> => {
    await request(`/room-swaps/${id}`, { method: 'DELETE' });
  },

  getRoomSwapHistory: async (): Promise<RoomSwapHistory[]> => {
    return request<RoomSwapHistory[]>('/room-swaps/history');
  },

  getAvailableRooms: async (): Promise<Array<{ number: string; building: string; capacity: number; occupied: number }>> => {
    return request<Array<{ number: string; building: string; capacity: number; occupied: number }>>('/room-swaps/available');
  },

  // --- Dashboard API ---
  getDashboardStats: async () => {
    return request<{
      totalStudents: number;
      occupancyRate: number;
      pendingRepairs: number;
      completedRepairs: number;
      occupancyData: Array<{ name: string; occupied: number; capacity: number }>;
      requestStatus: Array<{ name: string; value: number; color: string }>;
    }>('/dashboard/stats');
  },
};