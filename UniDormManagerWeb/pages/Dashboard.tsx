import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Building, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupancyRate: 0,
    pendingRepairs: 0,
    completedRepairs: 0,
    occupancyData: [] as Array<{ name: string; occupied: number; capacity: number }>,
    requestStatus: [] as Array<{ name: string; value: number; color: string }>,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const displayStats = [
    { 
      label: '学生总数', 
      value: stats.totalStudents.toString(), 
      icon: <Users className="text-indigo-600" />, 
      trend: '' 
    },
    { 
      label: '入住率', 
      value: `${stats.occupancyRate.toFixed(1)}%`, 
      icon: <Building className="text-pink-600" />, 
      trend: '' 
    },
    { 
      label: '待修事项', 
      value: stats.pendingRepairs.toString(), 
      icon: <AlertTriangle className="text-amber-500" />, 
      trend: '' 
    },
    { 
      label: '本月已修', 
      value: stats.completedRepairs.toString(), 
      icon: <CheckCircle className="text-emerald-500" />, 
      trend: '' 
    },
  ];

  if (loading) {
    return (
      <div className="p-6 pb-24 md:pb-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 pb-24 md:pb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 font-medium">加载失败</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">系统概览</h1>
        <p className="text-slate-500">欢迎回来，以下是宿舍今日的实时动态。</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
              {stat.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-6">楼栋入住情况</h2>
          <div className="h-64">
            {stats.occupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="occupied" name="已入住" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="capacity" name="总容量" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>暂无数据</p>
              </div>
            )}
          </div>
        </div>

        {/* Request Status Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-6">报修状态统计</h2>
          <div className="h-64">
            {stats.requestStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.requestStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.requestStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>暂无数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity List - Mobile Friendly */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold">最新预警</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.pendingRepairs > 0 ? (
            <div className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  有 {stats.pendingRepairs} 个待处理的报修请求
                </p>
                <p className="text-xs text-slate-500">请及时处理</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400">
              <p className="text-sm">暂无预警信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;