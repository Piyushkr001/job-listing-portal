"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";

/** ---------------------------
 * Candidate API shape (your current DetailResponse)
 * -------------------------- */
type CandidateDetailResponse = {
  application: {
    id: string;
    jobId: string;
    status: string;
    step: string;
    appliedAt: string;
    nextInterviewAt: string | null;
  };
  job: {
    id: string;
    title: string;
    location: string;
    description: string;
    company: string;
  };
};

/** ---------------------------
 * Employer API shape (common in your backend)
 * Adjust field names only if your employer API differs.
 * -------------------------- */
type EmployerDetailResponse = {
  applicationId: string;
  status: string;
  step: string | null;
  coverLetter: string | null;
  resumeUrl: string | null;
  createdAt: string;
  nextInterviewAt?: string | null;
  job: {
    id: string;
    title: string;
    location?: string | null;
    description?: string | null;
    company?: string | null;
  };
  candidate: {
    id: string;
    name: string | null;
    email: string;
  };
};

/** ---------------------------
 * UI-normalized detail
 * -------------------------- */
type NormalizedDetail = {
  application: {
    id: string;
    jobId: string;
    status: string;
    step: string;
    appliedAt: string;
    nextInterviewAt: string | null;
  };
  job: {
    id: string;
    title: string;
    location: string;
    description: string;
    company: string;
  };
};

type EventItem = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
  createdAt: string;
  actor: { name: string; company: string } | null;
};

type EventsResponse = { events: EventItem[] };

function isCandidateDetail(x: unknown): x is CandidateDetailResponse {
  if (!x || typeof x !== "object") return false;
  return "application" in x && "job" in x;
}

function normalizeDetail(role: Role, data: unknown): NormalizedDetail | null {
  if (role === "candidate") {
    const d = data as CandidateDetailResponse;
    if (!isCandidateDetail(d)) return null;
    return d;
  }

  // employer
  const d = data as EmployerDetailResponse;
  if (!d || typeof d !== "object" || !("applicationId" in d) || !("job" in d)) {
    return null;
  }

  return {
    application: {
      id: d.applicationId,
      jobId: d.job?.id ?? "",
      status: d.status ?? "applied",
      step: d.step ?? "",
      appliedAt: d.createdAt ?? new Date().toISOString(),
      nextInterviewAt: (d.nextInterviewAt as string | null) ?? null,
    },
    job: {
      id: d.job?.id ?? "",
      title: d.job?.title ?? "Job",
      location: (d.job?.location as string) ?? "—",
      description: (d.job?.description as string) ?? "",
      company: (d.job?.company as string) ?? "Company",
    },
  };
}

// your enum values (must match backend)
const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offered" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function ApplicationDetailPage() {
  const router = useRouter();

  // normalize params.id safely
  const params = useParams<{ id?: string | string[] }>();
  const id = React.useMemo(() => {
    const raw = params?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? String(raw[0] ?? "") : String(raw);
  }, [params]);

  const [token, setToken] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<NormalizedDetail | null>(null);
  const [events, setEvents] = React.useState<EventItem[]>([]);

  // ✅ status editing (employer only) — does not change existing fetch logic
  const [saving, setSaving] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<string>("");
  const [newStep, setNewStep] = React.useState<string>("");

  // keep edit state in sync when detail loads/changes
  React.useEffect(() => {
    if (!detail) return;
    setNewStatus(detail.application.status);
    setNewStep(detail.application.step ?? "");
  }, [detail]);

  // helpers: stable refs, no logic change
  const formatDateTime = React.useCallback((iso: string) => {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const iconForType = React.useCallback((type: string) => {
    if (type === "status_changed") return CheckCircle2;
    if (type === "interview_scheduled") return CalendarClock;
    if (type === "note") return FileText;
    return Users;
  }, []);

  // Load auth state first
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);

    const r = window.localStorage.getItem(ROLE_KEY);
    if (r === "candidate" || r === "employer") {
      setRole(r);
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Load application + events ONLY after token, id and role are ready
  React.useEffect(() => {
    if (!token || !id || !role) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const detailUrl =
          role === "employer"
            ? `/api/employer/applications/${id}`
            : `/api/applications/${id}`;

        const eventsUrl =
          role === "employer"
            ? `/api/employer/applications/${id}/events`
            : `/api/applications/${id}/events`;

        const [dRes, eRes] = await Promise.all([
          axios.get<unknown>(detailUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<EventsResponse>(eventsUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const normalized = normalizeDetail(role, dRes.data);

        if (!cancelled) {
          setDetail(normalized);
          setEvents(eRes.data?.events ?? []);
        }

        if (!normalized && !cancelled) {
          toast.error("Unexpected response from server (detail shape mismatch).");
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error("[ApplicationDetail] Axios error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });

          if (err.response?.status === 401) {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(ROLE_KEY);
            router.replace("/login");
            return;
          }
        } else {
          console.error("[ApplicationDetail] Unknown error:", err);
        }

        if (!cancelled) {
          toast.error("Failed to load application details.");
          setDetail(null);
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, id, role, router]);

  // ✅ save status (employer only)
  async function saveStatus(applicationId: string) {
    if (!token) return;

    try {
      setSaving(true);
      await axios.patch(
        `/api/employer/applications/${applicationId}/status`,
        { status: newStatus, step: newStep },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Application updated.");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update application.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Button
          variant="outline"
          className="w-fit rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Application not found or you don’t have access.
        </div>
      </div>
    );
  }

  const { application, job } = detail;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company} • {job.location}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => router.push(`/jobs/${job.id}`)}
          >
            View job
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,2fr]">
        <Card className="border bg-background shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Application summary
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant="secondary">{application.status}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Applied</span>
              <span className="text-xs">
                {formatDateTime(application.appliedAt)}
              </span>
            </div>

            {application.nextInterviewAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interview</span>
                <span className="text-xs">
                  {formatDateTime(application.nextInterviewAt)}
                </span>
              </div>
            )}

            {application.step && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Current step</p>
                  <p className="text-xs text-muted-foreground">
                    {application.step}
                  </p>
                </div>
              </>
            )}

            {/* ✅ Employer-only status update UI (no changes to existing logic) */}
            {role === "employer" && (
              <>
                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium">Update application</p>

                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Status</p>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Step</p>
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        placeholder="e.g. HR screening, Technical round, etc."
                      />
                    </div>

                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={saving || !token}
                      onClick={() => saveStatus(application.id)}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border bg-background shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {events.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No timeline events yet. Events appear when your status changes or
                notes are added.
              </p>
            )}

            {events.map((ev) => {
              const Icon = iconForType(ev.type);

              return (
                <div
                  key={ev.id}
                  className="flex gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {ev.type === "status_changed"
                          ? `Status changed${
                              ev.toStatus ? ` → ${ev.toStatus}` : ""
                            }`
                          : ev.type === "interview_scheduled"
                          ? "Interview scheduled"
                          : ev.type === "note"
                          ? "Note added"
                          : ev.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(ev.createdAt)}
                      </p>
                    </div>

                    {(ev.fromStatus || ev.toStatus) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ev.fromStatus ? `From: ${ev.fromStatus}` : ""}{" "}
                        {ev.toStatus ? `To: ${ev.toStatus}` : ""}
                      </p>
                    )}

                    {ev.message && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ev.message}
                      </p>
                    )}

                    {ev.actor && (ev.actor.company || ev.actor.name) && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        By {ev.actor.company || ev.actor.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
