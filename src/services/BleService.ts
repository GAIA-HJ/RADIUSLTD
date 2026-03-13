import {BleManager, Device, State} from 'react-native-ble-plx';
import {Platform, PermissionsAndroid} from 'react-native';

const READER_SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
const UNLOCK_CHARACTERISTIC_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';

class BleService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;

  getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }
    return this.manager;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(
          r => r === PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions via Info.plist
  }

  async isBluetoothOn(): Promise<boolean> {
    return new Promise(resolve => {
      const sub = this.getManager().onStateChange(state => {
        if (state === State.PoweredOn || state === State.PoweredOff) {
          sub.remove();
          resolve(state === State.PoweredOn);
        }
      }, true);
    });
  }

  /**
   * Scan for BLE access readers and connect to the one matching deviceId.
   */
  async connectToReader(
    deviceId: string,
    onProgress: (msg: string) => void,
    onSuccess: () => void,
    onError: (err: string) => void,
  ): Promise<void> {
    const hasPerms = await this.requestPermissions();
    if (!hasPerms) {
      onError('Bluetooth permissions denied');
      return;
    }

    const btOn = await this.isBluetoothOn();
    if (!btOn) {
      onError('Please enable Bluetooth');
      return;
    }

    onProgress('Scanning for reader...');

    try {
      // Scan for device
      const device = await new Promise<Device>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.getManager().stopDeviceScan();
          reject(new Error('Reader not found'));
        }, 10000);

        this.getManager().startDeviceScan(
          [READER_SERVICE_UUID],
          null,
          (error, scannedDevice) => {
            if (error) {
              clearTimeout(timeout);
              reject(error);
              return;
            }
            if (scannedDevice && scannedDevice.id === deviceId) {
              clearTimeout(timeout);
              this.getManager().stopDeviceScan();
              resolve(scannedDevice);
            }
          },
        );
      });

      onProgress('Connecting...');
      this.connectedDevice = await device.connect();
      await this.connectedDevice.discoverAllServicesAndCharacteristics();

      onProgress('Authenticating...');
      // Send unlock command
      const credential = Buffer.from('UNLOCK:' + deviceId).toString('base64');
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        READER_SERVICE_UUID,
        UNLOCK_CHARACTERISTIC_UUID,
        credential,
      );

      onSuccess();
    } catch (ex: any) {
      onError(ex?.message ?? 'BLE connection failed');
    } finally {
      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection().catch(() => {});
        this.connectedDevice = null;
      }
    }
  }

  destroy() {
    this.manager?.destroy();
    this.manager = null;
  }
}

export default new BleService();
