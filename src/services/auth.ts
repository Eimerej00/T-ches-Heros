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
  error: string | null;
}

class AuthService {
  private user: User | null = null;
  private isLoading: boolean = true;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private lastError: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    onAuthStateChanged(
      auth,
      (user) => {
        this.user = user;
        this.isLoading = false;
        this.lastError = null;
        this.notify();
      },
      (error) => {
        console.error('Firebase Auth error:', error);
        this.isLoading = false;
        this.lastError = error.message;
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
      error: this.lastError,
    };
  }

  public async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    this.lastError = null;
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!isEmailWhitelisted(user.email)) {
        return {
          success: false,
          error: `L'adresse ${user.email} n'est pas autorisée sur cet espace familial privé. Seules les adresses des parents enregistrées peuvent y accéder.`,
        };
      }

      return { success: true };
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      const errorObj = err as { code?: string; message?: string };
      let message = 'Erreur lors de la connexion avec Google.';

      if (errorObj?.code === 'auth/popup-closed-by-user') {
        message = 'La fenêtre de connexion a été fermée avant la finalisation.';
      } else if (errorObj?.code === 'auth/popup-blocked') {
        message = 'La fenêtre contextuelle a été bloquée par votre navigateur. Autorisez les popups pour vous connecter.';
      } else if (errorObj?.code === 'auth/network-request-failed') {
        message = 'Erreur réseau. Veuillez vérifier votre connexion internet.';
      } else if (errorObj?.message) {
        message = errorObj.message;
      }

      this.lastError = message;
      this.notify();
      return { success: false, error: message };
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.user = null;
      this.lastError = null;
      this.notify();
    } catch (err) {
      console.error('Error during logout:', err);
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
