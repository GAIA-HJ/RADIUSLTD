/**
 * CredentialStore — persists API credentials using AsyncStorage.
 * In production, swap AsyncStorage for react-native-keychain for
 * secure encrypted storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiProviderType} from './ApiProvider';

const KEYS = {
  provider: '@radius/provider',
  seamApiKey: '@radius/seam_api_key',
  saltoClientId: '@radius/salto_client_id',
  saltoClientSecret: '@radius/salto_client_secret',
  saltoSiteId: '@radius/salto_site_id',
  saltoBaseUrl: '@radius/salto_base_url',
};

export interface StoredCredentials {
  provider: ApiProviderType;
  seamApiKey?: string;
  saltoClientId?: string;
  saltoClientSecret?: string;
  saltoSiteId?: string;
  saltoBaseUrl?: string;
}

class CredentialStore {
  async save(creds: StoredCredentials): Promise<void> {
    const pairs: [string, string][] = [
      [KEYS.provider, creds.provider],
    ];
    if (creds.seamApiKey) {pairs.push([KEYS.seamApiKey, creds.seamApiKey]);}
    if (creds.saltoClientId) {pairs.push([KEYS.saltoClientId, creds.saltoClientId]);}
    if (creds.saltoClientSecret) {pairs.push([KEYS.saltoClientSecret, creds.saltoClientSecret]);}
    if (creds.saltoSiteId) {pairs.push([KEYS.saltoSiteId, creds.saltoSiteId]);}
    if (creds.saltoBaseUrl) {pairs.push([KEYS.saltoBaseUrl, creds.saltoBaseUrl]);}
    await AsyncStorage.multiSet(pairs);
  }

  async load(): Promise<StoredCredentials | null> {
    const values = await AsyncStorage.multiGet(Object.values(KEYS));
    const map = Object.fromEntries(values.map(([k, v]) => [k, v]));
    const provider = map[KEYS.provider] as ApiProviderType | null;
    if (!provider) {return null;}
    return {
      provider,
      seamApiKey: map[KEYS.seamApiKey] ?? undefined,
      saltoClientId: map[KEYS.saltoClientId] ?? undefined,
      saltoClientSecret: map[KEYS.saltoClientSecret] ?? undefined,
      saltoSiteId: map[KEYS.saltoSiteId] ?? undefined,
      saltoBaseUrl: map[KEYS.saltoBaseUrl] ?? undefined,
    };
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }

  async getProvider(): Promise<ApiProviderType> {
    const p = await AsyncStorage.getItem(KEYS.provider);
    return (p as ApiProviderType) ?? 'mock';
  }
}

export default new CredentialStore();
