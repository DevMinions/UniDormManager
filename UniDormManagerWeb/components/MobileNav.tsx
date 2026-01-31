import React from 'react';
import { Home, Users, Wrench, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: <Home size={20} />, label: '首页', path: '/' },
    { icon: <Users size={20} />, label: '宿舍', path: '/rooms' },
    { icon: <Wrench size={20} />, label: '报修', path: '/repairs' },
    { icon: <MessageSquare size={20} />, label: 'AI助手', path: '/assistant' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              location.pathname === item.path
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-indigo-500'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;