// app/api/settings/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { userSettings } from "@/config/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

type Theme = "system" | "light" | "dark";

type SettingsPayload = {
  jobAlertsEmail?: boolean;
  jobAlertsPush?: boolean;
  activityEmails?: boolean;
  marketingEmails?: boolean;
  loginAlerts?: boolean;
  twoFactor?: boolean;
  theme?: Theme;
};

/* ---------- Helpers ---------- */

function defaultSettings(): Required<SettingsPayload> {
  return {
    jobAlertsEmail: true,
    jobAlertsPush: true,
    activityEmails: true,
    marketingEmails: false,
    loginAlerts: true,
    twoFactor: false,
    theme: "system",
  };
}

/* ---------- GET /api/settings ---------- */

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

    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // If no row yet, use defaults (and optionally insert)
    if (!row) {
      const defaults = defaultSettings();

      // Optionally persist defaults now:
      await db.insert(userSettings).values({
        userId,
        ...defaults,
      });

      return NextResponse.json(defaults, { status: 200 });
    }

    const result: Required<SettingsPayload> = {
      jobAlertsEmail: row.jobAlertsEmail,
      jobAlertsPush: row.jobAlertsPush,
      activityEmails: row.activityEmails,
      marketingEmails: row.marketingEmails,
      loginAlerts: row.loginAlerts,
      twoFactor: row.twoFactor,
      theme: (row.theme as Theme) || "system",
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[/api/settings] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH /api/settings ---------- */

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

    const body = (await req.json().catch(() => null)) as SettingsPayload | null;
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate theme if provided
    if (body.theme && !["system", "light", "dark"].includes(body.theme)) {
      return NextResponse.json(
        { message: "Invalid theme value" },
        { status: 400 }
      );
    }

    // Check if row exists
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const now = new Date();

    if (!existing) {
      // Insert new row with defaults + overrides
      const defaults = defaultSettings();

      const merged: Required<SettingsPayload> = {
        ...defaults,
        ...body,
      };

      await db.insert(userSettings).values({
        userId,
        ...merged,
        updatedAt: now,
      });

      return NextResponse.json(merged, { status: 200 });
    }

    // Update existing row with partial fields
    const updateData: Partial<typeof userSettings.$inferInsert> = {
      updatedAt: now,
    };

    if (typeof body.jobAlertsEmail === "boolean") {
      updateData.jobAlertsEmail = body.jobAlertsEmail;
    }
    if (typeof body.jobAlertsPush === "boolean") {
      updateData.jobAlertsPush = body.jobAlertsPush;
    }
    if (typeof body.activityEmails === "boolean") {
      updateData.activityEmails = body.activityEmails;
    }
    if (typeof body.marketingEmails === "boolean") {
      updateData.marketingEmails = body.marketingEmails;
    }
    if (typeof body.loginAlerts === "boolean") {
      updateData.loginAlerts = body.loginAlerts;
    }
    if (typeof body.twoFactor === "boolean") {
      updateData.twoFactor = body.twoFactor;
    }
    if (body.theme) {
      updateData.theme = body.theme;
    }

    await db
      .update(userSettings)
      .set(updateData)
      .where(eq(userSettings.userId, userId));

    // Respond with merged settings
    const merged: Required<SettingsPayload> = {
      jobAlertsEmail:
        typeof body.jobAlertsEmail === "boolean"
          ? body.jobAlertsEmail
          : existing.jobAlertsEmail,
      jobAlertsPush:
        typeof body.jobAlertsPush === "boolean"
          ? body.jobAlertsPush
          : existing.jobAlertsPush,
      activityEmails:
        typeof body.activityEmails === "boolean"
          ? body.activityEmails
          : existing.activityEmails,
      marketingEmails:
        typeof body.marketingEmails === "boolean"
          ? body.marketingEmails
          : existing.marketingEmails,
      loginAlerts:
        typeof body.loginAlerts === "boolean"
          ? body.loginAlerts
          : existing.loginAlerts,
      twoFactor:
        typeof body.twoFactor === "boolean"
          ? body.twoFactor
          : existing.twoFactor,
      theme: (body.theme as Theme) || (existing.theme as Theme) || "system",
    };

    return NextResponse.json(merged, { status: 200 });
  } catch (error) {
    console.error("[/api/settings] PATCH error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
