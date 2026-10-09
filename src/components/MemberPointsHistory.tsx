import React, { useState } from 'react';
import {
  History,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { FamilyMember, FamilyState, ChoreSubmission } from '../types.ts';

interface MemberPointsHistoryProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
}

export const MemberPointsHistory: React.FC<MemberPointsHistoryProps> = ({ state, activeMember }) => {
  const [showAll, setShowAll] = useState(false);

  if (!activeMember) return null;

  const getMemberPoints = (s: ChoreSubmission): number => {
    const isCoop = !!s.isCoop || (Array.isArray(s.participantIds) && s.participantIds.length > 1);
    if (isCoop) {
      if (s.pointsPerParticipant) return s.pointsPerParticipant;
      const count = s.participantIds && s.participantIds.length > 0 ? s.participantIds.length : 1;
      return Math.ceil(s.points / count);
    }
    return s.points || 0;
  };

  // Filter validated submissions where the active member participated
  const validatedSubmissions = state.submissions
    .filter((s) => {
      if (s.status !== 'validee') return false;
      if (s.participantIds && s.participantIds.length > 0) {
        return s.participantIds.includes(activeMember.id);
      }
      return s.submittedBy === activeMember.id;
    })
    .sort((a, b) => {
      const timeA = new Date(a.validatedAt || a.submittedAt || a.completedDate).getTime();
      const timeB = new Date(b.validatedAt || b.submittedAt || b.completedDate).getTime();
      return timeB - timeA;
    });

  const totalPointsGained = validatedSubmissions.reduce((sum, s) => sum + getMemberPoints(s), 0);
  const displayedSubmissions = showAll ? validatedSubmissions : validatedSubmissions.slice(0, 5);

  const formatValidationDate = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-2xs"
            style={{
              backgroundColor: `${activeMember.color}20`,
              border: `2px solid ${activeMember.color}`,
            }}
          >
            {activeMember.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Points Gagnés Récemment
              </h2>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                {activeMember.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des missions validées et des points crédités
            </p>
          </div>
        </div>

        {/* Stats Summary Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {validatedSubmissions.length} mission{validatedSubmissions.length > 1 ? 's' : ''} validée{validatedSubmissions.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-2xs">
            +{totalPointsGained} pts au total
          </div>
        </div>
      </div>

      {/* History Items List */}
      {validatedSubmissions.length === 0 ? (
        /* Empty State */
        <div className="py-10 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 p-6 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl mb-2">
            🌱
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">
            Aucune mission validée pour le moment
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dès que <strong>{activeMember.name}</strong> accomplit une mission et qu'un tuteur la valide,
            les points et la date apparaîtront ici !
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedSubmissions.map((sub) => {
            const memberPoints = getMemberPoints(sub);
            const isCoop = !!sub.isCoop || (Array.isArray(sub.participantIds) && sub.participantIds.length > 1);
            return (
              <div
                key={sub.id}
                className={`p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  isCoop ? 'border-purple-200 hover:border-purple-300' : 'border-slate-200/90 hover:border-indigo-200'
                }`}
              >
                {/* Left: Icon & Details */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    {sub.taskIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{sub.taskTitle}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
                        {sub.taskCategory}
                      </span>
                      {isCoop && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xs">
                          <Users className="w-2.5 h-2.5" />
                          Coop
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      {isCoop && sub.participantNames && sub.participantNames.length > 0 && (
                        <>
                          <span className="font-semibold text-purple-700">
                            En équipe avec {sub.participantNames.filter((n) => n !== activeMember.name).join(' & ') || 'l’équipe'}
                          </span>
                          <span>•</span>
                        </>
                      )}

                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>Fait : {sub.completedDateLabel}</span>
                      </span>

                      {sub.validatedByName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Validé par {sub.validatedByName}</span>
                            {sub.validatedAt && (
                              <span className="text-slate-400">({formatValidationDate(sub.validatedAt)})</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Child's note if any */}
                    {sub.note && (
                      <div className="mt-1.5 text-[11px] text-slate-600 italic flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>« {sub.note} »</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Points Pill */}
                <div className="flex items-center justify-end sm:justify-center">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-white font-black text-xs sm:text-sm shadow-xs ${
                      memberPoints >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/80" />
                    {memberPoints > 0 ? `+${memberPoints}` : memberPoints} pts
                  </span>
                </div>
              </div>
            );
          })}

          {/* Toggle show all if more than 5 */}
          {validatedSubmissions.length > 5 && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Réduire l’historique</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Voir tout l’historique ({validatedSubmissions.length} missions)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
