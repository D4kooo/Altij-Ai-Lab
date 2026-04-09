import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>x</Badge>);
    expect(screen.getByText('x')).toHaveClass('bg-primary');
  });

  it.each([
    ['secondary', 'bg-primary/[0.04]'],
    ['destructive', 'bg-red-50'],
    ['outline', 'border-primary/[0.08]'],
    ['success', 'bg-emerald-50'],
    ['warning', 'bg-amber-50'],
    ['info', 'bg-sky-50'],
  ] as const)('applies %s variant', (variant, cls) => {
    render(<Badge variant={variant}>x</Badge>);
    expect(screen.getByText('x')).toHaveClass(cls);
  });

  it('merges custom className', () => {
    render(<Badge className="custom-xyz">x</Badge>);
    expect(screen.getByText('x')).toHaveClass('custom-xyz');
  });

  it('forwards HTML attributes', () => {
    render(<Badge data-testid="b" id="my-badge">x</Badge>);
    expect(screen.getByTestId('b')).toHaveAttribute('id', 'my-badge');
  });
});
