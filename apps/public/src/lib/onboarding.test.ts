import { describe, it, expect, beforeEach } from 'vitest';
import { getOrganizationName } from './onboarding';

describe('getOrganizationName', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no onboarding data is stored', () => {
    expect(getOrganizationName()).toBeNull();
  });

  it('returns the fallback when no onboarding data is stored', () => {
    expect(getOrganizationName('Acme')).toBe('Acme');
  });

  it('returns the stored organization name', () => {
    localStorage.setItem('citizen_onboarding', JSON.stringify({ organizationName: 'Data Ring' }));
    expect(getOrganizationName()).toBe('Data Ring');
  });

  it('returns fallback when stored data has no organization name', () => {
    localStorage.setItem('citizen_onboarding', JSON.stringify({ otherField: 'x' }));
    expect(getOrganizationName('Default')).toBe('Default');
  });

  it('returns fallback when stored JSON is invalid', () => {
    localStorage.setItem('citizen_onboarding', 'not json');
    expect(getOrganizationName('Safe')).toBe('Safe');
  });
});
