import React, { useState } from 'react';
import { Settings, Shield, ShieldCheck, Lock, RotateCcw, X, Check, AlertCircle, LogOut } from 'lucide-react';
import type { FamilyState } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';
import { authService, WHITELISTED_EMAILS } from '../services/auth.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FamilyState;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, state }) => {
  const [familyName, setFamilyName] = useState(state.settings.familyName);
  const [familyCode, setFamilyCode] = useState(state.settings.familyCode);
  const [guardianPin, setGuardianPin] = useState(state.settings.guardianPin);
  const [requirePin, setRequirePin] = useState(state.settings.requirePinForValidation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFamilyName(state.settings.familyName);
      setFamilyCode(state.settings.familyCode);
      setGuardianPin(state.settings.guardianPin);
      setRequirePin(state.settings.requirePinForValidation);
      setMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const res = await api.dispatchAction('UPDATE_SETTINGS', {
      familyName,
      familyCode,
      guardianPin,
      requirePinForValidation: requirePin,
    });

    setIsSubmitting(false);
    if (res.success) {
      sounds.playSuccess();
      setMessage('Réglages enregistrés avec succès !');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setMessage(res.error || 'Erreur lors de l’enregistrement');
    }
  };

  const handleResetPoints = async () => {
    if (!confirm('Remettre les points à 0 pour tous les membres de la famille ? (Les membres et les missions sont conservés)')) {
      return;
    }
    const res = await api.dispatchAction('RESET_POINTS', {});
    if (res.success) {
      sounds.playSuccess();
      setMessage('Tous les scores ont été réinitialisés à 0 !');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleResetHistoryAndRewards = async () => {
    if (!confirm('Réinitialiser l’historique des validations et remettre à 0 les compteurs de réclamation des cadeaux ?')) {
      return;
    }
    const res = await api.dispatchAction('RESET_HISTORY_AND_REWARDS', {});
    if (res.success) {
      sounds.playSuccess();
      setMessage('Historique de validation et boutique remis à zéro !');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Réinitialiser toutes les données de la famille avec les données de démonstration ?')) {
      return;
    }
    const res = await api.dispatchAction('RESET_DEMO', {});
    if (res.success) {
      sounds.playFanfare();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Paramètres de la Famille</h2>
              <p className="text-xs text-slate-500">Nom de tribu, sécurité et synchronisation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la famille</label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code Famille (identifiant unique de la tribu)</label>
            <input
              type="text"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              className="w-full text-xs sm:text-sm font-mono uppercase px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Code PIN Tuteur (Parent)</span>
                </div>
                <p className="text-[11px] text-slate-500">Empêche les enfants de valider leurs propres tâches</p>
              </div>
              <input
                type="password"
                maxLength={4}
                value={guardianPin}
                onChange={(e) => setGuardianPin(e.target.value)}
                placeholder="1234"
                className="w-20 text-center font-mono text-sm py-1.5 px-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={requirePin}
                onChange={(e) => setRequirePin(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Demander le code PIN pour basculer sur le compte d'un Tuteur</span>
            </label>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>

        {/* Security & Access Section */}
        <div className="mt-5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Protection & Liste Blanche Famille</span>
            </div>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              Actif
            </span>
          </div>
          <p className="text-[11px] text-indigo-900/80 leading-snug">
            Accès sécurisé réservé aux parents de la famille autorisés.
          </p>
          {authService.getState().user ? (
            <div className="text-[11px] font-mono text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100/80 flex items-center justify-between">
              <span className="truncate">{authService.getState().user?.email}</span>
              <span className="text-[9px] font-bold text-emerald-600 ml-2 flex-shrink-0">Connecté</span>
            </div>
          ) : authService.getState().isPinUnlocked ? (
            <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100/80 flex items-center justify-between">
              <span>Déverrouillé via Code PIN Parent</span>
              <span className="text-[9px] font-bold text-amber-600 ml-2 flex-shrink-0">Session locale</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              onClose();
              await authService.logout();
            }}
            className="w-full mt-2 py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Verrouiller l'accès sur cet appareil</span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Remise à zéro des scores :</span>
            <button
              type="button"
              onClick={handleResetPoints}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Points à 0</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Historique & Boutique :</span>
              <span className="text-[11px] text-slate-400">Efface validations et compteurs de cadeaux</span>
            </div>
            <button
              type="button"
              onClick={handleResetHistoryAndRewards}
              className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reset Historique</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Remettre les données d'exemple :</span>
            <button
              type="button"
              onClick={handleResetDemo}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser démo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
