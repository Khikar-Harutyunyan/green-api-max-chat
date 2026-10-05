import { describeInstanceState } from '../describeInstanceState';

import type { StateInstanceResponse } from '@app/api/types';

describe('describeInstanceState', () => {
  it('tells the user to scan the QR code when not authorized', () => {
    expect(describeInstanceState('notAuthorized')).toMatch(/Отсканируйте QR-код/);
  });

  it('reports an unknown state verbatim', () => {
    const unknown = 'yellowCard' as StateInstanceResponse['stateInstance'];
    expect(describeInstanceState(unknown)).toBe('Состояние инстанса: yellowCard');
  });
});
