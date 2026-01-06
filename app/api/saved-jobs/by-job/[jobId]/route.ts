// app/api/saved-jobs/by-job/[jobId]/route.ts

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { savedJobs } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> } // Next.js 16
) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub || payload.role !== "candidate") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { jobId } = await ctx.params;

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
          eq(savedJobs.candidateId, payload.sub),
          eq(savedJobs.jobId, jobId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE saved-job by jobId]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
