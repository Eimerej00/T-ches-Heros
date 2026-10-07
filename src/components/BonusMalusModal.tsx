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
];

const MALUS_SUGGESTIONS = [
  'Chambre en désordre 🛏️',
  'Temps d’écran dépassé 📱',
  'Dispute ou insolence ⚡',
  'Refus d’aider à la maison 🛑',
  'Mission promise non faite ⏳',
  'Rangement oublié 📦',
];

const PRESET_POINTS = [5, 10, 15, 20, 30, 50];

export const BonusMalusModal: React.FC<BonusMalusModalProps> = ({
  isOpen,
  onClose,
  state,
  activeGuardian,
}) => {
  // Players list (prefer joueurs, fallback to all if no joueur)
  const players = state.members.filter((m) => m.role === 'joueur').length > 0
    ? state.members.filter((m) => m.role === 'joueur')
    : state.members;

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isBonus, setIsBonus] = useState<boolean>(true);
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form state ONLY when opening the modal
  useEffect(() => {
    if (isOpen) {
      const playerList = state.members.filter((m) => m.role === 'joueur');
      const defaultId = playerList.length > 0 ? playerList[0].id : (state.members[0]?.id || '');
      setSelectedMemberId(defaultId);
      setIsBonus(true);
      setPointsAmount(10);
      setReason('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMember = state.members.find((m) => m.id === selectedMemberId) || players[0];

  const currentPoints = selectedMember ? selectedMember.points : 0;
  const projectedPoints = isBonus
    ? currentPoints + pointsAmount
    : Math.max(0, currentPoints - pointsAmount);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#4f46e5', '#f59e0b', '#ec4899', '#06b6d4'],
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
      setErrorMsg('Veuillez définir un montant de points supérieur à 0');
      return;
    }

    if (!activeGuardian || activeGuardian.role !== 'tuteur') {
      setErrorMsg('Seul un tuteur peut attribuer des points bonus ou malus');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.dispatchAction('APPLY_BONUS_MALUS', {
        memberId: selectedMember.id,
        points: pointsAmount,
        isBonus,
        reason: reason.trim() || (isBonus ? 'Bonus tuteur' : 'Malus tuteur'),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
                isBonus
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'bg-rose-50 border border-rose-200 text-rose-600'
              }`}
            >
              {isBonus ? <Sparkles className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Bonus / Malus</h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Tuteur 🛡️
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attribuez ou retirez des points immédiatement à un joueur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Select Player */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              1. Sélectionner le joueur
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {players.map((m) => {
                const isSelected = selectedMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedMemberId(m.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-2xs flex-shrink-0"
                      style={{
                        backgroundColor: `${m.color}25`,
                        border: `1.5px solid ${m.color}`,
                      }}
                    >
                      {m.avatar}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 truncate">{m.name}</div>
                      <div className="text-[11px] font-bold text-amber-600">{m.points} pts</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Choose Mode: Bonus (+) vs Malus (-) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              2. Action : Bonus ou Malus ?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsBonus(true);
                }}
                className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
                  isBonus
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className={`w-4 h-4 ${isBonus ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>+ Bonus (Ajouter)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsBonus(false);
                }}
                className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
                  !isBonus
                    ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MinusCircle className={`w-4 h-4 ${!isBonus ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>- Malus (Enlever)</span>
              </button>
            </div>
          </div>

          {/* 3. Number of Points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Nombre de points à {isBonus ? 'ajouter' : 'enlever'}
              </label>
              <span className="text-xs font-bold text-slate-500">
                {isBonus ? `+${pointsAmount}` : `-${pointsAmount}`} pts
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_POINTS.map((val) => {
                const isActive = pointsAmount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setPointsAmount(val);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
                      isActive
                        ? isBonus
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isBonus ? `+${val}` : `-${val}`} pts
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={500}
                value={pointsAmount || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPointsAmount(isNaN(val) ? 0 : Math.max(0, Math.min(500, val)));
                }}
                placeholder="Montant libre"
                className="w-full text-center font-black text-lg py-2 px-3 rounded-2xl border border-slate-300 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            {/* Impact Calculation Preview */}
            {selectedMember && (
              <div
                className={`mt-2.5 p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  isBonus
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/60 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedMember.avatar}</span>
                  <span>
                    <strong>{selectedMember.name}</strong> : {currentPoints} pts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <span>➔</span>
                  <span className={isBonus ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                    {projectedPoints} pts
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({isBonus ? `+${pointsAmount}` : `-${pointsAmount}`})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Reason / Motif */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              4. Motif (optionnel)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(isBonus ? BONUS_SUGGESTIONS : MALUS_SUGGESTIONS).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setReason(sugg);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    reason === sugg
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sugg}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Super aide pour débarrasser la table..."
              maxLength={80}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pointsAmount <= 0}
              className={`flex-1 py-3 rounded-2xl text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 ${
                isBonus
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/20'
              } ${isSubmitting || pointsAmount <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
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
