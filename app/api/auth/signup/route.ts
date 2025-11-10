// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { hashPassword, signJwt } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      companyName,
    }: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      role: "candidate" | "employer";
      companyName?: string;
    } = body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists (any provider)
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        provider: "credentials",
        role,
        companyName: role === "employer" ? companyName ?? null : null,
      })
      .returning();

    const token = signJwt({
      sub: created.id,
      email: created.email,
      role: created.role as any,
      provider: "credentials",
    });

    return NextResponse.json(
      {
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          companyName: created.companyName,
        },
        token,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
