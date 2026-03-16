import { describe, it, expect } from 'vitest';

// Utility function to calculate occupancy rate
export const calculateOccupancyRate = (occupied: number, capacity: number): number => {
  if (capacity === 0) return 0;
  return Math.round((occupied / capacity) * 100);
};

// Utility function to format date
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Utility function to format time
export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Utility function to get status color
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // 旧格式（兼容）
    Active: 'green',
    Inactive: 'gray',
    Suspended: 'red',
    Pending: 'yellow',
    'In Progress': 'blue',
    Completed: 'green',
    Available: 'green',
    Full: 'red',
    Maintenance: 'orange',
    Excellent: 'green',
    Good: 'blue',
    Fair: 'yellow',
    Poor: 'red',
    // 新格式（小写）
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    good: 'blue',
    fair: 'yellow',
    poor: 'red',
    excellent: 'green',
  };
  return colors[status] || 'gray';
};

// Utility function to get status text
export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    // 旧格式（兼容）
    Active: '活跃',
    Inactive: '未激活',
    Suspended: '暂停',
    Pending: '待处理',
    'In Progress': '进行中',
    Completed: '已完成',
    Available: '可用',
    Full: '已满',
    Maintenance: '维护中',
    Excellent: '优秀',
    Good: '良好',
    Fair: '一般',
    Poor: '较差',
    // 新格式（小写）
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    good: '良好',
    fair: '一般',
    poor: '较差',
    excellent: '优秀',
  };
  return texts[status] || status;
};

// Utility function to get priority color
export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    Low: 'green',
    Medium: 'yellow',
    High: 'red',
  };
  return colors[priority] || 'gray';
};

// Utility function to validate student ID
export const isValidStudentId = (studentId: string): boolean => {
  const regex = /^\d{4,10}$/;
  return regex.test(studentId);
};

// Utility function to validate phone number
export const isValidPhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

// Utility function to validate email
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

describe('Utility Functions', () => {
  describe('calculateOccupancyRate', () => {
    it('should calculate occupancy rate correctly', () => {
      expect(calculateOccupancyRate(4, 4)).toBe(100);
      expect(calculateOccupancyRate(2, 4)).toBe(50);
      expect(calculateOccupancyRate(0, 4)).toBe(0);
      expect(calculateOccupancyRate(1, 3)).toBe(33);
    });

    it('should handle zero capacity', () => {
      expect(calculateOccupancyRate(0, 0)).toBe(0);
      expect(calculateOccupancyRate(4, 0)).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024/01/15');
      expect(formatDate('2024-12-31')).toBe('2024/12/31');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for statuses', () => {
      expect(getStatusColor('Active')).toBe('green');
      expect(getStatusColor('Pending')).toBe('yellow');
      expect(getStatusColor('Completed')).toBe('green');
      expect(getStatusColor('Full')).toBe('red');
      expect(getStatusColor('Unknown')).toBe('gray');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for statuses', () => {
      expect(getStatusText('Active')).toBe('活跃');
      expect(getStatusText('Pending')).toBe('待处理');
      expect(getStatusText('Completed')).toBe('已完成');
      expect(getStatusText('Unknown')).toBe('Unknown');
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct colors for priorities', () => {
      expect(getPriorityColor('Low')).toBe('green');
      expect(getPriorityColor('Medium')).toBe('yellow');
      expect(getPriorityColor('High')).toBe('red');
      expect(getPriorityColor('Unknown')).toBe('gray');
    });
  });

  describe('isValidStudentId', () => {
    it('should validate student ID correctly', () => {
      expect(isValidStudentId('2023001')).toBe(true);
      expect(isValidStudentId('1234567890')).toBe(true);
      expect(isValidStudentId('123')).toBe(false);
      expect(isValidStudentId('abc123')).toBe(false);
      expect(isValidStudentId('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate phone number correctly', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('15912345678')).toBe(true);
      expect(isValidPhone('12345678901')).toBe(false);
      expect(isValidPhone('1380013800')).toBe(false);
      expect(isValidPhone('abc12345678')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user@unidorm.edu')).toBe(true);
      expect(isValidEmail('test@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });
});
