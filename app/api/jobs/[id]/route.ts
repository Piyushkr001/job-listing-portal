// app/api/jobs/[id]/route.ts

import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/config/db";
import { jobs, applications, savedJobs } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

type RouteParams = {
  id: string;
};

// NOTE: In Next 15/16 app router, `params` is a Promise
export async function GET(
  req: Request,
  ctx: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await ctx.params;
    const jobId = id;

    // ----- Optional auth: we try to identify user, but job details can be public -----
    const authHeader = req.headers.get("authorization") ?? "";
    let userId: string | null = null;
    let role: "candidate" | "employer" | "admin" | undefined;

    if (authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payload: any = verifyJwt(token); // or `await verifyJwt(token)` if your helper is async

        if (payload?.sub) {
          userId = String(payload.sub);
          role = payload.role;
        }
      } catch {
        // invalid token → treat as unauthenticated
        userId = null;
        role = undefined;
      }
    }

    // ----- Fetch job row (no per-column property access, so no TS 2339) -----
    const rows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const rowAny = rows[0] as any;

    // ----- Compute isApplied & isSaved for candidate users -----
    let isApplied = false;
    let isSaved = false;

    if (userId && role === "candidate") {
      // Active application = exists with status != 'withdrawn'
      const [existingApp] = await db
        .select({
          id: applications.id,
          status: applications.status,
        })
        .from(applications)
        .where(
          and(
            eq(applications.jobId, jobId),
            eq(applications.candidateId, userId),
            ne(applications.status, "withdrawn")
          )
        )
        .limit(1);

      if (existingApp) {
        isApplied = true;
      }

      // Saved job
      const [saved] = await db
        .select({ id: savedJobs.id })
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.jobId, jobId),
            eq(savedJobs.candidateId, userId)
          )
        )
        .limit(1);

      if (saved) {
        isSaved = true;
      }
    }

    // ----- Normalise postedAt (if present) and return response shaped for JobDetail -----
    const postedAtValue = rowAny.postedAt ?? rowAny.createdAt ?? null;

    return NextResponse.json({
      ...rowAny,
      // If postedAt is a Date, send ISO string; otherwise leave as-is or null
      postedAt:
        postedAtValue instanceof Date
          ? postedAtValue.toISOString()
          : postedAtValue,
      isApplied,
      isSaved,
    });
  } catch (error) {
    console.error("[/api/jobs/[id]] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
