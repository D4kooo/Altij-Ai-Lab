import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="name" />);
    expect(screen.getByPlaceholderText('name')).toBeInTheDocument();
  });

  it('applies type attribute', () => {
    render(<Input type="email" data-testid="i" />);
    expect(screen.getByTestId('i')).toHaveAttribute('type', 'email');
  });

  it('merges custom className', () => {
    render(<Input className="zzz" data-testid="i" />);
    expect(screen.getByTestId('i')).toHaveClass('zzz');
    expect(screen.getByTestId('i')).toHaveClass('border-2');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('calls onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('abc');
  });

  it('can be disabled', () => {
    render(<Input disabled data-testid="i" />);
    expect(screen.getByTestId('i')).toBeDisabled();
  });

  it('has displayName', () => {
    expect(Input.displayName).toBe('Input');
  });
});
