import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('applies default variant and size classes', () => {
    render(<Button>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-primary');
    expect(btn).toHaveClass('h-9');
  });

  it.each([
    ['destructive', 'bg-destructive'],
    ['outline', 'border'],
    ['secondary', 'bg-primary/[0.04]'],
    ['ghost', 'hover:bg-primary/[0.04]'],
    ['link', 'underline-offset-4'],
  ] as const)('applies %s variant', (variant, cls) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole('button')).toHaveClass(cls);
  });

  it.each([
    ['sm', 'h-8'],
    ['lg', 'h-11'],
    ['icon', 'w-9'],
  ] as const)('applies %s size', (size, cls) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole('button')).toHaveClass(cls);
  });

  it('merges custom className', () => {
    render(<Button className="foo-bar">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('foo-bar');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>x</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>x</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as child via asChild prop', () => {
    render(
      <Button asChild>
        <a href="/foo">link</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'link' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/foo');
    expect(link).toHaveClass('bg-primary');
  });

  it('has displayName set', () => {
    expect(Button.displayName).toBe('Button');
  });
});
