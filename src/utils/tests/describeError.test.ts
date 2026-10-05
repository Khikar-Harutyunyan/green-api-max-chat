import { describeError } from '@app/utils';

import { GreenApiError } from '@app/api/GreenApiError';

const quotaError = (body: unknown) => new GreenApiError('x', 466, JSON.stringify(body));

describe('describeError', () => {
  afterEach(() => jest.restoreAllMocks());

  it('explains rejected credentials', () => {
    expect(describeError(new GreenApiError('x', 401, ''))).toBe(
      'Неверные idInstance или apiTokenInstance',
    );
  });

  it('explains an instance that is not on this apiUrl', () => {
    expect(describeError(new GreenApiError('x', 403, ''))).toBe(
      'Инстанс не найден по этому apiUrl — проверьте apiUrl и idInstance',
    );
  });

  it('explains the Developer tariff chat limit', () => {
    const quotaData = { used: 3, total: 3, method: 'correspondents', status: 'CORRESPONDENTS_QUOTA_EXCEEDED' };
    expect(describeError(quotaError({ quotaData }))).toMatch(/лимит в 3 чата/);
  });

  it('names the method whose monthly quota is spent', () => {
    const invokeStatus = { used: 100, total: 100, method: 'checkAccount', status: 'QUOTE_EXCEEDED' };
    expect(describeError(quotaError({ invokeStatus }))).toBe(
      'Исчерпан месячный лимит метода checkAccount (100 из 100)',
    );
  });

  it('still explains a 466 whose body cannot be read', () => {
    expect(describeError(new GreenApiError('x', 466, 'not json'))).toBe(
      'Исчерпан месячный лимит тарифа GREEN-API',
    );
  });

  it('asks to retry a call throttled to one per second', () => {
    expect(describeError(new GreenApiError('x', 429, ''))).toBe(
      'Слишком много запросов к GREEN-API, попробуйте через секунду',
    );
  });

  it('explains an error in the plain form RTK Query stores', () => {
    expect(describeError(new GreenApiError('x', 401, '').serialize())).toBe(
      'Неверные idInstance или apiTokenInstance',
    );
  });

  it('explains the checkAccount rate limit', () => {
    expect(describeError(new GreenApiError('x', 469, ''))).toMatch(/Слишком много проверок/);
  });

  it('says GREEN-API does not answer while the browser is online', () => {
    expect(describeError(new GreenApiError('x', 0, ''))).toBe('GREEN-API не отвечает');
  });

  it('says the internet is gone while the browser is offline', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(describeError(new GreenApiError('x', 0, ''))).toBe('Нет подключения к интернету');
  });

  it('falls back to the HTTP status for other API errors', () => {
    expect(describeError(new GreenApiError('x', 500, ''))).toBe('Ошибка GREEN-API (HTTP 500)');
  });

  it('uses the message of a plain Error', () => {
    expect(describeError(new Error('Своё сообщение'))).toBe('Своё сообщение');
  });

  it('handles values that are not errors', () => {
    expect(describeError('boom')).toBe('Неизвестная ошибка');
  });
});
