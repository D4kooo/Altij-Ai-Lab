import type { Context } from 'hono';
import type { UserSelect } from '../db/schema';

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

export interface AuthContext extends Context {
  user: UserSelect;
}

export interface Env {
  Variables: {
    user: UserSelect;
  };
}
