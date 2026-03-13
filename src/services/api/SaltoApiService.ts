/**
 * SALTO KS Connect API Service
 *
 * To use this service:
 * 1. Apply for KSConnect Partner access at: https://developer.saltosystems.com/ks/connect-api/
 * 2. Receive your Client ID and Client Secret from your local SALTO Business Unit
 * 3. Fill in the config below (or load from environment / secure storage)
 *
 * Docs: https://developer.saltosystems.com/ks/connect-api/
 */

import {Lock, AccessEvent, Person} from '../../types';

// ---------------------------------------------------------------------------
// Configuration — replace with your real credentials
// ---------------------------------------------------------------------------
const SALTO_CONFIG = {
  baseUrl: 'https://api.saltoks.com/v1',    // KS Connect API base URL
  authUrl: 'https://auth.saltoks.com/oauth2/token',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  siteId: 'YOUR_SITE_ID',                   // Found in SALTO KS dashboard
};
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SaltoLock {
  id: string;
  name: string;
  online: boolean;
  battery_level?: number;
  door_state?: 'open' | 'closed';
  lock_state?: 'locked' | 'unlocked';
}

interface SaltoUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  access_profile_ids: string[];
}

interface SaltoAuditLog {
  id: string;
  lock_id: string;
  lock_name: string;
  user_name: string;
  event_type: string;
  timestamp: string;
  result: 'granted' | 'denied';
}

class SaltoApiService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /** Apply credentials loaded from CredentialStore at runtime. */
  configure(opts: {clientId: string; clientSecret: string; siteId: string; baseUrl?: string}): void {
    SALTO_CONFIG.clientId = opts.clientId;
    SALTO_CONFIG.clientSecret = opts.clientSecret;
    SALTO_CONFIG.siteId = opts.siteId;
    if (opts.baseUrl) {SALTO_CONFIG.baseUrl = opts.baseUrl;}
    // Reset token so next request re-authenticates with new credentials
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  // -------------------------------------------------------------------------
  // Authentication (OAuth 2.0 Client Credentials)
  // -------------------------------------------------------------------------
  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SALTO_CONFIG.clientId,
      client_secret: SALTO_CONFIG.clientSecret,
      scope: 'locks:read locks:write users:read users:write audit:read',
    });

    const res = await fetch(SALTO_CONFIG.authUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`SALTO auth failed: ${res.status} ${res.statusText}`);
    }

    const data: TokenResponse = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: object,
  ): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${SALTO_CONFIG.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Site-Id': SALTO_CONFIG.siteId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`SALTO API error ${res.status}: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Locks
  // -------------------------------------------------------------------------

  /** List all locks/readers for the configured site */
  async getLocks(): Promise<Lock[]> {
    const data = await this.request<{locks: SaltoLock[]}>('GET', '/locks');
    return data.locks.map(l => ({
      id: l.id,
      name: l.name.toUpperCase(),
      location: 'SALTO KS',
      status: l.online ? 'online' : 'offline',
      isOpen: l.lock_state === 'unlocked',
      bleDeviceId: l.id,
    }));
  }

  /** Get a single lock by ID */
  async getLock(lockId: string): Promise<Lock> {
    const l = await this.request<SaltoLock>('GET', `/locks/${lockId}`);
    return {
      id: l.id,
      name: l.name.toUpperCase(),
      location: 'SALTO KS',
      status: l.online ? 'online' : 'offline',
      isOpen: l.lock_state === 'unlocked',
      bleDeviceId: l.id,
    };
  }

  /**
   * Remotely unlock a door
   * Requires the lock to be connected to the SALTO KS cloud gateway
   */
  async unlockDoor(lockId: string): Promise<void> {
    await this.request('POST', `/locks/${lockId}/unlock`);
  }

  /** Lock a door remotely */
  async lockDoor(lockId: string): Promise<void> {
    await this.request('POST', `/locks/${lockId}/lock`);
  }

  // -------------------------------------------------------------------------
  // Users / People
  // -------------------------------------------------------------------------

  /** List all users with access to the site */
  async getUsers(): Promise<Person[]> {
    const data = await this.request<{users: SaltoUser[]}>('GET', '/users');
    return data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      accessLocks: [],
      accessGroupIds: u.access_profile_ids,
      role: 'user' as const,
      active: true,
      inviteStatus: 'active' as const,
    }));
  }

  /** Invite a new user and send them a digital key */
  async inviteUser(params: {
    name: string;
    email: string;
    phone?: string;
    accessProfileIds: string[];
    validFrom: Date;
    validUntil: Date;
  }): Promise<void> {
    await this.request('POST', '/users/invite', {
      name: params.name,
      email: params.email,
      phone: params.phone,
      access_profile_ids: params.accessProfileIds,
      valid_from: params.validFrom.toISOString(),
      valid_until: params.validUntil.toISOString(),
      send_invitation: true,
    });
  }

  /** Revoke all access for a user */
  async revokeUser(userId: string): Promise<void> {
    await this.request('DELETE', `/users/${userId}/access`);
  }

  // -------------------------------------------------------------------------
  // Audit log (Events)
  // -------------------------------------------------------------------------

  /** Fetch recent access events */
  async getAuditLog(limit = 50): Promise<AccessEvent[]> {
    const data = await this.request<{events: SaltoAuditLog[]}>(
      'GET',
      `/audit?limit=${limit}&site_id=${SALTO_CONFIG.siteId}`,
    );
    return data.events.map(e => ({
      id: e.id,
      lockId: e.lock_id,
      lockName: e.lock_name,
      personName: e.user_name,
      timestamp: new Date(e.timestamp),
      method: 'card' as const,
      success: e.result === 'granted',
    }));
  }

  // -------------------------------------------------------------------------
  // Digital Key (Mobile Key)
  // -------------------------------------------------------------------------

  /**
   * Request a mobile key (BLE credential) for the current user.
   * The returned token is used by BleService to authenticate with readers.
   */
  async getMobileKey(): Promise<string> {
    const data = await this.request<{mobile_key: string; expires_at: string}>(
      'POST',
      '/mobile-keys/request',
      {site_id: SALTO_CONFIG.siteId},
    );
    return data.mobile_key;
  }
}

export default new SaltoApiService();
