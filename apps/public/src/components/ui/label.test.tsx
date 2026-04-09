import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders children', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toHaveClass('font-mono', 'uppercase');
  });

  it('merges custom className', () => {
    render(<Label className="my-lbl">Email</Label>);
    expect(screen.getByText('Email')).toHaveClass('my-lbl');
  });

  it('associates with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>x</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
