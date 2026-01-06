// app/jobs/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Briefcase,
  MapPin,
  Laptop2,
  Clock,
  Filter,
  Search,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type WorkMode = "onsite" | "remote" | "hybrid";
type JobType = "full-time" | "part-time" | "internship" | "contract";

type JobListItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryRange?: string | null;
  postedAt: string; // ISO string
  isSaved?: boolean;
};

type JobsResponse = {
  jobs: JobListItem[];
  total: number;
};

export default function JobsPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingJobId, setSavingJobId] = React.useState<string | null>(null);

  const [jobs, setJobs] = React.useState<JobListItem[]>([]);

  const [activeTab, setActiveTab] = React.useState<"all" | "saved">("all");
  const [search, setSearch] = React.useState("");
  const [workModeFilter, setWorkModeFilter] =
    React.useState<WorkMode | "any">("any");
  const [jobTypeFilter, setJobTypeFilter] =
    React.useState<JobType | "any">("any");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (!storedRole) {
      router.replace("/dashboard");
      return;
    }

    setRole(storedRole);

    let cancelled = false;

    const loadJobs = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get<JobsResponse>("/api/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        const normalized = (data.jobs || []).map((job) => ({
          ...job,
          workMode: job.workMode || ("onsite" as WorkMode),
          jobType: job.jobType || ("full-time" as JobType),
          isSaved: job.isSaved ?? false,
        }));

        setJobs(normalized);
      } catch (error) {
        console.error("[Jobs] load error:", error);
        toast.error("Failed to load jobs. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ✅ FIXED: unsave must use DELETE /api/saved-jobs/by-job/[jobId]
  const handleSaveToggle = async (
    jobId: string,
    isSaved: boolean | undefined
  ) => {
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      setSavingJobId(jobId);

      if (isSaved) {
        // ✅ Unsave (by jobId)
        await axios.delete(`/api/saved-jobs/by-job/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Job removed from saved.");
      } else {
        // ✅ Save
        await axios.post(
          "/api/saved-jobs",
          { jobId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Job saved.");
      }

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, isSaved: !isSaved } : job
        )
      );
    } catch (error) {
      console.error("[Jobs] save toggle error:", error);
      toast.error("Unable to update saved jobs. Please try again.");
    } finally {
      setSavingJobId(null);
    }
  };

  if (loading || !role) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "saved" && !job.isSaved) return false;

    const query = search.trim().toLowerCase();
    if (query) {
      const combined = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      if (!combined.includes(query)) return false;
    }

    if (workModeFilter !== "any" && job.workMode !== workModeFilter) return false;
    if (jobTypeFilter !== "any" && job.jobType !== jobTypeFilter) return false;

    return true;
  });

  const isCandidate = role === "candidate";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <JobsHeader isCandidate={isCandidate} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:max-w-xs">
          <FiltersCard
            workModeFilter={workModeFilter}
            setWorkModeFilter={setWorkModeFilter}
            jobTypeFilter={jobTypeFilter}
            setJobTypeFilter={setJobTypeFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>

        <div className="flex w-full flex-1 flex-col">
          <JobsListCard
            jobs={filteredJobs}
            total={jobs.length}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSaveToggle={handleSaveToggle}
            savingJobId={savingJobId}
            onOpenJob={(jobId) => router.push(`/jobs/${jobId}`)} // ✅ use router
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- HEADER ---------- */

function JobsHeader({ isCandidate }: { isCandidate: boolean }) {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Briefcase className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            {isCandidate ? "Find your next role" : "Browse jobs"}
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Explore open opportunities and save the roles you care about.
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {isCandidate ? "Candidate view" : "Employer view"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Filters and search help you quickly narrow down the list.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- FILTERS CARD ---------- */

function FiltersCard({
  workModeFilter,
  setWorkModeFilter,
  jobTypeFilter,
  setJobTypeFilter,
  search,
  setSearch,
}: {
  workModeFilter: WorkMode | "any";
  setWorkModeFilter: (v: WorkMode | "any") => void;
  jobTypeFilter: JobType | "any";
  setJobTypeFilter: (v: JobType | "any") => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Filter className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          <p className="text-xs text-muted-foreground">
            Refine the job list based on your preferences.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Search</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Work mode</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={workModeFilter === "any"} onClick={() => setWorkModeFilter("any")}>
              Any
            </FilterChip>
            <FilterChip active={workModeFilter === "onsite"} onClick={() => setWorkModeFilter("onsite")}>
              On-site
            </FilterChip>
            <FilterChip active={workModeFilter === "remote"} onClick={() => setWorkModeFilter("remote")}>
              Remote
            </FilterChip>
            <FilterChip active={workModeFilter === "hybrid"} onClick={() => setWorkModeFilter("hybrid")}>
              Hybrid
            </FilterChip>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Job type</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={jobTypeFilter === "any"} onClick={() => setJobTypeFilter("any")}>
              Any
            </FilterChip>
            <FilterChip active={jobTypeFilter === "full-time"} onClick={() => setJobTypeFilter("full-time")}>
              Full-time
            </FilterChip>
            <FilterChip active={jobTypeFilter === "part-time"} onClick={() => setJobTypeFilter("part-time")}>
              Part-time
            </FilterChip>
            <FilterChip active={jobTypeFilter === "internship"} onClick={() => setJobTypeFilter("internship")}>
              Internship
            </FilterChip>
            <FilterChip active={jobTypeFilter === "contract"} onClick={() => setJobTypeFilter("contract")}>
              Contract
            </FilterChip>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          You can save interesting jobs from the list and view them later from your Saved jobs section.
        </p>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- JOBS LIST CARD ---------- */

function JobsListCard({
  jobs,
  total,
  activeTab,
  setActiveTab,
  onSaveToggle,
  savingJobId,
  onOpenJob,
}: {
  jobs: JobListItem[];
  total: number;
  activeTab: "all" | "saved";
  setActiveTab: (v: "all" | "saved") => void;
  onSaveToggle: (jobId: string, isSaved: boolean | undefined) => void;
  savingJobId: string | null;
  onOpenJob: (jobId: string) => void;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Job listings</CardTitle>
          <p className="text-xs text-muted-foreground">
            Showing {jobs.length} of {total} jobs based on your filters.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "all" | "saved")}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="all">All jobs</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-3">
        {jobs.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <p>No jobs match your filters yet.</p>
            <p>Try clearing some filters or searching with a different term.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSaveToggle={onSaveToggle}
                saving={savingJobId === job.id}
                onOpen={() => onOpenJob(job.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- JOB CARD ---------- */

function JobCard({
  job,
  onSaveToggle,
  saving,
  onOpen,
}: {
  job: JobListItem;
  onSaveToggle: (jobId: string, isSaved: boolean | undefined) => void;
  saving: boolean;
  onOpen: () => void;
}) {
  const postedDate = new Date(job.postedAt);

  const workModeLabel =
    job.workMode === "remote" ? "Remote" : job.workMode === "hybrid" ? "Hybrid" : "On-site";

  const jobTypeLabel =
    job.jobType === "full-time"
      ? "Full-time"
      : job.jobType === "part-time"
      ? "Part-time"
      : job.jobType === "internship"
      ? "Internship"
      : job.jobType === "contract"
      ? "Contract"
      : job.jobType;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{job.title}</span>
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
              {jobTypeLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
              {workModeLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
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
            {job.salaryRange && (
              <>
                <span>{job.salaryRange}</span>
                <span className="text-muted-foreground">·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Posted{" "}
              {postedDate.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <Button type="button" size="sm" className="rounded-full" onClick={onOpen}>
            View details
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={saving}
            onClick={() => onSaveToggle(job.id, job.isSaved)}
            title={job.isSaved ? "Unsave job" : "Save job"}
          >
            {job.isSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <p className="mt-1 max-w-3xl text-[11px] text-muted-foreground">
        An opportunity to join a fast-moving team and work on meaningful problems. Click &quot;View details&quot; to see
        the full description, responsibilities, and requirements.
      </p>
    </div>
  );
}
