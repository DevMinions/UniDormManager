import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Building2, User, X, Edit, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Building } from '../types';
import { api } from '../services/api';

const Buildings: React.FC = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getBuildings();
        setBuildings(data);
      } catch (err: any) {
        console.error('Failed to load buildings:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBuilding, setNewBuilding] = useState<Partial<Building>>({
    name: '',
    type: 'Male',
    floors: 6,
    manager: '',
    description: ''
  });

  const filteredBuildings = buildings.filter(b => 
    b.name.includes(searchTerm) || b.manager.includes(searchTerm)
  );

  const handleSaveBuilding = async () => {
    if (!newBuilding.name || !newBuilding.manager) return;

    try {
      if (editingId) {
        const updated = await api.updateBuilding(editingId, {
          name: newBuilding.name,
          type: newBuilding.type,
          floors: newBuilding.floors,
          manager: newBuilding.manager,
          description: newBuilding.description,
        });
        setBuildings(buildings.map(b => b.id === editingId ? updated : b));
      } else {
        const created = await api.createBuilding({
          name: newBuilding.name!,
          type: (newBuilding.type as any) || 'Male',
          floors: Number(newBuilding.floors) || 1,
          manager: newBuilding.manager!,
          description: newBuilding.description || '',
        });
        setBuildings([...buildings, created]);
      }
      closeModal();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleEditClick = (building: Building) => {
    setEditingId(building.id);
    setNewBuilding({ ...building });
    setIsModalOpen(true);
  };

  const handleViewRooms = (buildingName: string) => {
    navigate(`/rooms?search=${encodeURIComponent(buildingName)}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewBuilding({
      name: '',
      type: 'Male',
      floors: 6,
      manager: '',
      description: ''
    });
  };

  const getTypeLabel = (type: Building['type']) => {
    switch(type) {
      case 'Male': return '男生宿舍';
      case 'Female': return '女生宿舍';
      case 'Co-ed': return '混合/研究生';
      default: return type;
    }
  };

  const getTypeColor = (type: Building['type']) => {
    switch(type) {
      case 'Male': return 'bg-blue-100 text-blue-700';
      case 'Female': return 'bg-pink-100 text-pink-700';
      case 'Co-ed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">楼栋管理</h1>
          <p className="text-slate-500">管理宿舍楼栋及基本信息</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>添加楼栋</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索楼栋名称或管理员..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无楼栋数据</p>
            </div>
          ) : (
            filteredBuildings.map(building => (
          <div key={building.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Building2 size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(building.type)}`}>
                {getTypeLabel(building.type)}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">{building.name}</h3>
            <p className="text-slate-500 text-sm mb-4 min-h-[40px] line-clamp-2">{building.description}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>管理员：<span className="font-medium text-slate-900">{building.manager}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span>层数：{building.floors} 层</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
               <button 
                 onClick={() => handleEditClick(building)}
                 className="flex-1 text-sm py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
               >
                 <Edit size={14} />
                 编辑信息
               </button>
               <button 
                 onClick={() => handleViewRooms(building.name)}
                 className="flex-1 text-sm py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
               >
                 <Eye size={14} />
                 查看房间
               </button>
            </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Building Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">
                {editingId ? '编辑楼栋信息' : '添加新楼栋'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">楼栋名称</label>
                <input 
                  type="text"
                  value={newBuilding.name}
                  onChange={(e) => setNewBuilding({...newBuilding, name: e.target.value})}
                  placeholder="例如: E栋"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">类型</label>
                  <select 
                    value={newBuilding.type}
                    onChange={(e) => setNewBuilding({...newBuilding, type: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Male">男生宿舍</option>
                    <option value="Female">女生宿舍</option>
                    <option value="Co-ed">混合/研究生</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">层数</label>
                  <input 
                    type="number"
                    min="1"
                    value={newBuilding.floors}
                    onChange={(e) => setNewBuilding({...newBuilding, floors: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">管理员</label>
                <input 
                  type="text"
                  value={newBuilding.manager}
                  onChange={(e) => setNewBuilding({...newBuilding, manager: e.target.value})}
                  placeholder="负责人姓名"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">描述</label>
                <textarea 
                  value={newBuilding.description}
                  onChange={(e) => setNewBuilding({...newBuilding, description: e.target.value})}
                  placeholder="楼栋位置或特点描述..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
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
                onClick={handleSaveBuilding}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
              >
                {editingId ? '保存更改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings;