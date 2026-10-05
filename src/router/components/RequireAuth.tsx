import { Outlet, Navigate, useLocation } from 'react-router-dom';

import type { FC } from 'react';

import { selectCredentials } from '@features/sign-in';

import { useAppSelector } from '@app/hooks/redux';

import { PATHS } from '@app/router/constants/paths';

export const RequireAuth: FC = () => {
  const location = useLocation();
  const credentials = useAppSelector(selectCredentials);

  if (!credentials) return <Navigate to={PATHS.signIn} state={{ from: location }} replace />;
  return <Outlet />;
};
