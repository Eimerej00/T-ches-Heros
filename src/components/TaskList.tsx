import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Users,
  UserCheck,
  Sparkles,
  Filter,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import type { ChoreTask, FamilyMember, FamilyState, TaskCategory } from '../types.ts';
import { api } from '../services/api.ts';
import { sounds } from '../services/audio.ts';

interface TaskListProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
  onOpenCreateTask: (taskToEdit?: ChoreTask) => void;
  onOpenSubmitTask: (task: ChoreTask) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  state,
  activeMember,
  onOpenCreateTask,
  onOpenSubmitTask,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'general' | 'category'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskMenuOpenId, setTaskMenuOpenId] = useState<string | null>(null);

  const isGuardian = activeMember?.role === 'tuteur';

  // Filter tasks
  const filteredTasks = state.tasks.filter((task) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDesc) return false;
    }

    // Filter mode
    if (filterMode === 'mine' && activeMember) {
      if (task.targetType === 'general') return true;
      return task.assignedTo.includes(activeMember.id);
    }
    if (filterMode === 'general') {
      return task.targetType === 'general';
    }
    if (filterMode === 'category' && selectedCategory !== 'all') {
      return task.category === selectedCategory;
    }
    return true;
  });

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Supprimer la tâche « ${title} » ?`)) return;
    const res = await api.dispatchAction('DELETE_TASK', { taskId });
    if (res.success) {
      sounds.playPop();
    } else {
      alert(res.error || 'Erreur lors de la suppression');
    }
  };

  const getAssigneeNames = (assignedIds: string[]) => {
    return assignedIds
      .map((id) => state.members.find((m) => m.id === id))
      .filter(Boolean) as FamilyMember[];
  };

  return (
    <div className="space-y-5">
      {/* Header & New Task button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tableau des Missions</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {filteredTasks.length} disponibles
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Choisissez la mission que vous avez réalisée pour gagner vos points !
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isGuardian ? (
            <button
              onClick={() => onOpenCreateTask()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une mission</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenCreateTask()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              title="Créer une mission (mode tuteur)"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Ajouter une tâche</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une mission (table, chambre, vaisselle...)"
            className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition shadow-xs"
          />
        </div>

        {/* Filter modes */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Toutes
          </button>

          {activeMember && (
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterMode === 'mine'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>Pour moi ({activeMember.name})</span>
            </button>
          )}

          <button
            onClick={() => setFilterMode('general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterMode === 'general'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Générales (Tous)</span>
          </button>

          <button
            onClick={() => setFilterMode('category')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterMode === 'category'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Par Catégorie</span>
          </button>
        </div>

        {/* Category sub-selector */}
        {filterMode === 'category' && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'all', label: 'Toutes', icon: '✨' },
              { id: 'cuisine', label: 'Cuisine', icon: '🍽️' },
              { id: 'chambre', label: 'Chambre', icon: '🛏️' },
              { id: 'menage', label: 'Ménage', icon: '🧹' },
              { id: 'animaux', label: 'Animaux', icon: '🐾' },
              { id: 'ecole', label: 'École', icon: '📚' },
              { id: 'jardin', label: 'Jardin', icon: '🌱' },
              { id: 'quotidien', label: 'Quotidien', icon: '⭐' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as TaskCategory | 'all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl mb-3">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucune tâche trouvée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Changez les filtres de recherche ou créez une nouvelle tâche familiale !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => {
            const assignees = getAssigneeNames(task.assignedTo);
            const isAssignedToMe = activeMember && task.assignedTo.includes(activeMember.id);
            const isGeneral = task.targetType === 'general';

            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                        {task.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isGeneral ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Users className="w-2.5 h-2.5" />
                              Générale
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <UserCheck className="w-2.5 h-2.5" />
                              Personnelle
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 capitalize">{task.category}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{task.title}</h3>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-sm shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        +{task.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-slate-500 mb-3 pl-1">{task.description}</p>
                  )}

                  {/* Assignees badges if personal */}
                  {!isGeneral && assignees.length > 0 && (
                    <div className="mb-3.5 p-2 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-purple-800">Affectée à :</span>
                      {assignees.map((mem) => (
                        <span
                          key={mem.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-900 font-medium shadow-2xs"
                        >
                          <span>{mem.avatar}</span>
                          <span>{mem.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pending validation badge if current player declared it */}
                  {(() => {
                    const pendingSubs = state.submissions.filter(
                      (s) => s.taskId === task.id && s.status === 'en_attente' && (!activeMember || s.submittedBy === activeMember.id)
                    );
                    if (pendingSubs.length === 0) return null;
                    return (
                      <div className="mb-3 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                        <span className="text-base">⏳</span>
                        <span>
                          Déclarée <strong>{pendingSubs[0].completedDateLabel}</strong> — En attente de validation par le tuteur
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onOpenSubmitTask(task);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-indigo-200" />
                    <span>J'ai fait cette mission ! ✨</span>
                  </button>

                  {/* Guardian Options Menu */}
                  {isGuardian && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenCreateTask(task)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                        title="Modifier la tâche"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
