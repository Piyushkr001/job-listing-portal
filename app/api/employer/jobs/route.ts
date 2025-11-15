// app/api/employer/jobs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { jobs, applications } from "@/config/schema";
import { desc, eq, sql } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type JobStatus = "draft" | "open" | "paused" | "closed";

type EmployerJobItem = {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  remote: boolean;
  status: JobStatus;
  createdAt: string; // ISO
  applicationsCount: number;
};

type EmployerJobsResponse = {
  jobs: EmployerJobItem[];
};

/* -------------------------- Helper: slug generator ------------------------- */

function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const random = Math.random().toString(36).slice(2, 8);
  return `${base}-${random}`;
}

/* ---------------------------------- GET ---------------------------------- */
/**
 * GET /api/employer/jobs
 * Returns all jobs for the logged-in employer, plus applicationsCount for each.
 */
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

    const employerId = payload.sub as string;

    const rows = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        employmentType: jobs.employmentType,
        remote: jobs.remote,
        status: jobs.status,
        createdAt: jobs.createdAt,
        applicationsCount: sql<number>`count(${applications.id})`.as(
          "applications_count"
        ),
      })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(jobs.employerId, employerId))
      .groupBy(
        jobs.id,
        jobs.title,
        jobs.location,
        jobs.employmentType,
        jobs.remote,
        jobs.status,
        jobs.createdAt
      )
      .orderBy(desc(jobs.createdAt));

    const result: EmployerJobsResponse = {
      jobs: rows.map((row) => ({
        id: row.id,
        title: row.title,
        location: row.location,
        employmentType: row.employmentType || "Role",
        remote: !!row.remote,
        status: (row.status || "open") as JobStatus,
        createdAt: row.createdAt
          ? row.createdAt.toISOString()
          : new Date().toISOString(),
        applicationsCount: Number(row.applicationsCount ?? 0),
      })),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/employer/jobs] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------------------------- POST --------------------------------- */

type CreateJobBody = {
  title?: string;
  location?: string;
  employmentType?: string;
  remote?: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  description?: string;
  status?: JobStatus;
  // extra fields from UI (ignored by DB, but we accept them)
  experienceLevel?: string | null;
  applicationDeadline?: string | null;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
};

/**
 * POST /api/employer/jobs
 * Creates a new job owned by the logged-in employer.
 * Only uses columns that actually exist in your `jobs` table.
 */
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

    const employerId = payload.sub as string;
    const role = (payload as any).role as "candidate" | "employer" | undefined;

    if (role && role !== "employer") {
      return NextResponse.json(
        { message: "Only employers can create jobs." },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as CreateJobBody | null;
    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const title = body.title?.trim();
    const location = body.location?.trim();
    const employmentType = body.employmentType?.trim();
    const description = body.description?.trim();

    if (!title || !location || !employmentType || !description) {
      return NextResponse.json(
        {
          message:
            "Missing required fields. Please provide title, location, employmentType, and description.",
        },
        { status: 400 }
      );
    }

    const status: JobStatus = (body.status || "open") as JobStatus;
    const allowedStatuses: JobStatus[] = ["draft", "open", "paused", "closed"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          message:
            "Invalid status. Allowed values: 'draft', 'open', 'paused', 'closed'.",
        },
        { status: 400 }
      );
    }

    const remote = !!body.remote;
    const salaryMin =
      typeof body.salaryMin === "number" ? body.salaryMin : null;
    const salaryMax =
      typeof body.salaryMax === "number" ? body.salaryMax : null;
    const currency = body.currency?.trim() || "INR";

    // Generate slug required by your schema
    const slug = slugifyTitle(title);

    // If status is not draft, mark as published now; else keep null
    const now = new Date();
    const publishedAt = status === "draft" ? null : now;

    const [created] = await db
      .insert(jobs)
      //@ts-ignore
      .values({
        employerId,
        title,
        slug,
        description,
        location,
        employmentType,
        remote,
        salaryMin,
        salaryMax,
        currency,
        status,
        publishedAt,
        // createdAt / updatedAt have defaultNow(), no need to set explicitly
      })
      .returning({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        createdAt: jobs.createdAt,
      });

    return NextResponse.json(
      {
        message: "Job created successfully.",
        job: {
          id: created.id,
          title: created.title,
          status: created.status as JobStatus,
          createdAt: created.createdAt?.toISOString() ?? now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/employer/jobs] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
