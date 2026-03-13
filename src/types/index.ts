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

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  id: string;
  name: string;
  days: WeekDay[];
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface AccessGroup {
  id: string;
  name: string;
  color: string;
  lockIds: string[];
  scheduleId?: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accessLocks: string[];
  accessGroupIds: string[];
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  inviteStatus: 'active' | 'pending' | 'expired';
  validFrom?: Date;
  validUntil?: Date;
}

export interface Invitation {
  id: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'guest';
  accessGroupIds: string[];
  lockIds: string[];
  validFrom: Date;
  validUntil: Date;
  scheduleId?: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

export interface IQMetric {
  id: string;
  lockId: string;
  lockName: string;
  totalEntries: number;
  failedAttempts: number;
  lastActivity: Date;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AppAlert {
  id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  lockId?: string;
  lockName?: string;
  timestamp: Date;
  read: boolean;
}
