export { SignInPage } from './pages/SignInPage';

export {
  onLogin,
  signIn,
  onLogout,
  signOut,
  selectCredentials,
} from './reducers/auth';
export { default as authReducer } from './reducers/auth';

export type { IAuth, ILoginPayload } from './reducers/auth';
