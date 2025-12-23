import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { applicationEvents, applications, jobs, users } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toISO(value: unknown): string {
  if (!value) return new Date(0).toISOString();

  const d = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(d.getTime())) return new Date(0).toISOString();

  return d.toISOString();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: applicationId } = await ctx.params;

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const employerId = payload.sub as string;

    // Ensure employer owns the job for this application
    const owns = await db
      .select({ id: applications.id })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(eq(applications.id, applicationId), eq(jobs.employerId, employerId)))
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
      .where(eq(applicationEvents.applicationId, applicationId))
      // ✅ Timeline usually reads best oldest -> newest
      .orderBy(asc(applicationEvents.createdAt))
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
    console.error("[/api/employer/applications/[id]/events] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
