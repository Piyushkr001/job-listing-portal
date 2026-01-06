// app/faq/page.tsx

import {
  HelpCircle,
  User,
  Briefcase,
  ShieldCheck,
  Mail,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FAQPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-col gap-3 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">
          FAQs
        </Badge>

        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Frequently Asked Questions
        </h1>

        <p className="max-w-3xl text-sm text-muted-foreground">
          Quick answers to common questions about HireOrbit for candidates and
          employers.
        </p>
      </section>

      {/* FAQ SECTIONS */}
      <div className="flex flex-col gap-5">
        {/* ACCOUNT */}
        <FAQSection
          icon={<User className="h-5 w-5" />}
          title="Account & Access"
        >
          <Accordion type="single" collapsible className="w-full">
            <FAQItem
              value="account-1"
              question="How do I create an account on HireOrbit?"
              answer="You can sign up using your email or Google account. Choose whether you are registering as a candidate or an employer during onboarding."
            />
            <FAQItem
              value="account-2"
              question="Can I switch between candidate and employer roles?"
              answer="No. Roles are fixed per account for security reasons. To use another role, you must create a separate account."
            />
            <FAQItem
              value="account-3"
              question="I forgot my password. What should I do?"
              answer="Use the “Forgot password” option on the login page. You’ll receive instructions by email to reset your password."
            />
          </Accordion>
        </FAQSection>

        {/* JOBS & APPLICATIONS */}
        <FAQSection
          icon={<Briefcase className="h-5 w-5" />}
          title="Jobs & Applications"
        >
          <Accordion type="single" collapsible className="w-full">
            <FAQItem
              value="jobs-1"
              question="How do I apply for a job?"
              answer="Open a job listing, click “Apply now”, upload your resume, and submit your application."
            />
            <FAQItem
              value="jobs-2"
              question="Can I save jobs for later?"
              answer="Yes. Click the bookmark icon on any job listing to save it. Saved jobs appear in your dashboard."
            />
            <FAQItem
              value="jobs-3"
              question="Can I withdraw an application?"
              answer="Yes. If you’ve already applied, you can withdraw your application from the job details page."
            />
          </Accordion>
        </FAQSection>

        {/* EMPLOYERS */}
        <FAQSection
          icon={<Briefcase className="h-5 w-5" />}
          title="Employers"
        >
          <Accordion type="single" collapsible className="w-full">
            <FAQItem
              value="employer-1"
              question="How do I post a job?"
              answer="After signing in as an employer, go to your dashboard and use the “Post Job” option to publish a listing."
            />
            <FAQItem
              value="employer-2"
              question="Can I manage applicants?"
              answer="Yes. Employers can view, shortlist, and manage applicants directly from the employer dashboard."
            />
          </Accordion>
        </FAQSection>

        {/* SECURITY & PRIVACY */}
        <FAQSection
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Security & Privacy"
        >
          <Accordion type="single" collapsible className="w-full">
            <FAQItem
              value="security-1"
              question="Is my data secure?"
              answer="Yes. We use secure authentication, encrypted connections, and follow best practices to protect your data."
            />
            <FAQItem
              value="security-2"
              question="Who can see my profile information?"
              answer="Your information is only visible to relevant parties (employers for candidates, and vice versa) when required."
            />
          </Accordion>
        </FAQSection>

        {/* SUPPORT */}
        <FAQSection
          icon={<Mail className="h-5 w-5" />}
          title="Support"
        >
          <Accordion type="single" collapsible className="w-full">
            <FAQItem
              value="support-1"
              question="How can I contact support?"
              answer="You can reach us through the Contact page. Our team usually responds within 24–48 business hours."
            />
            <FAQItem
              value="support-2"
              question="I found a bug. What should I do?"
              answer="Please report bugs via the Contact page with clear steps and screenshots if possible."
            />
          </Accordion>
        </FAQSection>
      </div>

      <Separator />

      {/* FOOTER NOTE */}
      <p className="text-center text-xs text-muted-foreground">
        Didn’t find what you were looking for? Visit the{" "}
        <a href="/contact" className="underline underline-offset-2">
          Contact page
        </a>{" "}
        and we’ll help you out.
      </p>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function FAQSection({
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

function FAQItem({
  value,
  question,
  answer,
}: {
  value: string;
  question: string;
  answer: string;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-left text-sm">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}
