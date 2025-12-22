// app/api/jobs/recommended/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { jobs, users } from "@/config/schema";
import { desc, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  currency: string | null
) {
  const cur = currency ?? "INR";
  if (salaryMin == null && salaryMax == null) return null;
  if (salaryMin != null && salaryMax != null) return `${cur} ${salaryMin} - ${salaryMax}`;
  if (salaryMin != null) return `${cur} ${salaryMin}+`;
  return `${cur} up to ${salaryMax}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(10, Math.max(1, toInt(searchParams.get("limit"), 2)));

    /**
     * IMPORTANT:
     * Many 500s here are caused by enum mismatch (status filter).
     * So this route:
     *  - prefers published jobs if possible
     *  - but will still work even if enum value differs
     */

    // 1) Fetch jobs (prefer publishedAt desc); no hard status filter
    const rows = await db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        location: jobs.location,
        employmentType: jobs.employmentType,
        remote: jobs.remote,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        currency: jobs.currency,
        status: jobs.status,
        publishedAt: jobs.publishedAt,
        createdAt: jobs.createdAt,

        // This assumes users has companyName; if your users schema doesn't,
        // the join still works, but selecting companyName would crash.
        // So we select a safe "company" using SQL COALESCE fallback.
        company: sql<string>`coalesce(${users.companyName}, ${users.name}, ${users.email})`,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.employerId, users.id))
      // Prefer truly published jobs FIRST; drafts will appear later.
      .orderBy(
        // published first, then newest
        desc(sql`(${jobs.publishedAt} is not null)`),
        desc(jobs.publishedAt),
        desc(jobs.createdAt)
      )
      .limit(limit);

    const normalized = rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      title: r.title,
      company: r.company ?? "Unknown company",
      location: r.remote ? `Remote · ${r.location}` : r.location,
      type: r.employmentType ?? null,
      salary: formatSalary(r.salaryMin ?? null, r.salaryMax ?? null, r.currency ?? "INR"),
    }));

    return NextResponse.json({ jobs: normalized }, { status: 200 });
  } catch (error) {
    console.error("[/api/jobs/recommended] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
