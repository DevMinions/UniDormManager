import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Pin, Plus, Loader2, AlertCircle, X } from 'lucide-react';
import { Notice } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Notices: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', author: user?.realName || '' });

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getNotices();
        setNotices(data);
      } catch (err: any) {
        console.error('Failed to load notices:', err);
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handleCreateNotice = async () => {
    if (!newNotice.title || !newNotice.content) return;
    try {
      const created = await api.createNotice({
        title: newNotice.title,
        content: newNotice.content,
        author: newNotice.author || user?.realName || '系统管理员',
      });
      setNotices([created, ...notices]);
      setIsModalOpen(false);
      setNewNotice({ title: '', content: '', author: user?.realName || '' });
    } catch (err: any) {
      alert(err.message || '发布失败');
    }
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">公告通知</h1>
          <p className="text-slate-500">发布及管理宿舍重要通知</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>发布通知</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <p className="text-slate-500">加载中...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 font-medium">加载失败: {error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!loading && !error && notices.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无公告</p>
          </div>
        )}
        {!loading && !error && notices.map((notice, index) => (
          <div key={notice.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-red-50 text-red-600 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
                <Pin size={12} fill="currentColor" />
                置顶
              </div>
            )}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Bell size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{notice.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {notice.date}
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {notice.author}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {notice.content}
                </p>
                <button
                  onClick={() => navigate(`/notices/${notice.id}`)}
                  className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  查看详情 &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">发布新公告</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">标题</label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  placeholder="请输入公告标题"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">内容</label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 resize-none"
                  placeholder="请输入公告内容"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">发布者</label>
                <input
                  type="text"
                  value={newNotice.author}
                  onChange={(e) => setNewNotice({ ...newNotice, author: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  placeholder="发布者名称"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
                取消
              </button>
              <button
                onClick={handleCreateNotice}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;