import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, MessageSquare, AlertCircle, X, Sparkles, Send } from 'lucide-react';
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
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeMemberId || (members[0]?.id ?? ''));
  const [dayChoice, setDayChoice] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedMemberId if modal opens or activeMemberId changes
  React.useEffect(() => {
    if (activeMemberId) {
      setSelectedMemberId(activeMemberId);
    } else if (members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
    setDayChoice('today');
    setCustomDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setErrorMsg(null);
  }, [task, activeMemberId, members, isOpen]);

  if (!isOpen || !task) return null;

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
    if (!selectedMemberId) {
      setErrorMsg('Veuillez sélectionner qui a réalisé la tâche.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const { date, label } = getComputedDateAndLabel();

    try {
      const res = await api.dispatchAction('SUBMIT_CHORE', {
        taskId: task.id,
        memberId: selectedMemberId,
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

  const selectedMember = members.find((m) => m.id === selectedMemberId);

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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Qui a réalisé cette tâche ?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const isSelected = m.id === selectedMemberId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{m.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{m.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
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
              placeholder="Ex: J'ai bien nettoyé sous la table !"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden transition"
            />
          </div>

          {/* Validation Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Une fois envoyée, cette tâche apparaîtra sur l’écran de validation des <strong>Tuteurs (Parents)</strong>.
              Dès qu'un tuteur valide, vos <strong>+{task.points} points</strong> seront immédiatement crédités !
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
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Envoi...' : `J'ai fait cette mission ! (+${task.points} pts)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
