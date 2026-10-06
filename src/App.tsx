import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  Gift,
  Trophy,
  Wifi,
  Sparkles,
  Users,
  Plus,
  Clock,
  WifiOff,
} from 'lucide-react';
import type { ChoreTask, FamilyMember, FamilyState } from './types.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { TaskList } from './components/TaskList.tsx';
import { ValidationScreen } from './components/ValidationScreen.tsx';
import { RewardsShop } from './components/RewardsShop.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { WifiSyncModal } from './components/WifiSyncModal.tsx';
import { FamilyMembersModal } from './components/FamilyMembersModal.tsx';
import { CreateTaskModal } from './components/CreateTaskModal.tsx';
import { SubmitTaskModal } from './components/SubmitTaskModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { sounds } from './services/audio.ts';

type NavigationTab = 'corvees' | 'validation' | 'recompenses' | 'classement';

export default function App() {
  const [state, setState] = useState<FamilyState | null>(api.getState());
  const [activeTab, setActiveTab] = useState<NavigationTab>('corvees');
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  // Modals state
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ChoreTask | null>(null);
  const [taskToSubmit, setTaskToSubmit] = useState<ChoreTask | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState(api.getSyncStatus());

  useEffect(() => {
    const unsubscribe = api.subscribe((newState) => {
      setState(newState);
      setSyncStatus(api.getSyncStatus());

      // If active member not set or deleted, default to first available
      const savedId = api.getActiveMemberId();
      if (savedId && newState.members.some((m) => m.id === savedId)) {
        setActiveMemberId(savedId);
      } else if (newState.members.length > 0) {
        const defaultMember = newState.members.find((m) => m.role === 'joueur') || newState.members[0];
        setActiveMemberId(defaultMember.id);
        api.setActiveMemberId(defaultMember.id);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectActiveMember = (id: string) => {
    setActiveMemberId(id);
    api.setActiveMemberId(id);
  };

  const handleOpenCreateTask = (task?: ChoreTask) => {
    setTaskToEdit(task || null);
    setIsCreateTaskOpen(true);
  };

  const handleOpenSubmitTask = (task: ChoreTask) => {
    setTaskToSubmit(task);
  };

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-700">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg animate-bounce mb-3">
          ⚡
        </div>
        <h1 className="text-xl font-bold text-slate-900">Tâches & Héros</h1>
        <p className="text-xs text-slate-500 mt-1">Connexion à la base familiale en cours...</p>
      </div>
    );
  }

  const activeMember = state.members.find((m) => m.id === activeMemberId) || state.members[0] || null;
  const pendingCount = state.submissions.filter((s) => s.status === 'en_attente').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 sm:pb-8">
      {/* Offline Toast Notification */}
      {!syncStatus.isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Hors-Ligne — Les corvées enregistrées seront synchronisées dès reconnexion au Wi-Fi.</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        state={state}
        activeMember={activeMember}
        onSelectActiveMember={handleSelectActiveMember}
        onOpenWifiModal={() => setIsWifiModalOpen(true)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        isOnline={syncStatus.isOnline}
        isSyncing={syncStatus.isSyncing}
        onManualRefresh={() => api.fetchState()}
      />

      {/* Hero Family Ribbon for quick glance */}
      <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active Player Card */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner cursor-pointer hover:scale-105 transition"
              onClick={() => setIsMembersModalOpen(true)}
              title="Changer de profil"
            >
              {activeMember?.avatar || '🌟'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-200 font-medium">Connecté(e) sur ce téléphone :</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                  {activeMember?.role === 'tuteur' ? 'Tuteur 🛡️' : 'Joueur 🎮'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg">{activeMember?.name || 'Famille'}</span>
                <span className="text-xs text-indigo-200">• Niv. {activeMember?.level} ({activeMember?.title})</span>
              </div>
            </div>
          </div>

          {/* Quick Points & Wifi Sync Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div className="text-left">
                <div className="text-[10px] text-indigo-200 leading-none">Points dispo</div>
                <div className="text-sm font-black text-amber-300 leading-none mt-0.5">
                  {activeMember?.points || 0} pts
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsWifiModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-300" />
              <span>Partager Wifi</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 hidden sm:flex gap-2 pt-1 pb-2">
          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('corvees');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'corvees'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tâches & Corvées</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('validation');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 relative ${
              activeTab === 'validation'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validation Tuteur</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('recompenses');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'recompenses'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Boutique Cadeaux</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setActiveTab('classement');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === 'classement'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Classement & Niveaux</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {activeTab === 'corvees' && (
          <TaskList
            state={state}
            activeMember={activeMember}
            onOpenCreateTask={handleOpenCreateTask}
            onOpenSubmitTask={handleOpenSubmitTask}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationScreen
            state={state}
            activeMember={activeMember}
            onSelectActiveMember={handleSelectActiveMember}
          />
        )}

        {activeTab === 'recompenses' && (
          <RewardsShop state={state} activeMember={activeMember} />
        )}

        {activeTab === 'classement' && (
          <Leaderboard state={state} activeMember={activeMember} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (App-like feel on smartphones) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('corvees');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition ${
            activeTab === 'corvees' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span>Corvées</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('validation');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition relative ${
            activeTab === 'validation' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                {pendingCount}
              </span>
            )}
          </div>
          <span>Validation</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('recompenses');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition ${
            activeTab === 'recompenses' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Gift className="w-5 h-5 mb-0.5" />
          <span>Boutique</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab('classement');
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition ${
            activeTab === 'classement' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span>Héros</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            setIsWifiModalOpen(true);
          }}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition"
        >
          <Wifi className="w-5 h-5 mb-0.5 text-indigo-500" />
          <span>Wifi QR</span>
        </button>
      </nav>

      {/* Modals */}
      <WifiSyncModal
        isOpen={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
        state={state}
      />

      <FamilyMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={state.members}
        activeMemberId={activeMemberId}
        onSelectActiveMember={handleSelectActiveMember}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setTaskToEdit(null);
        }}
        members={state.members}
        taskToEdit={taskToEdit}
        currentUserId={activeMember?.id || 'tuteur'}
      />

      <SubmitTaskModal
        isOpen={!!taskToSubmit}
        onClose={() => setTaskToSubmit(null)}
        task={taskToSubmit}
        members={state.members}
        activeMemberId={activeMemberId}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        state={state}
      />
    </div>
  );
}
