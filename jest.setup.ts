import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

import { logger } from '@app/services/logger';

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

Object.assign(globalThis, { TextDecoder, TextEncoder });

beforeEach(() => {
  jest.spyOn(logger, 'warn').mockImplementation(() => {}).mockClear();
});
