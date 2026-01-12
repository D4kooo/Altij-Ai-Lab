import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { db, schema } from '../db';
import { eq, and, gt } from 'drizzle-orm';

// Generate UUID for PostgreSQL
function generateUUID(): string {
  return crypto.randomUUID();
}
import type { JWTPayload } from '../types';
import type { UserSelect } from '../db/schema';

// SECURITY: JWT_SECRET must be configured in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET environment variable must be set in production');
  }
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using insecure default for development only.');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

// Use Bun's native password hashing
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return Bun.password.verify(password, hashedPassword);
}

export async function generateAccessToken(user: UserSelect): Promise<string> {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = nanoid(64);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await db.insert(schema.refreshTokens).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<UserSelect | null> {
  const [refreshToken] = await db
    .select()
    .from(schema.refreshTokens)
    .where(
      and(
        eq(schema.refreshTokens.token, token),
        gt(schema.refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!refreshToken) {
    return null;
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, refreshToken.userId))
    .limit(1);

  return user || null;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
}

export async function getUserById(id: string): Promise<UserSelect | null> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  return user || null;
}

export async function getUserByEmail(email: string): Promise<UserSelect | null> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
}): Promise<UserSelect> {
  const passwordHash = await hashPassword(data.password);

  const [user] = await db.insert(schema.users).values({
    email: data.email.toLowerCase(),
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role || 'user',
  }).returning();

  if (!user) throw new Error('Failed to create user');

  return user;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, userId));
}
