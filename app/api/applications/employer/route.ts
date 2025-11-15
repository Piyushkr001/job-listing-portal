// app/api/applications/employer/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

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

    if (payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const employerId = payload.sub as string;

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // --- Stats in parallel --- //
    const [totalRows, todayRows, thisWeekRows] = await Promise.all([
      // total across all jobs for this employer
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(jobs.employerId, employerId)),

      // today
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(
          and(
            eq(jobs.employerId, employerId),
            gte(applications.createdAt, startOfToday)
          )
        ),

      // last 7 days
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(
          and(
            eq(jobs.employerId, employerId),
            gte(applications.createdAt, sevenDaysAgo)
          )
        ),
    ]);

    const stats = {
      total: totalRows[0]?.count ?? 0,
      today: todayRows[0]?.count ?? 0,
      thisWeek: thisWeekRows[0]?.count ?? 0,
    };

    // --- Applications list with candidate + job info --- //
    const rows = await db
      .select({
        id: applications.id,
        status: applications.status,
        step: applications.step,
        appliedAt: applications.createdAt,
        nextInterviewAt: applications.nextInterviewAt,
        jobId: jobs.id,
        jobTitle: jobs.title,
        candidateName: users.name,
        candidateEmail: users.email,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(applications.candidateId, users.id))
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(applications.createdAt));

    const applicationsList = rows.map((row) => ({
      id: row.id,
      jobTitle: row.jobTitle,
      jobId: row.jobId,
      candidateName: row.candidateName ?? "Unknown candidate",
      candidateEmail: row.candidateEmail ?? "",
      status: row.status as any,
      step: row.step ?? "",
      appliedAt:
        row.appliedAt instanceof Date
          ? row.appliedAt.toISOString()
          : new Date(row.appliedAt as any).toISOString(),
      nextInterviewAt: row.nextInterviewAt
        ? row.nextInterviewAt instanceof Date
          ? row.nextInterviewAt.toISOString()
          : new Date(row.nextInterviewAt as any).toISOString()
        : null,
    }));

    return NextResponse.json(
      {
        stats,
        applications: applicationsList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/applications/employer] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
