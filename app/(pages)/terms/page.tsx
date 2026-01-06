// app/terms/page.tsx

import { FileText, ShieldCheck, Users, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-col gap-3 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">
          Legal
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Terms of Service
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          These Terms of Service govern your access to and use of HireOrbit.
          By accessing or using our platform, you agree to be bound by these terms.
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: <span className="font-medium">January 2026</span>
        </p>
      </section>

      {/* CONTENT */}
      <section className="flex flex-col gap-4">
        <TermsCard
          icon={<Users className="h-5 w-5" />}
          title="1. Eligibility"
        >
          You must be at least 18 years old to use HireOrbit. By using the
          platform, you represent and warrant that you have the legal capacity
          to enter into these Terms.
        </TermsCard>

        <TermsCard
          icon={<FileText className="h-5 w-5" />}
          title="2. Account Registration"
        >
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account. You agree to provide accurate and up-to-date information.
        </TermsCard>

        <TermsCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="3. Acceptable Use"
        >
          You agree not to misuse the platform. This includes, but is not
          limited to, attempting unauthorized access, submitting false
          information, or engaging in any activity that disrupts HireOrbit’s
          services.
        </TermsCard>

        <TermsCard
          icon={<Users className="h-5 w-5" />}
          title="4. Employer & Candidate Responsibilities"
        >
          Employers are responsible for the accuracy of job listings and fair
          hiring practices. Candidates are responsible for the accuracy of
          resumes, applications, and profile information submitted.
        </TermsCard>

        <TermsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="5. Limitation of Liability"
        >
          HireOrbit is provided on an “as is” and “as available” basis. We do
          not guarantee employment outcomes and shall not be liable for any
          indirect, incidental, or consequential damages arising from your use
          of the platform.
        </TermsCard>

        <TermsCard
          icon={<FileText className="h-5 w-5" />}
          title="6. Termination"
        >
          We reserve the right to suspend or terminate your account at any
          time if you violate these Terms or engage in unlawful or harmful
          activities on the platform.
        </TermsCard>

        <TermsCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="7. Changes to These Terms"
        >
          We may update these Terms from time to time. Continued use of
          HireOrbit after changes are posted constitutes your acceptance of
          the revised Terms.
        </TermsCard>
      </section>

      <Separator />

      {/* FOOTER NOTE */}
      <section className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-5 py-4 text-sm">
        <p className="font-medium">Questions about these terms?</p>
        <p className="text-muted-foreground">
          If you have any questions regarding these Terms of Service, please
          contact us via the Contact page or email our support team.
        </p>
      </section>
    </div>
  );
}

/* ---------- HELPER ---------- */

function TermsCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
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
        {children}
      </CardContent>
    </Card>
  );
}
