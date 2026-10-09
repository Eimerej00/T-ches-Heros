import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  ChevronDown,
  Shield,
  ShieldCheck,
  Download,
  Settings,
  RefreshCw,
  Check,
  Cloud,
  LogOut,
} from 'lucide-react';
import type { FamilyMember, FamilyState } from '../types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { sounds } from '../services/audio.ts';
import { authService } from '../services/auth.ts';

interface HeaderProps {
  state: FamilyState;
  activeMember: FamilyMember | null;
  onSelectActiveMember: (id: string) => void;
  onOpenMembersModal: () => void;
  onOpenSettingsModal: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  onManualRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeMember,
  onSelectActiveMember,
  onOpenMembersModal,
  onOpenSettingsModal,
  isOnline,
  isSyncing,
  onManualRefresh,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pendingCount = state.submissions.filter((s) => s.status === 'en_attente').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
            <span className="text-xl sm:text-2xl">⚡</span>
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight truncate">
                Tâches & Héros
              </span>
              <span className="hidden md:inline-flex text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {state.settings.familyName}
              </span>
            </div>
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold truncate">Hors-ligne</span>
              </div>
            )}
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* PWA Install / Shortcut Button */}
          <PWAInstallButton />

          {/* Active Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pr-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
              title="Changer de profil actif sur cet appareil"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-2xs"
                style={{
                  backgroundColor: activeMember ? `${activeMember.color}25` : '#e0e7ff',
                  border: `1.5px solid ${activeMember?.color || '#4f46e5'}`,
                }}
              >
                {activeMember?.avatar || '👤'}
              </div>
              <div className="text-left hidden xs:block">
                <div className="text-xs font-extrabold text-slate-800 leading-none truncate max-w-[90px]">
                  {activeMember?.name || 'Profil'}
                </div>
                <div className="text-[10px] font-bold text-amber-600 leading-none mt-0.5">
                  {activeMember ? `${activeMember.points} pts` : ''}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Changer de profil sur ce tel :
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {state.members.map((m) => {
                      const isCurrent = activeMember?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectActiveMember(m.id);
                            setProfileDropdownOpen(false);
                            sounds.playPop();
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                            isCurrent
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{m.avatar}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {m.role} • {m.points} pts
                              </div>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenMembersModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Gérer les membres (Tuteurs & Joueurs)</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenSettingsModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Réglages & Code PIN tuteur</span>
                    </button>

                    {/* Security & Logout button */}
                    {(authService.getState().user || authService.getState().isPinUnlocked) && (
                      <div className="mt-1 pt-1.5 border-t border-slate-100">
                        <div className="px-2 py-1 bg-slate-50 rounded-lg mb-1.5 text-left">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Espace Sécurisé</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 truncate">
                            {authService.getState().user?.email || 'Session déverrouillée (PIN)'}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            setProfileDropdownOpen(false);
                            await authService.logout();
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Verrouiller / Déconnexion</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
