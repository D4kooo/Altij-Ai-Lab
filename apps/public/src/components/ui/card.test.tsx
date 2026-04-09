import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders full card composition', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Foot</CardFooter>
      </Card>
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Body');
    expect(screen.getByTestId('footer')).toHaveTextContent('Foot');
  });

  it('Card applies base + custom className', () => {
    render(<Card className="extra" data-testid="c" />);
    const el = screen.getByTestId('c');
    expect(el).toHaveClass('rounded-2xl');
    expect(el).toHaveClass('extra');
  });

  it('CardTitle renders as h3', () => {
    render(<CardTitle>T</CardTitle>);
    const h = screen.getByRole('heading', { name: 'T' });
    expect(h.tagName).toBe('H3');
  });

  it('CardDescription renders as p', () => {
    render(<CardDescription>D</CardDescription>);
    expect(screen.getByText('D').tagName).toBe('P');
  });

  it('CardHeader merges className', () => {
    render(<CardHeader className="x" data-testid="h" />);
    expect(screen.getByTestId('h')).toHaveClass('p-6', 'x');
  });

  it('CardContent merges className', () => {
    render(<CardContent className="x" data-testid="c" />);
    expect(screen.getByTestId('c')).toHaveClass('pt-0', 'x');
  });

  it('CardFooter merges className', () => {
    render(<CardFooter className="x" data-testid="f" />);
    expect(screen.getByTestId('f')).toHaveClass('items-center', 'x');
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('all parts expose displayName', () => {
    expect(Card.displayName).toBe('Card');
    expect(CardHeader.displayName).toBe('CardHeader');
    expect(CardTitle.displayName).toBe('CardTitle');
    expect(CardDescription.displayName).toBe('CardDescription');
    expect(CardContent.displayName).toBe('CardContent');
    expect(CardFooter.displayName).toBe('CardFooter');
  });
});
