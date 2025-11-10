// app/api/auth/google-login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { signJwt } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      role,
      idToken,
      companyName,
    }: {
      role: "candidate" | "employer";
      idToken: string;
      companyName?: string;
    } = body;

    if (!role || !idToken) {
      return NextResponse.json(
        { error: "Missing role or idToken" },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    if (!googleUser) {
      return NextResponse.json(
        { error: "Invalid Google token" },
        { status: 401 }
      );
    }

    // Check existing account by googleId OR email
    const existingByGoogleId = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.googleId, googleUser.sub),
    });

    const existingByEmail = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, googleUser.email),
    });

    let userRecord =
      existingByGoogleId ??
      existingByEmail; // might be credentials user reusing email

    // If existing credentials user with same email:
    if (userRecord && userRecord.provider === "credentials") {
      // Option 1: forbid Google login for this email
      // Option 2 (below): upgrade to support Google too.
      // Here we'll "link" Google to this account.
      if (!userRecord.googleId) {
        const [updated] = await db
          .update(users)
          .set({
            googleId: googleUser.sub,
            provider: "google", // or keep "credentials" and track separately if you want multi-provider
          })
          .where(eq(users.id, userRecord.id))
          .returning();
        userRecord = updated;
      }
    }

    // If no user, create new
    if (!userRecord) {
      const [created] = await db
        .insert(users)
        .values({
          name: googleUser.name ?? googleUser.email.split("@")[0],
          email: googleUser.email,
          googleId: googleUser.sub,
          provider: "google",
          role,
          companyName: role === "employer" ? companyName ?? null : null,
        })
        .returning();
      userRecord = created;
    } else {
      // Optional: ensure role matches
      if (userRecord.role !== role) {
        // You can decide whether to allow switching role or not.
        // Here, we’ll just return an error.
        return NextResponse.json(
          {
            error:
              "This Google account is already registered with a different role.",
          },
          { status: 400 }
        );
      }
    }

    const token = signJwt({
      sub: userRecord.id,
      email: userRecord.email,
      role: userRecord.role as any,
      provider: "google",
    });

    return NextResponse.json(
      {
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
          companyName: userRecord.companyName,
        },
        token,
      },
      { status: existingByGoogleId || existingByEmail ? 200 : 201 }
    );
  } catch (err) {
    console.error("Google login route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
