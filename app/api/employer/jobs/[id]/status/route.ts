// app/api/employer/jobs/[id]/status/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { jobs } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type JobStatus = "draft" | "open" | "paused" | "closed";

type StatusBody = {
  status: JobStatus;
};

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Job id is required in the URL." },
        { status: 400 }
      );
    }

    // --- Auth ---
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub as string;
    const role = (payload as any).role as "candidate" | "employer" | undefined;

    if (role && role !== "employer") {
      return NextResponse.json(
        { message: "Only employers can update job status." },
        { status: 403 }
      );
    }

    // --- Body validation ---
    const body = (await req.json().catch(() => null)) as StatusBody | null;
    if (!body || !body.status) {
      return NextResponse.json(
        { message: "Missing 'status' in request body." },
        { status: 400 }
      );
    }

    const allowed: JobStatus[] = ["draft", "open", "paused", "closed"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        {
          message:
            "Invalid status. Allowed values: 'draft', 'open', 'paused', 'closed'.",
        },
        { status: 400 }
      );
    }

    // --- Update only if job belongs to this employer ---
        const now = new Date();
    
        const [updated] = await db
          .update(jobs)
          .set({
            //@ts-ignore
            status: body.status as "draft" | "open" | "paused" | "closed",
            updatedAt: now,
          })
      .where(and(eq(jobs.id, id), eq(jobs.employerId, userId)))
      .returning({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        updatedAt: jobs.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        {
          message:
            "Job not found or you do not have permission to update this job.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Job status updated successfully.",
        job: {
          id: updated.id,
          title: updated.title,
          status: updated.status as JobStatus,
          updatedAt: updated.updatedAt?.toISOString() ?? now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/employer/jobs/[id]/status] PATCH error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
