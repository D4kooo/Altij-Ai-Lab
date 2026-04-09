export function getOrganizationName(fallback: string | null = null): string | null {
  try {
    const onboarding = localStorage.getItem('citizen_onboarding');
    if (onboarding) {
      const data = JSON.parse(onboarding);
      return data.organizationName || fallback;
    }
  } catch {
    // ignore
  }
  return fallback;
}
