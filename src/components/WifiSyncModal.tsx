import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Wifi, Copy, Check, QrCode, Smartphone, RefreshCw, Info, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.ts';
import type { FamilyState } from '../types.ts';

interface WifiSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FamilyState;
}

export const WifiSyncModal: React.FC<WifiSyncModalProps> = ({ isOpen, onClose, state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{
    primaryUrl: string;
    wifiUrls: string[];
    localIps: string[];
    port: number;
    familyCode: string;
    familyName: string;
  } | null>(null);

  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNetworkInfo();
    }
  }, [isOpen]);

  const loadNetworkInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = await api.getNetworkInfo();
      setNetworkInfo(info);
      
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      // If running in cloud / public web URL (e.g. https://ais-dev-...) use it directly so phones can scan immediately!
      let urlToUse = currentOrigin || info.primaryUrl;

      // If on localhost, look for a real private Wi-Fi IP (192.168.x.x or 10.x.x.x)
      if (isLocalHost) {
        const homeWifi = info.wifiUrls.find((u) => u.includes('192.168.') || u.includes('10.'));
        if (homeWifi) {
          urlToUse = homeWifi;
        } else if (info.wifiUrls.length > 0) {
          urlToUse = info.wifiUrls[0];
        }
      }

      setSelectedUrl(urlToUse);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (canvasRef.current && selectedUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        selectedUrl,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error rendering QR code:', error);
        }
      );
    }
  }, [selectedUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!selectedUrl) return;
    navigator.clipboard.writeText(selectedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Wifi className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                Partage Wifi & Téléphones
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Synchronisez toute la famille en 1 seconde sans créer de compte !
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

        {/* Family Code Badge */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/80">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏡</span>
            <div>
              <div className="text-xs text-slate-500 font-medium">Tribu active</div>
              <div className="text-sm font-bold text-slate-800">{state.settings.familyName}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-indigo-600 font-bold block">Code Famille</span>
            <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 shadow-xs">
              {state.settings.familyCode}
            </span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mt-5 flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-2xl border-2 border-indigo-200 shadow-md">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>

          <p className="mt-3 text-xs sm:text-sm font-medium text-slate-700 text-center flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-indigo-600 inline" />
            Scannez ce QR Code avec l'appareil photo du téléphone de votre enfant ou conjoint
          </p>
        </div>

        {/* URL selector & Copy */}
        <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Adresse de connexion directe</span>
            <button
              onClick={loadNetworkInfo}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedUrl}
              className="flex-1 text-xs sm:text-sm font-mono bg-white px-3 py-2 rounded-xl border border-slate-300 text-slate-700 focus:outline-hidden select-all"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>

          {/* Alternative IP picker if available */}
          {networkInfo && networkInfo.wifiUrls.length > 1 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 block mb-1">Autres adresses IP détectées :</span>
              <div className="flex flex-wrap gap-1.5">
                {networkInfo.wifiUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedUrl(url)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono transition ${
                      selectedUrl === url
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {url}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3 Simple Steps */}
        <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <p><strong>Même Wi-Fi :</strong> Assurez-vous que le téléphone est connecté au Wi-Fi de la maison.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <p><strong>Scanner & Ouvrir :</strong> Visez le code QR avec l'appareil photo du smartphone.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <p><strong>Installer sur l'écran :</strong> Une fois ouvert, touchez <em>« Installer l'App »</em> ou <em>« Sur l'écran d'accueil »</em> pour l'utiliser comme une vraie application !</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
