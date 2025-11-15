// app/jobs/[id]/page.tsx

"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  Users,
  Building2,
  Globe2,
  Sparkles,
  CheckCircle2,
  Tag,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Role = "candidate" | "employer";
type Theme = "system" | "light" | "dark";

// Reuse these keys from your other pages
const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type WorkMode = "onsite" | "remote" | "hybrid";
type JobType = "full-time" | "part-time" | "internship" | "contract";

type JobDetail = {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryRange?: string | null;
  postedAt: string; // ISO string
  applicationDeadline?: string | null;
  experienceLevel?: string | null;
  skills?: string[]; // tags
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  perks?: string[];
  companyWebsite?: string | null;
  companySize?: string | null;
  isSaved?: boolean;
  isApplied?: boolean;
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const jobId = params?.id as string;

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (!jobId) return;
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    setRole(storedRole);

    let cancelled = false;

    const loadJob = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get<JobDetail>(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        // Normalize some fields
        const workMode: WorkMode = (data.workMode || "onsite") as WorkMode;
        const jobType: JobType = (data.jobType || "full-time") as JobType;

        setJob({
          ...data,
          workMode,
          jobType,
          skills: data.skills ?? [],
          responsibilities: data.responsibilities ?? [],
          requirements: data.requirements ?? [],
          perks: data.perks ?? [],
          isSaved: data.isSaved ?? false,
          isApplied: data.isApplied ?? false,
        });
      } catch (error) {
        console.error("[JobDetail] load error:", error);
        toast.error("Failed to load job. Please try again.");
        router.replace("/jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJob();
    return () => {
      cancelled = true;
    };
  }, [jobId, router]);

  const handleSaveToggle = async () => {
    if (!job) return;

    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      setSaving(true);

      if (job.isSaved) {
        await axios.delete("/api/saved-jobs", {
          headers: { Authorization: `Bearer ${token}` },
          data: { jobId: job.id },
        });
        toast.success("Job removed from saved.");
      } else {
        await axios.post(
          "/api/saved-jobs",
          { jobId: job.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Job added to saved.");
      }

      setJob((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : prev));
    } catch (error) {
      console.error("[JobDetail] save toggle error:", error);
      toast.error("Unable to update saved jobs. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    if (role !== "candidate") {
      toast.error("Only candidates can apply to jobs.");
      return;
    }

    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      setApplying(true);

      // You can change this to your real applications API or a dedicated apply page.
      // Example: POST /api/applications  { jobId }
      await axios.post(
        "/api/applications",
        { jobId: job.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Application submitted.");
      setJob((prev) => (prev ? { ...prev, isApplied: true } : prev));
    } catch (error) {
      console.error("[JobDetail] apply error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-28 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-60 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const isCandidate = role === "candidate";
  const postedDate = new Date(job.postedAt);
  const deadline = job.applicationDeadline
    ? new Date(job.applicationDeadline)
    : null;

  const workModeLabel =
    job.workMode === "remote"
      ? "Remote"
      : job.workMode === "hybrid"
      ? "Hybrid"
      : "On-site";

  const jobTypeLabel = (() => {
    switch (job.jobType) {
      case "full-time":
        return "Full-time";
      case "part-time":
        return "Part-time";
      case "internship":
        return "Internship";
      case "contract":
        return "Contract";
      default:
        return job.jobType;
    }
  })();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:gap-6">
      {/* Top bar: back + save CTA */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 rounded-full w-fit"
          onClick={() => router.push("/jobs")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={job.isSaved ? "outline" : "ghost"}
            size="sm"
            className="inline-flex items-center gap-1 rounded-full"
            disabled={saving}
            onClick={handleSaveToggle}
          >
            {job.isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save job
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:items-start">
        {/* LEFT: Job content */}
        <div className="flex flex-col gap-4">
          {/* Overview card */}
          <Card className="border bg-background shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold sm:text-lg">
                      {job.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0.5 text-[10px]"
                    >
                      {jobTypeLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0.5 text-[10px]"
                    >
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
                      <Clock className="h-3 w-3" />
                      Posted{" "}
                      {postedDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "2-digit",
                      })}
                    </span>
                    {deadline && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Apply by{" "}
                          {deadline.toLocaleDateString(undefined, {
                            month: "short",
                            day: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* (Optional) Logo */}
                {job.companyLogoUrl && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card text-xs font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={job.companyLogoUrl}
                      alt={job.company}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                )}
              </div>

              {job.salaryRange && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Salary range:
                  </span>{" "}
                  {job.salaryRange}
                </p>
              )}

              {job.experienceLevel && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Experience level:
                  </span>{" "}
                  {job.experienceLevel}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4 text-xs text-muted-foreground">
              <div className="space-y-1.5">
                <h2 className="text-sm font-semibold text-foreground">
                  About the role
                </h2>
                <p className="leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    <Tag className="h-3 w-3" />
                    Key skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="rounded-full px-2 py-0.5 text-[10px]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-foreground">
                    What you&apos;ll do
                  </h3>
                  <ul className="ml-4 list-disc space-y-1">
                    {job.responsibilities.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-foreground">
                    What we&apos;re looking for
                  </h3>
                  <ul className="ml-4 list-disc space-y-1">
                    {job.requirements.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.perks && job.perks.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-foreground">
                    Benefits & perks
                  </h3>
                  <ul className="ml-4 list-disc space-y-1">
                    {job.perks.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Apply + company info */}
        <div className="flex w-full flex-col gap-4">
          {/* Apply card */}
          <Card className="border bg-background shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-semibold">
                Ready to apply?
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Submit your application directly through HireOrbit.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full text-xs"
                disabled={applying || job.isApplied || role !== "candidate"}
                onClick={handleApply}
              >
                {job.isApplied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Already applied
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {applying ? "Submitting..." : "Apply now"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              {role !== "candidate" && (
                <p className="text-[11px] text-muted-foreground">
                  You&apos;re currently signed in as an employer. Switch to a
                  candidate account to apply.
                </p>
              )}

              <Separator />

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Application tips
                </p>
                <ul className="ml-4 list-disc space-y-1 text-[11px] text-muted-foreground">
                  <li>Tailor your resume to the responsibilities listed.</li>
                  <li>Mention relevant projects and quantified impact.</li>
                  <li>Keep your profile details up to date.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Company snapshot */}
          <Card className="border bg-background shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    About {job.company}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Snapshot visible across this company&apos;s job listings.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-[11px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                {job.companySize && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {job.companySize}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.companyWebsite && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                    onClick={() =>
                      window.open(job.companyWebsite as string, "_blank")
                    }
                  >
                    <Globe2 className="h-3 w-3" />
                    Website
                  </button>
                )}
              </div>

              <p>
                As you explore roles from {job.company}, keep an eye on how
                their mission, culture, and work style align with what you&apos;re
                looking for in your next opportunity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
