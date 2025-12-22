// app/api/dashboard/employer/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs } from "@/config/schema";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // 1) Read & verify JWT from Authorization header
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const userId = payload.sub as string;
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 2) Stats: openRoles, activeCandidates, interviewsThisWeek
    const [openRolesRows, activeCandidatesRows, interviewsThisWeekRows] =
      await Promise.all([
        // openRoles = employer's jobs with status "open"
        db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(jobs)
          .where(and(eq(jobs.employerId, userId), eq(jobs.status, "open"))),

        // activeCandidates = distinct candidates across all statuses
        // (we don't filter by specific application_status values to avoid enum issues)
        db
          .select({
            count: sql<number>`cast(count(distinct ${applications.candidateId}) as int)`,
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(eq(jobs.employerId, userId)),

        // interviewsThisWeek = applications with nextInterviewAt in next 7 days
        db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(
            and(
              eq(jobs.employerId, userId),
              gt(applications.nextInterviewAt, now),
              lt(applications.nextInterviewAt, weekAhead)
            )
          ),
      ]);

    const openRoles = openRolesRows[0]?.count ?? 0;
    const activeCandidates = activeCandidatesRows[0]?.count ?? 0;
    const interviewsThisWeek = interviewsThisWeekRows[0]?.count ?? 0;

    // 3) Recent jobs (employer’s jobs, most recently updated)
    const recentJobsBase = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(eq(jobs.employerId, userId))
      .orderBy(desc(jobs.updatedAt))
      .limit(5);

    // For each job, count how many applications it has
    const applicantsByJobId: Record<string, number> = {};

    await Promise.all(
      recentJobsBase.map(async (job) => {
        const [row] = await db
          .select({
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(applications)
          .where(eq(applications.jobId, job.id));

        applicantsByJobId[job.id] = row?.count ?? 0;
      })
    );

    function mapJobStatus(status: string): string {
      switch (status) {
        case "open":
          return "Open";
        case "draft":
          return "Draft";
        case "closed":
          return "Closed";
        default:
          return status;
      }
    }

    const recentJobs = recentJobsBase.map((job) => ({
      id: job.id,
      title: job.title ?? "Untitled role",
      location: job.location ?? "Not specified",
      status: mapJobStatus(job.status as string),
      applicants: applicantsByJobId[job.id] ?? 0,
      updatedAt:
        job.updatedAt instanceof Date
          ? job.updatedAt.toISOString()
          : new Date(job.updatedAt as any).toISOString(),
    }));

    // 4) Pipeline: counts per application status for this employer
    //    IMPORTANT: We *do not* inject literal status strings into SQL.
    //    We just GROUP BY whatever enum values actually exist in the DB.
    const statusLabels: Record<string, string> = {
      applied: "Applied",
      screening: "Screening",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      hired: "Hired",
    };

    const pipelineRows = await db
      .select({
        status: applications.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(jobs.employerId, userId))
      .groupBy(applications.status);

    const pipeline = pipelineRows.map((row) => {
      const rawStatus = row.status as string;
      return {
        label: statusLabels[rawStatus] ?? rawStatus,
        count: row.count,
      };
    });

    // 5) Response shape matches EmployerDashboardResponse
    return NextResponse.json(
      {
        stats: {
          openRoles,
          activeCandidates,
          interviewsThisWeek,
        },
        recentJobs,
        pipeline,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/dashboard/employer] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
