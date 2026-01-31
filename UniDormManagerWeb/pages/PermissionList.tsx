
import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Lock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { Permission, Role } from '../types';

const PermissionList: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('All');
  const [expandedPermId, setExpandedPermId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [permData, roleData] = await Promise.all([
              api.getPermissions(),
              api.getRoles()
            ]);
            setPermissions(permData);
            setRoles(roleData);
        } catch (error) {
            console.error("Failed to fetch permissions", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Group permissions by resource
  const resources = Array.from(new Set(permissions.map(p => p.resource)));

  const filteredPermissions = permissions.filter(p => 
    (filterResource === 'All' || p.resource === filterResource) &&
    (p.name.includes(searchTerm) || p.code.includes(searchTerm) || p.description.includes(searchTerm))
  );

  // Group filtered permissions for display
  const groupedPermissions: Record<string, Permission[]> = {};
  filteredPermissions.forEach(p => {
    if (!groupedPermissions[p.resource]) {
      groupedPermissions[p.resource] = [];
    }
    groupedPermissions[p.resource].push(p);
  });

  const getActionColor = (action: string) => {
    switch(action) {
      case 'read': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'update': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'delete': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-purple-50 text-purple-700 border-purple-100';
    }
  };

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

  const getRolesWithPermission = (permId: string) => {
    return roles.filter(role => role.permissionIds.includes(permId));
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-indigo-600" />
          权限列表
        </h1>
        <p className="text-slate-500">查看系统中所有可用的功能权限及其定义</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索权限名称、代码或描述..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter size={20} className="text-slate-400 mr-1" />
          <select 
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="All">所有资源</option>
            {resources.map((r: string) => (
              <option key={r} value={r}>{getResourceName(r)} ({r})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
            {Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">未找到匹配的权限</p>
            </div>
            ) : (
            Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <Lock size={16} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">{getResourceName(resource)}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-0.5 rounded">{resource}</span>
                    </div>
                    <span className="text-xs text-slate-500">{perms.length} 个权限</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perms.map(perm => {
                      const isExpanded = expandedPermId === perm.id;
                      const activeRoles = getRolesWithPermission(perm.id);
                      
                      return (
                    <div key={perm.id} className="border border-slate-100 rounded-lg bg-white flex flex-col transition-colors group">
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getActionColor(perm.action)}`}>
                              {perm.action}
                          </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mb-1">{perm.name}</h4>
                          <code className="text-xs text-slate-500 bg-slate-100 px-1 py-0.5 rounded block w-fit mb-2">
                          {perm.code}
                          </code>
                          <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                          {perm.description}
                          </p>
                        </div>
                        
                        {/* Expanded Section for Roles */}
                        {isExpanded && (
                           <div className="px-4 pb-4 pt-0 border-t border-dashed border-slate-100 bg-slate-50/50 rounded-b-lg">
                              <p className="text-[10px] font-bold text-slate-500 uppercase py-2">拥有此权限的角色 ({activeRoles.length})</p>
                              <div className="flex flex-wrap gap-1.5">
                                 {activeRoles.length > 0 ? (
                                   activeRoles.map(role => (
                                      <span key={role.id} className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">
                                         {role.name}
                                      </span>
                                   ))
                                 ) : (
                                   <span className="text-[10px] text-slate-400 italic">暂无角色分配</span>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        <button 
                           onClick={() => setExpandedPermId(isExpanded ? null : perm.id)}
                           className="w-full py-1.5 border-t border-slate-100 text-[10px] font-medium text-slate-400 hover:text-indigo-600 hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors rounded-b-lg"
                        >
                           {isExpanded ? (
                             <>收起 <ChevronUp size={12} /></>
                           ) : (
                             <>查看角色 <ChevronDown size={12} /></>
                           )}
                        </button>
                    </div>
                    )})}
                </div>
                </div>
            ))
            )}
        </div>
      )}
    </div>
  );
};

export default PermissionList;
