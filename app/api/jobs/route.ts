// app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { jobs, savedJobs, users } from "@/config/schema";
import { and, desc, eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type WorkMode = "onsite" | "remote" | "hybrid";
type JobType = "full-time" | "part-time" | "internship" | "contract";

type JobsResponse = {
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    workMode: WorkMode;
    jobType: JobType;
    salaryRange?: string | null;
    postedAt: string;
    isSaved?: boolean;
  }[];
  total: number;
};

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

    const userId = payload.sub as string;

    // Select from jobs + savedJobs + employer user (for companyName)
    const rows = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        remote: jobs.remote,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        currency: jobs.currency,
        createdAt: jobs.createdAt,
        companyName: users.companyName,
        savedJobId: savedJobs.jobId,
      })
      .from(jobs)
      .leftJoin(
        savedJobs,
        and(
          eq(savedJobs.jobId, jobs.id),
          eq(savedJobs.candidateId, userId)
        )
      )
      .leftJoin(users, eq(jobs.employerId, users.id))
      .orderBy(desc(jobs.createdAt));

    const jobList: JobsResponse["jobs"] = rows.map((row) => {
      // Map remote → workMode
      const workMode: WorkMode = row.remote ? "remote" : "onsite";

      // Map employmentType string → JobType union
      const rawType = (row.employmentType || "").toLowerCase();
      let jobType: JobType = "full-time";
      if (rawType.includes("part")) jobType = "part-time";
      else if (rawType.includes("intern")) jobType = "internship";
      else if (rawType.includes("contract")) jobType = "contract";

      // Build salaryRange string from min / max / currency
      let salaryRange: string | null = null;
      const { salaryMin, salaryMax, currency } = row;

      const cur = currency || "INR";
      if (typeof salaryMin === "number" && typeof salaryMax === "number") {
        salaryRange = `₹${salaryMin.toLocaleString("en-IN")} – ₹${salaryMax.toLocaleString(
          "en-IN"
        )} ${cur}`;
      } else if (typeof salaryMin === "number") {
        salaryRange = `From ₹${salaryMin.toLocaleString("en-IN")} ${cur}`;
      } else if (typeof salaryMax === "number") {
        salaryRange = `Up to ₹${salaryMax.toLocaleString("en-IN")} ${cur}`;
      }

      return {
        id: row.id,
        title: row.title,
        company: row.companyName || "Unknown company",
        location: row.location,
        workMode,
        jobType,
        salaryRange,
        postedAt: row.createdAt
          ? row.createdAt.toISOString()
          : new Date().toISOString(),
        isSaved: !!row.savedJobId,
      };
    });

    return NextResponse.json(
      {
        jobs: jobList,
        total: jobList.length,
      } satisfies JobsResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/jobs] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
