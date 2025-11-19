
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, BookOpen, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { analyzeSchedule } from '../services/geminiService';

export const Dashboard: React.FC = () => {
  const { instructors, courses, schedule } = useApp();
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeSchedule(courses, instructors, schedule);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  // Prepare Chart Data
  const data = instructors.map(i => ({
    name: i.name.split(' ')[1] || i.name, // Last name roughly
    assigned: i.assignedHours,
    max: i.maxHoursPerWeek
  }));

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all">
            <Sparkles className="w-4 h-4" />
            {loadingAi ? "Analyzing..." : "Ask AI Analysis"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Instructors" value={instructors.length} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Courses" value={courses.length} icon={BookOpen} color="bg-green-500" />
        <StatCard title="Scheduled Sessions" value={schedule.length} icon={Calendar} color="bg-orange-500" />
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl animate-fade-in">
            <h3 className="text-indigo-800 font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Gemini Insight
            </h3>
            <p className="text-indigo-900 text-sm leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Workload Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="assigned" name="Assigned Hours" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.assigned > entry.max ? '#ef4444' : '#6366f1'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts / Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Status & Alerts</h2>
            <div className="space-y-3">
                {instructors.filter(i => i.assignedHours > i.maxHoursPerWeek).map(i => (
                    <div key={i.id} className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span><strong>Overload Alert:</strong> {i.name} is assigned {i.assignedHours}h (Max: {i.maxHoursPerWeek}h).</span>
                    </div>
                ))}
                {instructors.filter(i => i.assignedHours === 0).map(i => (
                    <div key={i.id} className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span><strong>Underutilized:</strong> {i.name} has no assigned classes.</span>
                    </div>
                ))}
                {instructors.every(i => i.assignedHours <= i.maxHoursPerWeek && i.assignedHours > 0) && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                        <Sparkles className="w-5 h-5" />
                        <span>All assignments appear to be within limits.</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};