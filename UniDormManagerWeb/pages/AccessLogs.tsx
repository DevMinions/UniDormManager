import React, { useState, useEffect } from 'react';
import { AccessLog, LateReturnAlert, Building } from '../types';
import { Search, Filter, AlertTriangle, Clock, Users, DoorOpen, Bell, Send, CheckCircle, X, RefreshCw, AlertCircle, Activity, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useAccessLogs, useLateReturnAlerts } from '../hooks/usePaginatedData';
import Pagination from '../components/Pagination';

const AccessLogs: React.FC = () => {
  // 使用分页Hook
  const [accessLogsState, accessLogsActions] = useAccessLogs({
    pageSize: 30,
  });
  const [lateAlertsState, lateAlertsActions] = useLateReturnAlerts({
    pageSize: 20,
  });

  // 状态管理
  const [activeTab, setActiveTab] = useState<'live' | 'late-returns'>('live');
  const [liveLogs, setLiveLogs] = useState<AccessLog[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isHandlingAlert, setIsHandlingAlert] = useState<string | null>(null);

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBuilding, setFilterBuilding] = useState<string>('All');

  // 同步搜索和筛选条件到分页Hook
  useEffect(() => {
    accessLogsActions.setSearch(searchTerm);
  }, [searchTerm, accessLogsActions]);

  useEffect(() => {
    accessLogsActions.setFilters({
      direction: filterDirection === 'All' ? undefined : filterDirection,
      status: filterStatus === 'All' ? undefined : filterStatus,
      building: filterBuilding === 'All' ? undefined : filterBuilding,
    });
  }, [filterDirection, filterStatus, filterBuilding, accessLogsActions]);

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [buildingsData, liveData] = await Promise.all([
          api.getBuildings(),
          api.getLiveAccessLogs(),
        ]);
        setBuildings(buildingsData);
        setLiveLogs(liveData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();

    // 每30秒刷新一次实时数据
    const interval = setInterval(loadInitialData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 处理晚归告警
  const handleLateReturn = async (alertId: string, status: 'Handled' | 'Ignored') => {
    setIsHandlingAlert(alertId);
    try {
      await api.handleLateReturn(alertId, {
        handler: '当前用户',
        comment: '已处理',
        status,
      });
      lateAlertsActions.refresh();
    } catch (error: any) {
      alert(error.message || '处理失败');
    } finally {
      setIsHandlingAlert(null);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Late': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Absent': return <X className="w-4 h-4 text-red-600" />;
      default: return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Late': return 'text-red-600 bg-red-50 border-red-100';
      case 'Absent': return 'text-red-700 bg-red-50 border-red-100';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Late': return '晚归';
      case 'Absent': return '未归';
      default: return '正常';
    }
  };

  // 获取方向图标和文本
  const getDirectionInfo = (direction: string) => {
    if (direction === 'In') {
      return {
        icon: <DoorOpen className="w-4 h-4" />,
        text: '进入',
        color: 'text-emerald-600'
      };
    }
    return {
      icon: <Activity className="w-4 h-4" />,
      text: '外出',
      color: 'text-amber-600'
    };
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-indigo-600" />
            晚归监控
          </h1>
          <p className="text-slate-500">实时监控学生出入情况，及时处理晚归预警</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            <span>实时监控</span>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'live'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Clock className="inline w-4 h-4 mr-2" />
          实时门禁
        </button>
        <button
          onClick={() => setActiveTab('late-returns')}
          className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'late-returns'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <AlertTriangle className="inline w-4 h-4 mr-2" />
          晚归告警
          {lateAlertsState.data.filter(a => a.status === 'Pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {lateAlertsState.data.filter(a => a.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="搜索学生姓名、房间号、门禁点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="All">所有方向</option>
            <option value="In">进入</option>
            <option value="Out">外出</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="All">所有状态</option>
            <option value="Normal">正常</option>
            <option value="Late">晚归</option>
            <option value="Absent">未归</option>
          </select>
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="All">所有楼栋</option>
            {buildings.map(building => (
              <option key={building.id} value={building.name}>{building.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 实时门禁标签页 */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* 实时动态 - 顶部5条 */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                实时动态
              </h3>
              <span className="text-sm text-indigo-600">最近5条记录</span>
            </div>
            <div className="space-y-2">
              {liveLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDirectionInfo(log.direction).icon}
                    <div>
                      <span className="font-medium text-slate-900">{log.studentName}</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="text-slate-600">{log.roomNumber}室</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={getDirectionInfo(log.direction).color}>
                      {getDirectionInfo(log.direction).text}
                    </span>
                    <span className="text-slate-400">{log.gateName}</span>
                    <span className="text-slate-400">{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 详细门禁记录列表 */}
          <div className="space-y-3">
            {accessLogsState.data.map((log) => {
              const directionInfo = getDirectionInfo(log.direction);
              return (
                <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {directionInfo.icon}
                        <span className={`font-medium ${directionInfo.color}`}>
                          {directionInfo.text}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{log.studentName}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{log.roomNumber}室</span>
                          <span>•</span>
                          <span>{log.gateName}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(log.status)}`}>
                        <span className="mr-1">{getStatusIcon(log.status)}</span>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 空状态 */}
            {accessLogsState.data.length === 0 && !accessLogsState.loading && !accessLogsState.error && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <DoorOpen size={48} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-slate-900 font-medium">暂无门禁记录</h3>
                <p className="text-slate-500 text-sm">当前筛选条件下没有门禁记录</p>
              </div>
            )}
          </div>

          {/* 分页 */}
          {!accessLogsState.loading && !accessLogsState.error && accessLogsState.data.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={accessLogsState.page}
                totalPages={accessLogsState.totalPages}
                total={accessLogsState.total}
                pageSize={accessLogsState.pageSize}
                onPageChange={accessLogsActions.setPage}
                loading={accessLogsState.loading}
              />
            </div>
          )}
        </div>
      )}

      {/* 晚归告警标签页 */}
      {activeTab === 'late-returns' && (
        <div className="space-y-4">
          {lateAlertsState.data.map((alert) => (
            <div key={alert.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{alert.studentName}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{alert.roomNumber}室</span>
                        <span>•</span>
                        <span>{alert.alertDate}</span>
                        {alert.lastEntry && (
                          <>
                            <span>•</span>
                            <span>最后进入: {new Date(alert.lastEntry).toLocaleTimeString('zh-CN')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-sm font-medium ${alert.status === 'Pending' ? 'text-red-600 bg-red-50 border-red-100' :
                      alert.status === 'Handled' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                        'text-slate-600 bg-slate-50 border-slate-100'
                    }`}>
                    {alert.status === 'Pending' ? '待处理' :
                      alert.status === 'Handled' ? '已处理' : '已忽略'}
                  </span>
                </div>

                {alert.status === 'Pending' && (
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLateReturn(alert.id, 'Handled')}
                      disabled={isHandlingAlert === alert.id}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isHandlingAlert === alert.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          标记已处理
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleLateReturn(alert.id, 'Ignored')}
                      disabled={isHandlingAlert === alert.id}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isHandlingAlert === alert.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      忽略
                    </button>
                  </div>
                )}

                {alert.status !== 'Pending' && alert.handler && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>处理人: {alert.handler}</span>
                      {alert.handleTime && (
                        <span>• {new Date(alert.handleTime).toLocaleString('zh-CN')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 空状态 */}
          {lateAlertsState.data.length === 0 && !lateAlertsState.loading && !lateAlertsState.error && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-slate-900 font-medium">暂无晚归告警</h3>
              <p className="text-slate-500 text-sm">所有学生都按时归寝</p>
            </div>
          )}

          {/* 分页 */}
          {!lateAlertsState.loading && !lateAlertsState.error && lateAlertsState.data.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={lateAlertsState.page}
                totalPages={lateAlertsState.totalPages}
                total={lateAlertsState.total}
                pageSize={lateAlertsState.pageSize}
                onPageChange={lateAlertsActions.setPage}
                loading={lateAlertsState.loading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessLogs;