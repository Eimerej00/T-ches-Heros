import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already running as an installed standalone PWA, show a subtle badge or nothing
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        App installée
      </span>
    );
  }

  return (
    <>
      {/* Chromium / Android / Desktop flow */}
      {isInstallable && (
        <button
          onClick={install}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition active:scale-95"
          title="Installer l'application sur cet appareil"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'App</span>
        </button>
      )}

      {/* iOS Safari flow */}
      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs sm:text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition active:scale-95"
          title="Guide d'installation sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Installer sur iPhone</span>
        </button>
      )}

      {/* General fallback button if browser doesn't trigger prompt yet */}
      {!isInstallable && !isIOS && !isInstalled && (
        <button
          onClick={() => setShowAndroidGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition"
          title="Comment installer l'application sur téléphone"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xs:inline">Installer l'App</span>
        </button>
      )}

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Installer sur iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Comme une vraie appli de l'App Store !</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <p>Dans <strong>Safari</strong>, touchez le bouton <strong>Partager</strong> <span className="inline-block px-1.5 py-0.5 bg-slate-200 rounded text-xs">⎋</span> en bas au milieu de l'écran.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <p>Faites défiler la liste vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong> ➕.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <p>Touchez <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra sur l'écran d'accueil de vos enfants !</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md transition"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Android/Generic Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Installer sur téléphone</h3>
                  <p className="text-xs text-slate-500">Accès rapide en 1 clic</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>Sur votre navigateur (Chrome, Safari, Firefox) :</p>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <p>Ouvrez le menu du navigateur (les <strong>3 petits points ⋮</strong> ou bouton <strong>Partager</strong>).</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <p>Choisissez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 shadow-md transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
