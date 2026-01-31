import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Notice } from '../types';

const NoticeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotice = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await api.getNoticeById(id);
                setNotice(data);
            } catch (err: any) {
                console.error('Failed to load notice:', err);
                setError(err.message || '加载公告详情失败');
            } finally {
                setLoading(false);
            }
        };

        fetchNotice();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-2" />
                <p className="text-slate-500">加载中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <button
                    onClick={() => navigate('/notices')}
                    className="flex items-center text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    返回公告列表
                </button>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-700 mb-2">无法加载公告</h3>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!notice) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-6">
            <button
                onClick={() => navigate('/notices')}
                className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
            >
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                返回公告列表
            </button>

            <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">{notice.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-500" />
                            {notice.date}
                        </span>
                        <span className="flex items-center gap-2">
                            <User size={16} className="text-indigo-500" />
                            发布者: <span className="font-medium text-slate-700">{notice.author}</span>
                        </span>
                    </div>
                </div>

                <div className="p-8 min-h-[300px]">
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-loose whitespace-pre-wrap text-lg">
                            {notice.content}
                        </p>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default NoticeDetail;
