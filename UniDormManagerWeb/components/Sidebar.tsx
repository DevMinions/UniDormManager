
import React from 'react';
import { Home, Users, Wrench, MessageSquare, Building2, Bell, DoorOpen, LogOut, Shield, ShieldCheck, UserCog, ClipboardCheck, Trophy, GitPullRequest, ShieldAlert } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { icon: <Home size={20} />, label: '仪表盘', path: '/', visible: true },
    { icon: <Building2 size={20} />, label: '楼栋管理', path: '/buildings', visible: hasPermission('buildings:read') },
    { icon: <DoorOpen size={20} />, label: '房间管理', path: '/rooms', visible: hasPermission('rooms:read') },
    { icon: <Users size={20} />, label: '学生管理', path: '/students', visible: hasPermission('students:read') },
    { icon: <Wrench size={20} />, label: '报修管理', path: '/repairs', visible: hasPermission('repairs:read') },
    { icon: <Bell size={20} />, label: '公告通知', path: '/notices', visible: hasPermission('notices:read') },
    { icon: <MessageSquare size={20} />, label: 'AI 智能助手', path: '/assistant', visible: true },
  ];

  const dormitoryServices = [
    { icon: <ClipboardCheck size={20} />, label: '查寝评分', path: '/inspections', visible: hasPermission('rooms:update') },
    { icon: <Trophy size={20} />, label: '红黑榜公示', path: '/rankings', visible: true },
    { icon: <GitPullRequest size={20} />, label: '换寝审批', path: '/workflow', visible: hasPermission('students:update') },
    { icon: <ShieldAlert size={20} />, label: '晚归预警', path: '/access-logs', visible: hasPermission('students:read') },
  ];

  // Admin Items
  const adminItems = [
    { icon: <UserCog size={20} />, label: '用户管理', path: '/users', visible: hasPermission('users:read') },
    { icon: <ShieldCheck size={20} />, label: '角色管理', path: '/roles', visible: hasPermission('roles:read') },
    { icon: <Shield size={20} />, label: '权限列表', path: '/permissions', visible: hasPermission('roles:read') },
  ];

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      try {
        await logout();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  // Fixed: Added key?: React.Key to the NavButton component props type to satisfy TS requirements in JSX mapping
  const NavButton = ({ item }: { item: any, key?: React.Key }) => (
    <button
      onClick={() => navigate(item.path)}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 ${
        location.pathname === item.path
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {item.icon}
      <span className="ml-3 font-medium">{item.label}</span>
    </button>
  );

  return (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto z-50 no-scrollbar">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">UniDorm</h1>
          <p className="text-xs text-slate-400">宿舍管理系统</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.filter(i => i.visible).map((item) => (
          <NavButton key={item.path} item={item} />
        ))}

        {/* Separator for Dorm Services */}
        <div className="pt-4 pb-2 px-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">业务审批</p>
        </div>
        {dormitoryServices.filter(i => i.visible).map((item) => (
          <NavButton key={item.path} item={item} />
        ))}

        {/* Separator for Admin */}
        {adminItems.some(i => i.visible) && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">系统管理</p>
            </div>
            {adminItems.filter(i => i.visible).map((item) => (
              <NavButton key={item.path} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-3 sticky bottom-0 bg-slate-900">
        <div className="flex items-center p-3 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold uppercase">
            {user?.username.charAt(0) || 'A'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.realName || '管理员'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@unidorm.edu'}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors gap-2"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
