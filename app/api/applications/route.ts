// app/api/applications/route.ts

import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { db } from "@/config/db";
import { applications, jobs } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

// Helper: save resume file to /public/uploads/resumes and return public URL
async function saveResumeFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName = file.name || "resume";
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()!
    : "pdf";

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");

  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  // Served statically by Next from /public
  return `/uploads/resumes/${filename}`;
}

/**
 * POST /api/applications
 *
 * - Expects multipart/form-data: jobId (string), resume (File)
 * - Only candidates can apply
 * - Prevents duplicate active applications (status != 'withdrawn')
 */
export async function POST(req: Request) {
  try {
    // --- Auth & role check ---
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    // If your verifyJwt is async, change this line to: `const payload = await verifyJwt(token);`
    const payload: any = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = String(payload.sub);
    const role = payload.role as "candidate" | "employer" | "admin" | undefined;

    if (role && role !== "candidate") {
      return NextResponse.json(
        { message: "Only candidates can apply to jobs." },
        { status: 403 }
      );
    }

    // --- Read form-data ---
    const formData = await req.formData();
    const jobId = formData.get("jobId");
    const resume = formData.get("resume") as File | null;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { message: "jobId is required" },
        { status: 400 }
      );
    }

    if (!resume) {
      return NextResponse.json(
        { message: "Resume file is required" },
        { status: 400 }
      );
    }

    // Basic file validation
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (resume.type && !allowedTypes.includes(resume.type)) {
      return NextResponse.json(
        { message: "Invalid resume file type." },
        { status: 400 }
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (resume.size > maxSizeBytes) {
      return NextResponse.json(
        { message: "Resume file is too large (max 5MB)." },
        { status: 400 }
      );
    }

    // --- Ensure job exists ---
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // --- Check existing application(s) for this job + candidate ---
    const [existing] = await db
      .select({
        id: applications.id,
        status: applications.status,
      })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, jobId),
          eq(applications.candidateId, userId)
        )
      )
      .limit(1);

    // If there is a non-withdrawn application, block re-apply
    if (existing && existing.status !== "withdrawn") {
      return NextResponse.json(
        { message: "You have already applied for this job." },
        { status: 409 }
      );
    }

    // --- Save resume file ---
    const resumeUrl = await saveResumeFile(resume);

    // --- Insert or re-activate application ---
    const now = new Date();

    if (existing && existing.status === "withdrawn") {
      await db
        .update(applications)
        .set({
          status: "applied", // enum value from applicationStatusEnum
          step: "Application re-submitted",
          resumeUrl,
          updatedAt: now,
        })
        .where(eq(applications.id, existing.id));
    } else {
      await db.insert(applications).values({
        jobId,
        candidateId: userId,
        status: "applied",
        step: "Application received",
        resumeUrl,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json(
      { message: "Application submitted." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/applications] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications
 *
 * - Expects JSON: { jobId }
 * - Marks candidate's application as withdrawn (status = 'withdrawn')
 */
export async function DELETE(req: Request) {
  try {
    // --- Auth & role check ---
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload: any = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = String(payload.sub);
    const role = payload.role as "candidate" | "employer" | "admin" | undefined;

    if (role && role !== "candidate") {
      return NextResponse.json(
        { message: "Only candidates can withdraw applications." },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { jobId?: string }
      | null;

    const jobId = body?.jobId;

    if (!jobId) {
      return NextResponse.json(
        { message: "jobId is required" },
        { status: 400 }
      );
    }

    // Find active application (status != 'withdrawn')
    const [existing] = await db
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

    if (!existing) {
      return NextResponse.json(
        { message: "No active application found for this job." },
        { status: 404 }
      );
    }

    const now = new Date();

    await db
      .update(applications)
      .set({
        status: "withdrawn",
        step: "Application withdrawn",
        updatedAt: now,
      })
      .where(eq(applications.id, existing.id));

    return NextResponse.json(
      { message: "Application withdrawn." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/applications] DELETE error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
