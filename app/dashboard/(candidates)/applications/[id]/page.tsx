"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AUTH_TOKEN_KEY = "hireorbit_token";

type DetailResponse = {
  application: {
    id: string;
    jobId: string;
    status: string;
    step: string;
    appliedAt: string;
    nextInterviewAt: string | null;
  };
  job: {
    id: string;
    title: string;
    location: string;
    description: string;
    company: string;
  };
};

type EventItem = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
  createdAt: string;
  actor: { name: string; company: string } | null;
};

type EventsResponse = { events: EventItem[] };

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<DetailResponse | null>(null);
  const [events, setEvents] = React.useState<EventItem[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
  }, [router]);

  React.useEffect(() => {
    if (!token || !id) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const [dRes, eRes] = await Promise.all([
          axios.get<DetailResponse>(`/api/applications/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<EventsResponse>(`/api/applications/${id}/events`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!cancelled) {
          setDetail(dRes.data);
          setEvents(eRes.data?.events ?? []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Failed to load application details.");
          setDetail(null);
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const iconForType = (type: string) => {
    if (type === "status_changed") return CheckCircle2;
    if (type === "interview_scheduled") return CalendarClock;
    if (type === "note") return FileText;
    return Users;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Button variant="outline" className="w-fit rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Application not found or you don’t have access.
        </div>
      </div>
    );
  }

  const { application, job } = detail;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company} • {job.location}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button size="sm" className="rounded-full" onClick={() => router.push(`/jobs/${job.id}`)}>
            View job
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,2fr]">
        <Card className="border bg-background shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Application summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant="secondary">{application.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Applied</span>
              <span className="text-xs">{formatDateTime(application.appliedAt)}</span>
            </div>
            {application.nextInterviewAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interview</span>
                <span className="text-xs">{formatDateTime(application.nextInterviewAt)}</span>
              </div>
            )}
            {application.step && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Current step</p>
                  <p className="text-xs text-muted-foreground">{application.step}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border bg-background shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No timeline events yet. Events appear when your status changes or notes are added.
              </p>
            )}

            {events.map((ev) => {
              const Icon = iconForType(ev.type);
              return (
                <div
                  key={ev.id}
                  className="flex gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {ev.type === "status_changed"
                          ? `Status changed${ev.toStatus ? ` → ${ev.toStatus}` : ""}`
                          : ev.type === "interview_scheduled"
                          ? "Interview scheduled"
                          : ev.type === "note"
                          ? "Note added"
                          : ev.type}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</p>
                    </div>

                    {(ev.fromStatus || ev.toStatus) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ev.fromStatus ? `From: ${ev.fromStatus}` : ""}{" "}
                        {ev.toStatus ? `To: ${ev.toStatus}` : ""}
                      </p>
                    )}

                    {ev.message && (
                      <p className="mt-1 text-xs text-muted-foreground">{ev.message}</p>
                    )}

                    {ev.actor && (ev.actor.company || ev.actor.name) && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        By {ev.actor.company || ev.actor.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
