// app/dashboard/jobs/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Briefcase,
  Plus,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

// ✅ Option A: only these statuses exist in DB enum
type JobStatus = "draft" | "open" | "closed";

type EmployerJobItem = {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  remote: boolean;
  status: JobStatus;
  createdAt: string;
  applicationsCount: number;
};

type EmployerJobsResponse = {
  jobs: EmployerJobItem[];
};

export default function EmployerJobsPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState<EmployerJobItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<
    "all" | "open" | "draft" | "closed"
  >("all");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (storedRole !== "employer") {
      toast.error("Dashboard jobs are only available for employers.");
      router.replace("/jobs");
      return;
    }

    setRole(storedRole);

    let cancelled = false;

    const loadJobs = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get<EmployerJobsResponse>(
          "/api/employer/jobs",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (cancelled) return;

        // Defensive normalize (if older UI ever produced "paused")
        const normalized = (data.jobs || []).map((j) => ({
          ...j,
          status: (j.status === ("paused" as any) ? "closed" : j.status) as JobStatus,
        }));

        setJobs(normalized);
      } catch (error) {
        console.error("[EmployerJobs] load error:", error);
        toast.error("Failed to load your jobs. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handlePostJob = () => {
    router.push("/dashboard/jobs-new");
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "all") return true;
    return job.status === activeTab;
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const draftJobs = jobs.filter((j) => j.status === "draft").length;
  const closedJobs = jobs.filter((j) => j.status === "closed").length;
  const totalApplications = jobs.reduce(
    (sum, j) => sum + (j.applicationsCount || 0),
    0
  );

  if (loading || !role) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <JobsHeader onPostJob={handlePostJob} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-1 flex-col gap-4">
          <JobsListCard
            jobs={filteredJobs}
            total={totalJobs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-xs">
          <JobsStatsCard
            totalJobs={totalJobs}
            openJobs={openJobs}
            draftJobs={draftJobs}
            closedJobs={closedJobs}
            totalApplications={totalApplications}
          />
        </div>
      </div>
    </div>
  );
}

function JobsHeader({ onPostJob }: { onPostJob: () => void }) {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Briefcase className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            Your job postings
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Manage all the roles you&apos;ve posted on HireOrbit and keep an eye
            on candidate activity.
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Employer workspace
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Post, or close openings as your hiring needs change.
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-start md:justify-end">
        <Button
          type="button"
          size="sm"
          className="inline-flex items-center gap-2 rounded-full"
          onClick={onPostJob}
        >
          <Plus className="h-4 w-4" />
          Post a new job
        </Button>
      </div>
    </header>
  );
}

function JobsListCard({
  jobs,
  total,
  activeTab,
  setActiveTab,
}: {
  jobs: EmployerJobItem[];
  total: number;
  activeTab: "all" | "open" | "draft" | "closed";
  setActiveTab: (v: "all" | "open" | "draft" | "closed") => void;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">Job postings</CardTitle>
            <p className="text-xs text-muted-foreground">
              Showing {jobs.length} of {total} jobs based on the selected status.
            </p>
          </div>

          {/* ✅ Removed paused */}
          <TabsList className="grid w-full grid-cols-4 md:inline-flex md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="space-y-3">
          <TabsContent value={activeTab} className="mt-0 space-y-3">
            {jobs.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <p>No jobs under this status yet.</p>
                <p>Try switching tabs or posting a new job.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <EmployerJobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

function EmployerJobCard({ job }: { job: EmployerJobItem }) {
  const router = useRouter();
  const createdDate = new Date(job.createdAt);

  const statusConfig: Record<
    JobStatus,
    { label: string; Icon: React.ComponentType<any>; className: string }
  > = {
    draft: {
      label: "Draft",
      Icon: CircleDot,
      className: "border-border bg-muted text-muted-foreground",
    },
    open: {
      label: "Open",
      Icon: CheckCircle2,
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    closed: {
      label: "Closed",
      Icon: CircleDot,
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  };

  const statusMeta = statusConfig[job.status];
  const workModeLabel = job.remote ? "Remote" : "On-site";

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{job.title}</span>
            <Badge
              variant="outline"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${statusMeta.className}`}
            >
              <statusMeta.Icon className="h-3 w-3" />
              {statusMeta.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.employmentType || "Role"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Posted{" "}
              {createdDate.toLocaleDateString(undefined, {
                month: "short",
                day: "2-digit",
              })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.applicationsCount} application{job.applicationsCount === 1 ? "" : "s"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span>{workModeLabel}</span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
          >
            View applications
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
          >
            Manage posting
          </Button>
        </div>
      </div>

      <p className="mt-1 max-w-3xl text-[11px] text-muted-foreground">
        Track candidates or update the status from the manage posting screen.
      </p>
    </div>
  );
}

function JobsStatsCard({
  totalJobs,
  openJobs,
  draftJobs,
  closedJobs,
  totalApplications,
}: {
  totalJobs: number;
  openJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Hiring snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Total jobs" value={totalJobs} />
          <StatTile label="Open roles" value={openJobs} emphasis />
          <StatTile label="Drafts" value={draftJobs} />
          <StatTile label="Closed" value={closedJobs} />
          <StatTile label="Total applications" value={totalApplications} wide />
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  emphasis,
  wide,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-lg border bg-card px-3 py-2 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-base font-semibold ${emphasis ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}
