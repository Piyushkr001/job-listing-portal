// app/features/page.tsx

import {
  Sparkles,
  Search,
  Bookmark,
  CheckCircle2,
  Briefcase,
  Users,
  ShieldCheck,
  BarChart3,
  Bell,
  Layers,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HERO */}
      <section className="flex flex-col gap-4 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">
          Platform features
        </Badge>

        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Everything you need to hire and get hired
        </h1>

        <p className="max-w-3xl text-sm text-muted-foreground">
          HireOrbit provides a powerful set of tools for both candidates and
          employers — designed to reduce friction, improve visibility, and make
          better hiring decisions.
        </p>
      </section>

      {/* CORE FEATURES */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Core features</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Smart job discovery"
            description="Search and filter jobs by role, location, work mode, and job type with instant results."
          />
          <FeatureCard
            icon={<Bookmark className="h-5 w-5" />}
            title="Save & shortlist jobs"
            description="Bookmark interesting roles and manage your personal shortlist from your dashboard."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="One-click applications"
            description="Apply to jobs directly on HireOrbit and track application status in real time."
          />
          <FeatureCard
            icon={<Bell className="h-5 w-5" />}
            title="Application tracking"
            description="Stay informed with clear application states and timely updates."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure & role-based access"
            description="Separate candidate and employer workflows with secure authentication."
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Modern dashboard"
            description="A clean, responsive dashboard experience built for clarity and speed."
          />
        </div>
      </section>

      <Separator />

      {/* CANDIDATE FEATURES */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">For candidates</h2>

        <div className="flex flex-col gap-4 lg:flex-row">
          <FeatureBlock
            icon={<Sparkles className="h-5 w-5" />}
            title="Personalised job experience"
            description="Discover opportunities aligned with your interests, skills, and preferences."
          />
          <FeatureBlock
            icon={<Bookmark className="h-5 w-5" />}
            title="Saved jobs dashboard"
            description="View, manage, and revisit saved roles anytime in one place."
          />
          <FeatureBlock
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Application history"
            description="Track applied roles and application outcomes from your dashboard."
          />
        </div>
      </section>

      <Separator />

      {/* EMPLOYER FEATURES */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">For employers</h2>

        <div className="flex flex-col gap-4 lg:flex-row">
          <FeatureBlock
            icon={<Briefcase className="h-5 w-5" />}
            title="Job posting management"
            description="Create, update, and manage job listings with full control."
          />
          <FeatureBlock
            icon={<Users className="h-5 w-5" />}
            title="Applicant visibility"
            description="Review applicants clearly with structured application data."
          />
          <FeatureBlock
            icon={<BarChart3 className="h-5 w-5" />}
            title="Hiring insights"
            description="Gain visibility into application flow and candidate engagement."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-3 rounded-xl border bg-primary/5 px-6 py-6 text-center">
        <Sparkles className="h-8 w-8 text-primary" />
        <h3 className="text-base font-semibold">
          Built for clarity, speed, and trust
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          HireOrbit is designed to scale with your hiring needs — whether
          you’re applying for your first role or managing hundreds of candidates.
        </p>
      </section>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-sm font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

function FeatureBlock({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border bg-card px-4 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
