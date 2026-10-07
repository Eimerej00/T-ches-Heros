import type { FamilyState } from '../types.ts';
import { INITIAL_STATE, applyLocalAction } from './defaultState.ts';
import { db, doc, onSnapshot, setDoc, getDoc } from './firebase.ts';

const LOCAL_STORAGE_KEY = 'taches_heros_state_v1';
const ACTIVE_MEMBER_KEY = 'taches_heros_active_member_id';
const FIRESTORE_FAMILY_DOC = 'main';

class ApiService {
  private state: FamilyState | null = null;
  private listeners: Set<(state: FamilyState) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pollInterval: number | null = null;
  private syncError: string | null = null;
  private isFirestoreConnected: boolean = false;

  constructor() {
    this.loadLocalCache();
    this.setupNetworkListeners();
    this.initFirestoreSync();
    this.startPolling();
  }

  private loadLocalCache() {
    let loadedState: FamilyState | null = null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        loadedState = JSON.parse(saved);
      }
    } catch {
      // Ignore
    }

    if (!loadedState) {
      loadedState = JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    this.saveLocalCache(loadedState!);
  }

  private saveLocalCache(state: FamilyState) {
    this.state = state;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
    this.notify();
  }

  private initFirestoreSync() {
    if (typeof window === 'undefined') return;

    try {
      const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);

      // Listen to real-time changes across all family devices
      onSnapshot(
        familyRef,
        (snapshot) => {
          this.isFirestoreConnected = true;
          this.isOnline = true;
          this.syncError = null;

          if (snapshot.exists()) {
            const data = snapshot.data() as FamilyState;
            if (data && Array.isArray(data.members) && Array.isArray(data.tasks)) {
              this.state = data;
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
              } catch {
                // Ignore
              }
              this.notify();
            }
          } else {
            // First time setup on cloud: initialize Firestore with initial state
            if (this.state) {
              const sanitized = JSON.parse(JSON.stringify(this.state));
              setDoc(familyRef, sanitized).catch((err) => {
                console.warn('Firestore initial setDoc notice:', err);
              });
            }
          }
        },
        (error) => {
          console.warn('Firestore real-time sync notice:', error.message);
          this.isFirestoreConnected = false;
        }
      );
    } catch (err) {
      console.warn('Could not initialize Firestore sync:', err);
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.fetchState();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify();
    });

    // Also sync on tab visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchState();
      }
    });
  }

  private startPolling() {
    if (typeof window === 'undefined') return;

    // Fetch immediately
    this.fetchState();

    // Secondary fallback poll
    this.pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        this.fetchState();
      }
    }, 5000);
  }

  public subscribe(cb: (state: FamilyState) => void): () => void {
    this.listeners.add(cb);
    if (this.state) {
      cb(this.state);
    }
    return () => this.listeners.delete(cb);
  }

  private notify() {
    if (this.state) {
      this.listeners.forEach((cb) => cb(this.state!));
    }
  }

  public getState(): FamilyState | null {
    return this.state;
  }

  public getSyncStatus(): { isOnline: boolean; isSyncing: boolean; syncError: string | null } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      syncError: this.syncError,
    };
  }

  public async fetchState(): Promise<FamilyState | null> {
    if (this.isSyncing) return this.state;
    this.isSyncing = true;

    try {
      // 1. First try Firestore cloud sync
      try {
        const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
        const snap = await getDoc(familyRef);
        if (snap.exists()) {
          const cloudData = snap.data() as FamilyState;
          if (cloudData && cloudData.members) {
            this.syncError = null;
            this.saveLocalCache(cloudData);
            return cloudData;
          }
        }
      } catch {
        // Firestore fetch fallback to local API
      }

      // 2. Try Local Express server if running
      const res = await fetch('/api/state', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data: FamilyState = await res.json();
        this.syncError = null;
        this.saveLocalCache(data);
        return data;
      }
    } catch (err: unknown) {
      this.syncError = (err as Error).message || 'Échec de synchronisation';
    } finally {
      this.isSyncing = false;
    }
    return this.state;
  }

  public async dispatchAction(type: string, payload: unknown): Promise<{ success: boolean; state?: FamilyState; error?: string }> {
    this.isSyncing = true;

    try {
      // 1. Calculate new state with local action reducer
      if (this.state) {
        const localResult = applyLocalAction(this.state, type, payload);
        if (!localResult.success) {
          return { success: false, error: localResult.error || 'Action impossible' };
        }

        const updatedState = localResult.state;
        this.saveLocalCache(updatedState);

        // 2. Broadcast immediately to Firebase Firestore so all family phones receive update
        try {
          const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
          const sanitized = JSON.parse(JSON.stringify(updatedState));
          setDoc(familyRef, sanitized).catch((cloudErr) => {
            console.warn('Cloud Firestore sync notice:', cloudErr);
          });
        } catch (e) {
          console.warn('Firestore dispatch notice:', e);
        }

        // 3. Also notify local Express server if available
        try {
          fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload }),
          }).catch(() => {});
        } catch {
          // Ignore
        }

        return { success: true, state: updatedState };
      }
    } finally {
      this.isSyncing = false;
    }

    return { success: false, error: 'État introuvable' };
  }

  public async getNetworkInfo(): Promise<{
    primaryUrl: string;
    wifiUrls: string[];
    localIps: string[];
    port: number;
    familyCode: string;
    familyName: string;
  }> {
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const proto = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const currentFullUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : `${proto}//${host}`;

    return {
      primaryUrl: currentFullUrl,
      wifiUrls: [currentFullUrl],
      localIps: [],
      port: 3000,
      familyCode: this.state?.settings.familyCode || 'TRIBU-42',
      familyName: this.state?.settings.familyName || 'La Famille',
    };
  }

  public getActiveMemberId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_MEMBER_KEY);
    } catch {
      return null;
    }
  }

  public setActiveMemberId(id: string) {
    try {
      localStorage.setItem(ACTIVE_MEMBER_KEY, id);
    } catch {
      // Ignore
    }
  }
}

export const api = new ApiService();
