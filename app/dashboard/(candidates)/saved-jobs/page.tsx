// app/dashboard/saved-jobs/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Bookmark,
  Filter,
  Loader2,
  Building2,
  MapPin,
  Laptop2,
  Clock,
  Search,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

/* ---------- API Types ---------- */

type WorkMode = "onsite" | "remote" | "hybrid";
type JobType = "full-time" | "part-time" | "internship" | "contract";

type SavedJob = {
  id: string; // saved row id (still returned by API; not used for delete anymore)
  jobId: string; // job id
  jobTitle: string;
  company: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  status: "open" | "closed";
  applied: boolean;
  savedAt: string;
  salaryRange?: string | null;
};

type SavedJobsStats = {
  total: number;
  open: number;
  applied: number;
};

type SavedJobsResponse = {
  stats: SavedJobsStats;
  jobs: SavedJob[];
};

export default function SavedJobsPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [token, setToken] = React.useState<string>(""); // ✅ keep token in state
  const [loading, setLoading] = React.useState(true);
  const [loadingList, setLoadingList] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "open" | "applied">(
    "all"
  );
  const [search, setSearch] = React.useState("");
  const [data, setData] = React.useState<SavedJobsResponse | null>(null);

  const reload = React.useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const { data } = await axios.get<SavedJobsResponse>("/api/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data);
    } catch (error) {
      console.error("[Saved Jobs] reload error:", error);
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  // Load saved jobs
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (!storedRole || storedRole !== "candidate") {
      router.replace("/dashboard");
      return;
    }

    setRole(storedRole);
    setToken(t);

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadingList(true);

        const { data } = await axios.get<SavedJobsResponse>("/api/saved-jobs", {
          headers: { Authorization: `Bearer ${t}` },
        });

        if (!cancelled) setData(data);
      } catch (error) {
        console.error("[Saved Jobs] load error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingList(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !role) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <SavedJobsHeader />

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* LEFT: list + search + filters */}
        <div className="flex w-full flex-1 flex-col gap-4">
          <Card className="border bg-background shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Saved jobs
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Keep track of roles you&apos;re interested in and revisit them
                  anytime.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by role or company"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-1 rounded-full"
                  onClick={reload}
                  disabled={loadingList || !token}
                  title="Refresh"
                >
                  {loadingList ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {loadingList ? "Loading..." : "Refresh"}
                  </span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as "all" | "open" | "applied")
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open roles</TabsTrigger>
                  <TabsTrigger value="applied">Applied</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {loadingList ? (
                    <div className="flex min-h-40 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <SavedJobsList
                      data={data}
                      filter={activeTab}
                      search={search}
                      token={token}
                      onUpdate={setData}
                      onReload={reload}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: stats + tips */}
        <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-sm">
          <SavedJobsStatsCard data={data} />
          <SavedJobsTipsCard />
        </div>
      </div>
    </div>
  );
}

/* ---------- HEADER ---------- */

function SavedJobsHeader() {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Bookmark className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            Saved jobs
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Bookmark roles you like so you can compare and apply when the time
            is right.
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Candidate view
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Only visible to you — not to employers.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- STATS CARD ---------- */

function SavedJobsStatsCard({ data }: { data: SavedJobsResponse | null }) {
  const stats = data?.stats;

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Saved jobs summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Saved" value={stats?.total ?? 0} />
          <StatPill label="Open" value={stats?.open ?? 0} />
          <StatPill label="Applied" value={stats?.applied ?? 0} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-start justify-center rounded-lg border bg-card px-3 py-2 text-xs">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="mt-1 text-base font-semibold">{value}</span>
    </div>
  );
}

/* ---------- TIPS CARD ---------- */

function SavedJobsTipsCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Make saved jobs work for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>
          Use this list as your shortlist of roles to apply to next. Keep it
          focused and updated.
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Remove roles that are no longer relevant.</li>
          <li>Prioritise open roles and apply while they&apos;re fresh.</li>
          <li>Compare salary, location and work mode before applying.</li>
        </ul>
      </CardContent>
    </Card>
  );
}

/* ---------- LIST + CARD ---------- */

function SavedJobsList({
  data,
  filter,
  search,
  token,
  onUpdate,
  onReload,
}: {
  data: SavedJobsResponse | null;
  filter: "all" | "open" | "applied";
  search: string;
  token: string;
  onUpdate: React.Dispatch<React.SetStateAction<SavedJobsResponse | null>>;
  onReload: () => Promise<void>;
}) {
  if (!data || data.jobs.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <p>No saved jobs yet.</p>
        <p>Bookmark roles from the jobs board to see them here.</p>
      </div>
    );
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = data.jobs.filter((job) => {
    if (filter === "open" && job.status !== "open") return false;
    if (filter === "applied" && !job.applied) return false;

    if (!normalizedSearch) return true;

    return (
      job.jobTitle.toLowerCase().includes(normalizedSearch) ||
      job.company.toLowerCase().includes(normalizedSearch)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-xs text-muted-foreground">
        No saved jobs match this filter or search.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((job) => (
        <SavedJobCard
          key={job.id}
          job={job}
          token={token}
          onUpdate={onUpdate}
          onReload={onReload}
        />
      ))}
    </div>
  );
}

function SavedJobCard({
  job,
  token,
  onUpdate,
  onReload,
}: {
  job: SavedJob;
  token: string;
  onUpdate: React.Dispatch<React.SetStateAction<SavedJobsResponse | null>>;
  onReload: () => Promise<void>;
}) {
  const router = useRouter();
  const [removing, setRemoving] = React.useState(false);
  const [navigating, setNavigating] = React.useState(false);

  const savedDate = new Date(job.savedAt);

  const workModeLabel =
    job.workMode === "remote"
      ? "Remote"
      : job.workMode === "hybrid"
        ? "Hybrid"
        : "On-site";

  const jobTypeLabel =
    job.jobType === "full-time"
      ? "Full-time"
      : job.jobType === "part-time"
        ? "Part-time"
        : job.jobType === "internship"
          ? "Internship"
          : "Contract";

  const isOpen = job.status === "open";

  const goToJob = () => {
    if (navigating) return;
    setNavigating(true);
    router.push(`/jobs/${job.jobId}`);
    setTimeout(() => setNavigating(false), 500);
  };

  const goToApplications = () => {
    if (navigating) return;
    setNavigating(true);
    router.push("/dashboard/applications");
    setTimeout(() => setNavigating(false), 500);
  };

  const removeSaved = async () => {
    if (removing || !token) return;

    setRemoving(true);

    // ✅ Optimistic UI: remove by jobId (more stable than saved row id)
    onUpdate((prev) => {
      if (!prev) return prev;

      const nextJobs = prev.jobs.filter((j) => j.jobId !== job.jobId);

      const nextStats = {
        total: Math.max(0, prev.stats.total - 1),
        open: Math.max(0, prev.stats.open - (job.status === "open" ? 1 : 0)),
        applied: Math.max(0, prev.stats.applied - (job.applied ? 1 : 0)),
      };

      return { ...prev, jobs: nextJobs, stats: nextStats };
    });

    try {
      // ✅ FIXED: backend expects jobId in the route param
      await axios.delete(`/api/saved-jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("[SavedJob] remove error:", error);
      // rollback: safest refetch
      await onReload();
    } finally {
      setRemoving(false);
    }
  };

  const primaryDisabled = navigating || removing || (!isOpen && !job.applied);
  const removeDisabled = removing || navigating || !token;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToJob}
              className="text-left text-sm font-semibold underline-offset-4 hover:underline"
              title="Open job"
              disabled={navigating}
            >
              {job.jobTitle}
            </button>

            <Badge
              variant={isOpen ? "default" : "secondary"}
              className="rounded-full px-2 py-0.5 text-[10px]"
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>

            {job.applied && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[10px]"
              >
                Applied
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {job.company}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <Laptop2 className="h-3 w-3" />
              {workModeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[10px]"
            >
              {jobTypeLabel}
            </Badge>
            {job.salaryRange && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{job.salaryRange}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Saved{" "}
            {savedDate.toLocaleDateString(undefined, {
              month: "short",
              day: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-[11px] text-muted-foreground">
          {isOpen
            ? "You can still apply to this role."
            : "This role is closed, but you can keep it for reference."}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={job.applied ? goToApplications : goToJob}
            disabled={primaryDisabled}
            title={!isOpen && !job.applied ? "This job is closed" : undefined}
          >
            {navigating
              ? "Opening..."
              : job.applied
                ? "View application"
                : "Apply now"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={removeSaved}
            disabled={removeDisabled}
          >
            {removing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </span>
            ) : (
              "Remove"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
