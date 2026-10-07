import React, { useState } from 'react';
import { Users, Plus, Shield, Trophy, Trash2, Edit2, X, Star, AlertCircle, Check } from 'lucide-react';
import type { FamilyMember, Role } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface FamilyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  activeMemberId: string | null;
  onSelectActiveMember: (id: string) => void;
}

const AVATAR_OPTIONS = ['👑', '🛡️', '🦊', '🦄', '🦁', '🐼', '🚀', '⚡', '🧙‍♂️', '🦸‍♀️', '🌸', '🎮', '⚽', '🎨'];
const COLOR_OPTIONS = ['#4f46e5', '#ec4899', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#eab308', '#06b6d4'];

export const FamilyMembersModal: React.FC<FamilyMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  activeMemberId,
  onSelectActiveMember,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('joueur');
  const [avatar, setAvatar] = useState('🦊');
  const [color, setColor] = useState('#f97316');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const tuteursCount = members.filter((m) => m.role === 'tuteur').length;
  const canAddTuteur = tuteursCount < 2;

  const handleStartAdd = () => {
    setName('');
    setRole('joueur');
    setAvatar('🦊');
    setColor('#f97316');
    setErrorMsg(null);
    setEditingMember(null);
    setIsAdding(true);
  };

  const handleStartEdit = (member: FamilyMember) => {
    setName(member.name);
    setRole(member.role);
    setAvatar(member.avatar);
    setColor(member.color);
    setErrorMsg(null);
    setEditingMember(member);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Veuillez entrer un prénom');
      return;
    }

    if (role === 'tuteur' && !editingMember && tuteursCount >= 2) {
      setErrorMsg('Il y a déjà 2 tuteurs au maximum dans la famille (parents).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingMember) {
        const res = await api.dispatchAction('UPDATE_MEMBER', {
          id: editingMember.id,
          name: name.trim(),
          role,
          avatar,
          color,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors de la mise à jour');
          return;
        }
      } else {
        const res = await api.dispatchAction('ADD_MEMBER', {
          name: name.trim(),
          role,
          avatar,
          color,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors de l’ajout');
          return;
        }
      }

      sounds.playSuccess();
      setIsAdding(false);
      setEditingMember(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (member: FamilyMember) => {
    if (member.role === 'tuteur' && tuteursCount <= 1) {
      alert('Impossible de supprimer le seul tuteur de la famille.');
      return;
    }
    if (!confirm(`Supprimer ${member.name} de la famille ? Ses points et assignations seront effacés.`)) {
      return;
    }

    const res = await api.dispatchAction('DELETE_MEMBER', { memberId: member.id });
    if (res.success) {
      sounds.playPop();
      if (activeMemberId === member.id && members.length > 1) {
        const next = members.find((m) => m.id !== member.id);
        if (next) onSelectActiveMember(next.id);
      }
    } else {
      alert(res.error || 'Impossible de supprimer ce membre');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Membres de la Famille</h2>
              <p className="text-xs text-slate-500">1 ou 2 Tuteurs (parents) et les Joueurs (enfants)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Members List */}
        {!isAdding && !editingMember ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {members.length} {members.length > 1 ? 'membres inscrits' : 'membre inscrit'} (Tuteurs: {tuteursCount}/2)
              </span>
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un membre</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {members.map((member) => {
                const isActive = activeMemberId === member.id;
                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                        style={{ backgroundColor: `${member.color}20`, border: `2px solid ${member.color}` }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">{member.name}</span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              member.role === 'tuteur'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {member.role === 'tuteur' ? 'Tuteur 🛡️' : 'Joueur 🎮'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-indigo-600">{member.points} pts</span>
                          <span>•</span>
                          <span>Niv. {member.level} ({member.title})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectActiveMember(member.id);
                          sounds.playPop();
                          onClose();
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isActive ? 'Actif sur ce tel' : 'Choisir'}
                      </button>
                      <button
                        onClick={() => handleStartEdit(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {members.length > 1 && (
                        <button
                          onClick={() => handleDelete(member)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Form Add/Edit */
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingMember ? `Modifier ${editingMember.name}` : 'Nouveau membre de la famille'}
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom du membre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lucas, Maman, Léa, Papa..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle dans la famille</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('joueur')}
                  className={`p-3 rounded-xl border text-left transition ${
                    role === 'joueur'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span>🎮 Joueur (Enfant)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Fait des tâches et gagne des points</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canAddTuteur && (!editingMember || editingMember.role !== 'tuteur')) {
                      setErrorMsg('Limite de 2 tuteurs déjà atteinte dans la famille.');
                      return;
                    }
                    setErrorMsg(null);
                    setRole('tuteur');
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    role === 'tuteur'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span>🛡️ Tuteur (Parent)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crée et valide les missions ({tuteursCount}/2)
                  </p>
                </button>
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                      avatar === av ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Couleur préférée</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition flex items-center justify-center ${
                      color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingMember(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                {isSubmitting ? 'Enregistrement...' : editingMember ? 'Mettre à jour' : 'Ajouter le membre'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        {!isAdding && !editingMember && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
