import { describe, it, expect } from 'vitest';
import { getScoreLabel, getPointLabel } from './CGUAnalyzer.utils';

describe('getScoreLabel', () => {
  it('returns "Bon" for scores >= 70', () => {
    expect(getScoreLabel(70)).toBe('Bon');
    expect(getScoreLabel(85)).toBe('Bon');
    expect(getScoreLabel(100)).toBe('Bon');
  });

  it('returns "Moyen" for scores 50-69', () => {
    expect(getScoreLabel(50)).toBe('Moyen');
    expect(getScoreLabel(60)).toBe('Moyen');
    expect(getScoreLabel(69)).toBe('Moyen');
  });

  it('returns "Préoccupant" for scores < 50', () => {
    expect(getScoreLabel(0)).toBe('Préoccupant');
    expect(getScoreLabel(49)).toBe('Préoccupant');
    expect(getScoreLabel(-10)).toBe('Préoccupant');
  });
});

describe('getPointLabel', () => {
  it('maps each type to its French label', () => {
    expect(getPointLabel('good')).toBe('OK');
    expect(getPointLabel('warning')).toBe('Attention');
    expect(getPointLabel('danger')).toBe('Alerte');
    expect(getPointLabel('info')).toBe('Info');
  });
});
