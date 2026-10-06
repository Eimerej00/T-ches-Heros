import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Plus, Sparkles, Check, AlertCircle, ShoppingBag, X, Edit2, Trash2, RotateCcw } from 'lucide-react';
import type { FamilyMember, FamilyState, RewardItem } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface RewardsShopProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
}

export const RewardsShop: React.FC<RewardsShopProps> = ({ state, activeMember }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCost, setFormCost] = useState(50);
  const [formIcon, setFormIcon] = useState('🎁');
  const [formTimesClaimed, setFormTimesClaimed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isGuardian = activeMember?.role === 'tuteur';

  const handleOpenAdd = () => {
    setEditingReward(null);
    setFormTitle('');
    setFormDesc('');
    setFormCost(50);
    setFormIcon('🎁');
    setFormTimesClaimed(0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reward: RewardItem) => {
    setEditingReward(reward);
    setFormTitle(reward.title);
    setFormDesc(reward.description || '');
    setFormCost(reward.cost);
    setFormIcon(reward.icon);
    setFormTimesClaimed(reward.timesClaimed || 0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDeleteReward = async (reward: RewardItem) => {
    if (!confirm(`Supprimer la récompense « ${reward.title} » de la boutique ?`)) {
      return;
    }

    const res = await api.dispatchAction('DELETE_REWARD', { rewardId: reward.id });
    if (res.success) {
      sounds.playPop();
    } else {
      alert(res.error || 'Erreur lors de la suppression');
    }
  };

  const handleResetCounters = async () => {
    if (!confirm('Réinitialiser l’historique des récompenses et remettre à zéro le compteur (réclamé 0 fois) pour tous les cadeaux ?')) {
      return;
    }

    const res = await api.dispatchAction('RESET_HISTORY_AND_REWARDS', {});
    if (res.success) {
      sounds.playSuccess();
    } else {
      alert(res.error || 'Erreur lors de la réinitialisation');
    }
  };

  const handleClaim = async (reward: RewardItem) => {
    if (!activeMember) {
      alert('Veuillez sélectionner un profil de membre.');
      return;
    }

    if (activeMember.points < reward.cost) {
      alert(`Points insuffisants ! Il vous manque ${reward.cost - activeMember.points} points pour cette récompense.`);
      return;
    }

    if (!confirm(`Échanger ${reward.cost} points contre « ${reward.title} » ?`)) {
      return;
    }

    const res = await api.dispatchAction('CLAIM_REWARD', {
      rewardId: reward.id,
      memberId: activeMember.id,
    });

    if (res.success) {
      sounds.playFanfare();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      alert(res.error || 'Erreur lors de l’échange');
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('Veuillez entrer un titre');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingReward) {
        // Update existing reward
        const res = await api.dispatchAction('UPDATE_REWARD', {
          id: editingReward.id,
          title: formTitle.trim(),
          description: formDesc.trim(),
          cost: Number(formCost),
          icon: formIcon,
          category: editingReward.category || 'famille',
          timesClaimed: Number(formTimesClaimed),
        });

        if (res.success) {
          sounds.playSuccess();
          setIsModalOpen(false);
          setEditingReward(null);
        } else {
          setErrorMsg(res.error || 'Erreur lors de la modification');
        }
      } else {
        // Create new reward
        const res = await api.dispatchAction('CREATE_REWARD', {
          title: formTitle.trim(),
          description: formDesc.trim(),
          cost: Number(formCost),
          icon: formIcon,
          category: 'famille',
        });

        if (res.success) {
          sounds.playSuccess();
          setIsModalOpen(false);
        } else {
          setErrorMsg(res.error || 'Erreur lors de la création');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Boutique des Récompenses</span>
            <span className="text-xl">🎁</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Échangez vos points durement gagnés contre de super privilèges familiaux !
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeMember && (
            <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Solde : {activeMember.points} pts</span>
            </div>
          )}

          {isGuardian && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau cadeau</span>
            </button>
          )}

          {isGuardian && (
            <button
              onClick={handleResetCounters}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition"
              title="Remettre tous les compteurs de réclamation à zéro"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset compteurs</span>
            </button>
          )}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.rewards.map((reward) => {
          const canAfford = (activeMember?.points || 0) >= reward.cost;

          return (
            <div
              key={reward.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center text-2xl shadow-xs">
                    {reward.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-3 py-1 rounded-xl text-white font-black text-xs shadow-xs ${
                        reward.cost === 0 ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    >
                      {reward.cost === 0 ? 'Gratuit (0 pt)' : `${reward.cost} pts`}
                    </span>

                    {/* Guardian Action Buttons (Modifier / Supprimer) */}
                    {isGuardian && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(reward)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Modifier cette récompense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Supprimer cette récompense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{reward.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{reward.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {reward.timesClaimed === 0 ? 'Jamais réclamé' : `Réclamé ${reward.timesClaimed} fois`}
                </span>

                <div className="flex items-center gap-1.5">
                  {isGuardian && (
                    <button
                      onClick={() => handleOpenEdit(reward)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleClaim(reward)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition active:scale-95 ${
                      canAfford
                        ? reward.cost === 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {reward.cost === 0
                      ? 'Obtenir (Gratuit) 🎁'
                      : canAfford
                      ? 'Obtenir 🎁'
                      : `Manque ${reward.cost - (activeMember?.points || 0)} pts`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent claims history */}
      {state.rewardClaims && state.rewardClaims.length > 0 && (
        <div className="mt-8 p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span>Dernières récompenses débloquées</span>
          </h3>
          <div className="divide-y divide-slate-100">
            {state.rewardClaims.slice(0, 5).map((claim) => (
              <div key={claim.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{claim.rewardIcon}</span>
                  <div>
                    <span className="font-bold text-slate-800">{claim.rewardTitle}</span>
                    <span className="text-slate-400 ml-1.5">• pour {claim.claimedByName}</span>
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Accordé ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Reward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingReward ? 'Modifier la récompense' : 'Ajouter une récompense'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingReward(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-3.5">
              {errorMsg && <div className="text-xs text-rose-600">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de la récompense</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Une glace, 30 min de console..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 outline-hidden focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-12 text-center text-lg px-1 py-1 rounded-xl border border-slate-300"
                    title="Icône / Emoji"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Modalités</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Détails de la récompense..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Coût en points (0 à 1000 pts)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={formCost}
                      onChange={(e) => setFormCost(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
                      className="w-20 text-right text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 focus:border-amber-500 outline-hidden bg-white text-amber-700"
                    />
                    <span className="text-xs font-bold text-amber-600">pts</span>
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {[0, 20, 50, 100, 200, 350, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormCost(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition ${
                        formCost === preset
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset === 0 ? 'Gratuit (0)' : `${preset} pts`}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={formCost}
                  onChange={(e) => setFormCost(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0 pt (Gratuit)</span>
                  <span>500 pts</span>
                  <span>1000 pts</span>
                </div>
              </div>

              {editingReward && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Compteur de réclamations
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={formTimesClaimed}
                      onChange={(e) => setFormTimesClaimed(Number(e.target.value))}
                      className="w-24 text-xs px-3 py-1.5 rounded-xl border border-slate-300 outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormTimesClaimed(0)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                    >
                      Remettre à 0
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingReward(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  {isSubmitting ? 'Enregistrement...' : editingReward ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

