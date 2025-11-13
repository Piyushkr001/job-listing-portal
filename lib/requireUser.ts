// lib/requireUser.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth"; // already in your repo

type GuardOk = { user: typeof users.$inferSelect };
type GuardFail = { error: NextResponse };
export type Guard = GuardOk | GuardFail;

export async function requireUser(req: NextRequest): Promise<Guard> {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    const payload = await verifyJwt(token); // expects { userId: string } inside
    const userId = (payload as any)?.userId;
    if (!userId) {
      return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!row) {
      return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    return { user: row };
  } catch (e) {
    console.error("requireUser error:", e);
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
}
