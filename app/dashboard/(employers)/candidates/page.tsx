// app/dashboard/candidates/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Users,
  Search,
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type CandidateStatus =
  | "new"
  | "reviewing"
  | "interview"
  | "hired"
  | "rejected";

type CandidateSummary = {
  id: string;
  name: string;
  email?: string;
  headline?: string;
  location?: string;
  experienceYears?: number | null;
  skills: string[];
  lastActiveAt?: string; // ISO
  appliedJobsCount: number;
  status: CandidateStatus;
};

type CandidatesResponse = {
  candidates: CandidateSummary[];
  total: number;
};

export default function EmployerCandidatesPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [candidates, setCandidates] = React.useState<CandidateSummary[]>([]);
  const [activeStatusTab, setActiveStatusTab] =
    React.useState<"all" | CandidateStatus>("all");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"recent" | "experience">("recent");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (storedRole !== "employer") {
      toast.error("Candidates dashboard is only available for employers.");
      router.replace("/dashboard");
      return;
    }

    setRole(storedRole);

    let cancelled = false;

    const loadCandidates = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<CandidatesResponse>(
          "/api/employer/candidates",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (cancelled) return;

        setCandidates(data.candidates || []);
      } catch (error: any) {
        console.error("[EmployerCandidates] load error:", error);

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          if (status === 401) {
            // invalid/expired token
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(ROLE_KEY);
            toast.error("Session expired. Please log in again.");
            router.replace("/login");
            return;
          }

          toast.error(
            error.response?.data?.message ||
              "Failed to load candidates. Please try again."
          );
        } else {
          toast.error("Failed to load candidates. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredCandidates = React.useMemo(() => {
    let list = [...candidates];

    // Filter by status tab
    if (activeStatusTab !== "all") {
      list = list.filter((c) => c.status === activeStatusTab);
    }

    // Search by name, headline, skills, location
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const skillsJoined = c.skills.join(" ").toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.headline || "").toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q) ||
          skillsJoined.includes(q)
        );
      });
    }

    // Sort
    if (sortBy === "experience") {
      list.sort((a, b) => {
        const aExp = a.experienceYears ?? 0;
        const bExp = b.experienceYears ?? 0;
        return bExp - aExp;
      });
    } else {
      // recent – by lastActiveAt or fallback to 0
      list.sort((a, b) => {
        const aTime = a.lastActiveAt
          ? new Date(a.lastActiveAt).getTime()
          : 0;
        const bTime = b.lastActiveAt
          ? new Date(b.lastActiveAt).getTime()
          : 0;
        return bTime - aTime;
      });
    }

    return list;
  }, [candidates, activeStatusTab, search, sortBy]);

  const newCount = candidates.filter((c) => c.status === "new").length;
  const reviewingCount = candidates.filter(
    (c) => c.status === "reviewing"
  ).length;
  const interviewCount = candidates.filter(
    (c) => c.status === "interview"
  ).length;
  const hiredCount = candidates.filter((c) => c.status === "hired").length;
  const rejectedCount = candidates.filter(
    (c) => c.status === "rejected"
  ).length;

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
      <CandidatesHeader total={candidates.length} />

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* LEFT: list */}
        <div className="flex w-full flex-1 flex-col gap-4">
          <CandidatesFilterBar
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          <CandidatesListCard
            candidates={filteredCandidates}
            activeStatusTab={activeStatusTab}
            setActiveStatusTab={setActiveStatusTab}
            counts={{
              all: candidates.length,
              new: newCount,
              reviewing: reviewingCount,
              interview: interviewCount,
              hired: hiredCount,
              rejected: rejectedCount,
            }}
          />
        </div>

        {/* RIGHT: summary */}
        <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-xs">
          <PipelineSummaryCard
            total={candidates.length}
            newCount={newCount}
            reviewingCount={reviewingCount}
            interviewCount={interviewCount}
            hiredCount={hiredCount}
            rejectedCount={rejectedCount}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- HEADER ---------- */

