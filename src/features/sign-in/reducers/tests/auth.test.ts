import {
  json,
  CREDENTIALS,
  signedInState,
  INITIAL_STATE,
  installApiMock
} from '@app/test-utils';

import authReducer, {
  signIn,
  onLogin,
  signOut,
  onLogout,
  selectCredentials
} from '../auth';

import { setupStore } from '@app/store';
import { apiService } from '@app/api/apiService';

beforeEach(() => {
  localStorage.clear();
});

describe('auth', () => {
  it('stores credentials on login', () => {
    const signedIn = authReducer(
      INITIAL_STATE.auth,
      onLogin({ credentials: CREDENTIALS, chats: [], activeChatId: null, byChat: {} }),
    );
    expect(signedIn.credentials).toEqual(CREDENTIALS);
  });

  it('forgets credentials on logout', () => {
    expect(authReducer(signedInState().auth, onLogout()).credentials).toBeNull();
  });

  it('selects the credentials', () => {
    expect(selectCredentials(signedInState())).toEqual(CREDENTIALS);
  });
});

describe('signIn', () => {
  it('signs into an authorized instance and restores its saved chats', async () => {
    installApiMock();
    localStorage.setItem(
      'max-chat.chats.310022752991',
      JSON.stringify([{ chatId: '111', phoneNumber: '', name: 'Первый' }]),
    );
    const store = setupStore();

    await store.dispatch(signIn(CREDENTIALS));

    expect(store.getState().auth.credentials).toEqual(CREDENTIALS);
    expect(store.getState().chats.activeChatId).toBe('111');
    expect(localStorage.getItem('max-chat.credentials')).not.toBeNull();
  });

  it('remembers the instance state it checked, so the chat page does not ask again', async () => {
    // getStateInstance allows one call per second; asking again at once came back 429.
    const api = installApiMock();
    const store = setupStore();

    await store.dispatch(signIn(CREDENTIALS));
    await store.dispatch(apiService.endpoints.getStateInstance.initiate(undefined, { subscribe: false }));

    expect(apiService.endpoints.getStateInstance.select()(store.getState()).data).toBe('authorized');
    expect(api.methodCalls).toEqual(['getStateInstance']);
  });

  it('refuses an instance that is not authorized', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve(json({ stateInstance: 'starting' })),
    ) as unknown as typeof fetch;
    const store = setupStore();

    const result = await store.dispatch(signIn(CREDENTIALS));

    expect(result.payload).toBe('Инстанс запускается. Попробуйте через минуту.');
    expect(store.getState().auth.credentials).toBeNull();
  });
});

describe('signOut', () => {
  it('clears the stored credentials and signs out', () => {
    localStorage.setItem('max-chat.credentials', JSON.stringify(CREDENTIALS));
    const store = setupStore(signedInState());

    store.dispatch(signOut());

    expect(store.getState().auth.credentials).toBeNull();
    expect(localStorage.getItem('max-chat.credentials')).toBeNull();
  });

  it('drops what the API cache held for the instance', async () => {
    installApiMock();
    const store = setupStore();
    await store.dispatch(signIn(CREDENTIALS));

    store.dispatch(signOut());

    expect(apiService.endpoints.getStateInstance.select()(store.getState()).data).toBeUndefined();
  });
});
