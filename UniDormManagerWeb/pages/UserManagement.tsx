
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Plus, Search, Edit, Trash2, X, Shield, Lock, Phone, Mail, Filter, ChevronLeft, ChevronRight, Loader2, GraduationCap, Building2 } from 'lucide-react';
import { User, Role, Student, Building } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Data for Selects
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    realName: '',
    email: '',
    phone: '',
    roleIds: [] as string[],
    status: 'Active' as User['status'],
    password: '',
    confirmPassword: '',
    studentId: '',
    buildingId: ''
  });

  // Fetch initial data (roles, students, buildings)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roles, students, buildings] = await Promise.all([
          api.getRoles(),
          api.getStudents(),
          api.getBuildings()
        ]);
        setAvailableRoles(roles);
        setAvailableStudents(students);
        setAvailableBuildings(buildings);
      } catch (error) {
        console.error("Failed to fetch prerequisite data", error);
      }
    };
    fetchData();
  }, []);

  // Fetch users when filters/page changes
  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, roleFilter, searchTerm]); // Debounce search in real app

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getUsers(page, pageSize, {
        search: searchTerm,
        status: statusFilter,
        roleId: roleFilter
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      roleIds: [...user.roleIds],
      status: user.status,
      password: '',
      confirmPassword: '',
      studentId: user.studentId || '',
      buildingId: user.buildingId || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (userId: string) => {
    if (!hasPermission('users:delete')) return;

    if (userId === currentUser?.id) {
        alert("为了安全起见，您不能删除自己的账户。");
        return;
    }
    
    // Check if system admin (simple check by ID for demo, ideally check role prop)
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.roleIds.includes('r1') && userToDelete.username === 'admin') { // Assuming 'r1' is system admin
        alert("无法删除初始系统管理员账户！");
        return;
    }

    if (window.confirm("确定要删除该用户吗？此操作不可恢复。")) {
      try {
        await api.deleteUser(userId);
        fetchUsers(); // Refresh list
      } catch (error) {
        alert("删除失败");
      }
    }
  };

  const handleSave = async () => {
    if (!formData.username) return;

    if (!editingId && formData.password !== formData.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateUser(editingId, {
          realName: formData.realName,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          roleIds: formData.roleIds,
          studentId: formData.studentId,
          buildingId: formData.buildingId
        });
      } else {
        await api.createUser({
          username: formData.username,
          realName: formData.realName || formData.username,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          roleIds: formData.roleIds,
          studentId: formData.studentId,
          buildingId: formData.buildingId
        });
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("Operation failed", error);
      alert("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      username: '',
      realName: '',
      email: '',
      phone: '',
      roleIds: [],
      status: 'Active',
      password: '',
      confirmPassword: '',
      studentId: '',
      buildingId: ''
    });
  };

  const toggleRole = (roleId: string) => {
    const currentRoles = formData.roleIds;
    let newRoles;
    if (currentRoles.includes(roleId)) {
      newRoles = currentRoles.filter(id => id !== roleId);
    } else {
      newRoles = [...currentRoles, roleId];
    }
    setFormData({...formData, roleIds: newRoles});
  };

  const getRoleNames = (roleIds: string[]) => {
    return availableRoles.filter(r => roleIds.includes(r.id)).map(r => r.name);
  };

  const totalPages = Math.ceil(total / pageSize);

  // Helper logic to check selected roles
  const isStudentRoleSelected = () => {
    const studentRole = availableRoles.find(r => r.code === 'student');
    return studentRole && formData.roleIds.includes(studentRole.id);
  };

  const isDormManagerRoleSelected = () => {
    const managerRole = availableRoles.find(r => r.code === 'dorm_manager');
    return managerRole && formData.roleIds.includes(managerRole.id);
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="text-indigo-600" />
            用户管理
          </h1>
          <p className="text-slate-500">管理后台管理员及系统用户</p>
        </div>
        {hasPermission('users:create') && (
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
            <Plus size={18} />
            <span>创建用户</span>
            </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索用户名、姓名..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
           <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              >
                <option value="All">所有状态</option>
                <option value="Active">活跃 (Active)</option>
                <option value="Inactive">未激活 (Inactive)</option>
                <option value="Suspended">冻结 (Suspended)</option>
              </select>
           </div>
           
           <div className="flex items-center gap-2">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              >
                <option value="All">所有角色</option>
                {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
           </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
        ) : (
            <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                    <th className="px-6 py-4">用户</th>
                    <th className="px-6 py-4">联系方式</th>
                    <th className="px-6 py-4">关联信息</th>
                    <th className="px-6 py-4">角色</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                未找到用户数据
                            </td>
                        </tr>
                    ) : (
                        users.map(user => {
                            const student = availableStudents.find(s => s.id === user.studentId);
                            const building = availableBuildings.find(b => b.id === user.buildingId);
                            
                            return (
                        <tr key={user.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase">
                                {user.username.charAt(0)}
                                </div>
                                <div>
                                <p className="font-bold text-slate-900">{user.realName}</p>
                                <p className="text-xs text-slate-500">@{user.username}</p>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-600">
                                <Mail size={12} /> {user.email}
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={12} /> {user.phone}
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    {student && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                                            <GraduationCap size={12} />
                                            <span>学生: {student.name}</span>
                                        </div>
                                    )}
                                    {building && (
                                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                                            <Building2 size={12} />
                                            <span>管理: {building.name}</span>
                                        </div>
                                    )}
                                    {!student && !building && (
                                        <span className="text-slate-400 text-xs">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                                {getRoleNames(user.roleIds).map(roleName => (
                                <span key={roleName} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100">
                                    {roleName}
                                </span>
                                ))}
                                {user.roleIds.length === 0 && <span className="text-slate-400 text-xs italic">无角色</span>}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                                user.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {user.status === 'Active' ? '活跃' : user.status === 'Suspended' ? '已冻结' : '未激活'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                {hasPermission('users:update') && (
                                    <button 
                                        onClick={() => handleEditClick(user)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="编辑用户"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                                {hasPermission('users:delete') && (
                                    <button 
                                        onClick={() => handleDeleteClick(user.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            user.id === currentUser?.id || user.username === 'admin' 
                                            ? 'text-slate-300 cursor-not-allowed' 
                                            : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                        }`}
                                        disabled={user.id === currentUser?.id || user.username === 'admin'}
                                        title={user.id === currentUser?.id ? "无法删除自己" : "删除用户"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                </div>
                            </td>
                        </tr>
                        );
                        })
                    )}
                </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    显示 {users.length > 0 ? (page - 1) * pageSize + 1 : 0} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || total === 0}
                        className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h3 className="font-bold text-xl text-slate-900">
                {editingId ? '编辑用户' : '创建用户'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Basic Info */}
                 <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">基本信息</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">用户名 <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          disabled={!!editingId}
                          className={`w-full p-2 border rounded-lg mt-1 ${editingId ? 'bg-slate-100 text-slate-500' : 'bg-white border-slate-300'}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">真实姓名</label>
                        <input 
                          type="text"
                          value={formData.realName}
                          onChange={(e) => setFormData({...formData, realName: e.target.value})}
                          className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">邮箱</label>
                        <input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">手机号</label>
                        <input 
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                        />
                      </div>
                      
                      {!editingId && (
                        <>
                          <div className="pt-2 border-t border-slate-100"></div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">设置密码 <span className="text-red-500">*</span></label>
                            <input 
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                              placeholder="至少6位"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">确认密码 <span className="text-red-500">*</span></label>
                            <input 
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                            />
                          </div>
                        </>
                      )}

                      {editingId && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">账户状态</label>
                          <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            className="w-full p-2 border border-slate-300 rounded-lg mt-1 bg-white"
                          >
                            <option value="Active">活跃 (Active)</option>
                            <option value="Inactive">未激活 (Inactive)</option>
                            <option value="Suspended">冻结 (Suspended)</option>
                          </select>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Role Selection & Extended Info */}
                 <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">角色分配</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {availableRoles.map(role => {
                            const isSelected = formData.roleIds.includes(role.id);
                            return (
                            <div 
                                key={role.id}
                                onClick={() => toggleRole(role.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                }`}>
                                    {isSelected && <Shield size={12} className="text-white" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{role.name}</p>
                                    <p className="text-xs text-slate-500 leading-tight mt-0.5">{role.description}</p>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    </div>

                    {/* Conditional Fields based on Role Selection */}
                    {(isStudentRoleSelected() || isDormManagerRoleSelected()) && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
                            <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">关联信息</h4>
                            
                            {isStudentRoleSelected() && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <GraduationCap size={12} /> 关联学生档案
                                    </label>
                                    <select
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg mt-1 bg-white"
                                    >
                                        <option value="">-- 选择学生 --</option>
                                        {availableStudents.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.name} ({student.studentId})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">关联后用户将能查看该学生的专属信息</p>
                                </div>
                            )}

                            {isDormManagerRoleSelected() && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Building2 size={12} /> 管理楼栋
                                    </label>
                                    <select
                                        value={formData.buildingId}
                                        onChange={(e) => setFormData({...formData, buildingId: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg mt-1 bg-white"
                                    >
                                        <option value="">-- 选择楼栋 --</option>
                                        {availableBuildings.map(building => (
                                            <option key={building.id} value={building.id}>
                                                {building.name} (管理员: {building.manager})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">指定该宿管员负责的楼栋</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
               </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
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

export default UserManagement;
