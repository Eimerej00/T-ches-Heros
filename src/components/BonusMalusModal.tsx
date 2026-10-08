import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Shield,
  Award,
  Minus,
  Plus,
} from 'lucide-react';
import type { FamilyMember, FamilyState } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface BonusMalusModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FamilyState;
  activeGuardian: FamilyMember | null;
}

const BONUS_SUGGESTIONS = [
  'Aide spontanée 🌟',
  'Super effort 💪',
  'Chambre impeccable 🧹',
  'Gentillesse et partage ❤️',
  'Devoirs bien faits 📚',
  'Comportement exemplaire 🥇',
  'Bonne humeur ✨',
];

const MALUS_SUGGESTIONS = [
  'Chambre en désordre 🛏️',
  'Temps d’écran dépassé 📱',
  'Dispute ou insolence ⚡',
  'Refus d’aider à la maison 🛑',
  'Mission promise non faite ⏳',
  'Rangement oublié 📦',
  'Règles non respectées ⚠️',
];

const PRESET_AMOUNTS = [5, 10, 15, 20, 25, 30, 50, 100];

export const BonusMalusModal: React.FC<BonusMalusModalProps> = ({
  isOpen,
  onClose,
  state,
  activeGuardian,
}) => {
  // Players list (prefer role === 'joueur', fallback to all members)
  const players = state.members.filter((m) => m.role === 'joueur').length > 0
    ? state.members.filter((m) => m.role === 'joueur')
    : state.members;

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isBonus, setIsBonus] = useState<boolean>(true);
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [pointsInput, setPointsInput] = useState<string>('10');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize once whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultId = players[0]?.id || state.members[0]?.id || '';
      setSelectedMemberId(defaultId);
      setIsBonus(true);
      setPointsAmount(10);
      setPointsInput('10');
      setReason('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMember = state.members.find((m) => m.id === selectedMemberId) || players[0];
  const currentPoints = selectedMember ? (selectedMember.points || 0) : 0;
  const projectedPoints = isBonus
    ? currentPoints + pointsAmount
    : Math.max(0, currentPoints - pointsAmount);

  const handleSelectMode = (bonus: boolean) => {
    sounds.playPop();
    setIsBonus(bonus);
  };

  const handleSetPresetAmount = (val: number) => {
    sounds.playPop();
    setPointsAmount(val);
    setPointsInput(String(val));
    setErrorMsg(null);
  };

  const handlePointsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setPointsInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPointsAmount(Math.min(parsed, 1000));
      setErrorMsg(null);
    } else if (raw === '') {
      setPointsAmount(0);
    }
  };

  const handleAdjustPoints = (delta: number) => {
    sounds.playPop();
    const next = Math.max(1, Math.min(1000, pointsAmount + delta));
    setPointsAmount(next);
    setPointsInput(String(next));
    setErrorMsg(null);
  };

  const handleSelectSuggestion = (sugg: string) => {
    sounds.playPop();
    setReason((prev) => (prev === sugg ? '' : sugg));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg('Veuillez sélectionner un joueur');
      return;
    }

    if (!pointsAmount || pointsAmount <= 0) {
      setErrorMsg('Veuillez choisir un nombre de points supérieur à 0');
      return;
    }

    if (!activeGuardian || activeGuardian.role !== 'tuteur') {
      setErrorMsg('Seul un tuteur peut attribuer des points bonus ou malus.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const finalReason = reason.trim() || (isBonus ? 'Bonus tuteur' : 'Malus tuteur');
      const res = await api.dispatchAction('APPLY_BONUS_MALUS', {
        memberId: selectedMember.id,
        points: pointsAmount,
        isBonus,
        reason: finalReason,
        guardianId: activeGuardian.id,
        guardianName: activeGuardian.name,
      });

      if (res.success) {
        if (isBonus) {
          sounds.playSuccess();
          triggerConfetti();
        } else {
          sounds.playPop();
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Erreur lors de l’application des points');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs transition-colors ${
                isBonus
                  ? 'bg-emerald-100/80 border border-emerald-300 text-emerald-700'
                  : 'bg-rose-100/80 border border-rose-300 text-rose-700'
              }`}
            >
              {isBonus ? <Sparkles className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-rose-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Bonus / Malus</h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Tuteur 🛡️
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attribuez ou retirez directement des points à un joueur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:space-y-5">
          {/* 1. Sélectionner le joueur */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">
              1. Sélectionner le joueur
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((m) => {
                const isSelected = selectedMember?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedMemberId(m.id);
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition flex items-center gap-2.5 relative cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl shadow-2xs flex-shrink-0"
                      style={{
                        backgroundColor: `${m.color}25`,
                        border: `1.5px solid ${m.color}`,
                      }}
                    >
                      {m.avatar}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 truncate">{m.name}</div>
                      <div className="text-[11px] font-bold text-amber-600">{m.points || 0} pts</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Choix Action : Bonus vs Malus */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">
              2. Action : Bonus (+) ou Malus (-) ?
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleSelectMode(true)}
                className={`py-3 px-3 sm:px-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                  isBonus
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <PlusCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isBonus ? 'text-white' : 'text-emerald-600'}`} />
                <span>+ BONUS (Ajouter)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode(false)}
                className={`py-3 px-3 sm:px-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                  !isBonus
                    ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <MinusCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${!isBonus ? 'text-white' : 'text-rose-600'}`} />
                <span>- MALUS (Enlever)</span>
              </button>
            </div>
          </div>

          {/* 3. Nombre de points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                3. Nombre de points à {isBonus ? 'ajouter' : 'enlever'}
              </label>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                isBonus ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isBonus ? `+${pointsAmount}` : `-${pointsAmount}`} pts
              </span>
            </div>

            {/* Presets rapides */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRESET_AMOUNTS.map((val) => {
                const isActive = pointsAmount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSetPresetAmount(val)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                      isActive
                        ? isBonus
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    {isBonus ? `+${val}` : `-${val}`}
                  </button>
                );
              })}
            </div>

            {/* Stepper + Input libre */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustPoints(-5)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Moins 5 points"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleAdjustPoints(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Moins 1 point"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={pointsInput}
                  onChange={handlePointsInputChange}
                  placeholder="Points"
                  className={`w-full text-center font-black text-xl py-2 px-3 rounded-2xl border transition outline-hidden ${
                    isBonus
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-emerald-900 bg-emerald-50/30'
                      : 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-rose-900 bg-rose-50/30'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  pts
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustPoints(1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Plus 1 point"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustPoints(5)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Plus 5 points"
              >
                +5
              </button>
            </div>

            {/* Impact Calculation Preview */}
            {selectedMember && (
              <div
                className={`mt-2.5 p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                  isBonus
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedMember.avatar}</span>
                  <span>
                    <strong>{selectedMember.name}</strong> : {currentPoints} pts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <span>➔</span>
                  <span className={isBonus ? 'text-emerald-700' : 'text-rose-700'}>
                    {projectedPoints} pts
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({isBonus ? `+${pointsAmount}` : `-${pointsAmount}`})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Motif (optionnel ou suggestions) */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              4. Motif (optionnel)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(isBonus ? BONUS_SUGGESTIONS : MALUS_SUGGESTIONS).map((sugg) => {
                const isSelected = reason === sugg;
                return (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => handleSelectSuggestion(sugg)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? isBonus
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                          : 'bg-rose-600 text-white border-rose-600 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {sugg}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isBonus ? 'Ex: Bravo pour l’aide précieuse !' : 'Ex: Oubli de ranger ses affaires...'}
              maxLength={100}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white text-slate-800"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pointsAmount <= 0}
              className={`flex-1 py-3 px-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                isBonus
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/25'
              } ${isSubmitting || pointsAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBonus ? <Sparkles className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'En cours...'
                  : isBonus
                  ? `Valider le Bonus (+${pointsAmount} pts)`
                  : `Valider le Malus (-${pointsAmount} pts)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
