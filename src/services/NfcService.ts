import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

class NfcService {
  private initialized = false;

  async init(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      if (!supported) {return false;}
      await NfcManager.start();
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    try {
      return await NfcManager.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Start a Digital Key NFC session for a given lock.
   * Writes the lock credential to a compatible NFC tag,
   * or reads an existing tag to authenticate.
   */
  async startDigitalKeySession(
    lockId: string,
    credential: string,
    onSuccess: () => void,
    onError: (err: string) => void,
  ): Promise<void> {
    if (!this.initialized) {
      const ok = await this.init();
      if (!ok) {
        onError('NFC not supported on this device');
        return;
      }
    }

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify({lockId, credential, ts: Date.now()})),
      ]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
      }

      onSuccess();
    } catch (ex: any) {
      onError(ex?.message ?? 'NFC session failed');
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  /**
   * Read an NFC tag to authenticate with a reader.
   */
  async readTag(
    onSuccess: (data: string) => void,
    onError: (err: string) => void,
  ): Promise<void> {
    if (!this.initialized) {
      const ok = await this.init();
      if (!ok) {
        onError('NFC not supported');
        return;
      }
    }

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      if (tag?.ndefMessage?.[0]) {
        const text = Ndef.text.decodePayload(
          tag.ndefMessage[0].payload as unknown as Uint8Array,
        );
        onSuccess(text);
      } else {
        onError('No NDEF message found');
      }
    } catch (ex: any) {
      onError(ex?.message ?? 'Failed to read NFC tag');
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  stop() {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

export default new NfcService();
