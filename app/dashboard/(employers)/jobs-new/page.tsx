// app/dashboard/jobs/new/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Briefcase,
  MapPin,
  IndianRupee,
  Laptop2,
  Calendar,
  ListChecks,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Role = "candidate" | "employer";
type JobStatus = "draft" | "open" | "paused" | "closed";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

export default function NewEmployerJobPage() {
  const router = useRouter();

  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Basic job fields
  const [title, setTitle] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [employmentType, setEmploymentType] = React.useState("Full-time");
  const [remote, setRemote] = React.useState(false);

  // Compensation
  const [minSalary, setMinSalary] = React.useState("");
  const [maxSalary, setMaxSalary] = React.useState("");
  const [currency, setCurrency] = React.useState("INR");

  // Meta
  const [experienceLevel, setExperienceLevel] = React.useState("");
  const [applicationDeadline, setApplicationDeadline] = React.useState("");

  // Rich fields
  const [description, setDescription] = React.useState("");
  const [responsibilities, setResponsibilities] = React.useState("");
  const [requirements, setRequirements] = React.useState("");
  const [skills, setSkills] = React.useState("");

  // Publishing
  const [status, setStatus] = React.useState<JobStatus>("open");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedRole = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (storedRole !== "employer") {
      toast.error("Only employers can post jobs.");
      router.replace("/dashboard");
      return;
    }

    setRole(storedRole);
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!role) return;

    if (!title.trim() || !location.trim()) {
      toast.error("Please fill in at least job title and location.");
      return;
    }

    try {
      setSubmitting(true);

      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      // Parse numeric fields safely
      const salaryMin = minSalary.trim() ? Number(minSalary.trim()) : null;
      const salaryMax = maxSalary.trim() ? Number(maxSalary.trim()) : null;

      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const responsibilitiesArray = responsibilities
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const requirementsArray = requirements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const deadlineIso = applicationDeadline
        ? new Date(applicationDeadline + "T23:59:59").toISOString()
        : null;

      // Adjust keys to match your /api/employer/jobs POST route
      const payload = {
        title: title.trim(),
        location: location.trim(),
        employmentType,
        remote,
        salaryMin,
        salaryMax,
        currency,
        experienceLevel: experienceLevel.trim() || null,
        applicationDeadline: deadlineIso,
        description: description.trim(),
        responsibilities: responsibilitiesArray,
        requirements: requirementsArray,
        skills: skillsArray,
        status,
      };

      await axios.post("/api/employer/jobs", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        status === "draft"
          ? "Draft saved. You can publish it later from your jobs dashboard."
          : "Job posted successfully."
      );
      router.replace("/dashboard/jobs");
    } catch (error: any) {
      console.error("[NewEmployerJob] create error:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to create job. Please check your details and try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !role) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-60 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <NewJobHeader submitting={submitting} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 lg:flex-row"
      >
        {/* LEFT COLUMN – main fields */}
        <div className="flex w-full flex-1 flex-col gap-4">
          <JobBasicsCard
            title={title}
            setTitle={setTitle}
            location={location}
            setLocation={setLocation}
            employmentType={employmentType}
            setEmploymentType={setEmploymentType}
            remote={remote}
            setRemote={setRemote}
          />

          <JobDetailsCard
            description={description}
            setDescription={setDescription}
            responsibilities={responsibilities}
            setResponsibilities={setResponsibilities}
            requirements={requirements}
            setRequirements={setRequirements}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            skills={skills}
            setSkills={setSkills}
          />
        </div>

        {/* RIGHT COLUMN – meta & publishing */}
        <div className="flex w-full max-w-full flex-col gap-4 lg:max-w-xs">
          <CompensationCard
            minSalary={minSalary}
            setMinSalary={setMinSalary}
            maxSalary={maxSalary}
            setMaxSalary={setMaxSalary}
            currency={currency}
            setCurrency={setCurrency}
          />

          <PublishingCard
            applicationDeadline={applicationDeadline}
            setApplicationDeadline={setApplicationDeadline}
            status={status}
            setStatus={setStatus}
            submitting={submitting}
          />

          <PreviewCard
            title={title}
            location={location}
            employmentType={employmentType}
            remote={remote}
            minSalary={minSalary}
            maxSalary={maxSalary}
            currency={currency}
          />
        </div>
      </form>
    </div>
  );
}

/* ---------- HEADER ---------- */

function NewJobHeader({ submitting }: { submitting: boolean }) {
  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <Briefcase className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            Create a new job
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Share role details, requirements, and expectations clearly to attract
            the right candidates.
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Employer · New posting
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              You can save as draft or publish immediately.
            </span>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <p className="text-[11px] text-muted-foreground">
          {submitting
            ? "Saving your job..."
            : "You’ll be able to edit this later from your jobs dashboard."}
        </p>
      </div>
    </header>
  );
}

/* ---------- JOB BASICS CARD ---------- */

