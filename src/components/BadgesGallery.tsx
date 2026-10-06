import React, { useState } from 'react';
import { Award, Lock, CheckCircle2, Sparkles, Star, Shield, Filter, ChevronRight } from 'lucide-react';
import type { FamilyMember, FamilyState } from '../types.ts';
import { ALL_BADGES, getMemberBadgeProgress, type BadgeTier, type MemberBadgeProgress } from '../services/badges.ts';

interface BadgesGalleryProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
}

const TIER_STYLES: Record<BadgeTier, { border: string; bg: string; badge: string; text: string; glow: string }> = {
  bronze: {
    border: 'border-amber-700/30',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    badge: 'bg-amber-700 text-white',
    text: 'text-amber-900',
    glow: 'ring-amber-200',
  },
  argent: {
    border: 'border-slate-300',
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    badge: 'bg-slate-500 text-white',
    text: 'text-slate-800',
    glow: 'ring-slate-200',
  },
  or: {
    border: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-50/80 via-yellow-50 to-amber-100/60',
    badge: 'bg-amber-500 text-amber-950 font-black',
    text: 'text-amber-950',
    glow: 'ring-amber-300',
  },
  diamant: {
    border: 'border-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50',
    badge: 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black',
    text: 'text-cyan-950',
    glow: 'ring-cyan-300',
  },
};

export const BadgesGallery: React.FC<BadgesGalleryProps> = ({ state, activeMember }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    activeMember?.id || (state.members[0]?.id ?? '')
  );

  const selectedMember = state.members.find((m) => m.id === selectedMemberId) || state.members[0];

  const badgeProgresses = selectedMember ? getMemberBadgeProgress(selectedMember, state) : [];
  const unlockedCount = badgeProgresses.filter((b) => b.unlocked).length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Médailles & Trophées Familiaux
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-10">
            Débloquez des récompenses spéciales en franchissant des jalons de corvées
          </p>
        </div>

        {/* Member selector */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {state.members.map((m) => {
            const isSelected = m.id === selectedMember?.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{m.avatar}</span>
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress banner for selected member */}
      {selectedMember && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
              style={{
                backgroundColor: `${selectedMember.color}20`,
                border: `2px solid ${selectedMember.color}`,
              }}
            >
              {selectedMember.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Collection de {selectedMember.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {selectedMember.role}
                </span>
              </div>
              <div className="text-xs text-amber-900 font-semibold mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {unlockedCount} / {ALL_BADGES.length} médailles débloquées ({Math.round((unlockedCount / ALL_BADGES.length) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="text-right hidden xs:block">
            <span className="font-mono text-sm font-black text-amber-700 bg-white/80 px-2.5 py-1 rounded-xl border border-amber-200">
              {unlockedCount} 🎖️
            </span>
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {badgeProgresses.map(({ badge, unlocked, progress, max, percentage }) => {
          const style = TIER_STYLES[badge.tier];

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                unlocked
                  ? `${style.bg} ${style.border} shadow-xs ring-2 ${style.glow}`
                  : 'bg-slate-50/70 border-slate-200 opacity-75 hover:opacity-90'
              }`}
            >
              <div>
                {/* Top Badge Tier & Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
                      unlocked ? 'bg-white shadow-sm' : 'bg-slate-200/60 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                        unlocked ? style.badge : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {badge.tier}
                    </span>

                    {unlocked ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Title & Description */}
                <h3
                  className={`font-black text-sm leading-snug ${
                    unlocked ? style.text : 'text-slate-700'
                  }`}
                >
                  {badge.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-500">
                  <span>{unlocked ? 'Accompli ! 🎉' : `${progress} / ${max}`}</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      unlocked
                        ? 'bg-emerald-500'
                        : percentage > 50
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
