"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, FileText, Mail, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

type Role = "candidate" | "employer";

type CandidateProfileResponse = {
  user: { id: string; name: string | null; email: string };
  profile: null | { headline: string | null; bio: string | null; location: string | null; resumeUrl: string | null };
  skills: string[];
};

export default function CandidateProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const candidateId = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<CandidateProfileResponse | null>(null);

  React.useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const role = window.localStorage.getItem(ROLE_KEY) as Role | null;

    if (!token) return router.replace("/login");
    if (role !== "employer") return router.replace("/jobs");
    if (!candidateId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<CandidateProfileResponse>(
          `/api/employer/candidates/${candidateId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setData(res.data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load candidate profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router, candidateId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{data.user.name || "Unnamed Candidate"}</h1>
          <p className="text-sm text-muted-foreground">{data.profile?.headline || "Candidate profile"}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
          <CardDescription className="text-xs">Basic contact and profile info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {data.user.email}
            </span>
            {data.profile?.location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {data.profile.location}
              </span>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs font-medium">Bio</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.profile?.bio || "No bio provided."}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium">Skills</p>
            <div className="flex flex-wrap gap-2">
              {data.skills.length ? data.skills.map((s) => (
                <Badge key={s} variant="secondary" className="rounded-full">
                  {s}
                </Badge>
              )) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            {data.profile?.resumeUrl ? (
              <Button className="rounded-full" onClick={() => window.open(data.profile!.resumeUrl!, "_blank")}>
                <FileText className="mr-2 h-4 w-4" />
                Open resume
              </Button>
            ) : (
              <Button className="rounded-full" disabled>
                <FileText className="mr-2 h-4 w-4" />
                No resume
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
