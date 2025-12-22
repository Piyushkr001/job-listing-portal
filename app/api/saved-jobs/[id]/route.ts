// app/api/saved-jobs/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { savedJobs } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>;
};

/* ---------- DELETE: unsave a job ---------- */

export async function DELETE(req: Request, ctx: Ctx) {
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

    // ✅ Next.js 16 fix: params is a Promise
    const { id: savedId } = await ctx.params;

    const deleted = await db
      .delete(savedJobs)
      .where(and(eq(savedJobs.id, savedId), eq(savedJobs.candidateId, candidateId)))
      .returning({ id: savedJobs.id });

    if (!deleted.length) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Job removed from saved list" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/saved-jobs/[id]] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to remove job" },
      { status: 500 }
    );
  }
}
