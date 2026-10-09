import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, MessageSquare, AlertCircle, X, Sparkles, Send, Users, Check } from 'lucide-react';
import type { ChoreTask, FamilyMember } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface SubmitTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ChoreTask | null;
  members: FamilyMember[];
  activeMemberId: string | null;
}

export const SubmitTaskModal: React.FC<SubmitTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  members,
  activeMemberId,
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    activeMemberId ? [activeMemberId] : (members[0] ? [members[0].id] : [])
  );
  const [dayChoice, setDayChoice] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedMemberIds if modal opens or activeMemberId changes
  React.useEffect(() => {
    if (isOpen) {
      if (activeMemberId) {
        setSelectedMemberIds([activeMemberId]);
      } else if (members.length > 0) {
        setSelectedMemberIds([members[0].id]);
      } else {
        setSelectedMemberIds([]);
      }
      setDayChoice('today');
      setCustomDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setErrorMsg(null);
    }
  }, [task, activeMemberId, isOpen, members]);

  if (!isOpen || !task) return null;

  const isCoop = selectedMemberIds.length > 1;
  const pointsPerParticipant = isCoop
    ? Math.ceil(task.points / selectedMemberIds.length)
    : task.points;

  const selectedMembers = members.filter((m) => selectedMemberIds.includes(m.id));
  const selectedMemberNames = selectedMembers.map((m) => m.name);

  const handleToggleMember = (id: string) => {
    sounds.playPop();
    setSelectedMemberIds((prev) => {
      if (prev.includes(id)) {
        // Only remove if more than 1 is selected
        if (prev.length > 1) {
          return prev.filter((mId) => mId !== id);
        }
        return prev;
      } else {
        return [...prev, id];
      }
    });
    setErrorMsg(null);
  };

  const getComputedDateAndLabel = () => {
    const today = new Date();
    if (dayChoice === 'today') {
      const formatted = today.toISOString().split('T')[0];
      const label = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
      return { date: formatted, label: `Aujourd’hui (${label})` };
    }
    if (dayChoice === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000);
      const formatted = yesterday.toISOString().split('T')[0];
      const label = yesterday.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
      return { date: formatted, label: `Hier (${label})` };
    }
    // custom
    const d = new Date(customDate);
    const label = isNaN(d.getTime())
      ? customDate
      : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
    return { date: customDate, label: `Le ${label}` };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une personne ayant réalisé la tâche.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const { date, label } = getComputedDateAndLabel();

    try {
      const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const res = await api.dispatchAction('SUBMIT_CHORE', {
        submissionId,
        taskId: task.id,
        memberId: selectedMemberIds[0],
        participantIds: selectedMemberIds,
        completedDate: date,
        completedDateLabel: label,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de l’envoi');
        return;
      }

      sounds.playSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
              {task.icon}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                Déclarer une mission faite
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  +{task.points} points
                </span>
                <span className="text-xs text-slate-400 capitalize">{task.category}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Name Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tâche effectuée :</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{task.title}</div>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 italic">{task.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Qui a réalisé cette tâche ?
              </label>
              {isCoop ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
                  <Users className="w-3 h-3" />
                  Mission Coop ({selectedMemberIds.length} joueurs)
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Touchez 2+ profils pour Coop 🤝
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleMember(m.id)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-300 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xl flex-shrink-0">{m.avatar}</span>
                      <div className="truncate min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{m.role}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-300 bg-slate-100 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cooperative Mission Info Banner */}
            {isCoop && (
              <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-indigo-200/90 text-indigo-950 space-y-1.5 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Mission Coopérative en Équipe ! 🤝</span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xs">
                    Coop
                  </span>
                </div>
                <p className="text-xs text-indigo-800 leading-snug">
                  Réalisée ensemble par <strong>{selectedMemberNames.join(' & ')}</strong>.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 text-xs">
                  <span className="text-slate-600 font-medium">Partage équitable ({task.points} pts) :</span>
                  <span className="font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                    +{pointsPerParticipant} pts chacun (arrondi sup.)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Day selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quand a-t-elle été effectuée ?</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDayChoice('today')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                  dayChoice === 'today'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={() => setDayChoice('yesterday')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                  dayChoice === 'yesterday'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hier
              </button>

              <button
                type="button"
                onClick={() => setDayChoice('custom')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                  dayChoice === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Autre jour
              </button>
            </div>

            {dayChoice === 'custom' && (
              <div className="mt-2">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Child's note / comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Un petit mot ou commentaire pour le tuteur ? (facultatif)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: On a rangé ensemble dans la bonne humeur !"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden transition"
            />
          </div>

          {/* Validation Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Une fois envoyée, cette tâche apparaîtra sur l’écran de validation des <strong>Tuteurs (Parents)</strong>.
              {isCoop ? (
                <> Dès validation, <strong>+{pointsPerParticipant} points chacun</strong> seront immédiatement crédités à <strong>{selectedMemberNames.join(' et ')}</strong> !</>
              ) : (
                <> Dès qu'un tuteur valide, vos <strong>+{task.points} points</strong> seront immédiatement crédités !</>
              )}
            </p>
          </div>

          {/* Submit button */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedMemberIds.length === 0}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                isCoop
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              } ${isSubmitting || selectedMemberIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Envoi...'
                  : isCoop
                  ? `Déclarer la mission Coop (+${pointsPerParticipant} pts/chacun) 🤝`
                  : `J'ai fait cette mission ! (+${task.points} pts) ✨`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
