"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Star,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<Role>("candidate");

  // Read role (and optionally token) from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      // Not logged in -> send to login
      router.push("/login");
      return;
    }

    if (storedRole === "candidate" || storedRole === "employer") {
      setRole(storedRole);
    } else {
      setRole("candidate");
    }
  }, [router]);

  return (
    // ❗ No sidebar, no outer flex with sidebar – layout will wrap this
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <DashboardHeader role={role} />
      <DashboardStatsRow role={role} />
      <DashboardMainContent role={role} />
    </div>
  );
}

/* ---------- HEADER ---------- */

function DashboardHeader({ role }: { role: Role }) {
  return (
    <header className="flex flex-col justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm md:flex-row md:items-center md:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight md:text-2xl">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          {role === "candidate" ? "Candidate Dashboard" : "Employer Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "candidate"
            ? "Track your job search, applications, and interview progress in one place."
            : "Manage job posts, candidates, and your hiring pipeline from a unified hub."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {role === "candidate" ? (
          <>
            <Button size="sm" variant="outline" className="rounded-full">
              View profile
            </Button>
            <Button size="sm" className="rounded-full">
              Browse jobs
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" className="rounded-full">
              View all jobs
            </Button>
            <Button size="sm" className="rounded-full">
              Post a job
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

/* ---------- STATS ROW ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="flex flex-1 flex-col border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardStatsRow({ role }: { role: Role }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {role === "candidate" ? (
        <>
          <StatCard
            icon={Briefcase}
            label="Active applications"
            value="4"
            hint="You have 2 interviews scheduled this week."
          />
          <StatCard
            icon={CalendarClock}
            label="Upcoming interviews"
            value="2"
            hint="Next interview: Wed · 3:00 PM"
          />
          <StatCard
            icon={Star}
            label="Saved jobs"
            value="9"
            hint="Don’t forget to apply before they expire."
          />
        </>
      ) : (
        <>
          <StatCard
            icon={Briefcase}
            label="Open roles"
            value="6"
            hint="2 roles have draft candidates waiting review."
          />
          <StatCard
            icon={Users}
            label="Active candidates"
            value="27"
            hint="Across all open roles this month."
          />
          <StatCard
            icon={CalendarClock}
            label="Interviews this week"
            value="5"
            hint="Keep your pipeline moving forward."
          />
        </>
      )}
    </section>
  );
}

/* ---------- MAIN CONTENT ---------- */

function DashboardMainContent({ role }: { role: Role }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
      {role === "candidate" ? (
        <>
          <CandidateApplicationsPanel />
          <CandidateRecommendedJobsPanel />
        </>
      ) : (
        <>
          <EmployerJobsPanel />
          <EmployerPipelinePanel />
        </>
      )}
    </section>
  );
}

/* ---------- CANDIDATE PANELS ---------- */

function CandidateApplicationsPanel() {
  const items = [
    {
      company: "Orbit Labs",
      title: "Frontend Engineer",
      status: "Interview",
      step: "2nd round · Hiring Manager",
      updated: "2 days ago",
    },
    {
      company: "NovaPay",
      title: "React Developer",
      status: "Applied",
      step: "Application received",
      updated: "5 days ago",
    },
    {
      company: "Skyline Systems",
      title: "Full-Stack Engineer",
      status: "Screening",
      step: "Recruiter reviewing",
      updated: "1 day ago",
    },
  ];

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Recent applications
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Stay on top of where you are in each company’s hiring process.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{item.title}</div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {item.status}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{item.company}</span>
              <span>{item.updated}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.step}</p>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-full rounded-full text-xs"
        >
          View all applications
        </Button>
      </CardContent>
    </Card>
  );
}

function CandidateRecommendedJobsPanel() {
  const jobs = [
    {
      company: "NebulaWorks",
      title: "Senior React Engineer",
      type: "Full-time · Remote",
    },
    {
      company: "Aurora Health",
      title: "Frontend Developer",
      type: "Hybrid · Bengaluru",
    },
    {
      company: "PixelCraft",
      title: "UI Engineer",
      type: "On-site · Pune",
    },
  ];

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Recommended for you
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on your skills and recent activity.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{job.title}</p>
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{job.company}</p>
            <p className="text-xs text-muted-foreground">{job.type}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="rounded-full px-3 py-1 text-[11px]">
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-[11px]"
              >
                Save
              </Button>
            </div>
          </div>
        ))}

        <Separator className="my-2" />

        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-full text-xs"
        >
          Browse all jobs
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER PANELS ---------- */

function EmployerJobsPanel() {
  const jobs = [
    {
      title: "Senior Frontend Engineer",
      location: "Remote · India",
      status: "Open",
      applicants: 18,
      updated: "Today",
    },
    {
      title: "Product Designer",
      location: "Hybrid · Bengaluru",
      status: "Open",
      applicants: 9,
      updated: "2 days ago",
    },
    {
      title: "Full-Stack Engineer",
      location: "On-site · Mumbai",
      status: "Draft",
      applicants: 0,
      updated: "Just now",
    },
  ];

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Recent job posts
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Track performance of your latest openings.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {jobs.map((job, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{job.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  job.status === "Open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {job.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{job.location}</p>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{job.applicants} applicants</span>
              <span>Updated {job.updated}</span>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-full rounded-full text-xs"
        >
          View all job posts
        </Button>
      </CardContent>
    </Card>
  );
}

function EmployerPipelinePanel() {
  const stages = [
    {
      label: "New",
      count: 12,
      icon: FileText,
    },
    {
      label: "Screening",
      count: 8,
      icon: Users,
    },
    {
      label: "Interviewing",
      count: 5,
      icon: CalendarClock,
    },
    {
      label: "Offers",
      count: 2,
      icon: CheckCircle2,
    },
  ];

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Pipeline snapshot
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Quick view of where candidates currently are across roles.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {stage.count} candidate(s)
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
              >
                View
              </Button>
            </div>
          );
        })}

        <Separator className="my-2" />

        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-full text-xs"
        >
          Open candidate pipeline
        </Button>
      </CardContent>
    </Card>
  );
}
