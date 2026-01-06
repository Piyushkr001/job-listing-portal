// app/cookies/page.tsx

import {
  Cookie,
  ShieldCheck,
  SlidersHorizontal,
  Info,
  Globe,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CookiesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* HEADER */}
      <section className="flex flex-col gap-3 rounded-xl border bg-background px-5 py-6 shadow-sm md:px-8">
        <Badge className="w-fit rounded-full px-3 py-1 text-xs">Legal</Badge>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Cookie Policy
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This Cookie Policy explains what cookies are, how HireOrbit uses them,
          and how you can manage your preferences.
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: <span className="font-medium">January 2026</span>
        </p>
      </section>

      {/* CONTENT */}
      <section className="flex flex-col gap-4">
        <PolicyCard icon={<Info className="h-5 w-5" />} title="1. What Are Cookies?">
          Cookies are small text files stored on your device when you visit a
          website. They help websites remember information about your visit,
          like your preferences, session state, and interactions.
        </PolicyCard>

        <PolicyCard
          icon={<Cookie className="h-5 w-5" />}
          title="2. How HireOrbit Uses Cookies"
        >
          We use cookies to keep you signed in, protect your account, improve
          performance, and understand how the platform is used so we can enhance
          the experience for candidates and employers.
        </PolicyCard>

        <PolicyCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="3. Types of Cookies We Use"
        >
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="font-medium text-foreground">Essential Cookies</p>
              <p className="mt-1">
                Required for core functionality such as authentication, security,
                and session management. These cannot be disabled in our systems.
              </p>
            </div>

            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="font-medium text-foreground">Performance Cookies</p>
              <p className="mt-1">
                Help us understand how users interact with HireOrbit (e.g., page
                visits, load times) so we can improve reliability and UX.
              </p>
            </div>

            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="font-medium text-foreground">Preference Cookies</p>
              <p className="mt-1">
                Remember your choices (e.g., theme, language, saved filters) to
                provide a more personalised experience.
              </p>
            </div>

            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="font-medium text-foreground">Analytics Cookies</p>
              <p className="mt-1">
                Used to measure usage patterns and improve features. We do not
                sell personal data; analytics are used to improve the platform.
              </p>
            </div>
          </div>
        </PolicyCard>

        <PolicyCard
          icon={<Globe className="h-5 w-5" />}
          title="4. Third-Party Cookies"
        >
          Some features may rely on third-party services (e.g., analytics or
          embedded content). These providers may set cookies according to their
          own policies. We encourage you to review third-party cookie policies
          where applicable.
        </PolicyCard>

        <PolicyCard
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title="5. Managing Your Cookie Preferences"
        >
          You can control cookies through your browser settings. Most browsers
          allow you to delete existing cookies, block cookies, or receive a
          warning before a cookie is stored. Note that disabling essential
          cookies may impact platform functionality (e.g., login, secure pages).
        </PolicyCard>

        <PolicyCard icon={<FileText className="h-5 w-5" />} title="6. Updates to This Policy">
          We may update this Cookie Policy from time to time. Changes will be
          posted on this page, and your continued use of HireOrbit indicates
          acceptance of the updated policy.
        </PolicyCard>
      </section>

      <Separator />

      {/* FOOTER NOTE */}
      <section className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-5 py-4 text-sm">
        <p className="font-medium">Need help?</p>
        <p className="text-muted-foreground">
          If you have questions about cookies or privacy, please reach out via
          the Contact page.
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
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}
