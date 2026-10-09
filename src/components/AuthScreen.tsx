import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sparkles,
  LogIn,
  LogOut,
  AlertCircle,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { authService, WHITELISTED_EMAILS, type AuthState } from '../services/auth.ts';

interface AuthScreenProps {
  authState: AuthState;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ authState }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, isWhitelisted, isLoading, error } = authState;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await authService.loginWithGoogle();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await authService.logout();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/30 mb-4 animate-in zoom-in duration-300">
            <div className="w-full h-full bg-slate-900/90 rounded-[22px] flex items-center justify-center text-3xl sm:text-4xl">
              ⚡
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tâches & Héros
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-indigo-300" />
            <span>Espace Familial Privé</span>
          </div>
        </div>

        {/* State 1: Logged in but UNAUTHORIZED (not in whitelist) */}
        {user && !isWhitelisted && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>Accès non autorisé</span>
              </div>
              <p className="text-xs text-rose-100 leading-relaxed">
                Le compte Google connecté ne fait pas partie des adresses enregistrées sur la liste blanche de la famille :
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-400/20 text-xs font-mono text-rose-200 break-all text-center">
                {user.email}
              </div>
              <p className="text-[11px] text-rose-200/80">
                Seuls les comptes des parents autorisés ont accès aux données et à l'application.
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-white/15 hover:bg-white/20 active:scale-98 border border-white/20 font-bold text-sm text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Changer de compte Google</span>
            </button>
          </div>
        )}

        {/* State 2: Not logged in */}
        {!user && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pour protéger la vie privée de votre famille, l’accès aux missions, aux points et aux récompenses est strictement verrouillé.
            </p>

            {/* Error banner if any */}
            {(errorMessage || error) && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage || error}</span>
              </div>
            )}

            {/* Sign in with Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  {/* Google "G" SVG */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Se connecter avec Google</span>
                </>
              )}
            </button>

            {/* Whitelist Transparency Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Comptes parents autorisés :</span>
              </div>
              <div className="space-y-1">
                {WHITELISTED_EMAILS.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-white/5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug pt-1">
                💡 Une fois connecté sur votre téléphone ou tablette, toute la famille (joueurs & enfants) peut utiliser l'application sans mot de passe supplémentaire.
              </p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Synchronisation Firestore sécurisée & règles chiffrées</span>
        </div>
      </div>
    </div>
  );
};
