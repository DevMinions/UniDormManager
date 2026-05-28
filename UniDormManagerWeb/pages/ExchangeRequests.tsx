
import React, { useState, useEffect } from 'react';
import { GitPullRequest, CheckCircle2, XCircle, Clock, ChevronRight, User, MapPin, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RoomSwapApplication } from '../types';

const ExchangeRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RoomSwapApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingRoomSwapApplications();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: RoomSwapApplication) => {
    setProcessingId(req.id);
    try {
      await api.approveRoomSwapApplication(req.id, {
        approverId: user?.id || '',
        approverRole: 'DormManager',
        status: 'Approved',
        comment: '审批通过',
      });
      fetchRequests();
    } catch (error: any) {
      alert(error.message || '审批失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: RoomSwapApplication) => {
    setProcessingId(req.id);
    try {
      await api.approveRoomSwapApplication(req.id, {
        approverId: user?.id || '',
        approverRole: 'DormManager',
        status: 'Rejected',
        comment: '审批驳回',
      });
      fetchRequests();
    } catch (error: any) {
      alert(error.message || '驳回失败');
    } finally {
      setProcessingId(null);
    }
  };

  const getStepLabel = (status: RoomSwapApplication['status']) => {
    switch (status) {
      case 'Pending': return '待审核';
      case 'CounselorApproved': return '辅导员已过';
      case 'CollegeApproved': return '学院已过';
      case 'FinalApproved': return '最终通过';
      case 'Completed': return '已完成';
      case 'Cancelled': return '已取消';
      case 'CounselorRejected':
      case 'CollegeRejected':
      case 'FinalRejected': return '已驳回';
      default: return '进行中';
    }
  };

  const getStatusColor = (status: RoomSwapApplication['status']) => {
    if (['FinalApproved', 'Completed'].includes(status)) return 'text-emerald-600 bg-emerald-50';
    if (status.includes('Rejected')) return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="text-indigo-600" />
            换寝审批
          </h1>
          <p className="text-slate-500">处理学生调寝、退宿等申请流程</p>
        </div>
      </div>

      <div className="space-y-6">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Left: Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {req.applicantName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{req.applicantName} 的调寝申请</h3>
                    <p className="text-xs text-slate-500">提交于 {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`ml-auto md:ml-0 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                    {getStepLabel(req.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">当前寝室</p>
                    <p className="font-bold text-slate-700">{req.currentRoom}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">意向寝室</p>
                    <p className="font-bold text-indigo-600">{req.targetRoom}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">申请理由</p>
                    <p className="text-sm text-slate-600">{req.reason}</p>
                  </div>
                </div>
              </div>

              {/* Right: Workflow View */}
              <div className="w-full md:w-64 border-l border-slate-100 pl-0 md:pl-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">审核链条</h4>
                <div className="relative space-y-6">
                  {['辅导员', '学院', '公寓中心'].map((step, idx) => {
                    const steps: Array<RoomSwapApplication['currentStep']> = ['Counselor', 'College', 'ApartmentCenter'];
                    const currentStepIdx = steps.indexOf(req.currentStep);
                    const isPast = currentStepIdx > idx;
                    const isCurrent = currentStepIdx === idx;
                    const isPending = currentStepIdx < idx;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${isPast ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                          }`}>
                          {isPast ? <CheckCircle2 size={14} /> : <span className="text-xs">{idx + 1}</span>}
                        </div>
                        <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step}
                        </span>
                        {idx < 2 && <div className={`absolute left-3 top-6 w-0.5 h-6 ${isPast ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>}
                      </div>
                    );
                  })}
                </div>

                {!['FinalApproved', 'Completed', 'Cancelled'].includes(req.status) && !req.status.includes('Rejected') && (
                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === req.id ? '处理中...' : '通过'}
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      disabled={processingId === req.id}
                      className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === req.id ? '处理中...' : '驳回'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-center py-12">
            <Clock className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : requests.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed">
            <Clock size={48} className="mx-auto text-slate-200 mb-2" />
            <p className="text-slate-400">暂无待处理的流程申请</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeRequests;
