import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="msg" />);
    const ta = screen.getByPlaceholderText('msg');
    expect(ta.tagName).toBe('TEXTAREA');
  });

  it('applies base classes and merges className', () => {
    render(<Textarea className="custom" data-testid="t" />);
    const ta = screen.getByTestId('t');
    expect(ta).toHaveClass('min-h-[60px]', 'custom');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('calls onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hi');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('hi');
  });

  it('can be disabled', () => {
    render(<Textarea disabled data-testid="t" />);
    expect(screen.getByTestId('t')).toBeDisabled();
  });

  it('has displayName', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});
