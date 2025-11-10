// lib/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserRole } from "@/config/schema";

// ── PASSWORD UTILS ──────────────────────────────

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT UTILS ───────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d"; // adjust as you like

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  provider: "credentials" | "google";
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
