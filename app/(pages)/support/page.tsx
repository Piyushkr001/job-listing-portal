// app/support/page.tsx

import {
  HelpCircle,
  Mail,
  MessageSquare,
  FileQuestion,
  LifeBuoy,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-col gap-3 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">
          Support Center
        </Badge>

        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          How can we help you?
        </h1>

        <p className="max-w-3xl text-sm text-muted-foreground">
          Get help with your account, job applications, employer tools, or
          platform features. We’re here to support both candidates and
          employers.
        </p>
      </section>

      {/* SUPPORT OPTIONS */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SupportCard
          icon={<FileQuestion className="h-5 w-5" />}
          title="Help & FAQs"
          description="Find answers to common questions about accounts, applications, and job postings."
          actionLabel="View FAQs"
          href="/faq"
        />

        <SupportCard
          icon={<Mail className="h-5 w-5" />}
          title="Contact Support"
          description="Reach out to our support team for personalised assistance."
          actionLabel="Contact us"
          href="/contact"
        />

        <SupportCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="Feedback & Suggestions"
          description="Share feedback or ideas to help us improve HireOrbit."
          actionLabel="Send feedback"
          href="/contact"
        />
      </section>

      {/* INFO SECTIONS */}
      <section className="flex flex-col gap-4">
        <InfoCard
          icon={<LifeBuoy className="h-5 w-5" />}
          title="What can we help with?"
        >
          <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Account access, login, and role issues</li>
            <li>Saving jobs and managing applications</li>
            <li>Employer job postings and candidate management</li>
            <li>Technical issues or unexpected errors</li>
            <li>Security, privacy, and policy questions</li>
          </ul>
        </InfoCard>

        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          title="Support availability"
        >
          <p className="text-sm text-muted-foreground">
            Our support team typically responds within{" "}
            <span className="font-medium text-foreground">24–48 hours</span>{" "}
            on business days. Complex issues may take slightly longer, but we’ll
            keep you informed throughout the process.
          </p>
        </InfoCard>
      </section>

      <Separator />

      {/* FOOTER CTA */}
      <section className="flex flex-col gap-3 rounded-xl border bg-muted/30 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">Still need help?</p>
          <p className="text-muted-foreground">
            If you can’t find what you’re looking for, our team is happy to help.
          </p>
        </div>

        <Button asChild className="rounded-full">
          <a href="/contact">Contact Support</a>
        </Button>
      </section>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function SupportCard({
  icon,
  title,
  description,
  actionLabel,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <Card className="flex h-full flex-col justify-between border bg-background shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        <Button asChild variant="outline" className="w-fit rounded-full">
          <a href={href}>{actionLabel}</a>
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoCard({
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
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
