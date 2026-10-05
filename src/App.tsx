import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from '@app/router';

export const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
