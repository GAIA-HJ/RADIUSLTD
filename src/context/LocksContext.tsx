import React, {createContext, useContext, useReducer, ReactNode} from 'react';
import {Lock, AccessEvent} from '../types';
import {MOCK_LOCKS, MOCK_EVENTS} from '../data/mockLocks';

interface LocksState {
  locks: Lock[];
  events: AccessEvent[];
  openingLockId: string | null;
}

type LocksAction =
  | {type: 'SET_LOCK_OPEN'; lockId: string; isOpen: boolean}
  | {type: 'SET_OPENING'; lockId: string | null}
  | {type: 'ADD_EVENT'; event: AccessEvent};

function locksReducer(state: LocksState, action: LocksAction): LocksState {
  switch (action.type) {
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
    default:
      return state;
  }
}

interface LocksContextValue {
  locks: Lock[];
  events: AccessEvent[];
  openingLockId: string | null;
  remoteOpen: (lockId: string) => Promise<void>;
}

const LocksContext = createContext<LocksContextValue | null>(null);

export function LocksProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(locksReducer, {
    locks: MOCK_LOCKS,
    events: MOCK_EVENTS,
    openingLockId: null,
  });

  const remoteOpen = async (lockId: string) => {
    const lock = state.locks.find(l => l.id === lockId);
    if (!lock) {return;}

    dispatch({type: 'SET_OPENING', lockId});
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
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
  };

  return (
    <LocksContext.Provider
      value={{
        locks: state.locks,
        events: state.events,
        openingLockId: state.openingLockId,
        remoteOpen,
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
