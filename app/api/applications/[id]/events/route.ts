// app/api/applications/[id]/events/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, users } from "@/config/schema";
import { applicationEvents } from "@/config/schema"; // ensure exported
import { and, desc, eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toISO(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value as any).toISOString();
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    // ownership check
    const owns = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.candidateId, candidateId)))
      .limit(1);

    if (!owns[0]) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: applicationEvents.id,
        type: applicationEvents.type,
        fromStatus: applicationEvents.fromStatus,
        toStatus: applicationEvents.toStatus,
        message: applicationEvents.message,
        createdAt: applicationEvents.createdAt,
        actorName: users.name,
        actorCompany: users.companyName,
      })
      .from(applicationEvents)
      .leftJoin(users, eq(applicationEvents.actorId, users.id))
      .where(eq(applicationEvents.applicationId, id))
      .orderBy(desc(applicationEvents.createdAt))
      .limit(100);

    const events = rows.map((r) => ({
      id: r.id,
      type: r.type,
      fromStatus: r.fromStatus ?? null,
      toStatus: r.toStatus ?? null,
      message: r.message ?? "",
      createdAt: toISO(r.createdAt),
      actor:
        r.actorCompany || r.actorName
          ? { name: r.actorName ?? "User", company: r.actorCompany ?? "" }
          : null,
    }));

    return NextResponse.json({ events }, { status: 200 });
  } catch (e) {
    console.error("[/api/applications/[id]/events] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
