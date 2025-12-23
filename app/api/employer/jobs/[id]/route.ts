// app/api/employer/jobs/[id]/route.ts

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { jobs, jobStatusEnum } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

// ✅ Option A: only the enum values in DB
type JobStatus = (typeof jobStatusEnum.enumValues)[number];

function getBearer(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function authEmployer(req: Request) {
  const token = getBearer(req);
  if (!token) return { ok: false as const, status: 401, message: "Unauthorized" };

  const payload = verifyJwt(token);
  if (!payload?.sub) return { ok: false as const, status: 401, message: "Unauthorized" };
  if (payload.role !== "employer") return { ok: false as const, status: 403, message: "Forbidden" };

  return { ok: true as const, employerId: payload.sub as string };
}

/* ---------- GET /api/employer/jobs/:id (job detail) ---------- */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authEmployer(req);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const { id } = await ctx.params;

    const [row] = await db
      .select({
        id: jobs.id,
        employerId: jobs.employerId,
        title: jobs.title,
        slug: jobs.slug,
        description: jobs.description,
        location: jobs.location,
        employmentType: jobs.employmentType,
        remote: jobs.remote,
        status: jobs.status,
        publishedAt: jobs.publishedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.employerId, auth.employerId)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job: row }, { status: 200 });
  } catch (error) {
    console.error("[/api/employer/jobs/[id]] GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/* ---------- PATCH /api/employer/jobs/:id (update) ---------- */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authEmployer(req);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const { id } = await ctx.params;

    const body = (await req.json().catch(() => null)) as
      | Partial<{
          title: string;
          slug: string;
          description: string;
          location: string;
          employmentType: string;
          remote: boolean;
          status: JobStatus;
          publishedAt: string | null; // ISO or null
        }>
      | null;

    if (!body) {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    // ✅ Build updates safely (no "paused", no type mismatch)
    const updates: Partial<typeof jobs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.slug === "string") updates.slug = body.slug;
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.location === "string") updates.location = body.location;
    if (typeof body.employmentType === "string") updates.employmentType = body.employmentType;
    if (typeof body.remote === "boolean") updates.remote = body.remote;

    if (body.status) updates.status = body.status;

    if (body.publishedAt !== undefined) {
      updates.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }

    const updated = await db
      .update(jobs)
      .set(updates)
      .where(and(eq(jobs.id, id), eq(jobs.employerId, auth.employerId)))
      .returning({ id: jobs.id });

    if (!updated.length) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Job updated" }, { status: 200 });
  } catch (error) {
    console.error("[/api/employer/jobs/[id]] PATCH error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
