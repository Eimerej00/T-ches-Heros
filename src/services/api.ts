import type { FamilyState } from '../types.ts';

const LOCAL_STORAGE_KEY = 'taches_heros_state_v1';
const ACTIVE_MEMBER_KEY = 'taches_heros_active_member_id';

class ApiService {
  private state: FamilyState | null = null;
  private listeners: Set<(state: FamilyState) => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pollInterval: number | null = null;
  private syncError: string | null = null;

  constructor() {
    this.loadLocalCache();
    this.setupNetworkListeners();
    this.startPolling();
  }

  private loadLocalCache() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
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

    // Poll every 3 seconds for seamless Wi-Fi synchronization across phones
    this.pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing) {
        this.fetchState();
      }
    }, 3000);
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
      const res = await fetch('/api/state', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data: FamilyState = await res.json();
      this.syncError = null;
      this.saveLocalCache(data);
      return data;
    } catch (err: unknown) {
      this.syncError = (err as Error).message || 'Échec de synchronisation';
      return this.state;
    } finally {
      this.isSyncing = false;
    }
  }

  public async dispatchAction(type: string, payload: unknown): Promise<{ success: boolean; state?: FamilyState; error?: string }> {
    this.isSyncing = true;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Une erreur est survenue' };
      }

      if (data.state) {
        this.saveLocalCache(data.state);
      }
      return { success: true, state: data.state };
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Connexion réseau impossible';
      return { success: false, error: errorMsg };
    } finally {
      this.isSyncing = false;
    }
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
    return {
      primaryUrl: `${proto}//${host}`,
      wifiUrls: [`${proto}//${host}`],
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
