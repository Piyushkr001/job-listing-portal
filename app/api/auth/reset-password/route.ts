// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users, passwordResetTokens } from "@/config/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as
      | { email?: string; otp?: string; newPassword?: string; confirmPassword?: string }
      | null;

    const email = body?.email?.trim().toLowerCase();
    const otp = body?.otp?.trim();
    const newPassword = body?.newPassword?.trim();
    const confirmPassword = body?.confirmPassword?.trim();

    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Email, OTP, and both password fields are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Generic message (don't reveal account existence)
      return NextResponse.json(
        { message: "Invalid OTP or email." },
        { status: 400 }
      );
    }

    const now = new Date();

    // Get the latest unused token for this user
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.used, false),
          //@ts-ignore
          lt(now, passwordResetTokens.expiresAt) // still valid
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);

    const tokenRow = tokens[0];

    if (!tokenRow) {
      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    const isOtpValid = await bcrypt.compare(otp, tokenRow.otpHash);
    if (!isOtpValid) {
      return NextResponse.json(
        { message: "Invalid OTP." },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const newHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        // If you want, you can also set provider to "credentials"
        // provider: "credentials",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenRow.id));

    return NextResponse.json(
      { message: "Password has been reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/auth/reset-password] error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
