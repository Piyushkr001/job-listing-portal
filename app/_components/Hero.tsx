"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
} from "lucide-react";

/**
 * IMPORTANT:
 * - This component now fetches "Live recommendations" from backend.
 * - Update RECOMMENDED_API to match your actual API route.
 *
 * Expected response shape (example):
 * {
 *   jobs: Array<{
 *     id: string;
 *     title: string;
 *     company?: string;
 *     location?: string;
 *     salary?: string;
 *     type?: string;
 *     tags?: string[];
 *   }>
 * }
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

  // Recommendations state
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

  // Fetch live recommendations (with optional auth header if token exists)
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

  // Fallback cards if backend returns empty or fails
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
      {/* Background: gradient mesh + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-linear-to-tr from-indigo-500/20 via-cyan-400/20 to-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-linear-to-tr from-emerald-400/20 via-cyan-400/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-linear-to-tr from-indigo-500/15 via-cyan-400/10 to-emerald-400/15 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(0 0 0 / 1) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background to-background" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12 md:py-16 lg:py-20">
        {/* Responsiveness improvements:
            - Mobile: stacked, tighter spacing, full-width right card below
            - Tablet: 2-column with better gaps
            - Desktop: balanced proportions and consistent vertical alignment
        */}
        <div className="grid items-start gap-10 md:grid-cols-[1.1fr,0.9fr] md:gap-10 lg:gap-12">
          {/* LEFT */}
          <div className="space-y-7 md:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Hire smarter. Grow faster.
              </Badge>

              <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Verified companies
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                <Timer className="h-3.5 w-3.5 text-indigo-500" />
                Faster shortlists
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Hire the{" "}
                <span className="bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  right talent
                </span>{" "}
                in one orbit.
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                HireOrbit helps teams discover, evaluate, and hire top candidates
                faster—with a streamlined job discovery and application experience
                tailored for modern companies.
              </p>
            </div>

            {/* SEARCH BAR (better mobile ergonomics) */}
            <div className="rounded-2xl border bg-card/70 p-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border bg-background/60 px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search roles e.g. Frontend Developer"
                    className="h-10 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <Button
                  type="button"
                  onClick={goToJobs}
                  className="group h-11 w-full rounded-xl px-5 text-sm sm:w-auto sm:text-base"
                >
                  Find Jobs
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2.5 py-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  Full-time
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Remote / Hybrid
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2.5 py-1">
                  <Users className="h-3.5 w-3.5" />
                  100+ teams hiring
                </span>
              </div>
            </div>

            {/* TRUST / STATS (improved responsiveness) */}
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricPill label="Curated roles" value="500+" sub="added this week" />
              <MetricPill label="Avg time-to-apply" value="2 min" sub="1-click flow" />
              <MetricPill label="Hiring teams" value="100+" sub="verified employers" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full md:pt-1">
            <Card className="relative overflow-hidden border border-border/70 bg-linear-to-b from-background to-muted/70 shadow-xl">
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-linear-to-tr from-indigo-500/15 via-cyan-400/15 to-emerald-400/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-linear-to-tr from-emerald-400/15 via-cyan-400/10 to-indigo-500/10 blur-3xl" />

              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm font-semibold sm:text-base">
                    Live recommendations
                  </CardTitle>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {recLoading ? "Loading…" : recommended.length ? "Matching now" : "Popular picks"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Roles suggested based on your skills, preferences, and recent activity.
                </p>

                {recError && (
                  <p className="text-[11px] text-destructive">
                    {recError} Showing fallback roles.
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {recLoading ? (
                  <div className="flex flex-col gap-3">
                    <SkeletonRole />
                    <SkeletonRole />
                    <div className="rounded-xl border bg-background/50 p-3">
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
                      disabled={!displayJobs[0]?.id || displayJobs[0]?.id.startsWith("fallback")}
                    />

                    <PreviewRole
                      icon={<Users className="h-4 w-4 text-cyan-500" />}
                      title={displayJobs[1]?.title ?? "Role"}
                      meta={buildMeta(displayJobs[1])}
                      tags={(displayJobs[1]?.tags ?? ["UI/UX", "Figma"]).slice(0, 3)}
                      cta="Save"
                      variant="outline"
                      onClick={() => router.push(`/jobs/${displayJobs[1]?.id ?? ""}`)}
                      disabled={!displayJobs[1]?.id || displayJobs[1]?.id.startsWith("fallback")}
                    />

                    <div className="rounded-xl border bg-background/50 p-3">
                      <p className="text-[11px] text-muted-foreground">
                        Create a free account to unlock tailored recommendations, saved roles,
                        and 1-click applications—designed to keep your hiring in orbit.
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

            {/* Mini badges: responsive */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <MiniChip title="Verified employers" desc="Reduce spam & improve quality" />
              <MiniChip title="Smart pipeline" desc="Shortlist & schedule faster" />
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
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/50">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
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

function MiniChip({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card/60 px-4 py-3 text-xs shadow-sm backdrop-blur supports-backdrop-filter:bg-card/40">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

export default HeroSection;
