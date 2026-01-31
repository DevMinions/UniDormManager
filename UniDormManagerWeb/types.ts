
export interface Student {
  id: string;
  name: string;
  studentId: string;
  major: string;
  roomNumber: string;
  status: 'Active' | 'Graduated' | 'On Leave';
  counselorId?: string;
}

export interface Building {
  id: string;
  name: string;
  type: 'Male' | 'Female' | 'Co-ed';
  floors: number;
  manager: string;
  description: string;
}

export interface Room {
  id: string;
  number: string;
  buildingId: string;
  buildingName?: string;
  building?: string; // For convenience, displays full building name
  capacity: number;
  occupied: number;
  type: 'Male' | 'Female' | 'Co-ed';
  status: 'Available' | 'Full' | 'Maintenance';
  floor?: number; // Floor number
}

// --- New Types ---

// Added ChatMessage for AI assistant
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Added RepairRequest for repair management
export interface RepairRequest {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  date: string;
  roomNumber: string;
  priority: 'Low' | 'Medium' | 'High';
}

// Added Notice for announcements
export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

// 查寝评分系统
export interface Inspection {
  id: string;
  roomNumber: string;
  building: string;
  inspector: string;
  checkDate: string;
  overallScore: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionDetail {
  id: string;
  inspectionId: string;
  category: 'Hygiene' | 'Safety' | 'Discipline' | 'AirQuality';
  item: string;
  score: number;
  maxScore: number;
  comment: string;
  photoUrl?: string;
}

export interface InspectionRanking {
  id: string;
  roomNumber: string;
  building: string;
  weekScore: number;
  monthScore: number;
  rank: number;
  totalRooms: number;
  isRedList: boolean;
  isBlackList: boolean;
  lastUpdated: string;
}

// 晚归报警系统
export interface AccessLog {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  direction: 'In' | 'Out';
  gateName: string;
  timestamp: string;
  photoUrl?: string;
  status: 'Normal' | 'Late' | 'Absent';
  createdAt: string;
}

export interface LateReturnAlert {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  alertDate: string;
  lastEntry?: string;
  status: 'Pending' | 'Handled' | 'Ignored';
  handler?: string;
  handleTime?: string;
  comment?: string;
  notifySent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurfewSetting {
  id: string;
  building: string;
  weekdayTime: string;
  weekendTime: string;
  alertDelay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 线上换寝申请系统
export interface RoomSwapApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  currentRoom: string;
  currentRoommate?: string;
  targetRoom: string;
  targetRoommate?: string;
  reason: string;
  urgencyLevel: 'Normal' | 'Urgent' | 'VeryUrgent';
  status: 'Pending' | 'CounselorApproved' | 'CounselorRejected' | 'CollegeApproved' | 'CollegeRejected' | 'FinalApproved' | 'FinalRejected' | 'Completed' | 'Cancelled';
  currentStep: 'Counselor' | 'College' | 'ApartmentCenter';
  applyDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFlow {
  id: string;
  applicationId: string;
  step: 'Counselor' | 'College' | 'ApartmentCenter';
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'Approved' | 'Rejected';
  comment?: string;
  approvalTime: string;
  nextStep?: string;
  createdAt: string;
}

export interface RoomSwapHistory {
  id: string;
  studentId: string;
  studentName: string;
  fromRoom: string;
  toRoom: string;
  swapDate: string;
  reason: string;
  applicationId: string;
  createdAt: string;
}

// Existing RBAC Types
export interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'special';
  description: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  permissionIds: string[];
  isSystem?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roleIds: string[];
  studentId?: string;
  buildingId?: string;
  avatar?: string;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 学生筛选条件接口
export interface StudentFilter {
  status?: string;
  major?: string;
  room?: string;
  building?: string;
}

// 房间筛选条件接口
export interface RoomFilter {
  status?: string;
  building?: string;
  type?: string;
  floor?: number;
  capacityMin?: number;
  capacityMax?: number;
}

// 维修申请筛选条件接口
export interface RepairFilter {
  status?: string;
  priority?: string;
  studentId?: string;
  roomNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// 查寝筛选条件接口
export interface InspectionFilter {
  status?: string;
  building?: string;
  inspector?: string;
  dateFrom?: Date;
  dateTo?: Date;
  scoreMin?: number;
  scoreMax?: number;
}

// 门禁记录筛选条件接口
export interface AccessLogFilter {
  direction?: string;
  studentName?: string;
  roomNumber?: string;
  gateName?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// 晚归告警筛选条件接口
export interface LateReturnFilter {
  status?: string;
  studentName?: string;
  roomNumber?: string;
  alertDateFrom?: Date;
  alertDateTo?: Date;
}

// 换寝申请筛选条件接口
export interface RoomSwapFilter {
  status?: string;
  currentStep?: string;
  applicantName?: string;
  urgencyLevel?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
