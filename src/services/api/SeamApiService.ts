/**
 * Seam API Service — Universal Lock Adapter for SALTO KS
 *
 * Seam is the easiest way to get started — no SALTO partnership needed.
 * It wraps SALTO KS (and 50+ other brands) behind a single REST API.
 *
 * Setup (5 minutes):
 *  1. Sign up at https://console.seam.co  (free sandbox)
 *  2. In the dashboard: Workspaces → Add Device → SALTO KS
 *  3. Log in with your SALTO KS credentials
 *  4. Copy your API key and paste it below
 *
 * Sandbox test credentials (SALTO KS):
 *   Email:    jane@example.com
 *   Password: 1234
 *
 * Docs: https://docs.seam.co/latest/device-and-system-integration-guides/salto-locks
 */

import {Lock, AccessEvent} from '../../types';

// ---------------------------------------------------------------------------
// Configuration — replace with your real Seam API key
// ---------------------------------------------------------------------------
const SEAM_CONFIG = {
  apiKey: 'YOUR_SEAM_API_KEY',   // seam_test2ZTo_... or seam_prod...
  baseUrl: 'https://connect.getseam.com',
};
// ---------------------------------------------------------------------------

interface SeamDevice {
  device_id: string;
  display_name: string;
  device_type: string;
  properties: {
    locked: boolean;
    online: boolean;
    battery_level?: number;
    manufacturer?: string;
    model?: {display_name: string};
  };
}

interface SeamLockEvent {
  event_id: string;
  device_id: string;
  event_type: string;
  created_at: string;
  properties?: {
    access_code_id?: string;
    method?: string;
  };
}

class SeamApiService {
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: object,
  ): Promise<T> {
    const res = await fetch(`${SEAM_CONFIG.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${SEAM_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Seam-Workspace': 'auto',  // uses default workspace
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Seam API error ${res.status}: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Locks
  // -------------------------------------------------------------------------

  /** List all SALTO KS locks connected to your Seam workspace */
  async getLocks(): Promise<Lock[]> {
    const data = await this.request<{devices: SeamDevice[]}>('GET', '/devices/list');
    return data.devices
      .filter(d => d.device_type.includes('salto') || d.properties.manufacturer === 'salto')
      .map(d => ({
        id: d.device_id,
        name: d.display_name.toUpperCase(),
        location: 'SALTO KS',
        status: d.properties.online ? 'online' : 'offline',
        isOpen: !d.properties.locked,
        bleDeviceId: d.device_id,
      }));
  }

  /** Get a specific lock's current state */
  async getLock(deviceId: string): Promise<Lock> {
    const data = await this.request<{device: SeamDevice}>(
      'GET',
      `/devices/get?device_id=${deviceId}`,
    );
    const d = data.device;
    return {
      id: d.device_id,
      name: d.display_name.toUpperCase(),
      location: 'SALTO KS',
      status: d.properties.online ? 'online' : 'offline',
      isOpen: !d.properties.locked,
      bleDeviceId: d.device_id,
    };
  }

  /**
   * Unlock a door remotely via Seam.
   *
   * Note: SALTO KS disables remote unlock by default.
   * You need to request a "pass-through waiver" from Seam support, OR
   * use the SALTO KS dashboard to enable remote unlock for each device.
   */
  async unlockDoor(deviceId: string): Promise<void> {
    await this.request('POST', '/locks/unlock_door', {device_id: deviceId});
  }

  /** Lock a door remotely */
  async lockDoor(deviceId: string): Promise<void> {
    await this.request('POST', '/locks/lock_door', {device_id: deviceId});
  }

  // -------------------------------------------------------------------------
  // Events (audit log via Seam Events API)
  // -------------------------------------------------------------------------
  async getEvents(deviceId?: string): Promise<AccessEvent[]> {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    const data = await this.request<{events: SeamLockEvent[]}>(
      'GET',
      `/events/list${params}`,
    );

    const methodMap: Record<string, 'remote' | 'digital_key' | 'card'> = {
      seam_api: 'remote',
      mobile_app: 'digital_key',
      access_code: 'card',
    };

    return data.events.map(e => ({
      id: e.event_id,
      lockId: e.device_id,
      lockName: e.device_id,  // enrich with getLock() if needed
      personName: 'User',
      timestamp: new Date(e.created_at),
      method: methodMap[e.properties?.method ?? ''] ?? 'card',
      success: e.event_type === 'lock.unlocked' || e.event_type === 'lock.access_granted',
    }));
  }

  // -------------------------------------------------------------------------
  // Connect new SALTO KS account (Connect Webview)
  // -------------------------------------------------------------------------

  /**
   * Generate a Seam Connect Webview URL for the user to log in with
   * their SALTO KS credentials and link the account to your workspace.
   *
   * Open the returned URL in a WebView or browser.
   */
  async createConnectWebview(): Promise<{url: string; connect_webview_id: string}> {
    const data = await this.request<{
      connect_webview: {url: string; connect_webview_id: string};
    }>('POST', '/connect_webviews/create', {
      accepted_providers: ['salto_ks'],
      custom_redirect_url: 'radiusaccess://seam/callback',
    });
    return data.connect_webview;
  }

  /** Poll until the Connect Webview is completed (user has logged in) */
  async waitForConnection(webviewId: string): Promise<boolean> {
    for (let i = 0; i < 30; i++) {
      const data = await this.request<{
        connect_webview: {status: string; connected_account_id?: string};
      }>('GET', `/connect_webviews/get?connect_webview_id=${webviewId}`);

      if (data.connect_webview.status === 'authorized') {
        return true;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    return false;
  }
}

export default new SeamApiService();
