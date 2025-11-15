// app/api/profile/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  users,
  userProfiles,
  employerProfiles,
  userSkills,
} from "@/config/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

/**
 * Helper: load the full profile for a given userId
 * Returns { user, profile, employerProfile, skills } or null if no user.
 */
async function getFullProfile(userId: string) {
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) return null;

  let profile: any = null;
  let employerProfile: any = null;
  let skills: string[] = [];

  if (userRow.role === "candidate") {
    // Candidate profile (userProfiles + userSkills)
    const [profileRow] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userRow.id))
      .limit(1);

    const skillRows = await db
      .select({ skill: userSkills.skill })
      .from(userSkills)
      .where(eq(userSkills.userId, userRow.id));

    skills = skillRows.map((r) => r.skill);

    profile = {
      phone: profileRow?.phone ?? "",
      location: profileRow?.location ?? "",
      website: profileRow?.website ?? "",
      headline: profileRow?.headline ?? "",
      bio: profileRow?.bio ?? "",
      experienceYears:
        profileRow?.experienceYears !== null &&
        profileRow?.experienceYears !== undefined
          ? profileRow.experienceYears
          : null,
      preferredTitle: profileRow?.preferredTitle ?? "",
      preferredLocation: profileRow?.preferredLocation ?? "",
      salaryRange: profileRow?.salaryRange ?? "",
      skills,
    };
  } else if (userRow.role === "employer") {
    // Employer profile (employerProfiles)
    const [profileRow] = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, userRow.id))
      .limit(1);

    employerProfile = {
      companyWebsite: profileRow?.companyWebsite ?? "",
      companySize: profileRow?.companySize ?? "",
      companyBio: profileRow?.companyBio ?? "",
      hiringLocations: profileRow?.hiringLocations ?? "",
      hiringFocus: profileRow?.hiringFocus ?? "",
      hiringNotes: profileRow?.hiringNotes ?? "",
    };
  }

  return {
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      companyName: userRow.companyName,
      provider: userRow.provider,
    },
    profile,
    employerProfile,
  };
}

