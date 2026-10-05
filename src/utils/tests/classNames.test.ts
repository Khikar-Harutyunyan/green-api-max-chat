import { classNames } from '@app/utils';

describe('classNames', () => {
  it('joins the truthy names and skips the rest', () => {
    expect(classNames('a', false, null, undefined, '', 'b')).toBe('a b');
  });
});
