// app/dashboard/jobs/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Users, Mail, CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";

type ApplicationStatus =
  | "submitted"
  | "review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

/**
 * FIX: your backend returns `applicationId` (not `id`)
 */
type JobApplicationItem = {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  createdAt: string; // ISO
};

type JobApplicationsResponse = {
  job: { id: string; title: string };
  applications: JobApplicationItem[];
};

export default function ViewApplicationsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<JobApplicationsResponse | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const role = window.localStorage.getItem(ROLE_KEY) as Role | null;

    if (!token) {
      router.replace("/login");
      return;
    }
    if (role !== "employer") {
      router.replace("/jobs");
      return;
    }
    if (!jobId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const res = await axios.get<JobApplicationsResponse>(
          `/api/employer/jobs/${jobId}/applications`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!cancelled) setData(res.data);
      } catch (e) {
        console.error("[ViewApplications] load error:", e);
        toast.error("Failed to load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router, jobId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {data?.job?.title
              ? `For: ${data.job.title}`
              : "Review candidates who applied to this job."}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            className="rounded-full"
            onClick={() => router.push(`/dashboard/jobs/${jobId}/edit`)}
          >
            Manage posting
          </Button>
        </div>
      </div>

      <Card className="border bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Applicants</CardTitle>
          <CardDescription className="text-xs">
            Total: {data?.applications?.length ?? 0}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {!data || data.applications.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <Users className="h-5 w-5" />
              <p>No applications yet.</p>
              <p>Share the job link to start receiving candidates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.applications.map((a) => (
                /**
                 * FIX: use applicationId as key (unique + present)
                 */
                <div
                  key={a.applicationId}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {a.candidateName}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {a.candidateEmail}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Applied{" "}
                          {new Date(a.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => router.push(`/dashboard/candidates/${a.candidateId}`)}
                      >
                        View profile
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => router.push(`/dashboard/applications/${a.applicationId}`)}
                      >
                        View application
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <p className="text-[11px] text-muted-foreground">
                    Tip: shortlist promising candidates and schedule interviews
                    quickly to reduce drop-off.
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; cls: string }> = {
    submitted: {
      label: "Submitted",
      cls: "border-border bg-muted text-muted-foreground",
    },
    review: {
      label: "In review",
      cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    shortlisted: {
      label: "Shortlisted",
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      cls: "border-destructive/40 bg-destructive/10 text-destructive",
    },
    hired: {
      label: "Hired",
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    withdrawn: {
      label: "Withdrawn",
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  };

  const m = map[status] ?? map.submitted;

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2 py-0.5 text-[10px] ${m.cls}`}
    >
      {m.label}
    </Badge>
  );
}
