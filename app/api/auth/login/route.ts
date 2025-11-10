// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { verifyPassword, signJwt } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role: "candidate" | "employer";
    } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq, and }) =>
        and(eq(u.email, email), eq(u.role, role)),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.provider !== "credentials") {
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in. Please login with Google.",
        },
        { status: 400 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "No password set for this account" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signJwt({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      provider: "credentials",
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
        },
        token,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
