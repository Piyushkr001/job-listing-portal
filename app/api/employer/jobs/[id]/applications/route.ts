// app/api/employer/jobs/[id]/applications/route.ts

import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/config/db";
import { jobs, applications, users } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

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

/* ---------- GET /api/employer/jobs/:id/applications ---------- */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authEmployer(req);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

    const { id } = await ctx.params;

    // Ensure job belongs to employer
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.employerId, auth.employerId)))
      .limit(1);

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Applications list (adjust selected fields to your schema)
    const rows = await db
      .select({
        applicationId: applications.id,
        status: applications.status,
        createdAt: applications.createdAt,
        candidateId: applications.candidateId,

        candidateName: users.name,
        candidateEmail: users.email,
      })
      .from(applications)
      .innerJoin(users, eq(applications.candidateId, users.id))
      .where(eq(applications.jobId, id))
      .orderBy(desc(applications.createdAt));

    return NextResponse.json({ applications: rows }, { status: 200 });
  } catch (error) {
    console.error("[/api/employer/jobs/[id]/applications] GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
