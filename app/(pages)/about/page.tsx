// app/about/page.tsx

import {
  Briefcase,
  Users,
  Target,
  Sparkles,
  ShieldCheck,
  Rocket,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HERO */}
      <section className="flex flex-col gap-4 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <div className="flex flex-col gap-2">
          <Badge className="w-fit rounded-full px-3 py-1 text-xs">
            About HireOrbit
          </Badge>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Connecting talent with opportunity
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            HireOrbit is a modern job marketplace designed to simplify hiring
            for employers and empower candidates to discover meaningful career
            opportunities.
          </p>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1 border bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Our mission is to create a transparent, efficient, and inclusive
            hiring ecosystem where candidates can showcase their skills and
            employers can discover the right talent without friction.
          </CardContent>
        </Card>

        <Card className="flex-1 border bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            We envision a future where hiring decisions are driven by skills,
            clarity, and data — not noise. HireOrbit aims to become the most
            trusted platform for career growth and recruitment.
          </CardContent>
        </Card>
      </section>

      {/* VALUES */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">What we stand for</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ValueCard
            icon={<Users className="h-5 w-5" />}
            title="Candidate-first"
            description="We prioritize clarity, fairness, and accessibility for job seekers at every step."
          />
          <ValueCard
            icon={<Briefcase className="h-5 w-5" />}
            title="Employer efficiency"
            description="Powerful tools that help employers hire faster without compromising quality."
          />
          <ValueCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Trust & security"
            description="Secure data handling, verified employers, and transparent processes."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="flex flex-col gap-4 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <h2 className="text-base font-semibold">How HireOrbit works</h2>

        <div className="flex flex-col gap-4 md:flex-row">
          <Step
            step="1"
            title="Discover jobs"
            text="Candidates explore curated job listings tailored to their preferences."
          />
          <Step
            step="2"
            title="Save & apply"
            text="Bookmark roles, apply directly, and track application progress."
          />
          <Step
            step="3"
            title="Hire smarter"
            text="Employers manage postings, review applicants, and hire efficiently."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-3 rounded-xl border bg-primary/5 px-6 py-6 text-center">
        <Rocket className="h-8 w-8 text-primary" />
        <h3 className="text-base font-semibold">
          Ready to explore opportunities?
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Join HireOrbit today and take the next step in your career or hiring
          journey.
        </p>
      </section>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function ValueCard({
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

function Step({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border bg-card px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {step}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
