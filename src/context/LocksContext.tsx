import React, {createContext, useContext, useReducer, useEffect, ReactNode} from 'react';
import {Lock, AccessEvent} from '../types';
import {MOCK_LOCKS, MOCK_EVENTS} from '../data/mockLocks';
import api from '../services/api/ApiProvider';

interface LocksState {
  locks: Lock[];
  events: AccessEvent[];
  openingLockId: string | null;
  loading: boolean;
  error: string | null;
}

type LocksAction =
  | {type: 'SET_LOCKS'; locks: Lock[]}
  | {type: 'SET_EVENTS'; events: AccessEvent[]}
  | {type: 'SET_LOCK_OPEN'; lockId: string; isOpen: boolean}
  | {type: 'SET_OPENING'; lockId: string | null}
  | {type: 'ADD_EVENT'; event: AccessEvent}
  | {type: 'SET_LOADING'; loading: boolean}
  | {type: 'SET_ERROR'; error: string | null};

function locksReducer(state: LocksState, action: LocksAction): LocksState {
  switch (action.type) {
    case 'SET_LOCKS':
      return {...state, locks: action.locks, loading: false, error: null};
    case 'SET_EVENTS':
      return {...state, events: action.events};
    case 'SET_LOCK_OPEN':
      return {
        ...state,
        locks: state.locks.map(l =>
          l.id === action.lockId ? {...l, isOpen: action.isOpen} : l,
        ),
      };
    case 'SET_OPENING':
      return {...state, openingLockId: action.lockId};
    case 'ADD_EVENT':
      return {...state, events: [action.event, ...state.events]};
    case 'SET_LOADING':
      return {...state, loading: action.loading};
    case 'SET_ERROR':
      return {...state, error: action.error, loading: false};
    default:
      return state;
  }
}

interface LocksContextValue {
  locks: Lock[];
  events: AccessEvent[];
  openingLockId: string | null;
  loading: boolean;
  error: string | null;
  remoteOpen: (lockId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LocksContext = createContext<LocksContextValue | null>(null);

export function LocksProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(locksReducer, {
    locks: MOCK_LOCKS,   // shown instantly while real data loads
    events: MOCK_EVENTS,
    openingLockId: null,
    loading: false,
    error: null,
  });

  // Fetch real locks from the configured API provider on mount
  const refresh = async () => {
    dispatch({type: 'SET_LOADING', loading: true});
    try {
      const [locks, events] = await Promise.all([
        api.getLocks(),
        api.getEvents(),
      ]);
      dispatch({type: 'SET_LOCKS', locks});
      dispatch({type: 'SET_EVENTS', events});
    } catch (err: any) {
      dispatch({type: 'SET_ERROR', error: err?.message ?? 'Failed to load locks'});
      // Keep mock data visible on error so the UI doesn't go blank
    }
  };

  useEffect(() => {
    refresh();
    // Poll for updates every 30 seconds
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remoteOpen = async (lockId: string) => {
    const lock = state.locks.find(l => l.id === lockId);
    if (!lock) {return;}

    dispatch({type: 'SET_OPENING', lockId});
    try {
      await api.unlockDoor(lockId);        // real API call
      dispatch({type: 'SET_OPENING', lockId: null});
      dispatch({type: 'SET_LOCK_OPEN', lockId, isOpen: true});

      dispatch({
        type: 'ADD_EVENT',
        event: {
          id: Date.now().toString(),
          lockId,
          lockName: lock.name,
          personName: 'You',
          timestamp: new Date(),
          method: 'remote',
          success: true,
        },
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        dispatch({type: 'SET_LOCK_OPEN', lockId, isOpen: false});
      }, 3000);
    } catch (err: any) {
      dispatch({type: 'SET_OPENING', lockId: null});
      dispatch({
        type: 'ADD_EVENT',
        event: {
          id: Date.now().toString(),
          lockId,
          lockName: lock.name,
          personName: 'You',
          timestamp: new Date(),
          method: 'remote',
          success: false,
        },
      });
      throw err; // let the UI show the error
    }
  };

  return (
    <LocksContext.Provider
      value={{
        locks: state.locks,
        events: state.events,
        openingLockId: state.openingLockId,
        loading: state.loading,
        error: state.error,
        remoteOpen,
        refresh,
      }}>
      {children}
    </LocksContext.Provider>
  );
}

export function useLocks() {
  const ctx = useContext(LocksContext);
  if (!ctx) {throw new Error('useLocks must be used within LocksProvider');}
  return ctx;
}
