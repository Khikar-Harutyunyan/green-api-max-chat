import { combineReducers } from '@reduxjs/toolkit';

import type { Reducer, UnknownAction } from '@reduxjs/toolkit';

import { chatReducers } from '@features/chat';
import { onLogout, authReducer } from '@features/sign-in';

import { apiService } from '@app/api/apiService';

export const allReducers = {
  auth: authReducer,
  ...chatReducers,
  [apiService.reducerPath]: apiService.reducer,
};

const appReducer = combineReducers(allReducers);

export type RootState = ReturnType<typeof appReducer>;

export const rootReducer: Reducer<RootState, UnknownAction, Partial<RootState>> = (state, action) =>
  appReducer(onLogout.match(action) ? undefined : state, action);
