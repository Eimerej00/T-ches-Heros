import React, { useState, useEffect } from 'react';
import { CheckSquare, Sparkles, AlertCircle, X, Users, UserCheck } from 'lucide-react';
import type { ChoreTask, FamilyMember, TaskCategory, TaskFrequency } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  taskToEdit?: ChoreTask | null;
  currentUserId: string;
}

const CATEGORIES: { id: TaskCategory; label: string; icon: string }[] = [
  { id: 'cuisine', label: 'Cuisine & Repas', icon: '🍽️' },
  { id: 'chambre', label: 'Chambre & Linge', icon: '🛏️' },
  { id: 'menage', label: 'Ménage & Propreté', icon: '🧹' },
  { id: 'animaux', label: 'Animaux', icon: '🐾' },
  { id: 'ecole', label: 'Devoirs & École', icon: '📚' },
  { id: 'jardin', label: 'Jardin & Extérieur', icon: '🌱' },
  { id: 'quotidien', label: 'Quotidien & Maison', icon: '⭐' },
];

const PRESET_TASKS = [
  { title: 'Mettre la table pour le repas', cat: 'cuisine' as TaskCategory, points: 15, icon: '🍽️' },
  { title: 'Débarrasser la table après le repas', cat: 'cuisine' as TaskCategory, points: 15, icon: '🥣' },
  { title: 'Vider le lave-vaisselle', cat: 'cuisine' as TaskCategory, points: 25, icon: '🫧' },
  { title: 'Ranger sa chambre et faire son lit', cat: 'chambre' as TaskCategory, points: 30, icon: '🛏️' },
  { title: 'Mettre le linge sale dans le panier', cat: 'chambre' as TaskCategory, points: 10, icon: '🧺' },
  { title: 'Passer l’aspirateur', cat: 'menage' as TaskCategory, points: 35, icon: '🧹' },
  { title: 'Sortir la poubelle', cat: 'menage' as TaskCategory, points: 20, icon: '🗑️' },
  { title: 'Nourrir les animaux de compagnie', cat: 'animaux' as TaskCategory, points: 20, icon: '🐱' },
  { title: 'Faire ses devoirs sans râler', cat: 'ecole' as TaskCategory, points: 35, icon: '📖' },
  { title: 'Arroser les plantes', cat: 'jardin' as TaskCategory, points: 15, icon: '🪴' },
];

const POINT_PRESETS = [10, 15, 20, 25, 30, 40, 50, 75, 100];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  members,
  taskToEdit,
  currentUserId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number>(20);
  const [category, setCategory] = useState<TaskCategory>('quotidien');
  const [targetType, setTargetType] = useState<'general' | 'personnel'>('general');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [icon, setIcon] = useState('⭐');
  const [frequency, setFrequency] = useState<TaskFrequency>('quotidien');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPoints(taskToEdit.points);
      setCategory(taskToEdit.category);
      setTargetType(taskToEdit.targetType);
      setAssignedTo(taskToEdit.assignedTo || []);
      setIcon(taskToEdit.icon);
      setFrequency(taskToEdit.frequency);
    } else {
      setTitle('');
      setDescription('');
      setPoints(20);
      setCategory('cuisine');
      setTargetType('general');
      setAssignedTo([]);
      setIcon('🍽️');
      setFrequency('quotidien');
    }
    setErrorMsg(null);
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TASKS[0]) => {
    setTitle(preset.title);
    setCategory(preset.cat);
    setPoints(preset.points);
    setIcon(preset.icon);
  };

  const toggleAssignee = (memberId: string) => {
    setAssignedTo((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Veuillez donner un titre à la tâche');
      return;
    }
    if (targetType === 'personnel' && assignedTo.length === 0) {
      setErrorMsg('Pour une tâche personnelle, sélectionnez au moins un membre assigné.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (taskToEdit) {
        const res = await api.dispatchAction('UPDATE_TASK', {
          id: taskToEdit.id,
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          category,
          targetType,
          assignedTo: targetType === 'personnel' ? assignedTo : [],
          icon,
          frequency,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors de la mise à jour');
          return;
        }
      } else {
        const res = await api.dispatchAction('CREATE_TASK', {
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          category,
          targetType,
          assignedTo: targetType === 'personnel' ? assignedTo : [],
          icon,
          frequency,
          createdBy: currentUserId,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Erreur lors de la création');
          return;
        }
      }

      sounds.playSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {taskToEdit ? 'Modifier la tâche' : 'Créer une tâche'}
              </h2>
              <p className="text-xs text-slate-500">
                Fixez les points à gagner et l’affectation (générale ou personnelle)
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

        {/* Quick suggestions if new */}
        {!taskToEdit && (
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions rapides
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {PRESET_TASKS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent text-slate-700 transition flex items-center gap-1 active:scale-95"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.title}</span>
                  <span className="text-amber-600 font-bold ml-1">+{preset.points}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la tâche / corvée</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ranger la table, Sortir le chien..."
                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
              />
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                title="Icône / Emoji"
                maxLength={4}
                className="w-14 text-center text-lg px-2 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Consignes (optionnel)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Ne pas oublier d'essuyer la nappe et ranger les épices..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
            />
          </div>

          {/* Points */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Points à gagner</label>
              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                +{points} points d'XP
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POINT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPoints(p)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-bold transition ${
                    points === p
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  +{p}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="5"
              max="150"
              step="5"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    if (!taskToEdit && !title) setIcon(cat.icon);
                  }}
                  className={`px-2.5 py-2 rounded-xl border text-left transition flex items-center gap-2 ${
                    category === cat.id
                      ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-900 ring-1 ring-indigo-300'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task Type: General vs Personal */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">Type de tâche & Affectation</label>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('general')}
                className={`p-3 rounded-xl border text-left transition ${
                  targetType === 'general'
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-slate-100/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Tâche Générale</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Accessible à <strong>tout le monde</strong> (enfants & parents). Le premier qui la fait gagne les points !
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('personnel')}
                className={`p-3 rounded-xl border text-left transition ${
                  targetType === 'personnel'
                    ? 'border-purple-600 bg-white ring-2 ring-purple-200'
                    : 'border-slate-200 bg-slate-100/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Tâche Personnelle</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Affectée à <strong>un ou plusieurs membres</strong> précis.
                </p>
              </button>
            </div>

            {/* If personal: choose assignees */}
            {targetType === 'personnel' && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Qui doit faire cette tâche ?
                </span>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isSelected = assignedTo.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span>{m.avatar}</span>
                        <span>{m.name}</span>
                        {isSelected && <span className="text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fréquence indicative</label>
            <div className="flex gap-2">
              {[
                { id: 'quotidien' as TaskFrequency, label: 'Quotidienne (tous les jours)' },
                { id: 'hebdo' as TaskFrequency, label: 'Hebdomadaire (par semaine)' },
                { id: 'libre' as TaskFrequency, label: 'Ponctuelle / Libre' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                    frequency === f.id
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
            >
              {isSubmitting ? 'Enregistrement...' : taskToEdit ? 'Mettre à jour' : 'Créer la corvée'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
