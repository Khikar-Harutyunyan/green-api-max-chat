import { createRef } from 'react';
import { render, screen } from '@app/test-utils';
import userEvent from '@testing-library/user-event';

import { Input } from '../Input';

describe('Input', () => {
  it('passes input attributes through', () => {
    render(<Input placeholder="79001234567" inputMode="tel" />);
    expect(screen.getByPlaceholderText('79001234567')).toHaveAttribute('inputmode', 'tel');
  });

  it('reports typed text through onChange', async () => {
    const onChange = jest.fn();
    render(<Input placeholder="phone" onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('phone'), '7');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards its ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="phone" />);
    expect(ref.current).toBe(screen.getByPlaceholderText('phone'));
  });
});
