import React, { useState, useEffect } from 'react';
import { InspectionRanking, Building } from '../types';
import { Trophy, Medal, AlertTriangle, TrendingUp, Calendar, Filter, Building2, ChevronUp, ChevronDown, Star, Crown } from 'lucide-react';
import { api } from '../services/api';

const InspectionRankings: React.FC = () => {
  const [rankings, setRankings] = useState<InspectionRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('All');
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [timeRange, selectedBuilding]);

  const loadBuildings = async () => {
    try {
      const data = await api.getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error('Failed to load buildings:', err);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInspectionRankings(
        timeRange,
        selectedBuilding === 'All' ? undefined : selectedBuilding
      );
      setRankings(data);
    } catch (err: any) {
      setError(err.message || '加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number, isRedList: boolean) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    if (isRedList) return <Trophy className="w-5 h-5 text-emerald-500" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-slate-500">{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '及格';
    return '不及格';
  };

  const redList = rankings.filter(r => r.isRedList).sort((a, b) => b.weekScore - a.weekScore);
  const blackList = rankings.filter(r => r.isBlackList).sort((a, b) => a.weekScore - b.weekScore);
  const otherRooms = rankings.filter(r => !r.isRedList && !r.isBlackList).sort((a, b) => b.weekScore - a.weekScore);

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" />
            查寝红黑榜
          </h1>
          <p className="text-slate-500">公示宿舍卫生检查结果，激励优秀，督促改进</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">
            {timeRange === 'week' ? '本周' : '本月'}排行榜
          </span>
        </div>
      </div>

      {/* 筛选控件 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            本周排行
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            本月排行
          </button>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">所有楼栋</option>
            {buildings.map(building => (
              <option key={building.id} value={building.name}>{building.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* 排行榜内容 */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 红榜 - 优秀宿舍 */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-900">红榜</h2>
                <span className="text-sm text-emerald-600">优秀宿舍</span>
              </div>
            </div>

            {redList.length > 0 ? (
              <div className="space-y-3">
                {redList.map((room, index) => (
                  <div key={room.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRankIcon(index + 1, true)}
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{room.roomNumber} 室</h3>
                          <p className="text-sm text-slate-500">{room.building}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">{room.weekScore.toFixed(1)}</div>
                        <p className="text-xs text-slate-500">平均分</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">排名: {room.rank}/{room.totalRooms}</span>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>表现优秀</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">暂无优秀宿舍</p>
              </div>
            )}
          </div>

          {/* 中间 - 普通宿舍 */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-blue-900">总排行</h2>
                <span className="text-sm text-blue-600">全部宿舍</span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...redList, ...otherRooms, ...blackList].map((room, index) => (
                <div key={room.id} className={`bg-white p-3 rounded-xl border ${room.isBlackList ? 'border-red-200' : 'border-slate-200'} shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{room.roomNumber} 室</h3>
                        <p className="text-xs text-slate-500">{room.building}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{room.weekScore.toFixed(1)}</div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getScoreColor(room.weekScore)}`}>
                        {getScoreGrade(room.weekScore)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 黑榜 - 需改进宿舍 */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-red-900">黑榜</h2>
                <span className="text-sm text-red-600">需改进宿舍</span>
              </div>
            </div>

            {blackList.length > 0 ? (
              <div className="space-y-3">
                {blackList.map((room, index) => (
                  <div key={room.id} className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{room.roomNumber} 室</h3>
                          <p className="text-sm text-slate-500">{room.building}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{room.weekScore.toFixed(1)}</div>
                        <p className="text-xs text-slate-500">平均分</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">排名: {room.rank}/{room.totalRooms}</span>
                      <div className="flex items-center gap-1 text-red-600">
                        <ChevronDown className="w-4 h-4" />
                        <span>需要改进</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ 卫生状况较差，请及时整改
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">暂无需改进宿舍</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {!loading && !error && rankings.length > 0 && (
        <div className="mt-8 bg-slate-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">统计概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-slate-900">{rankings.length}</div>
              <p className="text-sm text-slate-500">总宿舍数</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600">{redList.length}</div>
              <p className="text-sm text-slate-500">优秀宿舍</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600">{otherRooms.length}</div>
              <p className="text-sm text-slate-500">普通宿舍</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{blackList.length}</div>
              <p className="text-sm text-slate-500">需改进宿舍</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionRankings;