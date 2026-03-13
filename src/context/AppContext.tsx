import React, {createContext, useContext} from 'react';
import {ApiProviderType} from '../services/api/ApiProvider';

interface AppContextValue {
  activeProvider: ApiProviderType;
  openConnectionSetup: () => void;
}

const AppContext = createContext<AppContextValue>({
  activeProvider: 'mock',
  openConnectionSetup: () => {},
});

export const AppContextProvider = AppContext.Provider;
export const useAppContext = () => useContext(AppContext);
