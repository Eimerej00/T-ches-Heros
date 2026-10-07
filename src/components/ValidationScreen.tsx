import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  MessageSquare,
  History,
  Lock,
  RotateCcw,
  AlertCircle,
  Award,
  Trash2,
} from 'lucide-react';
import type { ChoreSubmission, FamilyMember, FamilyState } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface ValidationScreenProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
  onSelectActiveMember: (id: string) => void;
}

export const ValidationScreen: React.FC<ValidationScreenProps> = ({
  state,
  activeMember,
  onSelectActiveMember,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isCurrentTuteur = activeMember?.role === 'tuteur';
  const tuteurs = state.members.filter((m) => m.role === 'tuteur');

  const pendingSubmissions = state.submissions.filter((s) => s.status === 'en_attente');
  const historySubmissions = state.submissions.filter((s) => s.status !== 'en_attente');

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Ignore
    }
  };

  const handleValidate = async (sub: ChoreSubmission) => {
    if (!activeMember || activeMember.role !== 'tuteur') {
      alert('Seul un tuteur peut valider une tâche.');
      return;
    }

    setActionLoadingId(sub.id);
    try {
      const res = await api.dispatchAction('VALIDATE_SUBMISSION', {
        submissionId: sub.id,
        guardianId: activeMember.id,
      });

      if (res.success) {
        sounds.playSuccess();
        triggerConfetti();
      } else {
        alert(res.error || 'Erreur lors de la validation');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (subId: string) => {
    setRejectingSubId(subId);
    setRejectReason('À refaire avec plus d’attention');
  };

  const handleConfirmReject = async () => {
    if (!rejectingSubId || !activeMember || activeMember.role !== 'tuteur') return;

    setActionLoadingId(rejectingSubId);
    try {
      const res = await api.dispatchAction('REJECT_SUBMISSION', {
        submissionId: rejectingSubId,
        guardianId: activeMember.id,
        reason: rejectReason.trim() || 'À refaire',
      });

      if (res.success) {
        sounds.playPop();
        setRejectingSubId(null);
      } else {
        alert(res.error || 'Erreur lors du rejet');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Voulez-vous supprimer tout l’historique des missions validées et refusées ?')) {
      return;
    }
    const res = await api.dispatchAction('CLEAR_HISTORY', {});
    if (res.success) {
      sounds.playPop();
    } else {
      alert(res.error || 'Erreur lors de la suppression de l’historique');
    }
  };

  const handleSwitchToGuardian = (guardianId: string) => {
    onSelectActiveMember(guardianId);
  };

  return (
    <div className="space-y-6">
      {/* Role Banner if active member is a child */}
      {!isCurrentTuteur && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 text-xl">
              🛡️
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm sm:text-base text-amber-950">
                Espace Réservé aux Tuteurs (Parents)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Vous utilisez actuellement le profil de <strong>{activeMember?.name || 'Joueur'}</strong>. Seuls les
                parents peuvent valider les tâches et attribuer les points.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-amber-900">Passer sur le profil de :</span>
                {tuteurs.map((tut) => (
                  <button
                    key={tut.id}
                    onClick={() => handleSwitchToGuardian(tut.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>{tut.avatar}</span>
                    <span>{tut.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Validation des Missions</span>
            {pendingSubmissions.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-rose-500 text-white animate-bounce">
                {pendingSubmissions.length}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Vérifiez le travail accompli par les joueurs et créditez leurs récompenses
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>À valider ({pendingSubmissions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique ({historySubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pending' ? (
        pendingSubmissions.length === 0 ? (
          /* Empty Pending State */
          <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl mb-4 shadow-xs">
              🎉
            </div>
            <h3 className="text-lg font-bold text-slate-900">Toutes les tâches sont à jour !</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Aucune mission n'attend votre validation pour le moment. Dès qu'un enfant ou joueur déclare une tâche, elle
              apparaîtra ici.
            </p>
          </div>
        ) : (
          /* Pending Submissions List */
          <div className="space-y-4">
            {pendingSubmissions.map((sub) => {
              const performer = state.members.find((m) => m.id === sub.submittedBy);
              const isLoading = actionLoadingId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-3xl bg-white border-2 border-indigo-100 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Top Bar: Child Info & Points to earn */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                        style={{
                          backgroundColor: performer ? `${performer.color}25` : '#e0e7ff',
                          border: `2px solid ${performer?.color || '#4f46e5'}`,
                        }}
                      >
                        {performer?.avatar || '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{sub.submittedByName}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {performer?.role === 'tuteur' ? 'Tuteur' : 'Joueur'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-medium text-indigo-700">Fait le : {sub.completedDateLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-sm sm:text-base shadow-xs">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        +{sub.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Task details box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <span className="text-3xl p-1 bg-white rounded-xl shadow-xs border border-slate-100">{sub.taskIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase font-bold text-slate-400">{sub.taskCategory}</div>
                      <div className="text-sm font-bold text-slate-800 truncate">{sub.taskTitle}</div>
                    </div>
                  </div>

                  {/* Kid's Note if any */}
                  {sub.note && (
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-indigo-800">Note de {sub.submittedByName} : </span>
                        <span>« {sub.note} »</span>
                      </div>
                    </div>
                  )}

                  {/* Guardian Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      onClick={() => handleValidate(sub)}
                      disabled={isLoading || !isCurrentTuteur}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Valider & Créditer (+{sub.points} pts)</span>
                    </button>

                    <button
                      onClick={() => handleOpenReject(sub.id)}
                      disabled={isLoading || !isCurrentTuteur}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>À refaire / Refuser</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History Tab */
        <div className="space-y-3">
          {historySubmissions.length > 0 && isCurrentTuteur && (
            <div className="flex justify-end pb-1">
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer l’historique</span>
              </button>
            </div>
          )}

          {historySubmissions.length === 0 ? (
            <div className="py-12 text-center rounded-3xl bg-white border border-slate-200">
              <p className="text-xs sm:text-sm text-slate-500">Aucune mission validée ou refusée dans l'historique.</p>
            </div>
          ) : (
            historySubmissions.map((sub) => {
              const isValidated = sub.status === 'validee';
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        isValidated ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isValidated ? '✅' : '❌'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{sub.taskTitle}</span>
                        <span className="text-xs text-slate-400">• {sub.taskIcon}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Par <strong>{sub.submittedByName}</strong> • Réalisé : {sub.completedDateLabel}
                      </div>
                      {sub.rejectionReason && (
                        <div className="text-xs text-rose-600 italic mt-0.5">Motif : {sub.rejectionReason}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                        isValidated
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 line-through'
                      }`}
                    >
                      {isValidated ? `+${sub.points} pts` : `${sub.points} pts`}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {isValidated ? `Validé par ${sub.validatedByName || 'Tuteur'}` : 'Refusé'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Demander à refaire la tâche</h3>
            <p className="text-xs text-slate-500 mb-4">
              Indiquez gentiment à l'enfant pourquoi cette tâche n'est pas encore validée :
            </p>

            <div className="space-y-1.5 mb-3">
              {[
                'La chambre n’est pas complètement rangée',
                'Le sol n’a pas été bien nettoyé',
                'La table n’a pas été essuyée',
                'Erreur : la tâche n’a pas été faite',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2 rounded-xl text-xs border transition ${
                    rejectReason === reason
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Autre motif..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden mb-4"
              rows={2}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRejectingSubId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
