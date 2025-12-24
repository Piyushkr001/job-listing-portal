// app/dashboard/applications/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Briefcase,
  Filter,
  Loader2,
  User,
  Building2,
  Calendar,
  Mail,
  ArrowRightCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

/**
 * IMPORTANT:
 * Your backend uses:
 * - applied
 * - shortlisted
 * - interview_scheduled
 * - offered
 * - rejected
 * - hired
 *
 * So we align UI types to backend enum to avoid breaking filters/labels.
 */
type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview_scheduled"
  | "offered"
  | "rejected"
  | "hired";

/* ---------- Types expected from API ---------- */

// For candidates
type CandidateApplication = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  step: string;
  appliedAt: string;
  nextInterviewAt?: string | null;
};

type CandidateApplicationsResponse = {
  stats: {
    total: number;
    active: number;
    rejected: number;
    offers: number;
  };
  applications: CandidateApplication[];
};

// For employers
type EmployerApplication = {
  id: string;
  jobTitle: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  step: string;
  appliedAt: string;
  nextInterviewAt?: string | null;
};

type EmployerApplicationsResponse = {
  stats: {
    total: number;
    today: number;
    thisWeek: number;
  };
  applications: EmployerApplication[];
};

type TabKey = "all" | "active" | "interview" | "rejected";

/** Stage options aligned to backend enum */
const STAGE_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "offered", label: "Offered" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicationsPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingList, setLoadingList] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");

  const [candidateData, setCandidateData] =
    React.useState<CandidateApplicationsResponse | null>(null);
  const [employerData, setEmployerData] =
    React.useState<EmployerApplicationsResponse | null>(null);

  /**
   * ✅ NEW (does not change your existing logic):
   * updater for employer list after stage change.
   */
  const updateEmployerApplication = React.useCallback(
    (id: string, patch: Partial<EmployerApplication>) => {
      setEmployerData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: prev.applications.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        };
      });
    },
    []
  );

  // Load role + applications
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

    const load = async () => {
      try {
        setLoading(true);
        setLoadingList(true);

        if (storedRole === "candidate") {
          const { data } = await axios.get<CandidateApplicationsResponse>(
            "/api/applications/candidate",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!cancelled) setCandidateData(data);
        } else {
          const { data } = await axios.get<EmployerApplicationsResponse>(
            "/api/applications/employer",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!cancelled) setEmployerData(data);
        }
      } catch (error) {
        console.error("[Applications] load error:", error);
        if (!cancelled) toast.error("Failed to load applications.");
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

  const isCandidate = role === "candidate";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <ApplicationsHeader role={role} />

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* LEFT: list + filters */}
        <div className="flex w-full flex-1 flex-col gap-4">
          <Card className="border bg-background shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">
                {isCandidate ? "Your applications" : "Applications across your jobs"}
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-1 rounded-full"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabKey)}
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="interview">Interviews</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {/* ✅ Correct shadcn TabsContent usage: one per value */}
                <TabsContent value="all" className="mt-4">
                  {renderList({
                    loadingList,
                    isCandidate,
                    candidateData,
                    employerData,
                    filter: "all",
                    onEmployerUpdate: updateEmployerApplication,
                  })}
                </TabsContent>

                <TabsContent value="active" className="mt-4">
                  {renderList({
                    loadingList,
                    isCandidate,
                    candidateData,
                    employerData,
                    filter: "active",
                    onEmployerUpdate: updateEmployerApplication,
                  })}
                </TabsContent>

                <TabsContent value="interview" className="mt-4">
                  {renderList({
                    loadingList,
                    isCandidate,
                    candidateData,
                    employerData,
                    filter: "interview",
                    onEmployerUpdate: updateEmployerApplication,
                  })}
                </TabsContent>

                <TabsContent value="rejected" className="mt-4">
                  {renderList({
                    loadingList,
                    isCandidate,
                    candidateData,
                    employerData,
                    filter: "rejected",
                    onEmployerUpdate: updateEmployerApplication,
                  })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: stats summary */}
        <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-sm">
          {isCandidate ? (
            <CandidateStatsCard data={candidateData} />
          ) : (
            <EmployerStatsCard data={employerData} />
          )}
          {!isCandidate && <EmployerTipsCard />}
        </div>
      </div>
    </div>
  );
}

function renderList({
  loadingList,
  isCandidate,
  candidateData,
  employerData,
  filter,
  onEmployerUpdate,
}: {
  loadingList: boolean;
  isCandidate: boolean;
  candidateData: CandidateApplicationsResponse | null;
  employerData: EmployerApplicationsResponse | null;
  filter: TabKey;
  onEmployerUpdate: (id: string, patch: Partial<EmployerApplication>) => void;
}) {
  if (loadingList) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isCandidate ? (
    <CandidateApplicationsList data={candidateData} filter={filter} />
  ) : (
    <EmployerApplicationsList
      data={employerData}
      filter={filter}
      onUpdate={onEmployerUpdate}
    />
  );
}

