import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
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
  const [repairsTrend, setRepairsTrend] = useState<Array<{ day: string; total: number; completed: number; pending: number }>>([]);
  // P8 audit SSE: 显示最近 10 条写操作流
  const [auditEvents, setAuditEvents] = useState<Array<{
    id: string; userId: string; username: string; method: string;
    path: string; status: number; ip: string; createdAt: string;
  }>>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        // 主 stats 与时序趋势并行拉，互不阻塞
        const [data, trend] = await Promise.all([
          api.getDashboardStats(),
          api.getRepairsByDay(30).catch(() => ({ days: 30, data: [] })),
        ]);
        setStats(data);
        setRepairsTrend(trend.data || []);
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 订阅 audit SSE 流(P8 后端推)
  useEffect(() => {
    const ctrl = new AbortController();
    const apiBase = (import.meta as any).env?.VITE_API_URL || '/api';
    const token = localStorage.getItem('token') || '';
    (async () => {
      try {
        const res = await fetch(`${apiBase}/audit-logs/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          // SSE 帧: 事件之间空行分隔
          const blocks = buf.split('\n\n');
          buf = blocks.pop() || '';
          for (const block of blocks) {
            const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            try {
              const ev = JSON.parse(dataLine.slice(5).trim());
              setAuditEvents((prev) => [ev, ...prev].slice(0, 10));
            } catch {
              /* skip malformed */
            }
          }
        }
      } catch {
        /* 用户切走 / 流断 都属于正常 */
      }
    })();
    return () => ctrl.abort();
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

      {/* Repairs Trend - 时序折线图 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">报修趋势（近 30 天）</h2>
          <p className="text-xs text-slate-400">每日新增 / 已完成 / 待处理</p>
        </div>
        <div className="h-64">
          {repairsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repairsTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d: string) => d.slice(5)} // MM-DD
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" name="新增" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="已完成" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pending" name="待处理" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>暂无趋势数据</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Audit Feed (SSE 来自后端 /api/audit-logs/stream) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">实时审计流</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            实时
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {auditEvents.length > 0 ? (
            auditEvents.map((e) => (
              <div key={e.id} className="p-3 px-6 flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  e.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                  e.method === 'PUT' || e.method === 'PATCH' ? 'bg-amber-100 text-amber-700' :
                  e.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>{e.method}</span>
                <code className="text-slate-700 font-mono text-xs truncate flex-1">{e.path}</code>
                <span className="text-slate-500 text-xs">{e.username || '匿名'}</span>
                <span className={`text-xs ${e.status >= 400 ? 'text-red-600' : 'text-emerald-600'}`}>{e.status}</span>
                <span className="text-xs text-slate-400 font-mono">{e.createdAt.slice(11)}</span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400 text-sm">等待第一条写操作…</div>
          )}
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