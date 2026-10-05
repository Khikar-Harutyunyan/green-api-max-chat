import { render, screen, fireEvent } from '@app/test-utils';

import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('shows initials when there is no photo', () => {
    render(<Avatar name="Gegham Xachatryan" url={null} />);
    expect(screen.getByText('GX')).toBeInTheDocument();
  });

  it('shows the photo when there is one', () => {
    const { container } = render(<Avatar name="Arpi" url="https://i.oneme.ru/i?r=abc" />);
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://i.oneme.ru/i?r=abc');
    expect(image).toHaveAttribute('alt', '');
  });

  it('falls back to initials when the photo fails to load', () => {
    const { container } = render(<Avatar name="Arpi Meliqsetyan" url="https://expired" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('reports a photo that fails to load', () => {
    const onError = jest.fn();
    const { container } = render(<Avatar name="Arpi" url="https://expired" onError={onError} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('tries a new URL even after a previous one failed', () => {
    const { container, rerender } = render(<Avatar name="Arpi" url="https://expired" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    rerender(<Avatar name="Gegham" url="https://fresh" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://fresh');
  });
});
