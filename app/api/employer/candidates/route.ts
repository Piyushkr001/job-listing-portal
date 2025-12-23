// app/api/employer/candidates/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users, jobs, applications, userProfiles, userSkills } from "@/config/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type CandidateStatus = "new" | "reviewing" | "interview" | "hired" | "rejected";

type CandidatesResponse = {
  candidates: {
    id: string;
    name: string;
    email?: string;
    headline?: string;
    location?: string;
    experienceYears?: number | null;
    skills: string[];
    lastActiveAt?: string;
    appliedJobsCount: number;
    status: CandidateStatus;
  }[];
  total: number;
};

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const [t, v] = h.split(" ");
  return t === "Bearer" ? v : null;
}

// Map application_status -> pipeline bucket used by the dashboard
function mapApplicationStatusToCandidateStatus(appStatus: string): CandidateStatus {
  switch (appStatus) {
    case "screening":
      return "reviewing";
    case "interview":
    case "offer":
      return "interview";
    case "hired":
      return "hired";
    case "rejected":
      return "rejected";
    case "applied":
    default:
      return "new";
  }
}

// Lower rank = further along the pipeline (hired > interview > reviewing > new > rejected)
const STATUS_RANK: Record<CandidateStatus, number> = {
  hired: 0,
  interview: 1,
  reviewing: 2,
  new: 3,
  rejected: 4,
};

export async function GET(req: Request) {
  try {
    const token = getBearer(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload: any = verifyJwt(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ normalize employerId type (UUID/string/etc.)
    const employerId = String(payload.sub);

    // ✅ robust role read (same employer-only logic)
    const role: string | undefined =
      payload.role ??
      payload?.user?.role ??
      payload?.claims?.role ??
      payload?.app_metadata?.role ??
      payload?.publicMetadata?.role;

    // If role exists and is not employer => 403 (same logic you had)
    if (role && role !== "employer") {
      return NextResponse.json(
        { message: "Only employers can access candidates." },
        { status: 403 }
      );
    }

    // (Optional but safe) If role is missing entirely, still keep your employer-only intent:
    // If you want to be strict, uncomment:
    // if (!role) {
    //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    // }

    const rows = await db
      .select({
        candidateId: users.id,
        candidateName: users.name,
        candidateEmail: users.email,
        jobId: jobs.id,
        applicationStatus: applications.status,
        applicationCreatedAt: applications.createdAt,
        nextInterviewAt: applications.nextInterviewAt,
        headline: userProfiles.headline,
        location: userProfiles.location,
        experienceYears: userProfiles.experienceYears,
        skill: userSkills.skill,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(users, eq(applications.candidateId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(userSkills, eq(userSkills.userId, users.id))
      .where(eq(jobs.employerId, employerId));

    type CandidateAggregate = {
      id: string;
      name: string;
      email?: string;
      headline?: string;
      location?: string;
      experienceYears?: number | null;
      skills: Set<string>;
      jobIds: Set<string>;
      lastActiveAt?: Date;
      status: CandidateStatus;
      statusRank: number;
    };

    const byCandidate = new Map<string, CandidateAggregate>();

    for (const row of rows) {
      const candidateId = row.candidateId;
      const mappedStatus = mapApplicationStatusToCandidateStatus(
        row.applicationStatus as string
      );
      const rank = STATUS_RANK[mappedStatus];

      let agg = byCandidate.get(candidateId);

      if (!agg) {
        agg = {
          id: candidateId,
          name: row.candidateName,
          email: row.candidateEmail ?? undefined,
          headline: row.headline ?? undefined,
          location: row.location ?? undefined,
          experienceYears: row.experienceYears ?? undefined,
          skills: new Set<string>(),
          jobIds: new Set<string>(),
          lastActiveAt: undefined,
          status: mappedStatus,
          statusRank: rank,
        };
        byCandidate.set(candidateId, agg);
      } else {
        if (!agg.headline && row.headline) agg.headline = row.headline;
        if (!agg.location && row.location) agg.location = row.location;

        if (
          (agg.experienceYears === undefined || agg.experienceYears === null) &&
          row.experienceYears !== null &&
          row.experienceYears !== undefined
        ) {
          agg.experienceYears = row.experienceYears;
        }

        if (rank < agg.statusRank) {
          agg.status = mappedStatus;
          agg.statusRank = rank;
        }
      }

      if (row.jobId) agg.jobIds.add(row.jobId);
      if (row.skill) agg.skills.add(row.skill);

      const createdAt = row.applicationCreatedAt;
      const interviewAt = row.nextInterviewAt;
      const activity = interviewAt ?? createdAt;

      if (activity) {
        if (!agg.lastActiveAt || activity > agg.lastActiveAt) {
          agg.lastActiveAt = activity;
        }
      }
    }

    const candidates = Array.from(byCandidate.values()).map((agg) => ({
      id: agg.id,
      name: agg.name,
      email: agg.email,
      headline: agg.headline,
      location: agg.location,
      experienceYears: agg.experienceYears ?? null,
      skills: Array.from(agg.skills),
      lastActiveAt: agg.lastActiveAt?.toISOString(),
      appliedJobsCount: agg.jobIds.size,
      status: agg.status,
    }));

    const response: CandidatesResponse = {
      candidates,
      total: candidates.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[/api/employer/candidates] GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
