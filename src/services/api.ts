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

  /**
   * Intelligently reconcile local state with incoming cloud/server state
   * to guarantee NO mission submission (especially 'en_attente') is ever dropped or lost!
   */
  private reconcileWithIncoming(incoming: FamilyState): { state: FamilyState; needsCloudWriteback: boolean } {
    if (!this.state) {
      return { state: incoming, needsCloudWriteback: false };
    }

    const current = this.state;
    const submissionsMap = new Map<string, any>();
    let missingInIncoming = false;

    // 1. Add all incoming submissions
    (incoming.submissions || []).forEach((s) => submissionsMap.set(s.id, s));

    // 2. Preserve any local submissions that incoming didn't have (e.g. just declared)
    (current.submissions || []).forEach((s) => {
      if (!submissionsMap.has(s.id)) {
        submissionsMap.set(s.id, s);
        missingInIncoming = true;
      } else {
        // If current has validated/rejected status while incoming is en_attente, keep the newer status
        const existing = submissionsMap.get(s.id)!;
        if (s.status !== 'en_attente' && existing.status === 'en_attente') {
          submissionsMap.set(s.id, s);
        }
      }
    });

    const mergedSubmissions = Array.from(submissionsMap.values()).sort((a: any, b: any) => {
      const tA = new Date(a.submittedAt || a.completedDate || 0).getTime();
      const tB = new Date(b.submittedAt || b.completedDate || 0).getTime();
      return tB - tA;
    });

    // Pick whichever state has newer or equal lastUpdated for metadata/members/tasks
    const base = (incoming.lastUpdated || 0) >= (current.lastUpdated || 0) ? incoming : current;

    const reconciled: FamilyState = {
      ...base,
      submissions: mergedSubmissions,
      lastUpdated: Math.max(incoming.lastUpdated || 0, current.lastUpdated || 0, Date.now()),
    };

    return { state: reconciled, needsCloudWriteback: missingInIncoming };
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
              const { state: reconciled, needsCloudWriteback } = this.reconcileWithIncoming(data);
              this.saveLocalCache(reconciled);

              // If local had submissions that cloud was missing, push merged state back to cloud
              if (needsCloudWriteback) {
                const sanitized = JSON.parse(JSON.stringify(reconciled));
                setDoc(familyRef, sanitized).catch((err) => {
                  console.warn('Firestore writeback notice:', err);
                });
              }
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
      let fetchedState: FamilyState | null = null;

      // 1. First try Firestore cloud sync
      try {
        const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
        const snap = await getDoc(familyRef);
        if (snap.exists()) {
          const cloudData = snap.data() as FamilyState;
          if (cloudData && Array.isArray(cloudData.members)) {
            fetchedState = cloudData;
          }
        }
      } catch {
        // Firestore fetch fallback to local API
      }

      // 2. Also check Local Express server if available to merge any offline or Wi-Fi changes
      try {
        const res = await fetch('/api/state', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const serverData: FamilyState = await res.json();
          if (serverData && Array.isArray(serverData.members)) {
            if (!fetchedState) {
              fetchedState = serverData;
            } else {
              // Merge both cloud and server data
              const { state: merged } = this.reconcileWithIncoming(serverData);
              fetchedState = merged;
            }
          }
        }
      } catch {
        // Express fetch fallback
      }

      if (fetchedState) {
        const { state: reconciled, needsCloudWriteback } = this.reconcileWithIncoming(fetchedState);
        this.syncError = null;
        this.saveLocalCache(reconciled);

        if (needsCloudWriteback) {
          try {
            const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
            const sanitized = JSON.parse(JSON.stringify(reconciled));
            await setDoc(familyRef, sanitized);
          } catch {
            // Ignore
          }
        }

        return reconciled;
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

        // 2. Broadcast immediately and reliably to Firebase Firestore so all family devices receive update
        try {
          const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
          const sanitized = JSON.parse(JSON.stringify(updatedState));
          await setDoc(familyRef, sanitized);
        } catch (e) {
          console.warn('Firestore dispatch notice:', e);
        }

        // 3. Also notify local Express server if available
        try {
          await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload }),
          });
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
    familyCode: string;
    familyName: string;
  }> {
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const proto = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const currentFullUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : `${proto}//${host}`;

    return {
      primaryUrl: currentFullUrl,
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
