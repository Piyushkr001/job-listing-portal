"use client";

import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
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

/* ---------- API RESPONSE TYPES ---------- */

type CandidateDashboardResponse = {
  stats: {
    activeApplications: number;
    upcomingInterviews: number;
    savedJobs: number;
  };
  recentApplications: {
    id: string;
    jobId: string;
    company: string;
    title: string;
    status: string;
    step: string;
    updatedAt: string; // ISO string
  }[];
  recommendedJobs: {
    id: string;
    company: string;
    title: string;
    type: string;
  }[];
};

// What your /api/dashboard/employer should return
type EmployerDashboardResponse = {
  stats: {
    openRoles: number;
    activeCandidates: number;
    interviewsThisWeek: number;
  };
  recentJobs: {
    id: string;
    title: string;
    location: string;
    status: "Open" | "Draft" | string;
    applicants: number;
    updatedAt: string; // ISO string
  }[];
  pipeline: {
    label: string;
    count: number;
  }[];
};

type DashboardData = CandidateDashboardResponse | EmployerDashboardResponse;

export default function DashboardPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // 1) Read token + role from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;

    if (!storedToken) {
      router.replace("/login");
      return;
    }

    setToken(storedToken);
    setRole(
      storedRole === "employer" || storedRole === "candidate"
        ? storedRole
        : "candidate"
    );
  }, [router]);

  // 2) Fetch dashboard data whenever role/token is ready
  React.useEffect(() => {
    if (!token || !role) return;

    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const url =
          role === "candidate"
            ? "/api/dashboard/candidate"
            : "/api/dashboard/employer";

        const res = await axios.get<DashboardData>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cancelled) {
          // If backend returns empty object/null, treat as "no data"
          const payload = res.data;
          if (!payload || Object.keys(payload).length === 0) {
            setData(null);
          } else {
            setData(payload);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to load dashboard data:", error);
          toast.error("Failed to load dashboard. Showing empty state.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [role, token]);

  // Still determining auth
  if (!role || !token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // While fetching -> skeletons
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-20 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  // If loading is done but there's no data -> full-page empty state
  if (!data) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <DashboardHeader role={role} />
        <DashboardEmptyState role={role} />
      </div>
    );
  }

  const isCandidate = role === "candidate";
  const candidateData = isCandidate
    ? (data as CandidateDashboardResponse)
    : null;
  const employerData = !isCandidate
    ? (data as EmployerDashboardResponse)
    : null;

  const hasCandidateContent =
    !!candidateData &&
    (candidateData.stats.activeApplications > 0 ||
      candidateData.stats.upcomingInterviews > 0 ||
      candidateData.stats.savedJobs > 0 ||
      candidateData.recentApplications.length > 0 ||
      candidateData.recommendedJobs.length > 0);

  const hasEmployerContent =
    !!employerData &&
    (employerData.stats.openRoles > 0 ||
      employerData.stats.activeCandidates > 0 ||
      employerData.stats.interviewsThisWeek > 0 ||
      employerData.recentJobs.length > 0 ||
      employerData.pipeline.length > 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <DashboardHeader role={role} />

      {isCandidate && candidateData && hasCandidateContent && (
        <>
          <DashboardStatsRow role="candidate" data={candidateData} />
          <DashboardMainContent role="candidate" data={candidateData} />
        </>
      )}

      {isCandidate && candidateData && !hasCandidateContent && (
        <DashboardEmptyState role="candidate" />
      )}

      {!isCandidate && employerData && hasEmployerContent && (
        <>
          <DashboardStatsRow role="employer" data={employerData} />
          <DashboardMainContent role="employer" data={employerData} />
        </>
      )}

      {!isCandidate && employerData && !hasEmployerContent && (
        <DashboardEmptyState role="employer" />
      )}
    </div>
  );
}

/* ---------- EMPTY STATE (full page) ---------- */

function DashboardEmptyState({ role }: { role: Role }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border bg-background/60 px-6 py-10 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
      <h2 className="text-base font-semibold">
        {role === "candidate" ? "No activity yet" : "No hiring activity yet"}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {role === "candidate"
          ? "When you start applying to jobs, your applications and recommendations will appear here."
          : "Once you create job posts and start receiving candidates, your hiring activity will show up here."}
      </p>
      {role === "candidate" ? (
        <Button
          className="mt-4 rounded-full"
          size="sm"
          onClick={() => router.push("/jobs")}
        >
          Browse jobs
        </Button>
      ) : (
        <Button
          className="mt-4 rounded-full"
          size="sm"
          onClick={() => router.push("/dashboard/jobs/new")}
        >
          Post your first job
        </Button>
      )}
    </div>
  );
}

/* ---------- HEADER ---------- */

function DashboardHeader({ role }: { role: Role }) {
  const router = useRouter();

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
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/dashboard/profile")}
            >
              View profile
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => router.push("/jobs")}
            >
              Browse jobs
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/dashboard/jobs")}
            >
              View all jobs
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => router.push("/dashboard/jobs-new")}
            >
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
  value: string | number;
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
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardStatsRow({
  role,
  data,
}: {
  role: Role;
  data: CandidateDashboardResponse | EmployerDashboardResponse;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {role === "candidate" ? (
        (() => {
          const d = data as CandidateDashboardResponse;
          return (
            <>
              <StatCard
                icon={Briefcase}
                label="Active applications"
                value={d.stats.activeApplications}
                hint="You have applications currently in progress."
              />
              <StatCard
                icon={CalendarClock}
                label="Upcoming interviews"
                value={d.stats.upcomingInterviews}
                hint="Check your inbox for interview details."
              />
              <StatCard
                icon={Star}
                label="Saved jobs"
                value={d.stats.savedJobs}
                hint="Don’t forget to apply before they expire."
              />
            </>
          );
        })()
      ) : (
        (() => {
          const d = data as EmployerDashboardResponse;
          return (
            <>
              <StatCard
                icon={Briefcase}
                label="Open roles"
                value={d.stats.openRoles}
                hint="Roles currently visible to candidates."
              />
              <StatCard
                icon={Users}
                label="Active candidates"
                value={d.stats.activeCandidates}
                hint="Across all open roles this month."
              />
              <StatCard
                icon={CalendarClock}
                label="Interviews this week"
                value={d.stats.interviewsThisWeek}
                hint="Keep your pipeline moving forward."
              />
            </>
          );
        })()
      )}
    </section>
  );
}

