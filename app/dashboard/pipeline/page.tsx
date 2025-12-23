"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type PipelineItem = {
  applicationId: string;
  status: string;
  step: string | null;
  updatedAt: string;
  job: { id: string; title: string; location: string };
  candidate: { id: string; name: string | null; email: string };
};

type PipelineResponse = {
  items: PipelineItem[];
  stage: string | null;
};

export default function EmployerPipelinePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const stage = sp.get("stage");

  const [token, setToken] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);

  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<PipelineItem[]>([]);

  // auth gate
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const t = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const r = window.localStorage.getItem(ROLE_KEY);

    if (!t) {
      router.replace("/login");
      return;
    }
    if (r !== "employer") {
      router.replace("/dashboard"); // or /login
      return;
    }

    setToken(t);
    setRole(r);
  }, [router]);

  const fetchPipeline = React.useCallback(async () => {
    if (!token || role !== "employer") return;

    try {
      setLoading(true);
      const url = stage
        ? `/api/employer/pipeline?stage=${encodeURIComponent(stage)}`
        : `/api/employer/pipeline`;

      const res = await axios.get<PipelineResponse>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems(res.data.items ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pipeline.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, role, stage]);

  React.useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const candidate = (it.candidate.name ?? it.candidate.email).toLowerCase();
      const job = it.job.title.toLowerCase();
      return candidate.includes(s) || job.includes(s) || (it.step ?? "").toLowerCase().includes(s);
    });
  }, [items, q]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!token || role !== "employer") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
            Candidate Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stage ? `Filtered by stage: ${stage}` : "All candidates across your roles."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => fetchPipeline()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by candidate, job, or step…"
          className="border-0 focus-visible:ring-0"
        />
      </div>

      <Card className="border bg-background shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {loading ? "Loading…" : `${filtered.length} application(s)`}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {!loading && filtered.length === 0 && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              No candidates found for this filter.
            </div>
          )}

          {filtered.map((it) => (
            <div key={it.applicationId} className="rounded-lg border px-3 py-2.5 hover:bg-muted/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {it.candidate.name ?? it.candidate.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {it.job.title} • {it.job.location}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{it.status}</Badge>
                  {it.step ? <Badge variant="outline">{it.step}</Badge> : null}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Updated {formatDateTime(it.updatedAt)}</span>
                <Button
                  size="sm"
                  className="rounded-full px-3 py-1 text-[11px]"
                  onClick={() => router.push(`/dashboard/applications/${it.applicationId}`)}
                >
                  Open application
                </Button>
              </div>

              <Separator className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
