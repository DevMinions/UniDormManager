import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Users, LayoutGrid, List, X, Edit, Eye, Info, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Room, Student, Building } from '../types';
import { api } from '../services/api';

const RoomManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [roomsData, studentsData, buildingsData] = await Promise.all([
          api.getRooms(),
          api.getStudents(),
          api.getBuildings(),
        ]);
        setRooms(roomsData);
        setStudents(studentsData);
        setBuildings(buildingsData);
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Edit & Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    number: '',
    building: 'A栋',
    capacity: 4,
    occupied: 0,
    type: 'Male',
    status: 'Available'
  });

  // Details Modal State
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);

  // Initialize search from URL params (e.g., coming from Buildings page)
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Reload rooms after operations
  const reloadRooms = async () => {
    try {
      const roomsData = await api.getRooms();
      setRooms(roomsData);
    } catch (err: any) {
      console.error('Failed to reload rooms:', err);
    }
  };

  const filteredRooms = rooms.filter(room => 
    (filter === 'All' || room.status === filter) &&
    (room.number.includes(searchTerm) || room.building.includes(searchTerm))
  );

  const handleSaveRoom = async () => {
    if (!newRoom.number || !newRoom.building) return;
    
    try {
      if (editingId) {
        const updated = await api.updateRoom(editingId, {
          number: newRoom.number,
          building: newRoom.building,
          capacity: Number(newRoom.capacity) || 4,
          occupied: Number(newRoom.occupied) || 0,
          type: newRoom.type,
          status: newRoom.status,
        });
        setRooms(rooms.map(room => room.id === editingId ? updated : room));
      } else {
        const created = await api.createRoom({
          number: newRoom.number,
          building: newRoom.building || 'A栋',
          capacity: Number(newRoom.capacity) || 4,
          occupied: Number(newRoom.occupied) || 0,
          type: (newRoom.type as any) || 'Male',
          status: (newRoom.status as any) || 'Available',
        });
        setRooms([...rooms, created]);
      }
      closeModal();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingId(room.id);
    setNewRoom({ ...room });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewRoom({
      number: '',
      building: 'A栋',
      capacity: 4,
      occupied: 0,
      type: 'Male',
      status: 'Available'
    });
  };

  const getStatusColor = (status: Room['status']) => {
    switch(status) {
      case 'Available': return 'bg-emerald-100 text-emerald-700';
      case 'Full': return 'bg-slate-100 text-slate-700';
      case 'Maintenance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: Room['status']) => {
    switch(status) {
      case 'Available': return '可入住';
      case 'Full': return '已满';
      case 'Maintenance': return '维修中';
      default: return status;
    }
  };
  
  const getTypeText = (type: Room['type']) => {
    switch(type) {
      case 'Male': return '男生宿舍';
      case 'Female': return '女生宿舍';
      case 'Co-ed': return '混合宿舍';
      default: return type;
    }
  };

  // Filter residents for the viewing room
  const viewingResidents = viewingRoom 
    ? students.filter(s => s.roomNumber === viewingRoom.number)
    : [];

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">宿舍管理</h1>
          <p className="text-slate-500">管理宿舍分配与状态</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus size={18} />
          <span>添加房间</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索房间号或楼栋..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { label: '全部', value: 'All' },
            { label: '可入住', value: 'Available' },
            { label: '已满', value: 'Full' },
            { label: '维修中', value: 'Maintenance' }
          ].map(f => (
            <button 
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            <List size={18} />
          </button>
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

      {/* Grid View */}
      {!loading && !error && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无房间数据</p>
            </div>
          ) : (
            filteredRooms.map(room => (
            <div key={room.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {room.number} 室
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(room.status)}`}>
                      {getStatusText(room.status)}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500">{room.building}</p>
                </div>
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Users size={16} />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">类型</span>
                  <span className="font-medium text-slate-900">{getTypeText(room.type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">入住情况</span>
                  <span className="font-medium text-slate-900">{room.occupied} / {room.capacity} 人</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      room.occupied === room.capacity 
                        ? 'bg-red-500' 
                        : room.occupied > 0 
                          ? 'bg-indigo-500' 
                          : 'bg-slate-300'
                    }`} 
                    style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                 <button 
                   onClick={() => setViewingRoom(room)}
                   className="flex-1 text-sm py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                 >
                   <Eye size={14} />
                   详情
                 </button>
                 <button 
                   onClick={() => handleEditClick(room)}
                   className="flex-1 text-sm py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                 >
                   <Edit size={14} />
                   编辑
                 </button>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* List View */}
      {!loading && !error && viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">房间号</th>
                <th className="px-6 py-4">楼栋</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4">入住情况</th>
                <th className="px-6 py-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    暂无房间数据
                  </td>
                </tr>
              ) : (
                filteredRooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{room.number}</td>
                    <td className="px-6 py-4 text-slate-600">{room.building}</td>
                    <td className="px-6 py-4 text-slate-600">{getTypeText(room.type)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(room.status)}`}>
                        {getStatusText(room.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{room.occupied}/{room.capacity}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setViewingRoom(room)} className="text-slate-400 hover:text-indigo-600 font-medium text-xs flex items-center gap-1">
                          <Eye size={14} /> 详情
                        </button>
                        <button onClick={() => handleEditClick(room)} className="text-slate-400 hover:text-indigo-600 font-medium text-xs flex items-center gap-1">
                           <Edit size={14} /> 编辑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">
                {editingId ? '编辑房间信息' : '添加新房间'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">楼栋</label>
                  <select 
                    value={newRoom.building}
                    onChange={(e) => setNewRoom({...newRoom, building: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {buildings.length > 0 ? (
                      buildings.map(building => (
                        <option key={building.id} value={building.name}>{building.name}</option>
                      ))
                    ) : (
                      <option value="">请先创建楼栋</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">房间号</label>
                  <input 
                    type="text"
                    value={newRoom.number}
                    onChange={(e) => setNewRoom({...newRoom, number: e.target.value})}
                    placeholder="例如: 101"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">房间类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Co-ed'].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewRoom({...newRoom, type: type as any})}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        newRoom.type === type 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {getTypeText(type as any)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase">床位数量 (容量)</label>
                 <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({...newRoom, capacity: Number(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="w-8 text-center font-bold text-indigo-600 text-lg">{newRoom.capacity}</span>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">当前入住人数</label>
                <input 
                  type="number"
                  min="0"
                  max={newRoom.capacity}
                  value={newRoom.occupied}
                  onChange={(e) => setNewRoom({...newRoom, occupied: Number(e.target.value)})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

               <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">当前状态</label>
                <select 
                    value={newRoom.status}
                    onChange={(e) => setNewRoom({...newRoom, status: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Available">可入住</option>
                    <option value="Full">已满</option>
                    <option value="Maintenance">维修中</option>
                  </select>
               </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveRoom}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
              >
                {editingId ? '保存更改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="relative h-24 bg-indigo-600 flex items-center justify-center">
                <button 
                  onClick={() => setViewingRoom(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="text-white text-center">
                   <h2 className="text-3xl font-bold">{viewingRoom.number}</h2>
                   <p className="text-indigo-100 text-sm">{viewingRoom.building}</p>
                </div>
             </div>
             
             <div className="p-6 space-y-6">
                <div className="flex justify-between items-center text-center">
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-semibold">类型</p>
                       <p className="font-medium text-slate-900">{getTypeText(viewingRoom.type)}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-semibold">状态</p>
                       <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(viewingRoom.status)}`}>
                          {getStatusText(viewingRoom.status)}
                       </span>
                    </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">入住进度</span>
                      <span className="font-bold text-indigo-600">{viewingRoom.occupied} / {viewingRoom.capacity}</span>
                   </div>
                   <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          viewingRoom.occupied === viewingRoom.capacity 
                            ? 'bg-red-500' 
                            : viewingRoom.occupied > 0 
                              ? 'bg-indigo-500' 
                              : 'bg-slate-300'
                        }`} 
                        style={{ width: `${(viewingRoom.occupied / viewingRoom.capacity) * 100}%` }}
                      ></div>
                   </div>
                </div>

                {/* Residents List */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-2 text-slate-900">
                      <GraduationCap size={18} className="text-indigo-600"/>
                      <h4 className="text-sm font-bold">当前入住人员</h4>
                   </div>
                   
                   {viewingResidents.length > 0 ? (
                       <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                           {viewingResidents.map(student => (
                               <div key={student.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                   <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                           {student.name.charAt(0)}
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                           <p className="text-[10px] text-slate-500">{student.major}</p>
                                       </div>
                                   </div>
                                   <span className="text-xs font-mono text-slate-400">{student.studentId}</span>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="p-3 bg-slate-50 rounded-lg text-center">
                          <p className="text-xs text-slate-400 italic">暂无学生入住</p>
                       </div>
                   )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-1 flex-shrink-0">
                         <Info size={16} />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-slate-900">详细信息</h4>
                         <p className="text-xs text-slate-500 mt-1">
                            该房间位于 {viewingRoom.building}，是一间标准的{getTypeText(viewingRoom.type)}。
                            目前剩余床位 {viewingRoom.capacity - viewingRoom.occupied} 个。
                         </p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => {
                     setViewingRoom(null);
                     handleEditClick(viewingRoom);
                  }}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  编辑此房间
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;