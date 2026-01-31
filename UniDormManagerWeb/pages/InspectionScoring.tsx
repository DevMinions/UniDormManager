
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Building2, Camera, Save, Star, ChevronRight, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { api } from '../services/api';
import { Building, Room } from '../types';

const InspectionScoring: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);

  useEffect(() => {
    api.getBuildings().then(setBuildings);
  }, []);

  const handleBuildingChange = async (id: string) => {
    setSelectedBuilding(id);
    const building = buildings.find(b => b.id === id);
    if (!building) return;

    setLoading(true);
    try {
      const response = await api.getRoomsPaginated({
        page: 1,
        building: building.name,
        pageSize: 100 // Get all rooms for the building
      });
      setRooms(response.data);
    } catch (err) {
      console.error("Error loading rooms:", err);
      // Fallback/Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (roomId: string, score: number) => {
    setScores(prev => ({ ...prev, [roomId]: score }));
  };

  const submitScore = async (room: Room) => {
    const score = scores[room.id] || 100;
    const remark = remarks[room.id] || '';

    const buildingName = buildings.find(b => b.id === room.buildingId)?.name || room.building || 'Unknown Building';

    await api.createInspection({
      roomNumber: room.number,
      building: buildingName,
      overallScore: score,
      comment: remark,
      details: [
        {
          category: 'Hygiene',
          item: 'General Hygiene',
          score: score,
          maxScore: 100,
          comment: remark
        }
      ]
    });

    setSubmitted(prev => [...prev, room.id]);
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="text-indigo-600" />
            查寝评分
          </h1>
          <p className="text-slate-500">按楼栋对宿舍卫生及纪律进行实时打分</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <Building2 className="text-slate-400" />
        <select
          className="flex-1 bg-slate-50 border-none focus:ring-0 text-slate-700 font-medium"
          value={selectedBuilding}
          onChange={(e) => handleBuildingChange(e.target.value)}
        >
          <option value="">请选择要评分的楼栋...</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {!selectedBuilding && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">选择楼栋后开始录入评分</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map(room => {
            const isSubmitted = submitted.includes(room.id);
            const score = scores[room.id] || 100;

            return (
              <div key={room.id} className={`bg-white rounded-2xl border transition-all ${isSubmitted ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 shadow-sm'}`}>
                <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 w-full md:w-32">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {room.number}
                    </div>
                    <div className="md:hidden">
                      <h3 className="font-bold text-slate-900">{room.number} 室</h3>
                      <p className="text-xs text-slate-500">当前评分</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className={score < 60 ? 'text-red-500' : 'text-amber-500'} size={18} />
                        <span className="text-sm font-bold text-slate-700">评分录入: {score}分</span>
                      </div>
                      {score < 80 && (
                        <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                          <AlertTriangle size={14} />
                          <span>需拍照取证</span>
                        </div>
                      )}
                    </div>

                    <input
                      type="range"
                      min="0" max="100"
                      value={score}
                      disabled={isSubmitted}
                      onChange={(e) => handleScoreChange(room.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    <input
                      type="text"
                      placeholder="添加备注（如：卫生优秀、发现违规电器等）"
                      disabled={isSubmitted}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={remarks[room.id] || ''}
                      onChange={(e) => setRemarks(prev => ({ ...prev, [room.id]: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      className="flex-1 md:flex-none p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                      title="拍照上传"
                    >
                      <Camera size={20} />
                    </button>
                    <button
                      onClick={() => submitScore(room)}
                      disabled={isSubmitted}
                      className={`flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isSubmitted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        }`}
                    >
                      {isSubmitted ? (
                        <><CheckCircle2 size={20} /> 已提交</>
                      ) : (
                        <><Save size={20} /> 提交结果</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspectionScoring;