/* ---------- MAIN CONTENT ---------- */

function DashboardMainContent({
  role,
  data,
}: {
  role: Role;
  data: CandidateDashboardResponse | EmployerDashboardResponse;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
      {role === "candidate" ? (
        <>
          <CandidateApplicationsPanel
            applications={(data as CandidateDashboardResponse).recentApplications}
          />
          <CandidateRecommendedJobsPanel
            jobs={(data as CandidateDashboardResponse).recommendedJobs}
          />
        </>
      ) : (
        <>
          <EmployerJobsPanel jobs={(data as EmployerDashboardResponse).recentJobs} />
          <EmployerPipelinePanel stages={(data as EmployerDashboardResponse).pipeline} />
        </>
      )}
    </section>
  );
}

/* ---------- CANDIDATE PANELS ---------- */

function CandidateApplicationsPanel({
  applications,
}: {
  applications: CandidateDashboardResponse["recentApplications"];
}) {
  const router = useRouter();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent applications</CardTitle>
        <p className="text-xs text-muted-foreground">
          Stay on top of where you are in each company’s hiring process.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {applications.length === 0 && (
          <p className="text-xs text-muted-foreground">
            You haven&apos;t applied to any jobs yet.
          </p>
        )}

        {applications.map((item) => (
          <div
            key={item.id}
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
              <span>Updated {formatDate(item.updatedAt)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.step}</p>
          </div>
        ))}

        {/* ✅ IMPLEMENTED */}
        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-full rounded-full text-xs"
          onClick={() => router.push("/dashboard/applications")}
        >
          View all applications
        </Button>
      </CardContent>
    </Card>
  );
}

function CandidateRecommendedJobsPanel({
  jobs,
}: {
  jobs: CandidateDashboardResponse["recommendedJobs"];
}) {
  const router = useRouter();

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recommended for you</CardTitle>
        <p className="text-xs text-muted-foreground">Based on your skills and recent activity.</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            We don&apos;t have any recommendations yet. Start applying or updating your profile.
          </p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{job.title}</p>
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{job.company}</p>
            <p className="text-xs text-muted-foreground capitalize">{job.type}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="rounded-full px-3 py-1 text-[11px]"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
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
          onClick={() => router.push("/jobs")}
        >
          Browse all jobs
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER PANELS ---------- */

function EmployerJobsPanel({
  jobs,
}: {
  jobs: EmployerDashboardResponse["recentJobs"];
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });

  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent job posts</CardTitle>
        <p className="text-xs text-muted-foreground">
          Track performance of your latest openings.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            You haven&apos;t posted any jobs yet.
          </p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
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
              <span>Updated {formatDate(job.updatedAt)}</span>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" className="mt-1 w-full rounded-full text-xs">
          View all job posts
        </Button>
      </CardContent>
    </Card>
  );
}

function EmployerPipelinePanel({
  stages,
}: {
  stages: EmployerDashboardResponse["pipeline"];
}) {
  return (
    <Card className="flex h-full flex-col border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Pipeline snapshot</CardTitle>
        <p className="text-xs text-muted-foreground">
          Quick view of where candidates currently are across roles.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {stages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No candidates in the pipeline yet.
          </p>
        )}

        {stages.map((stage, idx) => {
          const Icon =
            [FileText, Users, CalendarClock, CheckCircle2][idx] || FileText;

          return (
            <div
              key={stage.label}
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
              <Button variant="ghost" size="sm" className="rounded-full text-xs">
                View
              </Button>
            </div>
          );
        })}

        <Separator className="my-2" />

        <Button variant="ghost" size="sm" className="w-full rounded-full text-xs">
          Open candidate pipeline
        </Button>
      </CardContent>
    </Card>
  );
}
