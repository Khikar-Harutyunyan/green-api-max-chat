import { render, screen } from '@app/test-utils';

import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders the trigger with its label beside it', () => {
    render(
      <Tooltip label="Доставлено">
        <span>✓✓</span>
      </Tooltip>,
    );
    expect(screen.getByText('✓✓')).toBeInTheDocument();
    expect(screen.getByText('Доставлено')).toHaveClass('label', 'center');
  });

  it('keeps the label away from screen readers, which read the trigger instead', () => {
    render(
      <Tooltip label="Доставлено">
        <span role="img" aria-label="Доставлено">
          ✓✓
        </span>
      </Tooltip>,
    );
    expect(screen.getByText('Доставлено')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByLabelText('Доставлено')).toHaveLength(1);
  });

  it('can line the label up with the end of the trigger', () => {
    render(
      <Tooltip label="Не отправлено" align="end">
        <span>!</span>
      </Tooltip>,
    );
    expect(screen.getByText('Не отправлено')).toHaveClass('end');
  });
});
