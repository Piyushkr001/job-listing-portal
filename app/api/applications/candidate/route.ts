// app/api/applications/candidate/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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

    if (payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const candidateId = payload.sub as string;

    const activeStatuses = [
      "applied",
      "screening",
      "interview",
      "offer",
    ] as const;

    // --- Stats in parallel --- //
    const [totalRows, activeRows, rejectedRows, offersRows] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .where(eq(applications.candidateId, candidateId)),

      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, candidateId),
            inArray(applications.status, activeStatuses as any)
          )
        ),

      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, candidateId),
            eq(applications.status, "rejected" as any)
          )
        ),

      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(applications)
        .where(
          and(
            eq(applications.candidateId, candidateId),
            inArray(applications.status, ["offer", "hired"] as any)
          )
        ),
    ]);

    const stats = {
      total: totalRows[0]?.count ?? 0,
      active: activeRows[0]?.count ?? 0,
      rejected: rejectedRows[0]?.count ?? 0,
      offers: offersRows[0]?.count ?? 0,
    };

    // --- Full applications list --- //
    const rows = await db
      .select({
        id: applications.id,
        status: applications.status,
        step: applications.step,
        appliedAt: applications.createdAt,
        nextInterviewAt: applications.nextInterviewAt,
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        companyName: users.companyName,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(jobs.employerId, users.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt));

    const applicationsList = rows.map((row) => ({
      id: row.id,
      jobTitle: row.jobTitle,
      company: row.companyName ?? "Unknown company",
      location: row.jobLocation ?? "Not specified",
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
    console.error("[/api/applications/candidate] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
