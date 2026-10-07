import React from 'react';
import { Trophy, Star, Sparkles, Flame, Shield, Award } from 'lucide-react';
import type { FamilyMember, FamilyState } from '../types.ts';
import { PointsEvolutionChart } from './PointsEvolutionChart.tsx';
import { BadgesGallery } from './BadgesGallery.tsx';
import { MemberPointsHistory } from './MemberPointsHistory.tsx';
import { getMemberBadgeProgress } from '../services/badges.ts';

interface LeaderboardProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ state, activeMember }) => {
  // Sort members by total earned points
  const sortedMembers = [...state.members].sort(
    (a, b) => (b.totalEarnedPoints || b.points) - (a.totalEarnedPoints || a.points)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Classement & Niveaux</span>
          <span className="text-xl">🏆</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Chaque mission accomplie vous fait progresser dans les rangs des Héros !
        </p>
      </div>

      {/* Podium for top 3 if at least 2 members */}
      {sortedMembers.length >= 2 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 pb-2 items-end max-w-md mx-auto text-center">
          {/* #2 */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-2xl shadow-sm relative mb-2">
              <span>{sortedMembers[1]?.avatar}</span>
              <span className="absolute -top-2.5 -right-2 w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center shadow-xs">
                2
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-800 truncate max-w-full">
              {sortedMembers[1]?.name}
            </div>
            <div className="text-[11px] font-bold text-indigo-600">
              {sortedMembers[1]?.totalEarnedPoints} pts
            </div>
            <div className="w-full h-16 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-400 text-lg">
              🥈
            </div>
          </div>

          {/* #1 */}
          <div className="flex flex-col items-center">
            <div className="w-18 h-18 rounded-3xl bg-amber-50 border-3 border-amber-400 flex items-center justify-center text-3xl shadow-md relative mb-2 ring-4 ring-amber-100">
              <span>{sortedMembers[0]?.avatar}</span>
              <span className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center shadow-xs">
                👑
              </span>
            </div>
            <div className="font-black text-sm sm:text-base text-slate-900 truncate max-w-full">
              {sortedMembers[0]?.name}
            </div>
            <div className="text-xs font-extrabold text-amber-600">
              {sortedMembers[0]?.totalEarnedPoints} pts
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-2xl mt-2 flex items-center justify-center font-black text-amber-800 text-2xl shadow-xs">
              🥇
            </div>
          </div>

          {/* #3 */}
          <div className="flex flex-col items-center">
            {sortedMembers[2] ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-50/60 border-2 border-amber-600/40 flex items-center justify-center text-2xl shadow-sm relative mb-2">
                  <span>{sortedMembers[2]?.avatar}</span>
                  <span className="absolute -top-2.5 -right-2 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    3
                  </span>
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-800 truncate max-w-full">
                  {sortedMembers[2]?.name}
                </div>
                <div className="text-[11px] font-bold text-indigo-600">
                  {sortedMembers[2]?.totalEarnedPoints} pts
                </div>
                <div className="w-full h-12 bg-gradient-to-t from-amber-700/20 to-amber-700/10 rounded-t-2xl mt-2 flex items-center justify-center font-black text-amber-800 text-lg">
                  🥉
                </div>
              </>
            ) : (
              <div className="w-full h-12" />
            )}
          </div>
        </div>
      )}

      {/* Recharts Monthly Cumulative Points Line Chart */}
      <PointsEvolutionChart state={state} />

      {/* Full Members Ranking List */}
      <div className="space-y-3">
        {sortedMembers.map((member, index) => {
          const isCurrent = activeMember?.id === member.id;
          const nextLevelThreshold = member.level * 150;
          const progressPercent = Math.min(100, Math.round(((member.totalEarnedPoints % 150) / 150) * 100));

          return (
            <div
              key={member.id}
              className={`p-4 rounded-3xl bg-white border transition ${
                isCurrent
                  ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-black text-base text-slate-400">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xs"
                    style={{
                      backgroundColor: `${member.color}20`,
                      border: `2px solid ${member.color}`,
                    }}
                  >
                    {member.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">{member.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-md">
                          Moi
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {member.role === 'tuteur' ? 'Tuteur' : 'Joueur'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Niv. {member.level} — <span className="text-indigo-600 font-semibold">{member.title}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-base text-slate-900">{member.points} pts</div>
                  <div className="text-[11px] text-slate-400">Total gagné : {member.totalEarnedPoints}</div>
                </div>
              </div>

              {/* XP Progress Bar to next level */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>Progression Niveau {member.level}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: member.color || '#4f46e5',
                    }}
                  />
                </div>
              </div>

              {/* Unlocked Badges Row */}
              {(() => {
                const badges = getMemberBadgeProgress(member, state).filter((b) => b.unlocked);
                return (
                  <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Médailles ({badges.length}) :
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {badges.length > 0 ? (
                        badges.map((b) => (
                          <span
                            key={b.badge.id}
                            title={`${b.badge.title} : ${b.badge.description}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs cursor-help"
                          >
                            <span>{b.badge.icon}</span>
                            <span className="text-[10px] hidden sm:inline">{b.badge.title}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          En route vers le 1er badge...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Recent Points History for Active Member */}
      <MemberPointsHistory state={state} activeMember={activeMember} />

      {/* Badges and Medals Gallery */}
      <BadgesGallery state={state} activeMember={activeMember} />
    </div>
  );
};
