// app/api/applications/candidate/route.ts
//@ts-nocheck

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toCount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toISO(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value as any).toISOString();
}

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

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

    // MUST match applicationStatusEnum in schema
    const activeStatuses = [
      "applied",
      "shortlisted",
      "interview_scheduled",
      "offered",
    ] as const;

    // Parse query params
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get("status") ?? "all").toLowerCase();
    const page = parseIntSafe(searchParams.get("page"), 1);
    const pageSize = Math.min(parseIntSafe(searchParams.get("pageSize"), 10), 50);
    const offset = (page - 1) * pageSize;

    // Build status filter (does NOT change your status logic; only selects subset)
    // Allowed:
    // - "all"
    // - "active" -> activeStatuses
    // - "rejected"
    // - "offers" -> ["offered","hired"]
    // - or an explicit enum value (e.g. "applied")
    let statusWhere = sql`true`;

    if (statusParam === "active") {
      statusWhere = inArray(applications.status, activeStatuses as readonly string[]);
    } else if (statusParam === "rejected") {
      statusWhere = eq(applications.status, "rejected" as any);
    } else if (statusParam === "offers") {
      statusWhere = inArray(applications.status, ["offered", "hired"] as readonly string[]);
    } else if (statusParam !== "all") {
      // treat as explicit status enum
      statusWhere = eq(applications.status, statusParam as any);
    }

    // --- Stats in parallel (your same logic) --- //
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
            inArray(applications.status, activeStatuses as readonly string[])
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
            inArray(applications.status, ["offered", "hired"] as readonly string[])
          )
        ),
    ]);

    const stats = {
      total: toCount(totalRows[0]?.count),
      active: toCount(activeRows[0]?.count),
      rejected: toCount(rejectedRows[0]?.count),
      offers: toCount(offersRows[0]?.count),
    };

    // Pagination total for current filter
    const filteredCountRows = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(applications)
      .where(and(eq(applications.candidateId, candidateId), statusWhere));

    const filteredTotal = toCount(filteredCountRows[0]?.count);
    const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

    // --- List with pagination --- //
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
        companyName: users.companyName,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(jobs.employerId, users.id))
      .where(and(eq(applications.candidateId, candidateId), statusWhere))
      .orderBy(desc(applications.createdAt))
      .limit(pageSize)
      .offset(offset);

    const applicationsList = rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      company: row.companyName ?? "Unknown company",
      location: row.jobLocation ?? "Not specified",
      status: row.status as any,
      step: row.step ?? "",
      appliedAt: toISO(row.appliedAt),
      nextInterviewAt: row.nextInterviewAt ? toISO(row.nextInterviewAt) : null,
    }));

    return NextResponse.json(
      {
        stats,
        applications: applicationsList,
        pagination: {
          page,
          pageSize,
          total: filteredTotal,
          totalPages,
        },
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
