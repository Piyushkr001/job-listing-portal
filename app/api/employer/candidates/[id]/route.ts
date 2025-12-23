import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { applications, jobs, users, userProfiles, userSkills } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const [t, v] = h.split(" ");
  return t === "Bearer" ? v : null;
}

function normId(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 16
) {
  try {
    const token = getBearer(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyJwt(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (payload.role !== "employer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;

    const candidateId = normId(id);
    const employerId = normId(payload.sub);

    // --- Authorization: candidate must have applied to employer's job (same rule) ---
    // FIX: avoid UUID/text mismatch by explicitly casting both sides to uuid in Postgres
    // If your columns are TEXT (not UUID), casting still works when values are valid UUIDs.
    const rel = await db
      .select({ id: applications.id })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          sql`${applications.candidateId}::uuid = ${candidateId}::uuid`,
          sql`${jobs.employerId}::uuid = ${employerId}::uuid`
        )
      )
      .limit(1);

    if (rel.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const base = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, candidateId))
      .limit(1);

    if (!base[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const profile = await db
      .select({
        headline: userProfiles.headline,
        bio: userProfiles.bio,
        location: userProfiles.location,
        resumeUrl: userProfiles.resumeUrl,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, candidateId))
      .limit(1);

    const skills = await db
      .select({ skill: userSkills.skill })
      .from(userSkills)
      .where(eq(userSkills.userId, candidateId));

    return NextResponse.json({
      user: base[0],
      profile: profile[0] || null,
      skills: skills.map((s) => s.skill),
    });
  } catch (e) {
    console.error("[/api/employer/candidates/[id]] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
