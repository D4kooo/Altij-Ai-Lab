import type { Context } from 'hono';
import type { UserSelect, OrganizationSelect } from '../db/schema';

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  organizationId?: string;
  iat: number;
  exp: number;
}

export interface AuthContext extends Context {
  user: UserSelect;
  organization?: OrganizationSelect;
}

// Type pour l'organisation avec infos minimales dans le contexte
export interface OrganizationContext {
  id: string;
  type: 'work' | 'family';
  name: string;
}

export interface Env {
  Variables: {
    user: UserSelect;
    organization?: OrganizationSelect;
    organizationId?: string;
    organizationType?: 'work' | 'family';
  };
}
