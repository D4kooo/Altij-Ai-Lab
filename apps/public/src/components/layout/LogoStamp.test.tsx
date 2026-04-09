import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { LogoStamp } from '@/components/layout/LogoStamp';

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LogoStamp', () => {
  it('renders a link to home', () => {
    renderWithRouter(<LogoStamp />);
    const link = screen.getByRole('link', { name: /Retour à l'accueil Dataring/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders both logo images with alt text', () => {
    renderWithRouter(<LogoStamp />);
    const imgs = screen.getAllByAltText('Dataring');
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute('src', '/assets/logo-dataring-black.png');
    expect(imgs[1]).toHaveAttribute('src', '/assets/logo-dataring.png');
  });
});
