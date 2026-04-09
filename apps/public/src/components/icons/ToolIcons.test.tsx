import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ShieldIcon,
  SearchDocIcon,
  AlertIcon,
  DatabaseIcon,
} from '@/components/icons/ToolIcons';

describe('ToolIcons', () => {
  it.each([
    ['ShieldIcon', ShieldIcon],
    ['SearchDocIcon', SearchDocIcon],
    ['AlertIcon', AlertIcon],
    ['DatabaseIcon', DatabaseIcon],
  ])('%s renders an svg with expected size', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('ShieldIcon contains expected paths', () => {
    const { container } = render(<ShieldIcon />);
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
  });

  it('SearchDocIcon contains a circle', () => {
    const { container } = render(<SearchDocIcon />);
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('DatabaseIcon contains an ellipse', () => {
    const { container } = render(<DatabaseIcon />);
    expect(container.querySelector('ellipse')).not.toBeNull();
  });
});
