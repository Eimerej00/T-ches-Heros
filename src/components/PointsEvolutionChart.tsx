import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Info, Sparkles } from 'lucide-react';
import type { FamilyMember, FamilyState } from '../types.ts';

interface PointsEvolutionChartProps {
  state: FamilyState;
}

export const PointsEvolutionChart: React.FC<PointsEvolutionChartProps> = ({ state }) => {
  const [viewMode, setViewMode] = useState<'month' | 'last14'>('month');

  const { chartData, memberLines, currentMonthName } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();

    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Calculate baseline and monthly chore additions for each member
    // All validated submissions in state
    const validatedSubmissions = state.submissions.filter((s) => s.status === 'validee');

    // Build timeline dates
    const datePoints: { dateStr: string; label: string }[] = [];

    if (viewMode === 'month') {
      // From day 1 of this month up to today (at least 7 days for a pleasant graph spread)
      const maxDay = Math.max(currentDay, 7);
      for (let d = 1; d <= maxDay; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label = `${d} ${dateObj.toLocaleDateString('fr-FR', { month: 'short' })}`;
        datePoints.push({ dateStr, label });
      }
    } else {
      // Last 14 days
      for (let i = 13; i >= 0; i--) {
        const dateObj = new Date(now.getTime() - i * 86400000);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const label = `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', { month: 'short' })}`;
        datePoints.push({ dateStr, label });
      }
    }

    // Compute cumulative data points
    // For each member, find their chores earned up to each date
    const data = datePoints.map(({ dateStr, label }) => {
      const point: Record<string, string | number> = { date: label };

      state.members.forEach((member) => {
        // Sum of all validated chores for this member up to this date
        const earnedUpToDate = validatedSubmissions
          .filter((s) => s.submittedBy === member.id && s.completedDate <= dateStr)
          .reduce((sum, s) => sum + (s.points || 0), 0);

        // If totalEarnedPoints has a baseline not in submissions, account for it
        const totalSubmissionsPoints = validatedSubmissions
          .filter((s) => s.submittedBy === member.id)
          .reduce((sum, s) => sum + (s.points || 0), 0);

        const baseline = Math.max(0, (member.totalEarnedPoints || 0) - totalSubmissionsPoints);
        point[member.id] = baseline + earnedUpToDate;
      });

      return point;
    });

    const lines = state.members.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      color: member.color || '#4f46e5',
      role: member.role,
    }));

    return {
      chartData: data,
      memberLines: lines,
      currentMonthName: capitalizedMonthName,
    };
  }, [state, viewMode]);

  // Find max value in chart to adjust YAxis
  const maxPoints = useMemo(() => {
    let max = 50;
    chartData.forEach((row) => {
      state.members.forEach((m) => {
        const val = Number(row[m.id]) || 0;
        if (val > max) max = val;
      });
    });
    return Math.ceil(max / 10) * 10 + 10;
  }, [chartData, state.members]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      {/* Header of chart card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Évolution des Points Cumulés
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-10">
            Progression des héros de la tribu au cours de {currentMonthName}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'month'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mois en cours
          </button>
          <button
            onClick={() => setViewMode('last14')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === 'last14'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 derniers jours
          </button>
        </div>
      </div>

      {/* Member Chips Legend on top for quick glance */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {memberLines.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold bg-slate-50 border-slate-200 text-slate-800 shadow-2xs"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <span>{member.avatar}</span>
            <span>{member.name}</span>
          </div>
        ))}
      </div>

      {/* Recharts LineChart container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              dy={5}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              domain={[0, maxPoints]}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="font-extrabold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{label}</span>
                        </span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        {payload.map((entry) => {
                          const mem = memberLines.find((m) => m.id === entry.dataKey);
                          if (!mem) return null;
                          return (
                            <div
                              key={mem.id}
                              className="flex items-center justify-between gap-4 font-medium"
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{mem.avatar}</span>
                                <span className="font-bold text-slate-800">{mem.name}</span>
                              </div>
                              <span className="font-black text-slate-900">
                                {entry.value} pts
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {memberLines.map((member) => (
              <Line
                key={member.id}
                type="monotone"
                dataKey={member.id}
                name={member.name}
                stroke={member.color}
                strokeWidth={3}
                dot={{ r: 3, fill: member.color, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: member.color, stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info caption */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        <span>
          Les points grimpent au fur et à mesure que les missions sont validées par les tuteurs.
        </span>
      </div>
    </div>
  );
};
