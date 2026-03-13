/**
 * ApiProvider — switchable backend adapter
 *
 * The active provider is now loaded at runtime from CredentialStore,
 * so users can switch backends from within the app (no code editing needed).
 *
 * Providers:
 *   'mock'  — hardcoded mock data (default, works offline)
 *   'salto' — SALTO KS Connect API (requires KSConnect Partner credentials)
 *   'seam'  — Seam API wrapping SALTO KS (easiest, free sandbox)
 */

import {Lock, AccessEvent, Person} from '../../types';
import SaltoApiService from './SaltoApiService';
import SeamApiService from './SeamApiService';
import {MOCK_LOCKS, MOCK_EVENTS, MOCK_PEOPLE} from '../../data/mockLocks';
import CredentialStore, {StoredCredentials} from './CredentialStore';

export type ApiProviderType = 'mock' | 'salto' | 'seam';

export interface IApiProvider {
  getLocks(): Promise<Lock[]>;
  getLock(lockId: string): Promise<Lock>;
  unlockDoor(lockId: string): Promise<void>;
  lockDoor(lockId: string): Promise<void>;
  getUsers(): Promise<Person[]>;
  getEvents(lockId?: string): Promise<AccessEvent[]>;
}

// ---------------------------------------------------------------------------
// Mock provider (development / offline)
// ---------------------------------------------------------------------------
const mockProvider: IApiProvider = {
  getLocks: async () => {
    await new Promise(r => setTimeout(r, 400)); // simulate latency
    return MOCK_LOCKS;
  },
  getLock: async (lockId: string) => {
    const lock = MOCK_LOCKS.find(l => l.id === lockId);
    if (!lock) {throw new Error(`Lock ${lockId} not found`);}
    return lock;
  },
  unlockDoor: async (lockId: string) => {
    await new Promise(r => setTimeout(r, 1200));
    console.log(`[Mock] Unlocked door: ${lockId}`);
  },
  lockDoor: async (lockId: string) => {
    await new Promise(r => setTimeout(r, 800));
    console.log(`[Mock] Locked door: ${lockId}`);
  },
  getUsers: async () => MOCK_PEOPLE,
  getEvents: async (lockId?: string) => {
    if (lockId) {return MOCK_EVENTS.filter(e => e.lockId === lockId);}
    return MOCK_EVENTS;
  },
};

// ---------------------------------------------------------------------------
// SALTO KS Connect API provider
// ---------------------------------------------------------------------------
const saltoProvider: IApiProvider = {
  getLocks: () => SaltoApiService.getLocks(),
  getLock: (lockId: string) => SaltoApiService.getLock(lockId),
  unlockDoor: (lockId: string) => SaltoApiService.unlockDoor(lockId),
  lockDoor: (lockId: string) => SaltoApiService.lockDoor(lockId),
  getUsers: () => SaltoApiService.getUsers(),
  getEvents: () => SaltoApiService.getAuditLog(),
};

// ---------------------------------------------------------------------------
// Seam API provider
// ---------------------------------------------------------------------------
const seamProvider: IApiProvider = {
  getLocks: () => SeamApiService.getLocks(),
  getLock: (lockId: string) => SeamApiService.getLock(lockId),
  unlockDoor: (lockId: string) => SeamApiService.unlockDoor(lockId),
  lockDoor: (lockId: string) => SeamApiService.lockDoor(lockId),
  getUsers: async () => MOCK_PEOPLE,
  getEvents: (lockId?: string) => SeamApiService.getEvents(lockId),
};

const providerMap: Record<ApiProviderType, IApiProvider> = {
  mock: mockProvider,
  salto: saltoProvider,
  seam: seamProvider,
};

// ---------------------------------------------------------------------------
// Runtime-switchable API singleton
// ---------------------------------------------------------------------------
// Apply saved credentials to the service instances then return the provider.
async function applyCredentials(creds: StoredCredentials): Promise<void> {
  if (creds.provider === 'seam' && creds.seamApiKey) {
    SeamApiService.configure(creds.seamApiKey);
  }
  if (creds.provider === 'salto') {
    SaltoApiService.configure({
      clientId: creds.saltoClientId ?? '',
      clientSecret: creds.saltoClientSecret ?? '',
      siteId: creds.saltoSiteId ?? '',
      baseUrl: creds.saltoBaseUrl,
    });
  }
}

class DynamicApiProvider implements IApiProvider {
  private _active: IApiProvider = mockProvider;
  private _ready = false;

  /** Call once at app start (e.g. in App.tsx before rendering screens). */
  async init(): Promise<ApiProviderType> {
    const creds = await CredentialStore.load();
    if (creds) {
      await applyCredentials(creds);
      this._active = providerMap[creds.provider];
    }
    this._ready = true;
    return creds?.provider ?? 'mock';
  }

  /** Switch provider at runtime (called after ConnectionSetupScreen saves creds). */
  async switchTo(provider: ApiProviderType): Promise<void> {
    const creds = await CredentialStore.load();
    if (creds) {await applyCredentials(creds);}
    this._active = providerMap[provider];
  }

  getLocks() {return this._active.getLocks();}
  getLock(id: string) {return this._active.getLock(id);}
  unlockDoor(id: string) {return this._active.unlockDoor(id);}
  lockDoor(id: string) {return this._active.lockDoor(id);}
  getUsers() {return this._active.getUsers();}
  getEvents(lockId?: string) {return this._active.getEvents(lockId);}
}

export const api = new DynamicApiProvider();
export default api;
