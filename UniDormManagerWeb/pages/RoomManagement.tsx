
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Users, LayoutGrid, List, X, Edit, Eye, Info, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Room, Student, Building } from '../types';
import { api } from '../services/api';
import { useRooms } from '../hooks/usePaginatedData';
import Pagination from '../components/Pagination';

const RoomManagement: React.FC = () => {
  // 使用分页Hook
  const [roomsState, roomsActions] = useRooms({
    pageSize: 20,
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [filterBuilding, setFilterBuilding] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Load students and buildings data (still needed for UI)
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        setStudentsLoading(true);
        setBuildingsLoading(true);
        setStudentsError(null);
        setBuildingsError(null);
        const [studentsData, buildingsData] = await Promise.all([
          api.getStudents(),
          api.getBuildings(),
        ]);
        setStudents(studentsData);
        setBuildings(buildingsData);
      } catch (err: any) {
        console.error('Failed to load additional data:', err);
        setStudentsError(err.message || '加载学生数据失败');
        setBuildingsError(err.message || '加载楼栋数据失败');
      } finally {
        setStudentsLoading(false);
        setBuildingsLoading(false);
      }
    };

    fetchAdditionalData();
  }, []);

  // Sync search and filters with pagination hook
  useEffect(() => {
    roomsActions.setFilters({
      status: filterStatus,
      building: filterBuilding,
      type: filterType,
    });
  }, [filterStatus, filterBuilding, filterType, roomsActions]);

  // Edit & Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Fixed: Updated 'building' to 'buildingName' to match Room type properties
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    number: '',
    buildingName: 'A栋',
    capacity: 4,
    occupied: 0,
    type: 'Male',
    status: 'Available',
    floor: 1
  });

  // CRUD Operations
  const handleCreateRoom = async () => {
    if (!newRoom.number || !newRoom.building) {
      alert('请填写房间号和楼栋信息');
      return;
    }

    try {
      const createdRoom = await api.createRoom({
        number: newRoom.number,
        building: newRoom.building,
        buildingId: newRoom.building || '', // Satisfy TS requirements
        capacity: newRoom.capacity || 4,
        occupied: 0,
        type: newRoom.type as Room['type'] || 'Male',
        status: newRoom.status as Room['status'] || 'Available',
        floor: newRoom.floor || 1,
      });
      roomsActions.refresh(); // Refresh paginated data
      setIsModalOpen(false);
      setNewRoom({
        number: '',
        building: 'A栋',
        capacity: 4,
        occupied: 0,
        type: 'Male',
        status: 'Available',
        floor: 1
      });
    } catch (err: any) {
      alert(err.message || '创建房间失败');
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingId || !newRoom.number || !newRoom.building) {
      alert('请填写房间号和楼栋信息');
      return;
    }

    try {
      const updatedRoom = await api.updateRoom(editingId, {
        number: newRoom.number,
        building: newRoom.building,
        capacity: newRoom.capacity,
        occupied: newRoom.occupied,
        type: newRoom.type,
        status: newRoom.status,
        floor: newRoom.floor,
      });
      roomsActions.refresh(); // Refresh paginated data
      setIsModalOpen(false);
      setEditingId(null);
      setNewRoom({
        number: '',
        building: 'A栋',
        capacity: 4,
        occupied: 0,
        type: 'Male',
        status: 'Available',
        floor: 1
      });
    } catch (err: any) {
      alert(err.message || '更新房间失败');
    }
  };

  const handleDeleteRoom = async (id: string, number: string, building: string) => {
    if (window.confirm(`确定要删除 ${building} 的 ${number} 号房间吗？此操作不可撤销。`)) {
      try {
        await api.deleteRoom(id);
        roomsActions.refresh(); // Refresh paginated data
      } catch (err: any) {
        alert(err.message || '删除房间失败');
      }
    }
  };

  const openModal = (room?: Room) => {
    if (room) {
      setEditingId(room.id);
      setNewRoom({
        number: room.number,
        building: room.building,
        capacity: room.capacity,
        occupied: room.occupied,
        type: room.type,
        status: room.status,
        floor: room.floor,
      });
    } else {
      setEditingId(null);
      setNewRoom({
        number: '',
        building: 'A栋',
        capacity: 4,
        occupied: 0,
        type: 'Male',
        status: 'Available',
        floor: 1
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewRoom({
      number: '',
      buildingName: 'A栋',
      capacity: 4,
      occupied: 0,
      type: 'Male',
      status: 'Available',
      floor: 1
    });
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    roomsActions.setSearch(value);
  };

  // Get available students for a room (匹配房间号和楼栋)
  const getAvailableStudentsForRoom = (roomNumber: string, buildingName: string) => {
    console.log('Getting students for:', buildingName, '-', roomNumber);
    console.log('Total students:', students.length);
    const filtered = students.filter(s => {
      const match = (s.roomNumber === roomNumber && s.building === buildingName);
      if (match) console.log('Matched student:', s.name, s.building, s.roomNumber);
      return match;
    });
    console.log('Filtered count:', filtered.length);
    return filtered;
  };

  // Get building floors for a specific building
  const getBuildingFloors = (buildingName: string) => {
    const building = buildings.find(b => b.name === buildingName);
    return building ? building.floors : 1;
  };

  // Helper functions to get building type icon
  const getBuildingTypeIcon = (type: string) => {
    switch (type) {
      case 'Male': return '👨';
      case 'Female': return '👩';
      case 'Co-ed': return '👫';
      default: return '🏠';
    }
  };

  // Get status badge styles
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Full':
        return 'bg-red-100 text-red-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get room occupation percentage for progress bar
  const getOccupancyPercentage = (room: Room) => {
    return Math.round((room.occupied / room.capacity) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <LayoutGrid className="w-8 h-8 text-indigo-600" />
              房间管理
            </h1>
            <p className="text-gray-600 mt-2">管理宿舍房间分配、容量和使用状态</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            添加房间
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-l-lg border ${viewMode === 'grid'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-r-0`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-r-lg border ${viewMode === 'list'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索房间号..."
              value={roomsState.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['All', 'Available', 'Full', 'Maintenance'].map((val) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                className={`px-3 py-2 rounded-lg transition-colors ${filterStatus === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {val === 'All' ? '全部状态' :
                  val === 'Available' ? '可用' :
                    val === 'Full' ? '已满' : '维修中'}
              </button>
            ))}
          </div>

          {/* Building Filter */}
          <div className="flex gap-2">
            {['All', 'A栋', 'B栋', 'C栋'].map((val) => (
              <button
                key={val}
                onClick={() => setFilterBuilding(val)}
                className={`px-3 py-2 rounded-lg transition-colors ${filterBuilding === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {val === 'All' ? '全部楼栋' : val}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {['All', 'Male', 'Female', 'Co-ed'].map((val) => (
              <button
                key={val}
                onClick={() => setFilterType(val)}
                className={`px-3 py-2 rounded-lg transition-colors ${filterType === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {val === 'All' ? '全部类型' :
                  val === 'Male' ? '男生' :
                    val === 'Female' ? '女生' : '混合'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {(roomsState.loading || studentsLoading || buildingsLoading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        )}

        {/* Error State */}
        {(roomsState.error || studentsError || buildingsError) && (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span className="ml-2 text-red-600">
              {roomsState.error || studentsError || buildingsError || '加载数据失败'}
            </span>
          </div>
        )}

        {/* Rooms Grid/List */}
        {!roomsState.loading && !roomsState.error && !studentsLoading && !studentsError && !buildingsLoading && !buildingsError && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {roomsState.data.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {roomsState.search || filterStatus !== 'All' || filterBuilding !== 'All' || filterType !== 'All'
                        ? '没有找到匹配的房间'
                        : '暂无房间数据'}
                    </p>
                  </div>
                ) : (
                  roomsState.data.map(room => (
                    <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {room.number} - {room.building}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getBuildingTypeIcon(room.type)} {room.type === 'Male' ? '男' : room.type === 'Female' ? '女' : '混合'}宿舍 · {room.floor}层
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeStyles(room.status)}`}>
                          {room.status === 'Available' ? '可用' :
                            room.status === 'Full' ? '已满' : '维修中'}
                        </span>
                      </div>

                      {/* Occupancy Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>入住率</span>
                          <span>{room.occupied}/{room.capacity} ({getOccupancyPercentage(room)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${room.occupied > 0
                              ? 'bg-blue-600'
                              : 'bg-green-500'
                              }`}
                            style={{ width: `${getOccupancyPercentage(room)}%` }}
                          />
                        </div>
                      </div>

                      {/* Room Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div>
                          <p className="text-2xl font-bold text-indigo-600">{room.capacity}</p>
                          <p className="text-xs text-gray-500">总容量</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{room.occupied}</p>
                          <p className="text-xs text-gray-500">已入住</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{room.capacity - room.occupied}</p>
                          <p className="text-xs text-gray-500">空余</p>
                        </div>
                      </div>

                      {/* Occupants */}
                      {room.occupied > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">入住学生：</p>
                          <div className="space-y-1">
                            {getAvailableStudentsForRoom(room.number, room.building).slice(0, 3).map(student => (
                              <div key={student.id} className="flex items-center text-sm">
                                <GraduationCap className="w-4 h-4 text-indigo-500 mr-2" />
                                <span>{student.name} ({student.studentId})</span>
                              </div>
                            ))}
                            {getAvailableStudentsForRoom(room.number, room.building).length > 3 && (
                              <p className="text-xs text-gray-500">...还有 {getAvailableStudentsForRoom(room.number, room.building).length - 3} 名学生</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => openModal(room)}
                          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.number, room.building)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        房间信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        楼层
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        容量/入住
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
                    {roomsState.data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {roomsState.search || filterStatus !== 'All' || filterBuilding !== 'All' || filterType !== 'All'
                            ? '没有找到匹配的房间'
                            : '暂无房间数据'}
                        </td>
                      </tr>
                    ) : (
                      roomsState.data.map(room => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{room.number}</div>
                              <div className="text-sm text-gray-500">{room.building}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getBuildingTypeIcon(room.type)} {room.type === 'Male' ? '男生' : room.type === 'Female' ? '女生' : '混合'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {room.floor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {room.occupied}/{room.capacity}
                              <span className="text-xs text-gray-500 ml-1">
                                ({getOccupancyPercentage(room)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeStyles(room.status)}`}>
                              {room.status === 'Available' ? '可用' :
                                room.status === 'Full' ? '已满' : '维修中'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openModal(room)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="编辑房间"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id, room.number, room.building)}
                                className="text-red-600 hover:text-red-900"
                                title="删除房间"
                              >
                                <X className="w-4 h-4" />
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
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={roomsState.page}
          totalPages={roomsState.totalPages}
          total={roomsState.total}
          pageSize={roomsState.pageSize}
          onPageChange={roomsActions.setPage}
          loading={roomsState.loading}
        />
      </div>

      {/* Room Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? '编辑房间' : '添加房间'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">房间号</label>
                <input
                  type="text"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">楼栋</label>
                <select
                  value={newRoom.building}
                  onChange={(e) => setNewRoom({ ...newRoom, building: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="A栋">A栋</option>
                  <option value="B栋">B栋</option>
                  <option value="C栋">C栋</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as Room['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Male">男生宿舍</option>
                  <option value="Female">女生宿舍</option>
                  <option value="Co-ed">混合宿舍</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容量</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">楼层</label>
                  <input
                    type="number"
                    min="1"
                    max={20}
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={newRoom.status}
                  onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as Room['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Available">可用</option>
                  <option value="Full">已满</option>
                  <option value="Maintenance">维修中</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={editingId ? handleUpdateRoom : handleCreateRoom}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {editingId ? '更新' : '创建'}
              </button>
              <button
                onClick={closeModal}
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

export default RoomManagement;
