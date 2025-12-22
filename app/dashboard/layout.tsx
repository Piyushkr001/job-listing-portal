// app/dashboard/layout.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "./_components/Sidebar";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<Role | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    setRole(storedRole === "employer" ? "employer" : "candidate");
  }, [router]);

  if (!role) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    // IMPORTANT: do NOT force h-screen here if you have a footer on the site
    <div className="bg-muted/30">
      <div className="flex w-full max-w-7xl flex-col md:flex-row">
        {/* Desktop sticky sidebar, Mobile topbar handled inside Sidebar */}
        <DashboardSidebar role={role} />

        {/* Main content */}
        <main className="flex-1 px-3 py-4 sm:px-4 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
