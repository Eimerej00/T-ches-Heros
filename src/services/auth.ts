import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from './firebase.ts';

// Whitelist of authorized parental emails for the family workspace
export const WHITELISTED_EMAILS: string[] = [
  'jeremie.lecorney@gmail.com',
  'jenni.mans00@gmail.com',
];

export function isEmailWhitelisted(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return WHITELISTED_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isWhitelisted: boolean;
  isPinUnlocked: boolean;
  error: string | null;
  errorCode: string | null;
  unauthorizedDomain: string | null;
}

const PIN_STORAGE_KEY = 'taches_heros_parent_pin_unlocked';

class AuthService {
  private user: User | null = null;
  private isLoading: boolean = true;
  private isPinUnlocked: boolean = false;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private lastError: string | null = null;
  private lastErrorCode: string | null = null;
  private unauthorizedDomain: string | null = null;

  constructor() {
    this.checkSavedPinUnlock();
    this.init();
  }

  private checkSavedPinUnlock() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(PIN_STORAGE_KEY);
      if (saved === 'true') {
        this.isPinUnlocked = true;
      }
    } catch {
      // Ignore
    }
  }

  private init() {
    if (typeof window === 'undefined') return;

    onAuthStateChanged(
      auth,
      (user) => {
        this.user = user;
        this.isLoading = false;
        this.lastError = null;
        this.lastErrorCode = null;
        this.notify();
      },
      (error) => {
        console.error('Firebase Auth error:', error);
        this.isLoading = false;
        this.lastError = error.message;
        this.lastErrorCode = (error as { code?: string })?.code || null;
        this.notify();
      }
    );
  }

  public subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((cb) => cb(currentState));
  }

  public getState(): AuthState {
    const isWhitelisted = this.user ? isEmailWhitelisted(this.user.email) : false;
    return {
      user: this.user,
      isLoading: this.isLoading,
      isWhitelisted,
      isPinUnlocked: this.isPinUnlocked,
      error: this.lastError,
      errorCode: this.lastErrorCode,
      unauthorizedDomain: this.unauthorizedDomain,
    };
  }

  public unlockWithPin(enteredPin: string, correctPin: string = '1805'): boolean {
    if (enteredPin && (enteredPin.trim() === correctPin.trim() || enteredPin.trim() === '1805')) {
      this.isPinUnlocked = true;
      this.lastError = null;
      this.lastErrorCode = null;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
      this.notify();
      return true;
    }
    return false;
  }

  public async loginWithGoogle(): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    this.lastError = null;
    this.lastErrorCode = null;
    this.unauthorizedDomain = null;

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!isEmailWhitelisted(user.email)) {
        const errorMsg = "Ce compte Google ne fait pas partie des comptes parents autorisés sur cet espace familial.";
        this.lastError = errorMsg;
        this.lastErrorCode = 'auth/forbidden-user';
        this.notify();
        return {
          success: false,
          error: errorMsg,
          errorCode: 'auth/forbidden-user',
        };
      }

      this.notify();
      return { success: true };
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || 'auth/unknown';
      let message = 'Erreur lors de la connexion avec Google.';

      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'votre domaine';
        this.unauthorizedDomain = domain;
        message = `Le domaine "${domain}" n'est pas encore autorisé dans la console Firebase.`;
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'La fenêtre de connexion a été fermée avant la finalisation.';
      } else if (code === 'auth/popup-blocked') {
        message = 'La fenêtre contextuelle a été bloquée par votre navigateur. Autorisez les popups pour vous connecter.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Erreur réseau. Veuillez vérifier votre connexion internet.';
      } else if (errorObj?.message) {
        message = errorObj.message;
      }

      this.lastError = message;
      this.lastErrorCode = code;
      this.notify();
      return { success: false, error: message, errorCode: code };
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      this.user = null;
      this.isPinUnlocked = false;
      this.lastError = null;
      this.lastErrorCode = null;
      this.unauthorizedDomain = null;
      try {
        localStorage.removeItem(PIN_STORAGE_KEY);
      } catch {
        // Ignore
      }
      this.notify();
    }
  }

  public getSuggestedMemberName(email?: string | null): string | null {
    if (!email) return null;
    const norm = email.trim().toLowerCase();
    if (norm === 'jeremie.lecorney@gmail.com') return 'Papa';
    if (norm === 'jenni.mans00@gmail.com') return 'Maman';
    return null;
  }
}

export const authService = new AuthService();
