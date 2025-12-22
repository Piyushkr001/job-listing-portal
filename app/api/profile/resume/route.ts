// app/api/profile/resume/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { userProfiles } from "@/config/schema";
import { verifyJwt } from "@/lib/auth";
import { eq } from "drizzle-orm";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const runtime = "nodejs";

// Helper: extract and verify candidate from Authorization header
async function requireCandidate(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const token = authHeader.slice(7);
  const payload = verifyJwt(token);

  if (!payload || !payload.sub) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  if (payload.role !== "candidate") {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { userId: payload.sub as string };
}

/* ---------- GET: current resume URL ---------- */

export async function GET(req: Request) {
  try {
    const { error, userId } = await requireCandidate(req);
    if (error || !userId) return error!;

    const [profile] = await db
      .select({
        resumeUrl: userProfiles.resumeUrl,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return NextResponse.json(
      {
        url: profile?.resumeUrl ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/profile/resume] GET error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- POST: upload & save resume ---------- */

export async function POST(req: Request) {
  try {
    const { error, userId } = await requireCandidate(req);
    if (error || !userId) return error!;

    const formData = await req.formData();
    const file = formData.get("resume");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "Missing resume file" },
        { status: 400 }
      );
    }

    // Simple validation
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Only PDF or Word files are allowed" },
        { status: 400 }
      );
    }

    // Store file under /public/uploads/resumes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadsDir, { recursive: true });

    const sanitizedName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const fileName = `${userId}-${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    // This is how the file will be accessible from the browser
    const publicUrl = `/uploads/resumes/${fileName}`;

    // Upsert into user_profiles
    const now = new Date();
    await db
      .insert(userProfiles)
      .values({
        userId,
        resumeUrl: publicUrl,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          resumeUrl: publicUrl,
          updatedAt: now,
        },
      });

    return NextResponse.json(
      { url: publicUrl, message: "Resume uploaded successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/profile/resume] POST error:", err);
    return NextResponse.json(
      { message: "Failed to upload resume" },
      { status: 500 }
    );
  }
}
