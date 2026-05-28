import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { PaginatedResponse, Student, Room, RepairRequest, Inspection, AccessLog, LateReturnAlert, RoomSwapApplication } from '../types';

export interface UsePaginatedDataOptions {
  apiFunction: (params: any) => Promise<PaginatedResponse<any>>;
  pageSize?: number;
  filters?: Record<string, any>;
  initialPage?: number;
}

export interface PaginatedDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedDataActions<T> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

export function usePaginatedData<T = any>({
  apiFunction,
  pageSize = 20,
  filters = {},
  initialPage = 1,
}: UsePaginatedDataOptions): [PaginatedDataState<T>, PaginatedDataActions<T>] {
  const [state, setState] = useState<PaginatedDataState<T>>({
    data: [],
    loading: false,
    error: null,
    page: initialPage,
    pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    search: '',
    sortBy: undefined,
    sortOrder: 'desc',
  });

  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(filters);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 防抖搜索：延迟 300ms 后才真正触发搜索
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(state.search);
      setState(prev => ({ ...prev, page: initialPage }));
    }, 300);

    return () => clearTimeout(timeout);
  }, [state.search, initialPage]);

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = {
        page: state.page,
        pageSize: state.pageSize,
        search: debouncedSearch || undefined,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...currentFilters,
      };

      const response = await apiFunction(params);

      const totalPages = Math.ceil(response.total / response.pageSize);
      setState(prev => ({
        ...prev,
        data: response.data,
        total: response.total,
        totalPages,
        hasNext: prev.page < totalPages,
        hasPrev: prev.page > 1,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [apiFunction, state.page, state.pageSize, debouncedSearch, state.sortBy, state.sortOrder, currentFilters]);

  // 自动加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 使用Ref保持最新的loadData引用，以便refresh函数保持稳定
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  const actions = useMemo<PaginatedDataActions<T>>(() => ({
    setPage: (page: number) => setState(prev => ({ ...prev, page })),
    setPageSize: (size: number) => setState(prev => ({ ...prev, pageSize: size, page: 1 })),
    setSearch: (search: string) => setState(prev => ({ ...prev, search })),
    setFilters: (filters: Record<string, any>) => {
      setCurrentFilters(filters);
      setState(prev => ({ ...prev, page: 1 }));
    },
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') =>
      setState(prev => ({ ...prev, sortBy, sortOrder })),
    refresh: () => loadDataRef.current(),
    nextPage: () => setState(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) })),
    prevPage: () => setState(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) })),
    firstPage: () => setState(prev => ({ ...prev, page: 1 })),
    lastPage: () => setState(prev => ({ ...prev, page: prev.totalPages })),
  }), []);

  return [state, actions];
}

// 专用于学生数据的API函数
const defaultGetStudents = async (params: any): Promise<PaginatedResponse<Student>> => {
  return api.getStudentsPaginated(params);
};

// 专用于学生数据的Hook
export function useStudents(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<Student>({
    apiFunction: apiFunction || defaultGetStudents,
    pageSize: 20,
    ...restOptions,
  });
}

// 专用于房间数据的API函数
const defaultGetRooms = async (params: any): Promise<PaginatedResponse<Room>> => {
  return api.getRoomsPaginated(params);
};

// 专用于房间数据的Hook
export function useRooms(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<Room>({
    apiFunction: apiFunction || defaultGetRooms,
    pageSize: 20,
    ...restOptions,
  });
}

// 专用于维修申请数据的API函数
const defaultGetRepairRequests = async (params: any): Promise<PaginatedResponse<RepairRequest>> => {
  return api.getRepairRequestsPaginated(params);
};

// 专用于维修申请数据的Hook
export function useRepairRequests(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<RepairRequest>({
    apiFunction: apiFunction || defaultGetRepairRequests,
    pageSize: 20,
    ...restOptions,
  });
}

// 专用于查寝评分数据的API函数
const defaultGetInspections = async (params: any): Promise<PaginatedResponse<Inspection>> => {
  return api.getInspectionsPaginated(params);
};

// 专用于查寝评分数据的Hook
export function useInspections(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<Inspection>({
    apiFunction: apiFunction || defaultGetInspections,
    pageSize: 20,
    ...restOptions,
  });
}

// 专用于门禁记录数据的API函数
const defaultGetAccessLogs = async (params: any): Promise<PaginatedResponse<AccessLog>> => {
  return api.getAccessLogsPaginated(params);
};

// 专用于门禁记录数据的Hook
export function useAccessLogs(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<AccessLog>({
    apiFunction: apiFunction || defaultGetAccessLogs,
    pageSize: 30, // 门禁记录显示更多条目
    ...restOptions,
  });
}

// 专用于晚归告警数据的API函数
const defaultGetLateReturnAlerts = async (params: any): Promise<PaginatedResponse<LateReturnAlert>> => {
  return api.getLateReturnAlertsPaginated(params);
};

// 专用于晚归告警数据的Hook
export function useLateReturnAlerts(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<LateReturnAlert>({
    apiFunction: apiFunction || defaultGetLateReturnAlerts,
    pageSize: 20,
    ...restOptions,
  });
}

// 专用于换寝申请数据的API函数
const defaultGetRoomSwapApplications = async (params: any): Promise<PaginatedResponse<RoomSwapApplication>> => {
  return api.getRoomSwapApplicationsPaginated(params);
};

// 专用于换寝申请数据的Hook
export function useRoomSwapApplications(options?: Partial<UsePaginatedDataOptions>) {
  const { apiFunction, ...restOptions } = options || {};

  return usePaginatedData<RoomSwapApplication>({
    apiFunction: apiFunction || defaultGetRoomSwapApplications,
    pageSize: 20,
    ...restOptions,
  });
}