import { describe, it, expect } from 'vitest';
import {
  formatFrenchDate,
  getLetterTemplate,
  generateLetter,
  type GDPRFormData,
} from './GDPRGenerator.utils';

const baseForm: GDPRFormData = {
  companyName: 'Acme',
  companyEmail: 'dpo@acme.com',
  userName: 'Jean Dupont',
  userEmail: 'jean@example.com',
  additionalInfo: '',
};

describe('formatFrenchDate', () => {
  it('formats dates in French long form', () => {
    const d = new Date('2024-05-10T12:00:00Z');
    const result = formatFrenchDate(d);
    // Contains month name in French
    expect(result).toMatch(/mai/);
    expect(result).toMatch(/2024/);
  });
});

describe('getLetterTemplate', () => {
  it('access template mentions Article 15', () => {
    expect(getLetterTemplate('access', '')).toContain('Article 15');
  });

  it('rectification template injects additional info', () => {
    const result = getLetterTemplate('rectification', 'mon adresse');
    expect(result).toContain('Informations à rectifier');
    expect(result).toContain('mon adresse');
  });

  it('rectification template shows placeholder when no info', () => {
    expect(getLetterTemplate('rectification', '')).toContain('[Précisez');
  });

  it('erasure template mentions Article 17', () => {
    expect(getLetterTemplate('erasure', '')).toContain('Article 17');
  });

  it('portability template mentions Article 20', () => {
    expect(getLetterTemplate('portability', '')).toContain('Article 20');
  });
});

describe('generateLetter', () => {
  it('returns empty string when no right selected', () => {
    expect(generateLetter(null, baseForm)).toBe('');
  });

  it('includes user and company info', () => {
    const result = generateLetter('access', baseForm);
    expect(result).toContain('Jean Dupont');
    expect(result).toContain('jean@example.com');
    expect(result).toContain('Acme');
    expect(result).toContain('dpo@acme.com');
  });

  it('includes a formatted date', () => {
    const result = generateLetter('access', baseForm, new Date('2024-03-15T12:00:00Z'));
    expect(result).toMatch(/mars/);
    expect(result).toMatch(/2024/);
  });

  it('ends with salutations and user name signature', () => {
    const result = generateLetter('access', baseForm);
    expect(result).toContain("l'expression de mes salutations distinguées");
    // userName appears both at top and bottom (signature)
    const matches = result.match(/Jean Dupont/g);
    expect(matches && matches.length).toBeGreaterThanOrEqual(2);
  });

  it('includes different template for each right', () => {
    expect(generateLetter('access', baseForm)).toContain('Article 15');
    expect(generateLetter('rectification', baseForm)).toContain('Article 16');
    expect(generateLetter('erasure', baseForm)).toContain('Article 17');
    expect(generateLetter('portability', baseForm)).toContain('Article 20');
  });

  it('passes additionalInfo through to templates', () => {
    const result = generateLetter(
      'rectification',
      { ...baseForm, additionalInfo: 'Mon nom est incorrect' }
    );
    expect(result).toContain('Mon nom est incorrect');
  });
});
