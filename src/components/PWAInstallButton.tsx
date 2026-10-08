import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { getAssetUrl } from '../services/pwaHelper.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed standalone PWA, show a subtle badge
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-bold">Raccourci installé</span>
      </span>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 px-2.5 sm:px-3 py-1.5 text-xs font-black text-white shadow-sm transition cursor-pointer"
        title="Créer un raccourci ou installer l'application sur votre écran d'accueil"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer / Raccourci</span>
      </button>

      {/* Guide Modal for iOS Safari, Chrome, and all mobile/desktop browsers */}
      {showGuide && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={getAssetUrl('shortcut-icon.png')}
                  alt="Icône Tâches & Héros"
                  className="w-12 h-12 rounded-2xl shadow-md border border-slate-200 object-cover flex-shrink-0"
                  onError={(e) => {
                    // Fallback to apple-touch-icon or SVG if needed
                    (e.target as HTMLImageElement).src = getAssetUrl('apple-touch-icon.png');
                  }}
                />
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    Ajouter le Raccourci
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sur l'écran d'accueil de votre téléphone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct install action button if supported */}
            {isInstallable && (
              <div className="mb-4">
                <button
                  onClick={async () => {
                    const done = await install();
                    if (done) setShowGuide(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Installer en 1 clic maintenant</span>
                </button>
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <span className="relative bg-white px-2 text-[11px] font-bold text-slate-400 uppercase">ou manuellement</span>
                </div>
              </div>
            )}

            {/* Step-by-step instructions */}
            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {isIOS ? (
                <>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs mb-1">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>Sur iPhone / iPad (Safari) :</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                    <p>Touchez l'icône <strong>Partager</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" /> tout en bas au milieu de Safari.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                    <p>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" />.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">3</span>
                    <p>Touchez <strong>Ajouter</strong> en haut à droite. L'icône apparaîtra comme une vraie application !</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs mb-1">
                    <Smartphone className="w-4 h-4 text-violet-600" />
                    <span>Sur Android / Chrome / Navigateur :</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                    <p>Ouvrez le menu du navigateur (les <strong>3 petits points ⋮</strong> en haut ou en bas).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                    <p>Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center">3</span>
                    <p>Validez : le raccourci avec le logo sera créé immédiatement sur votre téléphone !</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-2xl bg-slate-900 py-2.5 text-xs font-black text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            >
              C'est compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
};
