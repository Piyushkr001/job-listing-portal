// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users, passwordResetTokens } from "@/config/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const runtime = "nodejs"; // required for nodemailer

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string }
      | null;

    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always respond generically (don’t reveal if the email exists)
    const genericSuccess = NextResponse.json({
      message: "If an account exists for this email, an OTP has been sent.",
    });

    if (!user) {
      return genericSuccess;
    }

    // 1) Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2) Clear old tokens
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // 3) Insert new token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      otpHash,
      expiresAt,
      used: false,
    });

    const appName = "HireOrbit";

    // 4) If SMTP is not configured, just log the OTP in dev and return success
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.warn(
        "[forgot-password] SMTP not configured. OTP for dev:",
        otp,
        "for email:",
        user.email
      );
      return genericSuccess;
    }

    // 5) Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // change to true if using 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromEmail =
      process.env.SMTP_FROM ||
      `"${appName} Support" <no-reply@hireorbit.com>`;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: user.email,
        subject: `${appName} password reset OTP`,
        text: `Your password reset OTP is ${otp}. It is valid for 10 minutes.`,
        html: `
          <p>Hi ${user.name || ""},</p>
          <p>Your <strong>${appName}</strong> password reset OTP is:</p>
          <p style="font-size: 20px; font-weight: 600; letter-spacing: 4px;">
            ${otp}
          </p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      });
    } catch (mailError) {
      // Don’t break the flow if email sending fails (esp. in dev)
      console.error("[forgot-password] Failed to send email:", mailError);
    }

    return genericSuccess;
  } catch (error) {
    console.error("[/api/auth/forgot-password] error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
