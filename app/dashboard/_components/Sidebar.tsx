"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Bookmark,
  FileText,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const AUTH_TOKEN_KEY = "hireorbit_token";
// If you decide to store role in localStorage as well:
// const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const candidateNav: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    label: "My Applications",
    href: "/dashboard/applications",
    icon: FileText,
  },
  {
    label: "Saved Jobs",
    href: "/dashboard/saved-jobs",
    icon: Bookmark,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const employerNav: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    label: "Job Posts",
    href: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    label: "Post a Job",
    href: "/dashboard/jobs-new",
    icon: FileText,
  },
  {
    label: "Candidates",
    href: "/dashboard/candidates",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  role: Role; // pass "candidate" or "employer" from your layout/page
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = role === "candidate" ? candidateNav : employerNav;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      // window.localStorage.removeItem(ROLE_KEY); // if you store role
    }
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Top brand / role */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">HireOrbit</span>
          <span className="text-xs text-muted-foreground">
            {role === "candidate"
              ? "Candidate Dashboard"
              : "Employer Dashboard"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            // ✅ Fixed active logic
            const isDashboardRoot = item.href === "/dashboard";

            const isActive = isDashboardRoot
              ? pathname === "/dashboard"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "mb-1 flex w-full justify-start gap-2 rounded-full px-3 py-2 text-sm",
                  isActive && "font-semibold"
                )}
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="mt-auto border-t px-3 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Signed in as</span>
          <span className="capitalize">{role}</span>
        </div>
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start gap-2 rounded-full px-3 py-2 text-sm text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
