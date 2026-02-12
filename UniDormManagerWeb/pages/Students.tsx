import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, User, GraduationCap, School, Plus, X, Edit, Trash2, LogIn, LogOut, ArrowRightLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Student, Room } from '../types';
import { api } from '../services/api';
import { useStudents } from '../hooks/usePaginatedData';
import Pagination from '../components/Pagination';

const Students: React.FC = () => {
  // 使用分页Hook
  const [studentsState, studentsActions] = useStudents({
    pageSize: 20,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  // 根据筛选条件过滤学生数据
  const displayStudents = useMemo(() => {
    if (filter === 'NoRoom') {
      return studentsState.data.filter(s => s.roomNumber === '-' || !s.roomNumber);
    }
    return studentsState.data;
  }, [studentsState.data, filter]);

  // Load rooms on mount (rooms data is still needed for UI)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setRoomsLoading(true);
        setRoomsError(null);
        const roomsData = await api.getRooms();
        setRooms(roomsData);
      } catch (err: any) {
        console.error('Failed to load rooms:', err);
        setRoomsError(err.message || '加载房间数据失败');
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Sync search and filters with pagination hook
  useEffect(() => {
    studentsActions.setFilters({
      status: filter,
    });
  }, [filter, studentsActions]);

  // Student Form Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<Partial<Student>>({
    name: '',
    studentId: '',
    major: '',
    status: 'Active'
  });

  // Room Assignment Modal State (Check-in / Exchange)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomActionType, setRoomActionType] = useState<'CheckIn' | 'Exchange'>('CheckIn');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  // CRUD Operations
  const handleCreateStudent = async () => {
    if (!studentForm.name || !studentForm.studentId || !studentForm.major) {
      alert('请填写完整的学生信息');
      return;
    }

    try {
      const newStudent = await api.createStudent({
        name: studentForm.name,
        studentId: studentForm.studentId,
        major: studentForm.major,
        status: studentForm.status as Student['status'] || 'Active'
      });
      studentsActions.refresh(); // Refresh paginated data
      setIsStudentModalOpen(false);
      setStudentForm({ name: '', studentId: '', major: '', status: 'Active' });
    } catch (err: any) {
      alert(err.message || '创建学生失败');
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingId || !studentForm.name || !studentForm.studentId || !studentForm.major) {
      alert('请填写完整的学生信息');
      return;
    }

    try {
      const updatedStudent = await api.updateStudent(editingId, {
        name: studentForm.name,
        studentId: studentForm.studentId,
        major: studentForm.major,
        roomNumber: studentForm.roomNumber,
        status: studentForm.status as Student['status'] || 'Active'
      });
      studentsActions.refresh(); // Refresh paginated data
      setIsStudentModalOpen(false);
      setEditingId(null);
      setStudentForm({ name: '', studentId: '', major: '', status: 'Active' });
    } catch (err: any) {
      alert(err.message || '更新学生失败');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`确定要删除学生 "${name}" 吗？此操作不可撤销。`)) {
      try {
        await api.deleteStudent(id);
        studentsActions.refresh(); // Refresh paginated data
      } catch (err: any) {
        alert(err.message || '删除学生失败');
      }
    }
  };

  const openStudentModal = (student?: Student) => {
    if (student) {
      setEditingId(student.id);
      setStudentForm({
        name: student.name,
        studentId: student.studentId,
        major: student.major,
        status: student.status
      });
    } else {
      setEditingId(null);
      setStudentForm({ name: '', studentId: '', major: '', status: 'Active' });
    }
    setIsStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    setIsStudentModalOpen(false);
    setEditingId(null);
    setStudentForm({ name: '', studentId: '', major: '', status: 'Active' });
  };

  // Room Assignment Functions
  const openRoomModal = (student: Student, type: 'CheckIn' | 'Exchange') => {
    setSelectedStudent(student);
    setRoomActionType(type);
    setSelectedRoom(''); // Reset selection
    setIsRoomModalOpen(true);
  };

  const handleRoomAssignment = async () => {
    if (!selectedStudent || !selectedRoom) return;

    try {
      const updated = await api.updateStudent(selectedStudent.id, {
        roomNumber: selectedRoom,
        status: 'Active', // Auto set to Active on check-in
      });
      studentsActions.refresh(); // Refresh paginated data
      setIsRoomModalOpen(false);
      setSelectedStudent(null);
      setSelectedRoom('');
    } catch (err: any) {
      alert(err.message || '分配房间失败');
    }
  };

  const handleCheckOut = async (student: Student) => {
    if (window.confirm(`确定要为 ${student.name} 办理退宿吗？\n该操作将清空其宿舍信息。`)) {
      try {
        const updated = await api.updateStudent(student.id, {
          roomNumber: '-',
        });
        studentsActions.refresh(); // Refresh paginated data
      } catch (err: any) {
        alert(err.message || '退宿失败');
      }
    }
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    studentsActions.setSearch(value);
  };

  // Get available rooms for assignment
  const getAvailableRooms = () => {
    if (!selectedStudent) return [];
    return rooms.filter(r => r.status === 'Available' && r.number !== selectedStudent.roomNumber);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              学生管理
            </h1>
            <p className="text-gray-600 mt-2">管理学生信息、住宿分配和状态追踪</p>
          </div>
          <button
            onClick={() => openStudentModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            添加学生
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索学生姓名、学号或专业..."
              value={studentsState.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Graduated', 'On Leave', 'NoRoom'].map((val) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {val === 'All' ? '全部' :
                 val === 'Active' ? '在校' :
                 val === 'Graduated' ? '毕业' : val === 'NoRoom' ? '未分配宿舍' : '休学'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {(studentsState.loading || roomsLoading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        )}

        {/* Error State */}
        {(studentsState.error || roomsError) && (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span className="ml-2 text-red-600">
              {studentsState.error || roomsError || '加载数据失败'}
            </span>
          </div>
        )}

        {/* Students Table */}
        {!studentsState.loading && !studentsState.error && !roomsLoading && !roomsError && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学生信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      专业
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      宿舍
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {studentsState.search || filter !== 'All' ? '没有找到匹配的学生' : '暂无学生数据'}
                      </td>
                    </tr>
                  ) : (
                    displayStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.major}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <School className="w-4 h-4 text-gray-400 mr-2" />
                            <span className={`text-sm ${
                              student.roomNumber === '-' || !student.roomNumber
                                ? 'text-gray-400'
                                : 'text-gray-900'
                            }`}>
                              {(student.building && student.roomNumber && student.roomNumber !== '-') ? `${student.building}-${student.roomNumber}` : (student.roomNumber === '-' || !student.roomNumber ? '未分配' : student.roomNumber)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'Graduated'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.status === 'Active' ? '在校' :
                             student.status === 'Graduated' ? '毕业' : '休学'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openStudentModal(student)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="编辑学生信息"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRoomModal(student, student.roomNumber && student.roomNumber !== '-' ? 'Exchange' : 'CheckIn')}
                              className="text-blue-600 hover:text-blue-900"
                              title={student.roomNumber && student.roomNumber !== '-' ? '更换宿舍' : '分配宿舍'}
                            >
                              {student.roomNumber && student.roomNumber !== '-' ? (
                                <ArrowRightLeft className="w-4 h-4" />
                              ) : (
                                <LogIn className="w-4 h-4" />
                              )}
                            </button>
                            {student.roomNumber && student.roomNumber !== '-' && (
                              <button
                                onClick={() => handleCheckOut(student)}
                                className="text-orange-600 hover:text-orange-900"
                                title="办理退宿"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="text-red-600 hover:text-red-900"
                              title="删除学生"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={studentsState.page}
              totalPages={studentsState.totalPages}
              total={studentsState.total}
              pageSize={studentsState.pageSize}
              onPageChange={studentsActions.setPage}
              loading={studentsState.loading}
            />
          </div>
        )}
      </div>

      {/* Student Form Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? '编辑学生' : '添加学生'}
              </h2>
              <button onClick={closeStudentModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学号</label>
                <input
                  type="text"
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                <input
                  type="text"
                  value={studentForm.major}
                  onChange={(e) => setStudentForm({ ...studentForm, major: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={studentForm.status}
                  onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as Student['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Active">在校</option>
                  <option value="On Leave">休学</option>
                  <option value="Graduated">毕业</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={editingId ? handleUpdateStudent : handleCreateStudent}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {editingId ? '更新' : '创建'}
              </button>
              <button
                onClick={closeStudentModal}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Assignment Modal */}
      {isRoomModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {roomActionType === 'CheckIn' ? '分配宿舍' : '更换宿舍'}
              </h2>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                为学生 <span className="font-medium">{selectedStudent.name}</span> ({selectedStudent.studentId})
                {roomActionType === 'Exchange' && (
                  <> 从宿舍 <span className="font-medium">{selectedStudent.roomNumber}</span></>
                )}
              </p>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getAvailableRooms().length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无可分配的宿舍</p>
              ) : (
                getAvailableRooms().map(room => (
                  <label key={room.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="room"
                      value={room.number}
                      checked={selectedRoom === room.number}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{room.number}</div>
                      <div className="text-sm text-gray-500">
                        {room.building} • {room.occupied}/{room.capacity} 人
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleRoomAssignment}
                disabled={!selectedRoom || getAvailableRooms().length === 0}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认{roomActionType === 'CheckIn' ? '入住' : '更换'}
              </button>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;