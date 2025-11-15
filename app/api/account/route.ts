// app/api/account/route.ts

import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
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

    // IMPORTANT: Make sure foreign keys that reference `users.id`
    // use `onDelete: "cascade"` in your Drizzle schema (for example:
    // `userSettings`, `savedJobs`, etc.) so related rows are cleaned up.
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/account] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
