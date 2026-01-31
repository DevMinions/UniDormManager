
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Edit, Trash2, X, Check, ArrowUpDown, Loader2, Users, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Role, Permission, User as UserType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RoleManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]); // For user counts
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Form State
  const [form, setForm] = useState<Partial<Role>>({
    code: '',
    name: '',
    description: '',
    level: 1,
    permissionIds: []
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedRoles, fetchedPermissions, fetchedUsers] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
        api.getAllUsers()
      ]);
      setRoles(fetchedRoles);
      setPermissions(fetchedPermissions);
      setAllUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch role data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles
    .filter(role => role.name.toLowerCase().includes(searchTerm.toLowerCase()) || role.code.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'level') return b.level - a.level; // High priority first
      return a.name.localeCompare(b.name);
    });

  // Group permissions for the modal selector
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getResourceName = (res: string) => {
    const map: Record<string, string> = {
      students: '学生管理',
      buildings: '楼栋管理',
      rooms: '房间管理',
      repairs: '报修管理',
      notices: '公告管理',
      users: '用户管理',
      roles: '角色管理',
      dashboard: '仪表盘'
    };
    return map[res] || res;
  };

  const getUserCountForRole = (roleId: string) => {
    return allUsers.filter(u => u.roleIds.includes(roleId)).length;
  };

  const getUsersWithRole = (roleId: string) => {
    return allUsers.filter(u => u.roleIds.includes(roleId));
  };

  const handleEditClick = (role: Role) => {
    setEditingId(role.id);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      permissionIds: [...role.permissionIds]
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (role: Role) => {
    if (!hasPermission('roles:delete')) return;
    
    if (role.isSystem) {
      alert("预定义角色无法删除！");
      return;
    }
    
    const count = getUserCountForRole(role.id);
    if (count > 0) {
        if (!window.confirm(`警告：目前有 ${count} 名用户拥有此角色。删除后，这些用户将失去相关权限。\n\n确定要继续吗？`)) {
            return;
        }
    } else {
        if (!window.confirm(`确定要删除角色 "${role.name}" 吗？`)) {
            return;
        }
    }

    try {
        await api.deleteRole(role.id);
        fetchData(); // Refresh
    } catch (error) {
        alert("删除失败");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.level) return;
    setSubmitting(true);
    
    try {
        if (editingId) {
            await api.updateRole(editingId, {
                name: form.name,
                description: form.description,
                level: Number(form.level),
                permissionIds: form.permissionIds
            });
        } else {
            await api.createRole({
                code: form.code,
                name: form.name,
                description: form.description || '',
                level: Number(form.level),
                permissionIds: form.permissionIds || [],
                isSystem: false
            });
        }
        closeModal();
        fetchData();
    } catch (error) {
        alert("保存失败");
    } finally {
        setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ code: '', name: '', description: '', level: 1, permissionIds: [] });
  };

  const togglePermission = (permId: string) => {
    const currentIds = form.permissionIds || [];
    if (currentIds.includes(permId)) {
      setForm({ ...form, permissionIds: currentIds.filter(id => id !== permId) });
    } else {
      setForm({ ...form, permissionIds: [...currentIds, permId] });
    }
  };

  const toggleResourceGroup = (resource: string, allPerms: Permission[]) => {
    const allIds = allPerms.map(p => p.id);
    const currentIds = form.permissionIds || [];
    const hasAll = allIds.every(id => currentIds.includes(id));

    if (hasAll) {
      // Uncheck all
      setForm({ ...form, permissionIds: currentIds.filter(id => !allIds.includes(id)) });
    } else {
      // Check all (add missing)
      const newIds = Array.from(new Set([...currentIds, ...allIds]));
      setForm({ ...form, permissionIds: newIds });
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" />
            角色管理
          </h1>
          <p className="text-slate-500">创建角色并配置细粒度权限</p>
        </div>
        {hasPermission('roles:create') && (
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
            <Plus size={18} />
            <span>创建角色</span>
            </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索角色名称或代码..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
            onClick={() => setSortBy(prev => prev === 'level' ? 'name' : 'level')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
            <ArrowUpDown size={16} />
            {sortBy === 'level' ? '按优先级排序' : '按名称排序'}
        </button>
      </div>

      {loading ? (
          <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRoles.map(role => {
              const userCount = getUserCountForRole(role.id);
              const isExpanded = expandedRoleId === role.id;
              
              return (
            <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                      <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{role.code}</span>
                      </div>
                      {role.isSystem && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                          预定义
                      </span>
                      )}
                  </div>
                  <p className="text-slate-500 text-sm mt-2 min-h-[40px]">{role.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                      权限数: <span className="text-indigo-600">{role.permissionIds.length}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                      优先级: <span className="text-slate-900">{role.level}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                      <Users size={12} /> <span className="text-slate-900">{userCount}</span>
                      </span>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">关联用户 ({userCount})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {getUsersWithRole(role.id).length > 0 ? (
                        getUsersWithRole(role.id).map(u => (
                          <div key={u.id} className="flex items-center gap-2 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                              {u.realName.charAt(0)}
                            </div>
                            <span>{u.realName}</span>
                            <span className="text-slate-400 text-xs">@{u.username}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">暂无关联用户</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-auto p-4 bg-slate-50/50 flex gap-2">
                   <button 
                     onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                     className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                   >
                     {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                     {isExpanded ? '收起详情' : '查看详情'}
                   </button>

                  {hasPermission('roles:update') && (
                      <button 
                          onClick={() => handleEditClick(role)}
                          className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                              role.isSystem && role.code === 'system_admin'
                              ? 'text-slate-400 cursor-not-allowed bg-slate-100'
                              : 'text-indigo-600 hover:bg-indigo-50 bg-white border border-slate-200 shadow-sm'
                          }`}
                          disabled={role.isSystem && role.code === 'system_admin'}
                          title="编辑"
                      >
                          <Edit size={14} />
                      </button>
                  )}
                  {hasPermission('roles:delete') && (
                      <button 
                          onClick={() => handleDeleteClick(role)}
                          disabled={role.isSystem}
                          className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                          role.isSystem 
                              ? 'text-slate-300 cursor-not-allowed border border-transparent' 
                              : 'text-red-600 hover:bg-red-50 bg-white border border-slate-200 shadow-sm'
                          }`}
                          title="删除"
                      >
                          <Trash2 size={14} />
                      </button>
                  )}
                </div>
            </div>
            )})}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-900">
                  {editingId ? '编辑角色' : '创建新角色'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">配置角色信息及功能访问权限</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Role Info */}
                <div className="space-y-5 lg:col-span-1">
                   <h4 className="font-bold text-slate-900 border-b pb-2">基本信息</h4>
                   <div className="space-y-4">
                     <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">角色名称 <span className="text-red-500">*</span></label>
                       <input 
                         type="text"
                         value={form.name}
                         onChange={(e) => setForm({...form, name: e.target.value})}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                         placeholder="如: 财务专员"
                       />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">角色代码 <span className="text-red-500">*</span></label>
                       <input 
                         type="text"
                         value={form.code}
                         onChange={(e) => setForm({...form, code: e.target.value})}
                         disabled={!!editingId} // Code is immutable after creation
                         className={`w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${editingId ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                         placeholder="如: finance_staff"
                       />
                       {editingId && <p className="text-[10px] text-slate-400 mt-1">角色代码创建后不可修改</p>}
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">优先级 (1-10)</label>
                       <input 
                         type="number"
                         min="1" max="10"
                         value={form.level}
                         onChange={(e) => setForm({...form, level: Number(e.target.value)})}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">描述</label>
                       <textarea 
                         value={form.description}
                         onChange={(e) => setForm({...form, description: e.target.value})}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                         placeholder="描述该角色的职责范围..."
                       />
                     </div>
                   </div>
                </div>

                {/* Right: Permissions Selector */}
                <div className="lg:col-span-2 space-y-5">
                   <div className="flex justify-between items-end border-b pb-2">
                      <h4 className="font-bold text-slate-900">权限配置</h4>
                      <span className="text-xs text-slate-500">已选 {form.permissionIds?.length || 0} 项</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(permissionsByResource).map(([resource, perms]: [string, Permission[]]) => {
                        const allIds = perms.map(p => p.id);
                        const isAllSelected = allIds.every(id => form.permissionIds?.includes(id));
                        const isIndeterminate = allIds.some(id => form.permissionIds?.includes(id)) && !isAllSelected;

                        return (
                          <div key={resource} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <div 
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isAllSelected ? 'bg-indigo-600 border-indigo-600' : isIndeterminate ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                  }`}
                                  onClick={() => toggleResourceGroup(resource, perms)}
                                >
                                  {isAllSelected && <Check size={12} className="text-white" />}
                                  {isIndeterminate && <div className="w-2 h-0.5 bg-white rounded-full"></div>}
                                </div>
                                <span className="font-bold text-sm text-slate-700">{getResourceName(resource)}</span>
                              </label>
                            </div>
                            <div className="p-3 grid grid-cols-1 gap-2">
                               {perms.map(perm => {
                                 const isSelected = form.permissionIds?.includes(perm.id);
                                 return (
                                   <label key={perm.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer transition-colors group">
                                     <div 
                                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          togglePermission(perm.id);
                                        }}
                                     >
                                        {isSelected && <Check size={12} className="text-white" />}
                                     </div>
                                     <div className="flex-1">
                                        <p className={`text-sm ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>{perm.name}</p>
                                        <p className="text-[10px] text-slate-400 leading-tight">{perm.description}</p>
                                     </div>
                                   </label>
                                 );
                               })}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                disabled={submitting}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {editingId ? '保存更改' : '立即创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
