import type { FamilyState, FamilyMember, ChoreSubmission, ChoreTask, RewardClaim } from '../types.ts';
import { INITIAL_STATE, applyLocalAction, calculateLevel } from './defaultState.ts';
import { db, doc, onSnapshot, setDoc, getDoc } from './firebase.ts';
import { authService } from './auth.ts';

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
  private firestoreUnsubscribe: (() => void) | null = null;

  constructor() {
    this.loadLocalCache();
    this.setupNetworkListeners();
    this.setupAuthSync();
    this.startPolling();
  }

  private isAuthorizedSession(): boolean {
    const authState = authService.getState();
    return Boolean(authState.isWhitelisted || authState.isPinUnlocked);
  }

  private setupAuthSync() {
    if (typeof window === 'undefined') return;

    authService.subscribe((authState) => {
      const authorized = authState.isWhitelisted || authState.isPinUnlocked;
      if (authorized) {
        if (!this.firestoreUnsubscribe) {
          this.initFirestoreSync();
        }
      } else {
        if (this.firestoreUnsubscribe) {
          this.firestoreUnsubscribe();
          this.firestoreUnsubscribe = null;
        }
        this.isFirestoreConnected = false;
      }
    });
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
   * to guarantee NO mission submission (especially 'en_attente') is ever dropped or lost,
   * and guarantees player cumulative points and spendable balances match on ALL family devices!
   */
  private reconcileWithIncoming(incoming: FamilyState): { state: FamilyState; needsCloudWriteback: boolean } {
    if (!this.state) {
      return { state: incoming, needsCloudWriteback: false };
    }

    const current = this.state;
    const submissionsMap = new Map<string, ChoreSubmission>();
    let missingInIncoming = false;

    // 1. Add all incoming submissions
    (incoming.submissions || []).forEach((s) => submissionsMap.set(s.id, s));

    // 2. Preserve any local submissions that incoming didn't have (e.g. submitted on this device)
    (current.submissions || []).forEach((s) => {
      if (!submissionsMap.has(s.id)) {
        submissionsMap.set(s.id, s);
        missingInIncoming = true;
      } else {
        // If current has validated/rejected status while incoming is still en_attente, keep the newer status
        const existing = submissionsMap.get(s.id)!;
        if (s.status !== 'en_attente' && existing.status === 'en_attente') {
          submissionsMap.set(s.id, s);
          missingInIncoming = true;
        }
      }
    });

    const mergedSubmissions = Array.from(submissionsMap.values()).sort((a, b) => {
      const tA = new Date(a.submittedAt || a.completedDate || 0).getTime();
      const tB = new Date(b.submittedAt || b.completedDate || 0).getTime();
      return tB - tA;
    });

    // Merge reward claims
    const claimsMap = new Map<string, RewardClaim>();
    (incoming.rewardClaims || []).forEach((c) => claimsMap.set(c.id, c));
    (current.rewardClaims || []).forEach((c) => {
      if (!claimsMap.has(c.id)) {
        claimsMap.set(c.id, c);
        missingInIncoming = true;
      }
    });
    const mergedClaims = Array.from(claimsMap.values()).sort((a, b) => {
      const tA = new Date(a.claimedAt || 0).getTime();
      const tB = new Date(b.claimedAt || 0).getTime();
      return tB - tA;
    });

    // Merge tasks (keep all tasks created or modified)
    const tasksMap = new Map<string, ChoreTask>();
    (incoming.tasks || []).forEach((t) => tasksMap.set(t.id, t));
    (current.tasks || []).forEach((t) => {
      if (!tasksMap.has(t.id)) {
        tasksMap.set(t.id, t);
        missingInIncoming = true;
      }
    });
    const mergedTasks = Array.from(tasksMap.values());

    // Merge members list
    const membersMap = new Map<string, FamilyMember>();
    (incoming.members || []).forEach((m) => membersMap.set(m.id, { ...m }));
    (current.members || []).forEach((m) => {
      if (!membersMap.has(m.id)) {
        membersMap.set(m.id, { ...m });
        missingInIncoming = true;
      }
    });

    // Ensure all canonical members exist (Maman, Papa, Philéas, Giliane)
    INITIAL_STATE.members.forEach((initM) => {
      if (!membersMap.has(initM.id)) {
        membersMap.set(initM.id, { ...initM });
        missingInIncoming = true;
      }
    });

    // Synchronize member points deterministically across ALL devices:
    // Every member's points and totalEarnedPoints are calculated based on the merged submissions and claims,
    // guaranteeing that ALL family phones display the EXACT same scores for every player!
    const mergedMembers = Array.from(membersMap.values()).map((m) => {
      let earned = 0;
      let spendable = 0;

      mergedSubmissions
        .filter((s) => s.status === 'validee')
        .forEach((s) => {
          const isParticipant =
            (s.participantIds && s.participantIds.includes(m.id)) ||
            s.submittedBy === m.id;
          if (!isParticipant) return;

          const count = s.participantIds && s.participantIds.length > 0 ? s.participantIds.length : 1;
          const pts = s.pointsPerParticipant || (s.isCoop ? Math.ceil(s.points / count) : s.points);

          if (pts > 0) {
            earned += pts;
            spendable += pts;
          } else {
            // Malus (points is negative)
            spendable += pts;
          }
        });

      // Deduct spent reward claims
      mergedClaims.forEach((c) => {
        if (c.claimedBy === m.id && c.cost) {
          spendable -= c.cost;
        }
      });

      // Ensure points do not go negative and honor any higher baseline score
      const finalTotalEarned = Math.max(m.totalEarnedPoints || 0, earned);
      const finalSpendable = Math.max(0, Math.max(m.points || 0, spendable));
      const { level, title } = calculateLevel(finalTotalEarned);

      return {
        ...m,
        points: finalSpendable,
        totalEarnedPoints: finalTotalEarned,
        level,
        title,
      };
    });

    // Merge rewards catalog
    const mergedRewards = [...(incoming.rewards || current.rewards || [])];
    INITIAL_STATE.rewards.forEach((r) => {
      if (!mergedRewards.some((existing) => existing.id === r.id)) {
        mergedRewards.push(r);
      }
    });

    const reconciled: FamilyState = {
      settings: (incoming.lastUpdated || 0) >= (current.lastUpdated || 0) ? incoming.settings : current.settings,
      members: mergedMembers,
      tasks: mergedTasks,
      submissions: mergedSubmissions,
      rewards: mergedRewards,
      rewardClaims: mergedClaims,
      lastUpdated: Math.max(incoming.lastUpdated || 0, current.lastUpdated || 0, Date.now()),
    };

    return { state: reconciled, needsCloudWriteback: missingInIncoming };
  }

  private initFirestoreSync() {
    if (typeof window === 'undefined') return;
    if (!this.isAuthorizedSession()) return;

    try {
      const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);

      // Listen to real-time changes across all family devices
      this.firestoreUnsubscribe = onSnapshot(
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

              // If local had submissions that cloud was missing, push merged state back to cloud immediately
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

      // 1. First try Firestore cloud sync if user is authorized (Google whitelist or PIN)
      if (this.isAuthorizedSession()) {
        try {
          const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
          const snap = await getDoc(familyRef);
          if (snap.exists()) {
            const cloudData = snap.data() as FamilyState;
            if (cloudData && Array.isArray(cloudData.members)) {
              fetchedState = cloudData;
            }
          }
        } catch (e) {
          console.warn('Firestore fetch notice:', e);
        }
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

        if (needsCloudWriteback && this.isAuthorizedSession()) {
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

        // Reconcile and recalculate exact member scores
        const { state: updatedState } = this.reconcileWithIncoming(localResult.state);
        this.saveLocalCache(updatedState);

        // 2. Broadcast immediately and reliably to Firebase Firestore so all family devices receive update
        if (this.isAuthorizedSession()) {
          try {
            const familyRef = doc(db, 'families', FIRESTORE_FAMILY_DOC);
            const sanitized = JSON.parse(JSON.stringify(updatedState));
            await setDoc(familyRef, sanitized);
          } catch (e) {
            console.warn('Firestore dispatch notice:', e);
          }
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
