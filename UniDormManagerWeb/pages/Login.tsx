
import React, { useState } from 'react';
import { Building2, User, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('请输入用户名和密码');
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 opacity-70"></div>
         <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Left Side - Hero Section */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600/20 z-0"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl z-0"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/20">
               <Building2 size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">UniDorm Manager</h2>
            <p className="text-indigo-200">智慧校园宿舍管理解决方案</p>
          </div>

          <div className="relative z-10 space-y-6">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                      <ShieldCheck size={16} />
                   </div>
                   <span>企业级数据安全保障</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                      <User size={16} />
                   </div>
                   <span>高效的学生入住与退宿管理</span>
                </div>
             </div>
             <p className="text-xs text-slate-500 pt-8 border-t border-slate-700/50">
                © 2024 UniDorm System. All rights reserved.
             </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">欢迎回来</h1>
            <p className="text-slate-500 text-sm">请输入您的管理员账号以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">用户名</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">密码</label>
                <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  忘记密码？
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  登录中...
                </>
              ) : (
                <>
                  立即登录 <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
                默认账号: admin / admin123
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
