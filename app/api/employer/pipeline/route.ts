import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toISO(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value as any).toISOString();
}

/**
 * GET /api/employer/pipeline?stage=Applied
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub || payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const employerId = payload.sub as string;

    const { searchParams } = new URL(req.url);
    const stageRaw = searchParams.get("stage")?.trim() || "";

    // Normalize "Applied" -> "applied", "In Review" -> "in_review"
    const stageLower = stageRaw.toLowerCase();
    const stageUnderscore = stageLower.replace(/\s+/g, "_");

    // ✅ status is enum, must cast to text for ILIKE
    const statusText = sql`${applications.status}::text`;

    const whereStage =
      stageRaw.length > 0
        ? or(
            // try common matches
            ilike(statusText, stageLower),
            ilike(statusText, stageUnderscore),
            // step is varchar in your schema; ILIKE is safe
            ilike(applications.step, `%${stageRaw}%`),
            ilike(applications.step, `%${stageLower}%`)
          )
        : undefined;

    const rows = await db
      .select({
        applicationId: applications.id,
        status: applications.status,
        step: applications.step,
        updatedAt: applications.updatedAt,
        jobId: jobs.id,
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        candidateId: users.id,
        candidateName: users.name,
        candidateEmail: users.email,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(applications.candidateId, users.id))
      .where(
        whereStage
          ? and(eq(jobs.employerId, employerId), whereStage)
          : eq(jobs.employerId, employerId)
      )
      .orderBy(desc(applications.updatedAt))
      .limit(200);

    const items = rows.map((r) => ({
      applicationId: r.applicationId,
      status: r.status, // enum value, fine to return
      step: r.step ?? null,
      updatedAt: toISO(r.updatedAt),
      job: {
        id: r.jobId,
        title: r.jobTitle,
        location: r.jobLocation ?? "",
      },
      candidate: {
        id: r.candidateId,
        name: r.candidateName ?? null,
        email: r.candidateEmail,
      },
    }));

    return NextResponse.json({ items, stage: stageRaw || null }, { status: 200 });
  } catch (e) {
    console.error("[/api/employer/pipeline] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
