import type { UserSelect, OrganizationSelect } from '../db/schema';

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  organizationId?: string;
  iat: number;
  exp: number;
}

export interface Env {
  Variables: {
    user: UserSelect;
    organization?: OrganizationSelect;
    organizationId?: string;
    organizationType?: 'work' | 'family';
  };
}
