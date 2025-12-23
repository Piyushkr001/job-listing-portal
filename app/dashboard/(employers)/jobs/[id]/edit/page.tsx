// app/dashboard/jobs/[id]/edit/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Save, Settings2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";
type JobStatus = "draft" | "open" | "paused" | "closed";

type EmployerJobDetail = {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  remote: boolean;
  status: JobStatus;
  description: string;
};

type JobDetailResponse = { job: EmployerJobDetail };

export default function ManageJobPostingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [job, setJob] = React.useState<EmployerJobDetail | null>(null);

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

        // Adjust this endpoint to match your backend
        const res = await axios.get<JobDetailResponse>(`/api/employer/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) setJob(res.data.job);
      } catch (e) {
        console.error("[ManagePosting] load error:", e);
        toast.error("Failed to load job details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router, jobId]);

  const updateField = <K extends keyof EmployerJobDetail>(key: K, value: EmployerJobDetail[K]) => {
    setJob((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!job) return;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    setSaving(true);
    try {
      // Adjust this endpoint/method to match your backend
      await axios.patch(
        `/api/employer/jobs/${job.id}`,
        {
          title: job.title,
          location: job.location,
          employmentType: job.employmentType,
          remote: job.remote,
          status: job.status,
          description: job.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Job updated successfully.");
    } catch (e) {
      console.error("[ManagePosting] save error:", e);
      toast.error("Failed to update job.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-semibold">Job not found</p>
        <p className="text-xs text-muted-foreground">The job may have been removed.</p>
        <Button variant="outline" className="rounded-full" onClick={() => router.push("/dashboard/jobs")}>
          Back to jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Manage posting</h1>
          <p className="text-sm text-muted-foreground">Edit job details and status.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button className="rounded-full" onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <Card className="border bg-background shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Job settings</CardTitle>
          <CardDescription className="text-xs">
            Keep your listing accurate to attract relevant candidates.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={job.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input
                value={job.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Employment type</Label>
              <Input
                value={job.employmentType}
                onChange={(e) => updateField("employmentType", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={job.status} onValueChange={(v) => updateField("status", v as JobStatus)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs">Description</Label>
            </div>
            <Textarea
              value={job.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-[180px] text-sm"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Tip: Use clear responsibilities, requirements, and compensation range (if applicable) to improve candidate quality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
