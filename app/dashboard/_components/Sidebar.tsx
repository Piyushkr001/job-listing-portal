"use client";

import * as React from "react";
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
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const AUTH_TOKEN_KEY = "hireorbit_token";

type Role = "candidate" | "employer";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const candidateNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/profile", icon: User },
  { label: "My Applications", href: "/dashboard/applications", icon: FileText },
  { label: "Saved Jobs", href: "/dashboard/saved-jobs", icon: Bookmark },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const employerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/profile", icon: User },
  { label: "Job Posts", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Post a Job", href: "/dashboard/jobs-new", icon: FileText },
  { label: "Candidates", href: "/dashboard/candidates", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === "candidate" ? candidateNav : employerNav;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    router.push("/login");
  };

  const isActive = (href: string) => {
    const isDashboardRoot = href === "/dashboard";
    return isDashboardRoot ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b px-4 py-4">
        <div className="text-sm font-semibold">HireOrbit</div>
        <div className="text-xs text-muted-foreground">
          {role === "candidate" ? "Candidate Dashboard" : "Employer Dashboard"}
        </div>
      </div>

      {/* Links */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "mb-1 flex w-full justify-start gap-2 rounded-full px-3 py-2 text-sm",
                  active && "font-semibold"
                )}
              >
                <Link href={item.href} onClick={onNavigate}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t px-3 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Signed in as</span>
          <span className="capitalize">{role}</span>
        </div>
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start gap-2 rounded-full px-3 py-2 text-sm text-destructive hover:text-destructive"
          onClick={() => {
            onNavigate?.();
            handleLogout();
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE: sticky topbar under the site navbar */}
      <div className="sticky top-16 z-40 border-b bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="text-sm">Menu</SheetTitle>
              </SheetHeader>

              {/* Close sheet on navigate: dispatch escape */}
              <NavBody
                onNavigate={() =>
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
                }
              />
            </SheetContent>
          </Sheet>

          <div className="leading-tight">
            <div className="text-sm font-semibold">Dashboard</div>
            <div className="text-xs text-muted-foreground capitalize">{role} view</div>
          </div>
        </div>
      </div>

      {/* DESKTOP: sticky sidebar under the site navbar; does NOT overlap footer */}
      <aside className="hidden md:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background">
          <NavBody />
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