/**
 * GET /api/profile
 * Returns:
 * {
 *   user: { id, name, email, role, companyName, provider },
 *   profile: { ...candidate fields + skills[] } | null,
 *   employerProfile: { ...employer fields } | null
 * }
 */
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

    const full = await getFullProfile(userId);
    if (!full) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(full, { status: 200 });
  } catch (error) {
    console.error("[/api/profile] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 *
 * Candidate can send (all optional, PATCH = partial update):
 * {
 *   name?: string;
 *   phone?: string;
 *   location?: string;
 *   website?: string;
 *   headline?: string;
 *   bio?: string;
 *   experienceYears?: number | string | null;
 *   preferredTitle?: string;
 *   preferredLocation?: string;
 *   salaryRange?: string;
 *   skills?: string[];     // replaces full skills set if provided
 * }
 *
 * Employer can send:
 * {
 *   name?: string;
 *   companyName?: string;
 *   companyWebsite?: string;
 *   companySize?: string;
 *   companyBio?: string;
 *   hiringLocations?: string;
 *   hiringFocus?: string;
 *   hiringNotes?: string;
 * }
 */
export async function PATCH(req: Request) {
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

    const body = (await req.json().catch(() => null)) as
      | {
          // shared
          name?: string;
          // employer only
          companyName?: string;
          companyWebsite?: string;
          companySize?: string;
          companyBio?: string;
          hiringLocations?: string;
          hiringFocus?: string;
          hiringNotes?: string;
          // candidate only
          phone?: string;
          location?: string;
          website?: string;
          headline?: string;
          bio?: string;
          experienceYears?: number | string | null;
          preferredTitle?: string;
          preferredLocation?: string;
          salaryRange?: string;
          skills?: string[];
        }
      | null;

    if (!body) {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Load user to know role, etc.
    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // --- 1) Update users table (name, companyName) ---------------------------------- //
    const userUpdates: Partial<typeof users.$inferInsert> = {};

    if (typeof body.name === "string" && body.name.trim().length > 0) {
      userUpdates.name = body.name.trim();
    }

    if (
      userRow.role === "employer" &&
      typeof body.companyName === "string"
    ) {
      const val = body.companyName.trim();
      userUpdates.companyName = val === "" ? null : val;
    }

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = new Date();
      await db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    // --- 2) Role-specific profile updates ------------------------------------------ //
    if (userRow.role === "candidate") {
      const profileUpdates: Partial<typeof userProfiles.$inferInsert> = {};

      if ("phone" in body) {
        profileUpdates.phone =
          typeof body.phone === "string" && body.phone.trim()
            ? body.phone.trim()
            : null;
      }
      if ("location" in body) {
        profileUpdates.location =
          typeof body.location === "string" && body.location.trim()
            ? body.location.trim()
            : null;
      }
      if ("website" in body) {
        profileUpdates.website =
          typeof body.website === "string" && body.website.trim()
            ? body.website.trim()
            : null;
      }
      if ("headline" in body) {
        profileUpdates.headline =
          typeof body.headline === "string" && body.headline.trim()
            ? body.headline.trim()
            : null;
      }
      if ("bio" in body) {
        profileUpdates.bio =
          typeof body.bio === "string" && body.bio.trim()
            ? body.bio.trim()
            : null;
      }
      if ("experienceYears" in body) {
        let val: number | null = null;
        if (
          typeof body.experienceYears === "number" &&
          !Number.isNaN(body.experienceYears)
        ) {
          val = body.experienceYears;
        } else if (
          typeof body.experienceYears === "string" &&
          body.experienceYears.trim() !== ""
        ) {
          const parsed = Number(body.experienceYears);
          if (!Number.isNaN(parsed)) {
            val = parsed;
          }
        }
        profileUpdates.experienceYears = val;
      }
      if ("preferredTitle" in body) {
        profileUpdates.preferredTitle =
          typeof body.preferredTitle === "string" &&
          body.preferredTitle.trim()
            ? body.preferredTitle.trim()
            : null;
      }
      if ("preferredLocation" in body) {
        profileUpdates.preferredLocation =
          typeof body.preferredLocation === "string" &&
          body.preferredLocation.trim()
            ? body.preferredLocation.trim()
            : null;
      }
      if ("salaryRange" in body) {
        profileUpdates.salaryRange =
          typeof body.salaryRange === "string" && body.salaryRange.trim()
            ? body.salaryRange.trim()
            : null;
      }

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updatedAt = new Date();

        const [existingProfile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        if (!existingProfile) {
          await db.insert(userProfiles).values({
            userId,
            ...profileUpdates,
          });
        } else {
          await db
            .update(userProfiles)
            .set(profileUpdates)
            .where(eq(userProfiles.userId, userId));
        }
      }

      // Skills: if provided, replace the whole set
      if (Array.isArray(body.skills)) {
        const cleanSkills = Array.from(
          new Set(
            body.skills
              .map((s) => (typeof s === "string" ? s.trim() : ""))
              .filter(Boolean)
          )
        );

        // delete old
        await db
          .delete(userSkills)
          .where(eq(userSkills.userId, userId));

        // insert new
        if (cleanSkills.length > 0) {
          await db.insert(userSkills).values(
            cleanSkills.map((skill) => ({
              userId,
              skill,
            }))
          );
        }
      }
    } else if (userRow.role === "employer") {
      const profileUpdates: Partial<typeof employerProfiles.$inferInsert> = {};

      if ("companyWebsite" in body) {
        profileUpdates.companyWebsite =
          typeof body.companyWebsite === "string" &&
          body.companyWebsite.trim()
            ? body.companyWebsite.trim()
            : null;
      }
      if ("companySize" in body) {
        profileUpdates.companySize =
          typeof body.companySize === "string" &&
          body.companySize.trim()
            ? body.companySize.trim()
            : null;
      }
      if ("companyBio" in body) {
        profileUpdates.companyBio =
          typeof body.companyBio === "string" &&
          body.companyBio.trim()
            ? body.companyBio.trim()
            : null;
      }
      if ("hiringLocations" in body) {
        profileUpdates.hiringLocations =
          typeof body.hiringLocations === "string" &&
          body.hiringLocations.trim()
            ? body.hiringLocations.trim()
            : null;
      }
      if ("hiringFocus" in body) {
        profileUpdates.hiringFocus =
          typeof body.hiringFocus === "string" &&
          body.hiringFocus.trim()
            ? body.hiringFocus.trim()
            : null;
      }
      if ("hiringNotes" in body) {
        profileUpdates.hiringNotes =
          typeof body.hiringNotes === "string" &&
          body.hiringNotes.trim()
            ? body.hiringNotes.trim()
            : null;
      }

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updatedAt = new Date();

        const [existingProfile] = await db
          .select()
          .from(employerProfiles)
          .where(eq(employerProfiles.userId, userId))
          .limit(1);

        if (!existingProfile) {
          await db.insert(employerProfiles).values({
            userId,
            ...profileUpdates,
          });
        } else {
          await db
            .update(employerProfiles)
            .set(profileUpdates)
            .where(eq(employerProfiles.userId, userId));
        }
      }
    }

    // --- 3) Return updated full profile ------------------------------------------ //
    const full = await getFullProfile(userId);
    if (!full) {
      return NextResponse.json(
        { message: "Profile updated, but user not found" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        ...full,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/profile] PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}
