import React, { useState, useEffect } from 'react';
import { Search, User, GraduationCap, School, Plus, X, Edit, Trash2, LogIn, LogOut, ArrowRightLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Student, Room } from '../types';
import { api } from '../services/api';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Load students and rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [studentsData, roomsData] = await Promise.all([
          api.getStudents(),
          api.getRooms(),
        ]);
        setStudents(studentsData);
        setRooms(roomsData);
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const filteredStudents = students.filter(student => 
    (filter === 'All' || student.status === filter) &&
    (student.name.includes(searchTerm) || student.studentId.includes(searchTerm) || student.major.includes(searchTerm))
  );

  // --- Student CRUD Operations ---

  const handleSaveStudent = async () => {
    if (!studentForm.name || !studentForm.studentId) return;

    try {
      if (editingId) {
        const updated = await api.updateStudent(editingId, {
          name: studentForm.name,
          studentId: studentForm.studentId,
          major: studentForm.major,
          status: studentForm.status,
        });
        setStudents(students.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.createStudent({
          name: studentForm.name!,
          studentId: studentForm.studentId!,
          major: studentForm.major || '未分配',
          status: (studentForm.status as any) || 'Active',
        });
        setStudents([...students, { ...created, roomNumber: '-' }]);
      }
      closeStudentModal();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setStudentForm({ 
      name: student.name,
      studentId: student.studentId,
      major: student.major,
      status: student.status
    });
    setIsStudentModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('确定要删除这位学生的信息吗？此操作无法撤销。')) {
      try {
        await api.deleteStudent(id);
        setStudents(students.filter(s => s.id !== id));
      } catch (err: any) {
        alert(err.message || '删除失败');
      }
    }
  };

  const closeStudentModal = () => {
    setIsStudentModalOpen(false);
    setEditingId(null);
    setStudentForm({ name: '', studentId: '', major: '', status: 'Active' });
  };

  // --- Room Operations (Check-in, Exchange, Check-out) ---

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
      setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
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
        setStudents(students.map(s => s.id === student.id ? updated : s));
      } catch (err: any) {
        alert(err.message || '退宿失败');
      }
    }
  };

  // --- Helper Renderers ---

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">在校</span>;
      case 'Graduated': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">毕业</span>;
      case 'On Leave': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">休学</span>;
      default: return status;
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">学生管理</h1>
          <p className="text-slate-500">办理入住、退宿及信息维护</p>
        </div>
        <button 
          onClick={() => setIsStudentModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>添加学生</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索姓名、学号或专业..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['All', 'Active', 'On Leave', 'Graduated'].map(val => (
            <button 
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === val
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {val === 'All' ? '全部' : val === 'Active' ? '在校' : val === 'On Leave' ? '休学' : '毕业'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <p className="text-slate-500">加载中...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 font-medium">加载失败: {error}</p>
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">学生信息</th>
                  <th className="px-6 py-4">学号/专业</th>
                  <th className="px-6 py-4">宿舍号</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4 text-center">住宿操作</th>
                  <th className="px-6 py-4 text-center">信息管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      暂无学生数据
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                const hasRoom = student.roomNumber && student.roomNumber !== '-';
                return (
                  <tr key={student.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-700">{student.studentId}</span>
                        <span className="text-xs text-slate-500">{student.major}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`font-medium px-2 py-1 rounded text-xs ${
                         hasRoom ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                       }`}>
                         {hasRoom ? `${student.roomNumber}室` : '未分配'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(student.status)}
                    </td>
                    
                    {/* Accommodation Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!hasRoom ? (
                           <button 
                             onClick={() => openRoomModal(student, 'CheckIn')}
                             className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-medium transition-colors"
                             title="办理入住"
                           >
                             <LogIn size={14} /> 入住
                           </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => openRoomModal(student, 'Exchange')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-medium transition-colors"
                              title="更换宿舍"
                            >
                              <ArrowRightLeft size={14} /> 换宿
                            </button>
                            <button 
                              onClick={() => handleCheckOut(student)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 text-xs font-medium transition-colors"
                              title="办理退宿"
                            >
                              <LogOut size={14} /> 退宿
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Info Management Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="text-slate-500 hover:text-indigo-600 transition-colors p-1"
                          title="编辑资料"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(student.id)}
                          className="text-slate-500 hover:text-red-600 transition-colors p-1"
                          title="删除学生"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

       {/* Add/Edit Student Modal */}
       {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">
                {editingId ? '编辑学生档案' : '新建学生档案'}
              </h3>
              <button onClick={closeStudentModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">姓名</label>
                <input 
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">学号</label>
                <input 
                  type="text"
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({...studentForm, studentId: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">专业</label>
                <input 
                  type="text"
                  value={studentForm.major}
                  onChange={(e) => setStudentForm({...studentForm, major: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">学籍状态</label>
                <select 
                  value={studentForm.status}
                  onChange={(e) => setStudentForm({...studentForm, status: e.target.value as any})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">在校</option>
                  <option value="On Leave">休学</option>
                  <option value="Graduated">毕业</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeStudentModal} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">取消</button>
              <button onClick={handleSaveStudent} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm">{editingId ? '保存' : '创建'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Assignment Modal (Check In / Exchange) */}
      {isRoomModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${roomActionType === 'CheckIn' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <h3 className={`font-bold text-lg ${roomActionType === 'CheckIn' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {roomActionType === 'CheckIn' ? '办理入住' : '更换宿舍'}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                   {selectedStudent.name.charAt(0)}
                </div>
                <div>
                   <p className="font-bold text-slate-900">{selectedStudent.name}</p>
                   <p className="text-xs text-slate-500">学号: {selectedStudent.studentId}</p>
                </div>
                {roomActionType === 'Exchange' && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500">当前宿舍</p>
                    <p className="font-bold text-slate-800">{selectedStudent.roomNumber}室</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                 <label className="block text-sm font-medium text-slate-700">选择新房间</label>
                 <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {rooms
                      .filter(r => r.status === 'Available' && r.number !== selectedStudent.roomNumber)
                      .map(room => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.number)}
                        disabled={room.occupied >= room.capacity}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          selectedRoom === room.number 
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                            : room.occupied >= room.capacity
                              ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-slate-900">{room.number}室</span>
                           {selectedRoom === room.number && <CheckCircle size={16} className="text-indigo-600" />}
                         </div>
                         <div className="text-xs text-slate-500 flex justify-between">
                            <span>{room.building}</span>
                            <span className={room.occupied >= room.capacity ? 'text-red-500' : 'text-emerald-600'}>
                              {room.occupied >= room.capacity ? '已满' : `余 ${room.capacity - room.occupied}`}
                            </span>
                         </div>
                      </button>
                    ))}
                    {rooms.filter(r => r.status === 'Available' && r.number !== selectedStudent.roomNumber).length === 0 && (
                      <div className="col-span-2 text-center py-4 text-slate-400 text-sm">
                        暂无可用房间
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">取消</button>
              <button 
                onClick={handleRoomAssignment} 
                disabled={!selectedRoom}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认{roomActionType === 'CheckIn' ? '入住' : '更换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;