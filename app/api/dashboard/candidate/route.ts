// app/api/dashboard/candidate/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs, savedJobs, users } from "@/config/schema";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // 1) Read and verify JWT
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only candidates should hit this endpoint
    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const userId = payload.sub;
    const now = new Date();

    // 2) Stats: activeApplications, upcomingInterviews, savedJobs
    const activeStatuses = ["applied", "screening", "interview", "offer"] as const;

    const [activeRows, upcomingRows, savedRows] = await Promise.all([
      db
        .select({
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, userId),
            inArray(applications.status, activeStatuses as any)
          )
        ),

      db
        .select({
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, userId),
            gt(applications.nextInterviewAt, now)
          )
        ),

      db
        .select({
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(savedJobs)
        .where(eq(savedJobs.candidateId, userId)),
    ]);

    const activeApplications =
      activeRows[0]?.count !== undefined ? activeRows[0].count : 0;
    const upcomingInterviews =
      upcomingRows[0]?.count !== undefined ? upcomingRows[0].count : 0;
    const savedJobsCount =
      savedRows[0]?.count !== undefined ? savedRows[0].count : 0;

    // 3) Recent applications (for the table on the candidate dashboard)
    const recentApplicationsRaw = await db
      .select({
        id: applications.id,
        status: applications.status,
        step: applications.step,
        updatedAt: applications.updatedAt,
        jobTitle: jobs.title,
        companyName: users.companyName,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(jobs.employerId, users.id))
      .where(eq(applications.candidateId, userId))
      .orderBy(desc(applications.updatedAt))
      .limit(5);

    const recentApplications = recentApplicationsRaw.map((row) => ({
      id: row.id,
      company: row.companyName ?? "Unknown company",
      title: row.jobTitle,
      status: row.status,
      step: row.step,
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : new Date(row.updatedAt as any).toISOString(),
    }));

    // 4) Recommended jobs (simple: latest open roles)
    const recommendedJobsRaw = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        type: jobs.employmentType,
        companyName: users.companyName,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.employerId, users.id))
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.publishedAt))
      .limit(5);

    const recommendedJobs = recommendedJobsRaw.map((job) => ({
      id: job.id,
      company: job.companyName ?? "Unknown company",
      title: job.title,
      type: job.type,
    }));

    // 5) Shape matches `CandidateDashboardResponse` in app/dashboard/page.tsx
    return NextResponse.json(
      {
        stats: {
          activeApplications,
          upcomingInterviews,
          savedJobs: savedJobsCount,
        },
        recentApplications,
        recommendedJobs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/dashboard/candidate] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