function JobBasicsCard(props: {
  title: string;
  setTitle: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  employmentType: string;
  setEmploymentType: (v: string) => void;
  remote: boolean;
  setRemote: (v: boolean) => void;
}) {
  const {
    title,
    setTitle,
    location,
    setLocation,
    employmentType,
    setEmploymentType,
    remote,
    setRemote,
  } = props;

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Job basics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Job title</Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                name="title"
                placeholder="Senior Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                placeholder="Bengaluru, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employment type</Label>
            <Select
              value={employmentType}
              onValueChange={setEmploymentType}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
            <div className="space-y-0.5">
              <Label className="text-xs">Remote-friendly</Label>
              <p className="text-[11px] text-muted-foreground">
                Mark this role as remote to highlight flexibility.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Laptop2 className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={remote}
                onCheckedChange={setRemote}
                aria-label="Remote toggle"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- JOB DETAILS CARD ---------- */

function JobDetailsCard(props: {
  description: string;
  setDescription: (v: string) => void;
  responsibilities: string;
  setResponsibilities: (v: string) => void;
  requirements: string;
  setRequirements: (v: string) => void;
  experienceLevel: string;
  setExperienceLevel: (v: string) => void;
  skills: string;
  setSkills: (v: string) => void;
}) {
  const {
    description,
    setDescription,
    responsibilities,
    setResponsibilities,
    requirements,
    setRequirements,
    experienceLevel,
    setExperienceLevel,
    skills,
    setSkills,
  } = props;

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Role details & requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <Label htmlFor="description">Job description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe the role, team, and mission. This is often the first thing candidates read."
            value={description}
            onChange={(e: { target: { value: string; }; }) => setDescription(e.target.value)}
            className="min-h-[120px] text-xs"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="responsibilities">
              Responsibilities{" "}
              <span className="text-[10px] text-muted-foreground">
                (one per line)
              </span>
            </Label>
            <Textarea
              id="responsibilities"
              name="responsibilities"
              rows={4}
              placeholder={"Own frontend features end-to-end\nCollaborate with designers and PMs\nWrite clean, maintainable code"}
              value={responsibilities}
              onChange={(e: { target: { value: string; }; }) => setResponsibilities(e.target.value)}
              className="min-h-[90px] text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirements">
              Requirements{" "}
              <span className="text-[10px] text-muted-foreground">
                (one per line)
              </span>
            </Label>
            <Textarea
              id="requirements"
              name="requirements"
              rows={4}
              placeholder={
                "3+ years of frontend experience\nStrong React / TypeScript skills\nExperience with modern tooling"
              }
              value={requirements}
              onChange={(e: { target: { value: string; }; }) => setRequirements(e.target.value)}
              className="min-h-[90px] text-xs"
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="experienceLevel">Experience level</Label>
            <Input
              id="experienceLevel"
              name="experienceLevel"
              placeholder="e.g. 2–4 years · Mid-level"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skills">
              Key skills{" "}
              <span className="text-[10px] text-muted-foreground">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="skills"
              name="skills"
              placeholder="React, TypeScript, Next.js, Tailwind"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- COMPENSATION CARD ---------- */

function CompensationCard(props: {
  minSalary: string;
  setMinSalary: (v: string) => void;
  maxSalary: string;
  setMaxSalary: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
}) {
  const { minSalary, setMinSalary, maxSalary, setMaxSalary, currency, setCurrency } =
    props;

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IndianRupee className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">
            Compensation
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Optional, but ranges help set clear expectations.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid gap-3 md:grid-cols-[1.3fr_1.3fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="salaryMin">Min salary (yearly)</Label>
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              placeholder="1200000"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryMax">Max salary (yearly)</Label>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              placeholder="1800000"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          You can leave these blank if you prefer not to show a range publicly,
          but candidates often appreciate transparency.
        </p>
      </CardContent>
    </Card>
  );
}

/* ---------- PUBLISHING CARD ---------- */

function PublishingCard(props: {
  applicationDeadline: string;
  setApplicationDeadline: (v: string) => void;
  status: JobStatus;
  setStatus: (v: JobStatus) => void;
  submitting: boolean;
}) {
  const {
    applicationDeadline,
    setApplicationDeadline,
    status,
    setStatus,
    submitting,
  } = props;

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">
            Publishing & timeline
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Decide when to close applications and whether to publish now.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <Label htmlFor="deadline">
            Application deadline{" "}
            <span className="text-[10px] text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="text-xs"
          />
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label>Initial status</Label>
          <Select
            value={status}
            onValueChange={(v: string) => setStatus(v as JobStatus)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open (publish now)</SelectItem>
              <SelectItem value="draft">Draft (save only)</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full text-xs"
          disabled={submitting}
        >
          {submitting ? (
            "Saving..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {status === "draft" ? "Save draft" : "Save & publish"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- PREVIEW CARD ---------- */

function PreviewCard(props: {
  title: string;
  location: string;
  employmentType: string;
  remote: boolean;
  minSalary: string;
  maxSalary: string;
  currency: string;
}) {
  const { title, location, employmentType, remote, minSalary, maxSalary, currency } =
    props;

  const hasSalary = minSalary || maxSalary;

  let salaryText = "Not specified";
  if (minSalary && maxSalary) {
    salaryText = `₹${Number(minSalary).toLocaleString("en-IN")} – ₹${Number(
      maxSalary
    ).toLocaleString("en-IN")} ${currency}`;
  } else if (minSalary) {
    salaryText = `From ₹${Number(minSalary).toLocaleString("en-IN")} ${currency}`;
  } else if (maxSalary) {
    salaryText = `Up to ₹${Number(maxSalary).toLocaleString("en-IN")} ${currency}`;
  }

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">
            Candidate preview
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            A quick snapshot of how this job might appear in listings.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {title || "Job title goes here"}
            </span>
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[10px]"
            >
              {employmentType || "Employment type"}
            </Badge>
            {remote && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[10px]"
              >
                Remote
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location || "Location"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {hasSalary ? salaryText : "Salary range not shown"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
