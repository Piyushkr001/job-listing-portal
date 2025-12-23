import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { applicationEvents, applications, jobs } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_VALUES = [
  "applied",
  "shortlisted",
  "interview_scheduled",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;

type ApplicationStatus = (typeof STATUS_VALUES)[number];

function isApplicationStatus(v: unknown): v is ApplicationStatus {
  return typeof v === "string" && (STATUS_VALUES as readonly string[]).includes(v);
}

type PatchBody = {
  status: ApplicationStatus;
  step?: string; // optional, stored on applications.step
  nextInterviewAt?: string | null; // ISO string or null
  message?: string; // optional event note
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await ctx.params;

    // --- Auth ---
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub || payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const employerId = payload.sub as string;

    // --- Body ---
    const body = (await req.json()) as Partial<PatchBody>;

    if (!isApplicationStatus(body.status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be a valid application_status enum value." },
        { status: 400 }
      );
    }

    const step =
      typeof body.step === "string" && body.step.trim().length > 0
        ? body.step.trim()
        : undefined;

    let nextInterviewAt: Date | null | undefined = undefined;
    if (body.nextInterviewAt === null) {
      nextInterviewAt = null;
    } else if (typeof body.nextInterviewAt === "string" && body.nextInterviewAt.trim()) {
      const d = new Date(body.nextInterviewAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: "Invalid nextInterviewAt." }, { status: 400 });
      }
      nextInterviewAt = d;
    }

    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : null;

    // --- Ownership check (application -> job -> employer) + fetch old status ---
    const owned = await db
      .select({
        id: applications.id,
        fromStatus: applications.status,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(eq(applications.id, applicationId), eq(jobs.employerId, employerId)))
      .limit(1);

    if (!owned[0]) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const fromStatus = owned[0].fromStatus;

    // --- Update application ---
    const updated = await db
      .update(applications)
      .set({
        status: body.status,
        ...(step !== undefined ? { step } : {}),
        ...(nextInterviewAt !== undefined ? { nextInterviewAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning({
        id: applications.id,
        status: applications.status,
        step: applications.step,
        nextInterviewAt: applications.nextInterviewAt,
        updatedAt: applications.updatedAt,
      });

    // --- Create timeline event ---
    const eventType =
      body.status === "interview_scheduled" || nextInterviewAt
        ? "interview_scheduled"
        : "status_changed";

    await db.insert(applicationEvents).values({
      applicationId,
      actorId: employerId, // employer user id
      type: eventType,
      fromStatus: String(fromStatus),
      toStatus: String(body.status),
      message,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        ok: true,
        application: updated[0],
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[PATCH /api/employer/applications/[id]/status] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