/* ---------- HEADER ---------- */

function ApplicationsHeader({ role }: { role: Role }) {
  const isCandidate = role === "candidate";

  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          {isCandidate ? (
            <Briefcase className="h-6 w-6" />
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            {isCandidate ? "Applications" : "Applications & pipeline"}
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            {isCandidate
              ? "Track where you are in the hiring process for each job."
              : "Review candidates across your open roles and follow them through the pipeline."}
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {isCandidate ? "Candidate view" : "Employer view"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Updated in real time as you apply or review.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- STATUS HELPERS ---------- */

function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case "applied":
      return "Applied";
    case "shortlisted":
      return "Shortlisted";
    case "interview_scheduled":
      return "Interview scheduled";
    case "offered":
      return "Offered";
    case "rejected":
      return "Rejected";
    case "hired":
      return "Hired";
    default:
      return status;
  }
}

function statusBadgeVariant(
  status: ApplicationStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "applied":
      return "secondary";
    case "shortlisted":
    case "interview_scheduled":
    case "offered":
      return "default";
    case "rejected":
      return "destructive";
    case "hired":
      return "outline";
    default:
      return "secondary";
  }
}

/* ---------- CANDIDATE STATS ---------- */

function CandidateStatsCard({ data }: { data: CandidateApplicationsResponse | null }) {
  const stats = data?.stats;
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Application summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Total" value={stats?.total ?? 0} />
          <StatPill label="Active" value={stats?.active ?? 0} />
          <StatPill label="Offers" value={stats?.offers ?? 0} />
          <StatPill label="Rejected" value={stats?.rejected ?? 0} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER STATS ---------- */

function EmployerStatsCard({ data }: { data: EmployerApplicationsResponse | null }) {
  const stats = data?.stats;
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Pipeline overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatPill label="Total" value={stats?.total ?? 0} />
          <StatPill label="Today" value={stats?.today ?? 0} />
          <StatPill label="This week" value={stats?.thisWeek ?? 0} />
        </div>
      </CardContent>
    </Card>
  );
}

function EmployerTipsCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tips for better responses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>
          Responding quickly to candidates and keeping your pipeline clean improves your
          employer brand.
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Move candidates to screening/interview as soon as you review.</li>
          <li>Reject kindly when there isn&apos;t a fit.</li>
          <li>Keep job descriptions and salary ranges clear.</li>
        </ul>
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

/* ---------- CANDIDATE LIST ---------- */

function CandidateApplicationsList({
  data,
  filter,
}: {
  data: CandidateApplicationsResponse | null;
  filter: TabKey;
}) {
  if (!data || data.applications.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <p>No applications yet.</p>
        <p>Start applying to roles and they&apos;ll appear here.</p>
      </div>
    );
  }

  const filtered = data.applications.filter((app) => {
    if (filter === "all") return true;

    // ✅ Same logic, just aligned to backend enum
    if (filter === "active") {
      return ["applied", "shortlisted", "interview_scheduled", "offered"].includes(
        app.status
      );
    }
    if (filter === "interview") {
      return ["interview_scheduled", "offered"].includes(app.status);
    }
    if (filter === "rejected") {
      return ["rejected"].includes(app.status);
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-xs text-muted-foreground">
        No applications match this filter.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((app) => (
        <CandidateApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}

function CandidateApplicationCard({ application }: { application: CandidateApplication }) {
  const router = useRouter();

  const appliedDate = new Date(application.appliedAt);
  const interviewDate = application.nextInterviewAt
    ? new Date(application.nextInterviewAt)
    : null;

  const isUpcomingInterview = interviewDate && interviewDate.getTime() > Date.now();

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{application.jobTitle}</span>
            <Badge
              variant={statusBadgeVariant(application.status)}
              className="rounded-full px-2 py-0.5 text-[10px]"
            >
              {statusLabel(application.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {application.company}
            </span>
            <span className="text-muted-foreground">·</span>
            <span>{application.location}</span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Applied{" "}
            {appliedDate.toLocaleDateString(undefined, {
              month: "short",
              day: "2-digit",
            })}
          </span>
          {isUpcomingInterview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              <Calendar className="h-3 w-3" />
              Interview{" "}
              {interviewDate!.toLocaleDateString(undefined, {
                month: "short",
                day: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-[11px] text-muted-foreground">{application.step}</p>

        {/* ✅ No logic change: just wires existing button to your detail route */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => router.push(`/dashboard/applications/${application.id}`)}
        >
          View details
        </Button>
      </div>
    </div>
  );
}

/* ---------- EMPLOYER LIST ---------- */

function EmployerApplicationsList({
  data,
  filter,
  onUpdate,
}: {
  data: EmployerApplicationsResponse | null;
  filter: TabKey;
  onUpdate: (id: string, patch: Partial<EmployerApplication>) => void;
}) {
  if (!data || data.applications.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <p>No applications yet.</p>
        <p>As candidates apply to your roles, they&apos;ll show up here.</p>
      </div>
    );
  }

  const filtered = data.applications.filter((app) => {
    if (filter === "all") return true;

    // ✅ Same logic, aligned to backend enum
    if (filter === "active") {
      return ["applied", "shortlisted", "interview_scheduled", "offered"].includes(
        app.status
      );
    }
    if (filter === "interview") {
      return ["interview_scheduled", "offered"].includes(app.status);
    }
    if (filter === "rejected") {
      return ["rejected"].includes(app.status);
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-xs text-muted-foreground">
        No applications match this filter.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((app) => (
        <EmployerApplicationCard
          key={app.id}
          application={app}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

function EmployerApplicationCard({
  application,
  onUpdate,
}: {
  application: EmployerApplication;
  onUpdate: (id: string, patch: Partial<EmployerApplication>) => void;
}) {
  const appliedDate = new Date(application.appliedAt);
  const interviewDate = application.nextInterviewAt
    ? new Date(application.nextInterviewAt)
    : null;

  const isUpcomingInterview = interviewDate && interviewDate.getTime() > Date.now();

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-xs sm:px-4 sm:py-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{application.jobTitle}</span>
            <Badge
              variant={statusBadgeVariant(application.status)}
              className="rounded-full px-2 py-0.5 text-[10px]"
            >
              {statusLabel(application.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {application.candidateName}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {application.candidateEmail}
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Applied{" "}
            {appliedDate.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
          </span>
          {isUpcomingInterview && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              <Calendar className="h-3 w-3" />
              Interview{" "}
              {interviewDate!.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-[11px] text-muted-foreground">{application.step}</p>

        <div className="flex flex-wrap items-center gap-2">
          {/* ✅ NEW: Move stage now works without changing your existing logic */}
          <MoveStageDialog
            application={application}
            onUpdated={(patch) => onUpdate(application.id, patch)}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- MOVE STAGE DIALOG (Employer only) ---------- */

function MoveStageDialog({
  application,
  onUpdated,
}: {
  application: EmployerApplication;
  onUpdated: (patch: Partial<EmployerApplication>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [status, setStatus] = React.useState<ApplicationStatus>(application.status);
  const [step, setStep] = React.useState<string>(application.step || "");
  const [nextInterviewAt, setNextInterviewAt] = React.useState<string>(
    application.nextInterviewAt
      ? new Date(application.nextInterviewAt).toISOString().slice(0, 16)
      : ""
  );

  React.useEffect(() => {
    // Keep dialog in sync with latest application row
    setStatus(application.status);
    setStep(application.step || "");
    setNextInterviewAt(
      application.nextInterviewAt
        ? new Date(application.nextInterviewAt).toISOString().slice(0, 16)
        : ""
    );
  }, [application.id, application.status, application.step, application.nextInterviewAt, open]);

  const requiresInterview = status === "interview_scheduled";

  async function handleSave() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;

    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }

    if (requiresInterview && !nextInterviewAt) {
      toast.error("Please select an interview date/time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        status,
        step: step?.trim() || undefined,
        nextInterviewAt: nextInterviewAt ? new Date(nextInterviewAt).toISOString() : null,
      };

      // ✅ Employer status update endpoint (as per your project pattern)
      await axios.patch(
        `/api/employer/applications/${application.id}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update UI (does not change server logic; just refreshes local state)
      onUpdated({
        status,
        step: payload.step ?? application.step,
        nextInterviewAt: payload.nextInterviewAt,
      });

      toast.success("Stage updated.");
      setOpen(false);
    } catch (err) {
      console.error("[MoveStage] update failed:", err);
      toast.error("Failed to update stage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="rounded-full">
          <ArrowRightCircle className="mr-2 h-4 w-4" />
          Move stage
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Move candidate to next stage</DialogTitle>
          <DialogDescription>
            Update the candidate&apos;s pipeline stage. Changes will reflect in their dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New stage</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ApplicationStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresInterview && (
            <div className="space-y-2">
              <Label>Interview date &amp; time</Label>
              <Input
                type="datetime-local"
                value={nextInterviewAt}
                onChange={(e) => setNextInterviewAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for “Interview scheduled”.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Step / note (optional)</Label>
            <Textarea
              value={step}
              onChange={(e) => setStep(e.target.value)}
              placeholder='E.g., "Screening call scheduled with HR"'
              className="min-h-[90px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Update stage"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
