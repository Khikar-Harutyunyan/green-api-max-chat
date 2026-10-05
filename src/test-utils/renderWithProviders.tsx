import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { render, renderHook } from '@testing-library/react';

import type { FC, ReactElement, PropsWithChildren } from 'react';
import type { RenderOptions, RenderHookOptions } from '@testing-library/react';

import { setupStore } from '@app/store';

import type { AppStore, RootState } from '@app/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries' | 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export const renderWithProviders = (
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState), ...options }: ExtendedRenderOptions = {},
) => ({
  store,
  ...render(<Provider store={store}>{ui}</Provider>, { wrapper: StrictMode, ...options }),
});

interface ExtendedRenderHookOptions<Props>
  extends Omit<RenderHookOptions<Props>, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export const renderHookWithProviders = <Result, Props>(
  hook: (initialProps: Props) => Result,
  {
    preloadedState,
    store = setupStore(preloadedState),
    ...options
  }: ExtendedRenderHookOptions<Props> = {},
) => {
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...renderHook(hook, { wrapper: Wrapper, ...options }) };
};

export const renderHookStrict = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>,
) => renderHook(hook, { wrapper: StrictMode, ...options });
