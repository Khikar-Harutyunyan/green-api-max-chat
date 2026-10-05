import { logger } from '../logger';

describe('logger', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(logger.warn).mockRestore();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('prefixes the message and passes the error on', () => {
    const error = new Error('boom');
    logger.warn('Something broke', error);
    expect(warn).toHaveBeenCalledWith('[max-chat] Something broke', error);
  });

  it('passes nothing extra when there is no error', () => {
    logger.warn('Something broke');
    expect(warn.mock.calls[0]).toEqual(['[max-chat] Something broke']);
  });
});
