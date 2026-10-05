import { getChatPreview } from '../getChatPreview';

describe('getChatPreview', () => {
  it('prefixes own messages', () => {
    expect(getChatPreview('привет', 'out')).toBe('Вы: привет');
  });

  it('shows incoming messages as is', () => {
    expect(getChatPreview('привет', 'in')).toBe('привет');
  });

  it('says so when there are no messages', () => {
    expect(getChatPreview()).toBe('Нет сообщений');
  });
});
