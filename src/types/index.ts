export interface Lock {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  isOpen: boolean;
  bleDeviceId?: string;
  nfcTagId?: string;
}

export interface AccessEvent {
  id: string;
  lockId: string;
  lockName: string;
  personName: string;
  timestamp: Date;
  method: 'remote' | 'digital_key' | 'card';
  success: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accessLocks: string[];
  role: 'admin' | 'user' | 'guest';
  active: boolean;
}

export interface IQMetric {
  id: string;
  lockId: string;
  lockName: string;
  totalEntries: number;
  failedAttempts: number;
  lastActivity: Date;
}
