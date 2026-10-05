import { Navigate } from 'react-router-dom';

import type { RouteObject } from 'react-router-dom';

import { ChatPage } from '@features/chat';
import { SignInPage } from '@features/sign-in';

import { GuestOnly } from '@app/router/components/GuestOnly';
import { RequireAuth } from '@app/router/components/RequireAuth';

import { PATHS } from '@app/router/constants/paths';

export const routes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ path: PATHS.chats, element: <ChatPage /> }],
  },
  {
    element: <GuestOnly />,
    children: [{ path: PATHS.signIn, element: <SignInPage /> }],
  },
  { path: '*', element: <Navigate to={PATHS.chats} replace /> },
];
