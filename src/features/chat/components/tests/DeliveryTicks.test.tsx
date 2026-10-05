import { render, screen } from '@app/test-utils';

import { DeliveryTicks } from '../DeliveryTicks';

describe('DeliveryTicks', () => {
  it('shows a single tick once sent', () => {
    render(<DeliveryTicks status="sent" />);
    expect(screen.getByLabelText('Отправлено')).toHaveTextContent('✓');
  });

  it('shows two ticks once read', () => {
    render(<DeliveryTicks status="read" />);
    expect(screen.getByLabelText('Прочитано')).toHaveTextContent('✓✓');
  });

  it('flags a failed send', () => {
    render(<DeliveryTicks status="failed" />);
    expect(screen.getByLabelText('Не отправлено')).toHaveTextContent('!');
  });
});
