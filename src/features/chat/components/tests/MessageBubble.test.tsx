import { render, screen } from '@app/test-utils';

import { MessageBubble } from '../MessageBubble';

import type { IMessageBubble } from '../MessageBubble';

const OUTGOING: IMessageBubble = {
  direction: 'out',
  status: 'delivered',
  timestamp: 1790860382,
  text: 'привет\nвторая строка',
};

describe('MessageBubble', () => {
  it('renders the text with its time', () => {
    render(<MessageBubble {...OUTGOING} />);
    expect(screen.getByText(/привет/)).toBeInTheDocument();
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('shows the delivery status on outgoing messages', () => {
    render(<MessageBubble {...OUTGOING} />);
    expect(screen.getByLabelText('Доставлено')).toBeInTheDocument();
  });

  it('shows no delivery status on incoming messages', () => {
    render(<MessageBubble {...OUTGOING} direction="in" status="read" />);
    expect(screen.queryByLabelText('Прочитано')).not.toBeInTheDocument();
  });
});
