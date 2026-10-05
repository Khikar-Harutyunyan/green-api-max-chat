import { Outlet, Navigate, useLocation } from 'react-router-dom';

import type { FC } from 'react';
import type { Location } from 'react-router-dom';

import { selectCredentials } from '@features/sign-in';

import { useAppSelector } from '@app/hooks/redux';

import { PATHS } from '@app/router/constants/paths';

interface RedirectState {
  from?: Location;
}

export const GuestOnly: FC = () => {
  const location = useLocation();
  const credentials = useAppSelector(selectCredentials);

  if (credentials) {
    const from = (location.state as RedirectState | null)?.from;
    return <Navigate to={from ?? PATHS.chats} replace />;
  }
  return <Outlet />;
};
