import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core"; // ✅ keep this (your version supports this)

import { db } from "@/config/db";
import { applications, jobs, users } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toISO(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value as any).toISOString();
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: applicationId } = await ctx.params;

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload?.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (payload.role !== "employer") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const employerId = payload.sub as string;

    // ✅ Alias users table so we can join candidate + employer correctly
    const candidateUser = alias(users, "candidate_user");
    const employerUser = alias(users, "employer_user");

    const rows = await db
      .select({
        applicationId: applications.id,
        status: applications.status,
        step: applications.step,
        coverLetter: applications.coverLetter,
        resumeUrl: applications.resumeUrl,
        createdAt: applications.createdAt,
        nextInterviewAt: applications.nextInterviewAt,

        jobId: jobs.id,
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        jobDescription: jobs.description,

        // ✅ companyName must come from employer user
        companyName: employerUser.companyName,

        candidateId: applications.candidateId,
        candidateName: candidateUser.name,
        candidateEmail: candidateUser.email,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(candidateUser, eq(applications.candidateId, candidateUser.id))
      .innerJoin(employerUser, eq(jobs.employerId, employerUser.id))
      .where(and(eq(applications.id, applicationId), eq(jobs.employerId, employerId)))
      .limit(1);

    const r = rows[0];
    if (!r) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        applicationId: r.applicationId,
        status: r.status,
        step: r.step ?? null,
        coverLetter: r.coverLetter ?? null,
        resumeUrl: r.resumeUrl ?? null,
        createdAt: toISO(r.createdAt),
        nextInterviewAt: r.nextInterviewAt ? toISO(r.nextInterviewAt) : null,
        job: {
          id: r.jobId,
          title: r.jobTitle,
          location: r.jobLocation ?? "",
          description: r.jobDescription ?? "",
          company: r.companyName ?? "",
        },
        candidate: {
          id: r.candidateId,
          name: r.candidateName ?? null,
          email: r.candidateEmail,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[/api/employer/applications/[id]] error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
