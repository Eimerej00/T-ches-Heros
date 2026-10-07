import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, AlertCircle, Check, ShieldCheck, Delete } from 'lucide-react';
import type { FamilyMember } from '../types.ts';
import { sounds } from '../services/audio.ts';

interface PinModalProps {
  isOpen: boolean;
  targetMember: FamilyMember | null;
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  targetMember,
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, targetMember]);

  if (!isOpen || !targetMember) return null;

  const effectiveCorrectPin = (typeof correctPin === 'string' ? correctPin : String(correctPin ?? '1805')).trim() || '1805';

  const handleVerify = (candidatePin: string) => {
    if (candidatePin === effectiveCorrectPin) {
      setError(null);
      setIsSuccess(true);
      sounds.playSuccess();
      setTimeout(() => {
        onSuccess();
      }, 250);
    } else {
      sounds.playPop();
      setError('Code PIN incorrect. Veuillez réessayer.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Veuillez saisir votre code PIN');
      return;
    }
    handleVerify(pin.trim());
  };

  const handleKeypadPress = (digit: string) => {
    if (isSuccess) return;
    setError(null);
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      sounds.playPop();
      if (nextPin.length === effectiveCorrectPin.length) {
        handleVerify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
    sounds.playPop();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800 my-auto text-center animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Badge */}
        <div className="relative inline-block mb-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md mx-auto"
            style={{
              backgroundColor: `${targetMember.color}25`,
              border: `2px solid ${targetMember.color}`,
            }}
          >
            {targetMember.avatar}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Accès Tuteur Sécurisé
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
          Entrez le code PIN parental pour passer au profil de{' '}
          <strong className="text-slate-800">{targetMember.name}</strong>.
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-2.5 my-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isSuccess
                    ? 'bg-emerald-500 scale-110'
                    : isFilled
                    ? 'bg-indigo-600 scale-110'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        {/* Hidden Form for physical keyboard support */}
        <form onSubmit={handleSubmit} className="mb-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPin(val);
              setError(null);
              if (val.length === effectiveCorrectPin.length) {
                handleVerify(val);
              }
            }}
            className="w-full text-center text-xl font-mono tracking-widest py-2 px-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-slate-50 focus:bg-white text-slate-800"
            placeholder="••••"
            autoComplete="off"
          />

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 mt-2 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 mt-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Code PIN validé !</span>
            </div>
          )}
        </form>

        {/* On-Screen Numeric Keypad for Mobile Touch Ease */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-indigo-100 text-slate-800 font-bold text-base transition active:scale-95 flex items-center justify-center shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium text-xs transition active:scale-95 flex items-center justify-center"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-indigo-100 text-slate-800 font-bold text-base transition active:scale-95 flex items-center justify-center shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Effacer"
            className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-rose-50 text-slate-700 font-bold transition active:scale-95 flex items-center justify-center shadow-2xs"
          >
            <Delete className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
