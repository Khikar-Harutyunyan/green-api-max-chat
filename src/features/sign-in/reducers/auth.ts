import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';

import { logger } from '@app/services/logger';
import { apiService } from '@app/api/apiService';
import { getStateInstance } from '@app/api/greenApi';
import { loadChatData, saveCredentials, clearCredentials } from '@app/services/storage';

import { createAppAsyncThunk } from '@app/store/createAppAsyncThunk';

import type { Credentials } from '@app/api/types';
import type { AppThunk, RootState } from '@app/store';
import type { StoredChatData } from '@app/services/storage';
import { describeSignInError } from '@features/sign-in/utils/describeSignInError';
import { describeInstanceState } from '@features/sign-in/utils/describeInstanceState';

export interface ILoginPayload extends StoredChatData {
  credentials: Credentials;
}

export interface IAuth {
  credentials: Credentials | null;
}

const initialState: IAuth = {
  credentials: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    onLogin(state, { payload }: PayloadAction<ILoginPayload>) {
      state.credentials = payload.credentials;
    },
    onLogout(state) {
      state.credentials = null;
    },
  },
});

const { actions, reducer } = authSlice;

export const { onLogin, onLogout } = actions;

export const signIn = createAppAsyncThunk(
  'auth/signIn',
  async (credentials: Credentials, { dispatch, rejectWithValue }) => {
    // The client directly, not the API service: that reads credentials from the
    // store, and these are not in it until they are proven to work.
    try {
      const { stateInstance } = await getStateInstance(credentials);
      if (stateInstance !== 'authorized') return rejectWithValue(describeInstanceState(stateInstance));
    } catch (error) {
      logger.warn('Sign-in failed', error);
      return rejectWithValue(describeSignInError(error));
    }

    saveCredentials(credentials);
    dispatch(onLogin({ credentials, ...loadChatData(credentials.idInstance) }));
    // Cached as just checked: getStateInstance allows one call per second, and the
    // chat page would otherwise ask again straight away and get a 429.
    void dispatch(apiService.util.upsertQueryData('getStateInstance', undefined, 'authorized'));
  },
);

export const signOut = (): AppThunk => (dispatch) => {
  clearCredentials();
  dispatch(onLogout());
  // The root reducer empties the cache too; this also clears the API middleware's own bookkeeping.
  dispatch(apiService.util.resetApiState());
};

export const selectCredentials = (state: RootState) => state.auth.credentials;

export default reducer;
