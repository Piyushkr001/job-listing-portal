// app/privacy/page.tsx

import {
  ShieldCheck,
  Database,
  Eye,
  Lock,
  Users,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-col gap-3 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">
          Legal
        </Badge>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Privacy Policy
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This Privacy Policy explains how HireOrbit collects, uses, and protects
          your personal information when you use our platform.
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: <span className="font-medium">January 2026</span>
        </p>
      </section>

      {/* CONTENT */}
      <section className="flex flex-col gap-4">
        <PolicyCard
          icon={<Users className="h-5 w-5" />}
          title="1. Information We Collect"
        >
          We collect information you provide directly, such as your name,
          email address, resume details, and account credentials. We may also
          collect usage data to improve platform performance.
        </PolicyCard>

        <PolicyCard
          icon={<Database className="h-5 w-5" />}
          title="2. How We Use Your Information"
        >
          Your information is used to provide and improve HireOrbit services,
          facilitate job applications, communicate updates, and ensure platform
          security and compliance.
        </PolicyCard>

        <PolicyCard
          icon={<Eye className="h-5 w-5" />}
          title="3. Information Sharing"
        >
          We do not sell your personal data. Information is shared only with
          employers when you apply for a job, or with trusted service providers
          necessary to operate the platform.
        </PolicyCard>

        <PolicyCard
          icon={<Lock className="h-5 w-5" />}
          title="4. Data Security"
        >
          We implement industry-standard security measures to protect your
          information. However, no system is completely secure, and we cannot
          guarantee absolute protection.
        </PolicyCard>

        <PolicyCard
          icon={<FileText className="h-5 w-5" />}
          title="5. Cookies & Tracking"
        >
          HireOrbit may use cookies and similar technologies to enhance user
          experience, analyze usage patterns, and improve service reliability.
          You can control cookie preferences through your browser settings.
        </PolicyCard>

        <PolicyCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="6. Your Rights"
        >
          You have the right to access, update, or delete your personal
          information. You may also request clarification on how your data is
          processed by contacting our support team.
        </PolicyCard>
      </section>

      <Separator />

      {/* FOOTER NOTE */}
      <section className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-5 py-4 text-sm">
        <p className="font-medium">Questions about privacy?</p>
        <p className="text-muted-foreground">
          If you have questions or concerns about this Privacy Policy, please
          reach out via the Contact page or email our support team.
        </p>
      </section>
    </div>
  );
}

/* ---------- HELPER ---------- */

function PolicyCard({
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
