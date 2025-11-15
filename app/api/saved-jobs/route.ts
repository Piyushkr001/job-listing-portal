// app/api/saved-jobs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { savedJobs, jobs, users, applications } from "@/config/schema";
import { and, desc, eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

type WorkMode = "onsite" | "remote" | "hybrid";
type JobType = "full-time" | "part-time" | "internship" | "contract";

export const runtime = "nodejs";

/* ---------- GET: list saved jobs ---------- */

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    // 🔹 Only use columns that actually exist in your jobs table:
    // id, title, location, employerId
    const rows = await db
      .select({
        savedId: savedJobs.id,
        savedAt: savedJobs.createdAt,

        jobId: jobs.id,
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        employerCompanyName: users.companyName,

        applicationId: applications.id,
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .innerJoin(users, eq(jobs.employerId, users.id))
      .leftJoin(
        applications,
        and(
          eq(applications.jobId, savedJobs.jobId),
          eq(applications.candidateId, candidateId)
        )
      )
      .where(eq(savedJobs.candidateId, candidateId))
      .orderBy(desc(savedJobs.createdAt));

    const jobsList = rows.map((row) => {
      // 🔹 Fallbacks, since we’re NOT reading these from DB
      const workMode: WorkMode = "onsite";
      const jobType: JobType = "full-time";
      const salaryRange: string | null = null;

      return {
        id: row.savedId,
        jobId: row.jobId,
        jobTitle: row.jobTitle ?? "Untitled role",
        company: row.employerCompanyName ?? "Unknown company",
        location: row.jobLocation ?? "Not specified",
        workMode,
        jobType,
        status: "open" as const, // Treat all as open for now
        applied: !!row.applicationId,
        savedAt:
          row.savedAt instanceof Date
            ? row.savedAt.toISOString()
            : new Date(row.savedAt as any).toISOString(),
        salaryRange,
      };
    });

    const total = jobsList.length;
    const appliedCount = jobsList.filter((j) => j.applied).length;
    const openCount = jobsList.filter((j) => j.status === "open").length;

    return NextResponse.json(
      {
        stats: {
          total,
          open: openCount,
          applied: appliedCount,
        },
        jobs: jobsList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/saved-jobs] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- POST: save a job ---------- */

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    const body = (await req.json().catch(() => null)) as
      | { jobId?: string }
      | null;

    const jobId = body?.jobId;
    if (!jobId) {
      return NextResponse.json(
        { message: "jobId is required" },
        { status: 400 }
      );
    }

    // Optional: verify job exists
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Insert or ignore if already saved
    await db
      .insert(savedJobs)
      .values({
        candidateId,
        jobId,
      })
      .onConflictDoNothing({
        target: [savedJobs.candidateId, savedJobs.jobId],
      });

    return NextResponse.json(
      { message: "Job saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/saved-jobs] POST error:", error);
    return NextResponse.json(
      { message: "Failed to save job" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE: unsave a job ---------- */

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    const body = (await req.json().catch(() => null)) as
      | { jobId?: string }
      | null;

    const jobId = body?.jobId;
    if (!jobId) {
      return NextResponse.json(
        { message: "jobId is required" },
        { status: 400 }
      );
    }

    await db
      .delete(savedJobs)
      .where(
        and(
          eq(savedJobs.candidateId, candidateId),
          eq(savedJobs.jobId, jobId)
        )
      );

    return NextResponse.json(
      { message: "Job removed from saved list" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/saved-jobs] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to remove job" },
      { status: 500 }
    );
  }
}