function CandidatesHeader({ total }: { total: number }) {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Users className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            Candidates
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            View and evaluate candidates who have interacted with your job
            postings.
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Employer workspace
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {total} candidate{total === 1 ? "" : "s"} in your pipeline.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- FILTER BAR ---------- */

function CandidatesFilterBar({
  search,
  setSearch,
  sortBy,
  setSortBy,
}: {
  search: string;
  setSearch: (v: string) => void;
  sortBy: "recent" | "experience";
  setSortBy: (v: "recent" | "experience") => void;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardContent className="flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, skills, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3 md:w-auto">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Sort by</span>
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) =>
              setSortBy(v as "recent" | "experience")
            }
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent activity</SelectItem>
              <SelectItem value="experience">
                Experience (high → low)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- CANDIDATES LIST CARD ---------- */

function CandidatesListCard({
  candidates,
  activeStatusTab,
  setActiveStatusTab,
  counts,
}: {
  candidates: CandidateSummary[];
  activeStatusTab: "all" | CandidateStatus;
  setActiveStatusTab: (v: "all" | CandidateStatus) => void;
  counts: {
    all: number;
    new: number;
    reviewing: number;
    interview: number;
    hired: number;
    rejected: number;
  };
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">
            Candidate pipeline
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Filter by stage to focus on who needs your attention next.
          </p>
        </div>

        <Tabs
          value={activeStatusTab}
          onValueChange={(v) =>
            setActiveStatusTab(
              v as "all" | CandidateStatus
            )
          }
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3 gap-1 md:inline-flex md:w-auto">
            <TabsTrigger value="all" className="text-[11px]">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="new" className="text-[11px]">
              New ({counts.new})
            </TabsTrigger>
            <TabsTrigger value="reviewing" className="text-[11px]">
              Reviewing ({counts.reviewing})
            </TabsTrigger>
            <TabsTrigger
              value="interview"
              className="hidden text-[11px] md:inline-flex"
            >
              Interview ({counts.interview})
            </TabsTrigger>
            <TabsTrigger
              value="hired"
              className="hidden text-[11px] md:inline-flex"
            >
              Hired ({counts.hired})
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="hidden text-[11px] md:inline-flex"
            >
              Rejected ({counts.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-3">
        {candidates.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <p>No candidates in this stage yet.</p>
            <p>As applications come in, you’ll see profiles appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map((candidate) => (
              <CandidateRow key={candidate.id} candidate={candidate} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- SINGLE CANDIDATE ROW ---------- */

function CandidateRow({ candidate }: { candidate: CandidateSummary }) {
  const router = useRouter();

  const initials = candidate.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const lastActive =
    candidate.lastActiveAt &&
    new Date(candidate.lastActiveAt).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* LEFT: identity + meta */}
        <div className="flex flex-1 items-start gap-3">
          <Avatar className="h-9 w-9 text-xs">
            <AvatarImage src={undefined} alt={candidate.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{candidate.name}</span>
              <CandidateStatusBadge status={candidate.status} />
            </div>

            {candidate.headline && (
              <p className="max-w-xl text-[11px] text-muted-foreground">
                {candidate.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {candidate.location && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {candidate.location}
                  </span>
                  <span className="text-muted-foreground">·</span>
                </>
              )}

              {typeof candidate.experienceYears === "number" && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {candidate.experienceYears}{" "}
                    {candidate.experienceYears === 1 ? "year" : "years"} exp
                  </span>
                  <span className="text-muted-foreground">·</span>
                </>
              )}

              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {candidate.appliedJobsCount} application
                {candidate.appliedJobsCount === 1 ? "" : "s"}
              </span>

              {lastActive && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Active {lastActive}
                  </span>
                </>
              )}
            </div>

            {candidate.skills.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, 6).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="rounded-full px-2 py-0.5 text-[10px]"
                  >
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 6 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{candidate.skills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: actions */}
        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
          >
            View profile
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() =>
              router.push(`/dashboard/applications?candidateId=${candidate.id}`)
            }
          >
            View applications
          </Button>
        </div>
      </div>

      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <ArrowRight className="h-3 w-3" />
        Move this candidate forward by shortlisting, scheduling interviews, or
        sending feedback.
      </p>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */

function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  const config: Record<
    CandidateStatus,
    { label: string; className: string }
  > = {
    new: {
      label: "New",
      className: "border-primary/40 bg-primary/10 text-primary",
    },
    reviewing: {
      label: "Reviewing",
      className:
        "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    interview: {
      label: "Interview",
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    hired: {
      label: "Hired",
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className:
        "border-destructive/40 bg-destructive/10 text-destructive",
    },
  };

  const meta = config[status];

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2 py-0.5 text-[10px] ${meta.className}`}
    >
      <CheckCircle2 className="mr-1 h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

/* ---------- PIPELINE SUMMARY CARD ---------- */

function PipelineSummaryCard({
  total,
  newCount,
  reviewingCount,
  interviewCount,
  hiredCount,
  rejectedCount,
}: {
  total: number;
  newCount: number;
  reviewingCount: number;
  interviewCount: number;
  hiredCount: number;
  rejectedCount: number;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Pipeline overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-3">
          <PipelineTile label="Total candidates" value={total} emphasis />
          <PipelineTile label="New" value={newCount} />
          <PipelineTile label="Reviewing" value={reviewingCount} />
          <PipelineTile label="Interview" value={interviewCount} />
          <PipelineTile label="Hired" value={hiredCount} />
          <PipelineTile label="Rejected" value={rejectedCount} />
        </div>

        <Separator />

        <p className="text-[11px]">
          Use stages like <span className="font-medium">New</span>,{" "}
          <span className="font-medium">Reviewing</span>, and{" "}
          <span className="font-medium">Interview</span> to keep your hiring
          process structured and transparent.
        </p>
      </CardContent>
    </Card>
  );
}

function PipelineTile({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border bg-card px-3 py-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={`text-base font-semibold ${
          emphasis ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
