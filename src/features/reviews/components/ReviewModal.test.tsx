import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReviewModal from './ReviewModal';

describe('ReviewModal', () => {
  it('submits received as the default receipt status', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        revieweeName="the Seller"
      />,
    );

    expect(
      screen.getByRole('radio', { name: /^Received$/i }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /^Not received$/i }),
    ).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: /Rate 5 stars/i }));
    await user.click(
      screen.getByRole('button', { name: /Submit Review/i }),
    );

    expect(onSubmit).toHaveBeenCalledWith(5, '', 'received');
  });

  it('lets the buyer report that the item was not received', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole('radio', { name: /^Not received$/i }),
    );
    await user.click(screen.getByRole('button', { name: /Rate 4 stars/i }));
    await user.type(
      screen.getByPlaceholderText(/How was the item/i),
      'Seller marked it delivered, but it never arrived.',
    );
    await user.click(
      screen.getByRole('button', { name: /Submit Review/i }),
    );

    expect(
      screen.getByRole('radio', { name: /^Not received$/i }),
    ).toBeChecked();
    expect(onSubmit).toHaveBeenCalledWith(
      4,
      'Seller marked it delivered, but it never arrived.',
      'not_received',
    );
  });

  it('restores received as the default when reopened', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <ReviewModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.click(
      screen.getByRole('radio', { name: /^Not received$/i }),
    );
    rerender(
      <ReviewModal isOpen={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    rerender(
      <ReviewModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    expect(
      screen.getByRole('radio', { name: /^Received$/i }),
    ).toBeChecked();
  });
});
