import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MessageSquare,
  AlertCircle,
  X,
  Sparkles,
  Send,
  Users,
  Check,
  User,
  UserCheck,
} from 'lucide-react';
import type { ChoreTask, FamilyMember } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface SubmitTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ChoreTask | null;
  members: FamilyMember[];
  activeMemberId: string | null;
  initialMemberId?: string | null;
  initialCoop?: boolean;
}

export const SubmitTaskModal: React.FC<SubmitTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  members,
  activeMemberId,
  initialMemberId,
  initialCoop,
}) => {
  const [mode, setMode] = useState<'single' | 'coop'>('single');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dayChoice, setDayChoice] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CRITICAL: We only initialize form state when the modal transitions from closed to open,
  // or when switching to a different task!
  // This PREVENTS background Firestore polling / snapshot re-renders from wiping out
  // the multi-player coop selection after a few seconds!
  const prevOpenRef = useRef<boolean>(false);
  const prevTaskIdRef = useRef<string | null>(null);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    const isModalOpening = isOpen && (!prevOpenRef.current || task?.id !== prevTaskIdRef.current);
    
    if (isModalOpening) {
      prevOpenRef.current = isOpen;
      prevTaskIdRef.current = task?.id || null;
      initializedRef.current = false;
    }

    if (!isOpen) {
      prevOpenRef.current = false;
      prevTaskIdRef.current = null;
      initializedRef.current = false;
    }

    // Initialize or re-initialize once members are available and modal is open for this task
    if (isOpen && task && (!initializedRef.current || selectedMemberIds.length === 0)) {
      if (members.length > 0) {
        const defaultId = initialMemberId || activeMemberId || members[0].id;
        const startInCoop = Boolean(initialCoop) || mode === 'coop';

        if (startInCoop) {
          setMode('coop');
          const otherMember = members.find((m) => m.id !== defaultId);
          if (defaultId && otherMember) {
            setSelectedMemberIds([defaultId, otherMember.id]);
          } else if (defaultId) {
            setSelectedMemberIds([defaultId]);
          } else {
            setSelectedMemberIds(members.slice(0, 2).map((m) => m.id));
          }
        } else {
          setSelectedMemberIds(defaultId ? [defaultId] : [members[0].id]);
        }

        if (isModalOpening) {
          setDayChoice('today');
          setCustomDate(new Date().toISOString().split('T')[0]);
          setNote('');
          setErrorMsg(null);
        }

        initializedRef.current = true;
      }
    }
  }, [isOpen, task?.id, initialMemberId, initialCoop, members, activeMemberId, mode]);

  if (!isOpen || !task) return null;

  const isCoop = mode === 'coop' || selectedMemberIds.length > 1;
  const count = selectedMemberIds.length > 0 ? selectedMemberIds.length : 1;
  const pointsPerParticipant = isCoop
    ? Math.ceil(task.points / count)
    : task.points;

  const selectedMembers = members.filter((m) => selectedMemberIds.includes(m.id));
  const selectedMemberNames = selectedMembers.map((m) => m.name);
  const activeMember = members.find((m) => m.id === activeMemberId);

  // Check if active player is submitting for another player
  const isDeclaringForSomeoneElse =
    !isCoop &&
    selectedMemberIds.length === 1 &&
    activeMemberId &&
    selectedMemberIds[0] !== activeMemberId;

  const targetMemberName = selectedMembers[0]?.name || 'le joueur';

  // Handler for single player mode: 1-click selection of ANY family member
  const handleSelectSingleMember = (id: string) => {
    sounds.playPop();
    setSelectedMemberIds([id]);
    setErrorMsg(null);
  };

  // Handler for coop mode: multi-select toggle
  const handleToggleCoopMember = (id: string) => {
    sounds.playPop();
    setSelectedMemberIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length > 1) {
          return prev.filter((mId) => mId !== id);
        }
        return prev; // keep at least 1
      } else {
        return [...prev, id];
      }
    });
    setErrorMsg(null);
  };

  const switchToCoop = () => {
    sounds.playPop();
    setMode('coop');
    // If only 1 member is currently selected, also add another member to start coop if available
    if (selectedMemberIds.length === 1) {
      const other = members.find((m) => m.id !== selectedMemberIds[0]);
      if (other) {
        setSelectedMemberIds((prev) => [...prev, other.id]);
      }
    }
  };

  const switchToSingle = () => {
    sounds.playPop();
    setMode('single');
    if (selectedMemberIds.length > 1) {
      // Keep activeMemberId if in selection, otherwise keep first selected
      const keepId = selectedMemberIds.includes(activeMemberId || '')
        ? activeMemberId!
        : selectedMemberIds[0];
      setSelectedMemberIds([keepId]);
    } else if (selectedMemberIds.length === 0) {
      const id = activeMemberId || (members[0] ? members[0].id : null);
      if (id) setSelectedMemberIds([id]);
    }
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
      setErrorMsg('Veuillez sélectionner au moins un joueur ayant réalisé la tâche.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const { date, label } = getComputedDateAndLabel();

    try {
      const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      
      // If declared for someone else without their phone, append a clear note
      let finalNote = note.trim();
      if (isDeclaringForSomeoneElse && activeMember) {
        const declaredMention = `[Déclaré par ${activeMember.name} pour ${targetMemberName}]`;
        finalNote = finalNote ? `${declaredMention} ${finalNote}` : declaredMention;
      }

      const res = await api.dispatchAction('SUBMIT_CHORE', {
        submissionId,
        taskId: task.id,
        memberId: selectedMemberIds[0],
        participantIds: selectedMemberIds,
        completedDate: date,
        completedDateLabel: label,
        note: finalNote || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de l’envoi de la mission');
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
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
              {task.icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-snug">
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
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Mission réalisée :</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{task.title}</div>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 italic">{task.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member selector section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Qui a réalisé cette mission ?
              </label>
              <span className="text-[11px] text-slate-500">
                {mode === 'single' ? 'Touchez un joueur' : 'Sélectionnez 2+ joueurs'}
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-3">
              <button
                type="button"
                onClick={switchToSingle}
                className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'single'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>1 Joueur (Solo)</span>
              </button>
              <button
                type="button"
                onClick={switchToCoop}
                className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'coop'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>En Équipe (Coop 🤝)</span>
              </button>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                const isCurrentSelf = activeMemberId === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (mode === 'single') {
                        handleSelectSingleMember(m.id);
                      } else {
                        handleToggleCoopMember(m.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer active:scale-98 ${
                      isSelected
                        ? mode === 'coop'
                          ? 'border-purple-600 bg-purple-50/90 ring-2 ring-purple-300 shadow-xs'
                          : 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-300 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <span className="text-2xl flex-shrink-0">{m.avatar}</span>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-extrabold text-slate-900 truncate">{m.name}</span>
                          {isCurrentSelf && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">Moi</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{m.role} • {m.points} pts</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? mode === 'coop'
                            ? 'bg-purple-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : 'border border-slate-300 bg-slate-100 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanatory Banner: Declaring for another player who has no phone */}
            {isDeclaringForSomeoneElse && (
              <div className="mt-3 p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sky-900">
                    Déclaration pour {targetMemberName}
                  </div>
                  <p className="text-[11px] text-sky-800 leading-snug mt-0.5">
                    {activeMember ? activeMember.name : 'Vous'} déclarez cette tâche pour <strong>{targetMemberName}</strong> (ex: s'il/elle n'a pas son téléphone). Les <strong>+{task.points} points</strong> lui seront bien crédités !
                  </p>
                </div>
              </div>
            )}

            {/* Cooperative Mission Info Banner */}
            {isCoop && (
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-indigo-200 text-indigo-950 space-y-2 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-indigo-950">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Mission Coopérative en Équipe ! 🤝 ({selectedMemberIds.length} joueurs)</span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xs">
                    Coop
                  </span>
                </div>
                <p className="text-xs text-indigo-900 leading-snug">
                  Réalisée ensemble par <strong>{selectedMemberNames.join(' & ')}</strong>.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 text-xs">
                  <span className="text-slate-600 font-medium">Partage ({task.points} pts au total) :</span>
                  <span className="font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
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
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
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
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
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
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
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
              <span>Un petit mot pour le tuteur ? (facultatif)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Tâche terminée avec soin !"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden transition"
            />
          </div>

          {/* Validation Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Cette tâche apparaîtra immédiatement sur l’écran de validation des <strong>Tuteurs (Parents)</strong>.
              {isCoop ? (
                <> Dès validation, <strong>+{pointsPerParticipant} points</strong> seront crédités à <strong>{selectedMemberNames.join(' et ')}</strong> !</>
              ) : isDeclaringForSomeoneElse ? (
                <> Dès validation, <strong>+{task.points} points</strong> seront crédités à <strong>{targetMemberName}</strong> !</>
              ) : (
                <> Dès validation, vos <strong>+{task.points} points</strong> seront immédiatement crédités !</>
              )}
            </p>
          </div>

          {/* Submit button */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedMemberIds.length === 0}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                isCoop
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800'
                  : isDeclaringForSomeoneElse
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              } ${isSubmitting || selectedMemberIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Envoi...'
                  : isCoop
                  ? `Déclarer la mission Coop (+${pointsPerParticipant} pts/chacun) 🤝`
                  : isDeclaringForSomeoneElse
                  ? `Déclarer pour ${targetMemberName} (+${task.points} pts) ✨`
                  : `J'ai fait cette mission ! (+${task.points} pts) ✨`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
