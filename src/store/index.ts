import { configureStore } from '@reduxjs/toolkit';

import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { onLogin } from '@features/sign-in';
import { rootReducer } from '@app/store/rootReducer';

import { apiService } from '@app/api/apiService';
import type { RootState } from '@app/store/rootReducer';
import { loadChatData, loadCredentials } from '@app/services/storage';

export type { RootState };

export const loadPersistedState = (): RootState | undefined => {
  const credentials = loadCredentials();
  if (!credentials) return undefined;
  return rootReducer(undefined, onLogin({ credentials, ...loadChatData(credentials.idInstance) }));
};

export const setupStore = (preloadedState: Partial<RootState> | undefined = loadPersistedState()) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiService.middleware),
  });

export const store = setupStore();

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, UnknownAction>;
