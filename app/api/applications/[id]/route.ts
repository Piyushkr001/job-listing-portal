// app/api/applications/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { and, eq } from "drizzle-orm";
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

    // This detail route is for candidates (same as your detail page)
    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    const rows = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
        step: applications.step,
        appliedAt: applications.createdAt,
        nextInterviewAt: applications.nextInterviewAt,

        jobTitle: jobs.title,
        jobLocation: jobs.location,
        jobDescription: jobs.description,

        companyName: users.companyName,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(jobs.employerId, users.id))
      .where(and(eq(applications.id, id), eq(applications.candidateId, candidateId)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        application: {
          id: row.id,
          jobId: row.jobId,
          status: row.status,
          step: row.step ?? "",
          appliedAt: toISO(row.appliedAt),
          nextInterviewAt: row.nextInterviewAt ? toISO(row.nextInterviewAt) : null,
        },
        job: {
          id: row.jobId,
          title: row.jobTitle,
          location: row.jobLocation ?? "Not specified",
          description: row.jobDescription ?? "",
          company: row.companyName ?? "Unknown company",
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[/api/applications/[id]] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
