import React, { useState, useEffect } from 'react';
import { RepairRequest } from '../types';
import { Clock, CheckCircle, AlertCircle, X, Plus, Loader2, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useRepairRequests } from '../hooks/usePaginatedData';
import Pagination from '../components/Pagination';

const RepairRequests: React.FC = () => {
  // 使用分页Hook
  const [repairsState, repairsActions] = useRepairRequests({
    pageSize: 20,
  });

  const [activeTab, setActiveTab] = useState<'Pending' | 'In Progress' | 'Completed' | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // 同步搜索和筛选条件到分页Hook
  useEffect(() => {
    repairsActions.setSearch(searchTerm);
  }, [searchTerm, repairsActions]);

  useEffect(() => {
    const statusToFilter = activeTab === 'All' ? filterStatus : activeTab;
    repairsActions.setFilters({
      status: statusToFilter,
      priority: filterPriority === 'All' ? undefined : filterPriority,
    });
  }, [activeTab, filterStatus, filterPriority, repairsActions]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRepair, setNewRepair] = useState<Partial<RepairRequest>>({
    title: '',
    description: '',
    roomNumber: '',
    priority: 'Medium'
  });

  const handleAddRepair = async () => {
    if (!newRepair.title?.trim() || !newRepair.roomNumber?.trim()) {
      alert('请填写报修标题和房间号');
      return;
    }

    try {
      const created = await api.createRepairRequest({
        title: newRepair.title!,
        description: newRepair.description || '无详细描述',
        roomNumber: newRepair.roomNumber!,
        priority: (newRepair.priority as 'Low' | 'Medium' | 'High') || 'Medium',
      });

      // 刷新数据
      repairsActions.refresh();
      setIsModalOpen(false);
      setNewRepair({
        title: '',
        description: '',
        roomNumber: '',
        priority: 'Medium'
      });
    } catch (err: any) {
      alert(err.message || '创建报修失败');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      const updated = await api.updateRepairRequest(id, { status: newStatus });

      // 更新本地状态以避免重新加载整个页面
      repairsActions.refresh();
    } catch (err: any) {
      alert(err.message || '更新状态失败');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getPriorityText = (priority: string) => {
     switch (priority) {
      case 'High': return '高优先级';
      case 'Medium': return '中优先级';
      case 'Low': return '低优先级';
      default: return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'In Progress': return <Clock size={18} className="text-blue-500" />;
      default: return <AlertCircle size={18} className="text-amber-500" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch(tab) {
      case 'All': return '全部';
      case 'Pending': return '待处理';
      case 'In Progress': return '维修中';
      case 'Completed': return '已完成';
      default: return tab;
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">报修管理</h1>
          <p className="text-slate-500">追踪并处理宿舍设施维修请求</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>新建报修</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="搜索报修主题、房间号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-w-[120px]"
          >
            <option value="All">所有优先级</option>
            <option value="High">高优先级</option>
            <option value="Medium">中优先级</option>
            <option value="Low">低优先级</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-slate-200">
        {['All', 'Pending', 'In Progress', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {repairsState.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <p className="text-slate-500">加载中...</p>
        </div>
      )}

      {/* Error State */}
      {repairsState.error && !repairsState.loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 font-medium">加载失败: {repairsState.error}</p>
          </div>
        </div>
      )}

      {/* List */}
      {!repairsState.loading && !repairsState.error && (
        <div className="space-y-4">
          {repairsState.data.map((request) => (
          <div key={request.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(request.status)}</div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {request.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{request.roomNumber} 室</span>
                    <span>•</span>
                    <span>{request.date}</span>
                  </div>
                  <p className="text-slate-600 mt-2 text-sm line-clamp-2">
                    {request.description}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getPriorityColor(request.priority)}`}>
                {getPriorityText(request.priority)}
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
               {request.status === 'Pending' && (
                 <button 
                   onClick={() => handleUpdateStatus(request.id, 'In Progress')}
                   className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                 >
                   开始维修
                 </button>
               )}
               {request.status === 'In Progress' && (
                 <button 
                   onClick={() => handleUpdateStatus(request.id, 'Completed')}
                   className="text-sm px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                 >
                   标记完成
                 </button>
               )}
            </div>
          </div>
          ))}

          {repairsState.data.length === 0 && !repairsState.loading && !repairsState.error && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-slate-900 font-medium">暂无记录</h3>
            <p className="text-slate-500 text-sm">当前筛选条件下没有报修请求</p>
          </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!repairsState.loading && !repairsState.error && repairsState.data.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={repairsState.page}
            totalPages={repairsState.totalPages}
            total={repairsState.total}
            pageSize={repairsState.pageSize}
            onPageChange={repairsActions.setPage}
            loading={repairsState.loading}
          />
        </div>
      )}

      {/* Add Repair Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">新建报修单</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">报修主题</label>
                <input 
                  type="text"
                  value={newRepair.title}
                  onChange={(e) => setNewRepair({...newRepair, title: e.target.value})}
                  placeholder="例如: 空调漏水"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">房间号</label>
                  <input 
                    type="text"
                    value={newRepair.roomNumber}
                    onChange={(e) => setNewRepair({...newRepair, roomNumber: e.target.value})}
                    placeholder="例如: 101"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">优先级</label>
                  <select 
                    value={newRepair.priority}
                    onChange={(e) => setNewRepair({...newRepair, priority: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Low">低 - 不影响生活</option>
                    <option value="Medium">中 - 需要维修</option>
                    <option value="High">高 - 紧急情况</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">详细描述</label>
                <textarea 
                  value={newRepair.description}
                  onChange={(e) => setNewRepair({...newRepair, description: e.target.value})}
                  placeholder="请详细描述故障情况..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAddRepair}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
              >
                提交报修
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairRequests;