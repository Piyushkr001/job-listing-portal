// app/dashboard/layout.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "./_components/Sidebar";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<"candidate" | "employer" | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      // Not logged in -> send to login
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(
      ROLE_KEY
    ) as "candidate" | "employer" | null;

    // Fallback to candidate if role is missing/invalid
    setRole(storedRole === "employer" ? "employer" : "candidate");
  }, [router]);

  // Simple loading state while we resolve role/auth
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30 md:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-b bg-background md:h-screen md:w-64 md:border-b-0 md:border-r">
        <DashboardSidebar role={role} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
