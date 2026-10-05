import { CREDENTIALS, signedInState } from '@app/test-utils';

import { onLogout } from '@features/sign-in';
import { rootReducer, allReducers } from '../rootReducer';


describe('rootReducer', () => {
  it('puts every feature slice in the store', () => {
    expect(Object.keys(allReducers).sort()).toEqual(['api', 'auth', 'chats', 'messages']);
  });

  it('resets every slice on logout', () => {
    const signedIn = signedInState({
      chats: {
        chats: [{ chatId: '111', phoneNumber: '', name: 'Arpi' }],
        activeChatId: '111',
        isChatOpen: true,
      },
    });
    expect(signedIn.auth.credentials).toEqual(CREDENTIALS);

    expect(rootReducer(signedIn, onLogout())).toEqual(rootReducer(undefined, { type: '@@init' }));
  });

  it('passes every other action on to the slices', () => {
    const state = signedInState();
    expect(rootReducer(state, { type: 'unrelated' })).toBe(state);
  });
});
