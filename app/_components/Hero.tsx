"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  Timer,
  Users,
  Loader2,
  Zap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

/**
 * IMPORTANT:
 * - Keep API logic the same.
 * - We only redesigned UI and component structure.
 */

const RECOMMENDED_API = "/api/jobs/recommended?limit=2";
const AUTH_TOKEN_KEY = "hireorbit_token";

type RecommendedJob = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  salary?: string | null;
  type?: string | null;
  tags?: string[] | null;
};

type RecommendedResponse = {
  jobs: RecommendedJob[];
};

function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  // Recommendations state (unchanged logic)
  const [recLoading, setRecLoading] = React.useState(true);
  const [recError, setRecError] = React.useState<string | null>(null);
  const [recommended, setRecommended] = React.useState<RecommendedJob[]>([]);

  const goToJobs = React.useCallback(() => {
    const q = query.trim();
    router.push(q ? `/jobs?query=${encodeURIComponent(q)}` : "/jobs");
  }, [query, router]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") goToJobs();
  };

  // Fetch live recommendations (unchanged logic)
  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setRecLoading(true);
        setRecError(null);

        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem(AUTH_TOKEN_KEY)
            : null;

        const { data } = await axios.get<RecommendedResponse>(RECOMMENDED_API, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (cancelled) return;

        const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
        setRecommended(jobs.slice(0, 2));
      } catch (err: any) {
        if (cancelled) return;
        setRecError("Failed to load live recommendations.");
        setRecommended([]);
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fallback cards if backend returns empty or fails (unchanged logic)
  const fallback: RecommendedJob[] = [
    {
      id: "fallback-1",
      title: "Senior Frontend Engineer",
      company: "Remote-first team",
      location: "Remote",
      salary: "₹18–25 LPA",
      type: "Full-time",
      tags: ["React", "TypeScript", "Next.js"],
    },
    {
      id: "fallback-2",
      title: "Product Designer",
      company: "Growth-stage startup",
      location: "Bengaluru · Hybrid",
      salary: "",
      type: "",
      tags: ["Figma", "UI/UX"],
    },
  ];

  const displayJobs = recommended.length > 0 ? recommended : fallback;

  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* ===== Background (cleaner + more professional) ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-linear-to-tr from-indigo-500/18 via-cyan-400/14 to-emerald-400/16 blur-3xl" />
        <div className="absolute -bottom-36 -left-28 h-[380px] w-[380px] rounded-full bg-linear-to-tr from-emerald-400/16 via-cyan-400/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[380px] w-[380px] rounded-full bg-linear-to-tr from-indigo-500/14 via-cyan-400/10 to-emerald-400/14 blur-3xl" />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(0 0 0 / 1) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-b from-background/30 via-background to-background" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12 md:py-16 lg:py-20">
        {/* ===== Layout: flex-based, responsive, professional spacing ===== */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-12">
          {/* ================= LEFT COLUMN ================= */}
          <div className="flex w-full flex-1 flex-col justify-center gap-6">
            {/* Top chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                HireOrbit · Smart job matching
              </Badge>

              <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Verified employers
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                <Zap className="h-3.5 w-3.5 text-indigo-500" />
                Faster pipeline
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Find, apply, and hire{" "}
                <span className="bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  with confidence
                </span>
                .
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                A modern job portal for candidates and hiring teams—search roles, manage
                applications, and keep your pipeline moving with clean, structured workflows.
              </p>
            </div>

            {/* Search block (more “product-grade”) */}
            <Card className="border bg-card/70 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border bg-background/70 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search roles, skills, or companies (e.g., Frontend Developer)"
                      className="h-10 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={goToJobs}
                    className="group h-11 w-full rounded-xl px-5 text-sm sm:w-auto sm:text-base"
                  >
                    Search jobs
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    Full-time / Internship
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Remote / Hybrid
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1">
                    <Users className="h-3.5 w-3.5" />
                    Growing teams
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trust metrics (cleaner cards) */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <MetricPill
                icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
                label="Curated roles"
                value="500+"
                sub="added this week"
              />
              <MetricPill
                icon={<Timer className="h-4 w-4 text-emerald-500" />}
                label="Avg time-to-apply"
                value="2 min"
                sub="quick apply flow"
              />
              <MetricPill
                icon={<CheckCircle2 className="h-4 w-4 text-cyan-500" />}
                label="Verified teams"
                value="100+"
                sub="higher-quality listings"
              />
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex w-full flex-col gap-4 lg:w-[420px] lg:min-w-[420px]">
            <Card className="relative overflow-hidden border bg-linear-to-b from-background to-muted/70 shadow-xl">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-linear-to-tr from-indigo-500/15 via-cyan-400/12 to-emerald-400/14 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-20 h-52 w-52 rounded-full bg-linear-to-tr from-emerald-400/14 via-cyan-400/10 to-indigo-500/10 blur-3xl" />

              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm font-semibold sm:text-base">
                    Live recommendations
                  </CardTitle>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {recLoading
                      ? "Loading…"
                      : recommended.length
                      ? "Matching now"
                      : "Popular picks"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Suggested roles based on your activity and profile signals.
                </p>

                {recError && (
                  <p className="text-[11px] text-destructive">
                    {recError} Showing fallback roles.
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {recLoading ? (
                  <div className="space-y-3">
                    <SkeletonRole />
                    <SkeletonRole />
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching recommendations…
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <PreviewRole
                      icon={<Briefcase className="h-4 w-4 text-indigo-500" />}
                      title={displayJobs[0]?.title ?? "Role"}
                      meta={buildMeta(displayJobs[0])}
                      tags={(displayJobs[0]?.tags ?? ["React", "TypeScript"]).slice(0, 3)}
                      cta="View"
                      onClick={() => router.push(`/jobs/${displayJobs[0]?.id ?? ""}`)}
                      disabled={
                        !displayJobs[0]?.id ||
                        displayJobs[0]?.id.startsWith("fallback")
                      }
                    />

                    <PreviewRole
                      icon={<Users className="h-4 w-4 text-cyan-500" />}
                      title={displayJobs[1]?.title ?? "Role"}
                      meta={buildMeta(displayJobs[1])}
                      tags={(displayJobs[1]?.tags ?? ["UI/UX", "Figma"]).slice(0, 3)}
                      cta="View"
                      variant="outline"
                      onClick={() => router.push(`/jobs/${displayJobs[1]?.id ?? ""}`)}
                      disabled={
                        !displayJobs[1]?.id ||
                        displayJobs[1]?.id.startsWith("fallback")
                      }
                    />

                    <div className="rounded-xl border bg-background/60 p-3">
                      <p className="text-[11px] text-muted-foreground">
                        Create an account to unlock tailored recommendations, saved roles,
                        and 1-click applications.
                      </p>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          className="h-10 w-full rounded-xl sm:w-auto"
                          onClick={() => router.push("/signup")}
                        >
                          Create account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-xl sm:w-auto"
                          onClick={() => router.push("/login")}
                        >
                          Sign in
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-2 sm:grid-cols-2">
              <MiniChip title="Cleaner matches" desc="Less noise, better fit." icon={<Sparkles className="h-4 w-4 text-indigo-500" />} />
              <MiniChip title="Faster decisions" desc="Move candidates in minutes." icon={<Timer className="h-4 w-4 text-emerald-500" />} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildMeta(job?: RecommendedJob) {
  if (!job) return "Open roles · Explore now";
  const left = [job.location, job.salary, job.type].filter(Boolean).join(" · ");
  const company = job.company ? `${job.company} · ` : "";
  return `${company}${left || "Explore now"}`;
}

function SkeletonRole() {
  return (
    <div className="flex items-start justify-between rounded-2xl border bg-card/70 px-3 py-3 shadow-sm">
      <div className="space-y-2">
        <div className="h-4 w-44 rounded bg-muted animate-pulse" />
        <div className="h-3 w-56 rounded bg-muted animate-pulse" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-9 w-16 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-1 items-start gap-3 rounded-2xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/50">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border bg-background/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function PreviewRole({
  icon,
  title,
  meta,
  tags,
  cta,
  variant,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tags: string[];
  cta: string;
  variant?: "default" | "outline";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border bg-card/70 px-3 py-3 shadow-sm">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <p className="truncate text-sm font-medium">{title}</p>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{meta}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={variant === "outline" ? "outline" : "default"}
        className="h-9 shrink-0 rounded-full px-4 text-xs"
        onClick={onClick}
        disabled={disabled}
      >
        {cta}
      </Button>
    </div>
  );
}

function MiniChip({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card/60 px-4 py-3 text-xs shadow-sm backdrop-blur supports-backdrop-filter:bg-card/40">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border bg-background/70">
        {icon ?? <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default HeroSection;
