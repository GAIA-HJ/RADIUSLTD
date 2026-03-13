/**
 * ApiProvider — switchable backend adapter
 *
 * Set the ACTIVE_PROVIDER to choose your data source:
 *
 *   'mock'  — uses hardcoded mock data (default, works offline, no credentials needed)
 *   'salto' — calls SALTO KS Connect API directly (requires KSConnect Partner credentials)
 *   'seam'  — calls Seam API which wraps SALTO KS (easiest, free sandbox available)
 */

import {Lock, AccessEvent, Person} from '../../types';
import SaltoApiService from './SaltoApiService';
import SeamApiService from './SeamApiService';
import {MOCK_LOCKS, MOCK_EVENTS, MOCK_PEOPLE} from '../../data/mockLocks';

export type ApiProviderType = 'mock' | 'salto' | 'seam';

// ▼▼▼ CHANGE THIS to switch backends ▼▼▼
export const ACTIVE_PROVIDER: ApiProviderType = 'mock';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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
  getUsers: async () => MOCK_PEOPLE,  // Seam doesn't have user management yet
  getEvents: (lockId?: string) => SeamApiService.getEvents(lockId),
};

// ---------------------------------------------------------------------------
// Export the active provider
// ---------------------------------------------------------------------------
const providers: Record<ApiProviderType, IApiProvider> = {
  mock: mockProvider,
  salto: saltoProvider,
  seam: seamProvider,
};

export const api: IApiProvider = providers[ACTIVE_PROVIDER];
export default api;
