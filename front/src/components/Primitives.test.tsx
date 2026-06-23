import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Primitives';

describe('Switch', () => {
  it('renderiza su estado on/off vía aria-checked y dispara onClick', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Switch on={false} onClick={onClick} />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(switchEl);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Switch on={true} onClick={onClick} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
