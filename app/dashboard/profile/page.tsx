// app/dashboard/profile/page.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  // Below are only used as text; remove if you don't use those cards
  Briefcase,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Role = "candidate" | "employer";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role";

/* ---------- API Types ---------- */
type ProfileGetResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    companyName: string | null;
    provider: "credentials" | "google";
  };
  profile: {
    location: string;
    website: string;
    headline: string;
    bio: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Source of truth for role comes from API
  const [role, setRole] = React.useState<Role | null>(null);

  // Controlled fields we actually persist (supported by your current schema)
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState(""); // read-only
  const [companyName, setCompanyName] = React.useState<string>("");

  // Optional local-only fields (for UI; not persisted yet)
  const [phone, setPhone] = React.useState("");
  const [location, setLocation] = React.useState("");

  // Auth + initial load
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<ProfileGetResponse>("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        setRole(data.user.role);
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setCompanyName(data.user.companyName ?? "");

        // optional local-only placeholders
        setLocation(data.profile.location || "");
        // phone is not in API yet; keep whatever user typed last session if you store it locally

        // keep localStorage role in sync for the rest of your app
        window.localStorage.setItem(ROLE_KEY, data.user.role);
      } catch (e: any) {
        console.error("Profile load failed:", e);
        toast.error(
          e?.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
        // on hard auth failure, kick to login
        if (e?.response?.status === 401) router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!role) return;

    try {
      setSaving(true);
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      // Only send fields your schema currently supports
      const payload: { name?: string; companyName?: string } = {};
      if (name.trim()) payload.name = name.trim();
      if (role === "employer") payload.companyName = companyName.trim();

      await axios.patch("/api/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile saved successfully.");
    } catch (e: any) {
      console.error("Profile save failed:", e);
      toast.error(
        e?.response?.data?.message || "Failed to save profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !role) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-4 p-4 md:p-6">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const isCandidate = role === "candidate";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <ProfileHeader role={role} saving={saving} />

      {/* Form wraps the whole content area */}
      <form
        id="profile-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 lg:grid-cols-[2fr,1.4fr]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            <BasicDetailsCard
              role={role}
              name={name}
              setName={setName}
              email={email}
              companyName={companyName}
              setCompanyName={setCompanyName}
              phone={phone}
              setPhone={setPhone}
              location={location}
              setLocation={setLocation}
            />
            {isCandidate ? <CandidateAboutCard /> : <EmployerAboutCard />}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            {isCandidate ? (
              <>
                <CandidatePreferencesCard />
                <CandidateSkillsCard />
              </>
            ) : (
              <>
                <EmployerPreferencesCard />
                <EmployerSnapshotCard />
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

/* ---------- HEADER ---------- */

function ProfileHeader({ role, saving }: { role: Role; saving: boolean }) {
  const isCandidate = role === "candidate";

  return (
    <header className="flex flex-col justify-between gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:px-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:h-14 md:w-14">
          <User className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            {isCandidate ? "Your candidate profile" : "Your employer profile"}
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            {isCandidate
              ? "Keep your details up to date so employers can get to know you better."
              : "Manage your company information and hiring preferences in one place."}
          </p>
          <div className="inline-flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {isCandidate ? "Candidate" : "Employer"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Used across your dashboard and applications.
            </span>
          </div>
        </div>
      </div>

      {/* Save button aligned to the right on larger screens */}
      <div className="flex justify-start md:justify-end">
        <Button
          type="submit"
          form="profile-form"
          className="inline-flex items-center gap-2 rounded-full"
          size="sm"
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </header>
  );
}

/* ---------- BASIC DETAILS CARD ---------- */

function BasicDetailsCard({
  role,
  name,
  setName,
  email,
  companyName,
  setCompanyName,
  phone,
  setPhone,
  location,
  setLocation,
}: {
  role: Role;
  name: string;
  setName: (v: string) => void;
  email: string;
  companyName: string;
  setCompanyName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
}) {
  const isCandidate = role === "candidate";

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {isCandidate ? "Basic details" : "Company contact details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              {isCandidate ? "Full name" : "Primary contact name"}
            </Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                placeholder={isCandidate ? "Alex Sharma" : "Riya Singh"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{isCandidate ? "Email" : "Work email"}</Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                disabled
                className="border-0 bg-transparent px-0 shadow-none disabled:opacity-70 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {role === "employer" && (
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Orbit Labs Pvt. Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                placeholder="Bengaluru, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- CANDIDATE "ABOUT" CARD ---------- */

function CandidateAboutCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">About you</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="headline">Profile headline</Label>
          <Input
            id="headline"
            name="headline"
            placeholder="Frontend Engineer · React · TypeScript"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary">Summary</Label>
          <textarea
            id="summary"
            name="summary"
            rows={4}
            placeholder="Briefly describe your experience, skills, and what you're looking for next..."
            className="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">Years of experience</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            placeholder="3"
            className="bg-card"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER "ABOUT" CARD ---------- */

function EmployerAboutCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">About company</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="companyWebsite">Website</Label>
          <Input
            id="companyWebsite"
            name="companyWebsite"
            placeholder="https://yourcompany.com"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companySize">Company size</Label>
          <Input
            id="companySize"
            name="companySize"
            placeholder="11–50 employees"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyBio">Company overview</Label>
          <textarea
            id="companyBio"
            name="companyBio"
            rows={4}
            placeholder="Describe your product, mission, and what it's like to work at your company..."
            className="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- CANDIDATE PREFERENCES ---------- */

function CandidatePreferencesCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Job preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="preferredTitle">Preferred role title</Label>
          <Input
            id="preferredTitle"
            name="preferredTitle"
            placeholder="Frontend Engineer, UI Engineer"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="preferredLocation">Preferred location</Label>
          <Input
            id="preferredLocation"
            name="preferredLocation"
            placeholder="Remote · Bengaluru · Pune"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salaryRange">Salary expectation (yearly)</Label>
          <Input
            id="salaryRange"
            name="salaryRange"
            placeholder="₹12–18 LPA"
            className="bg-card"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- CANDIDATE SKILLS ---------- */

function CandidateSkillsCard() {
  const exampleSkills = ["React", "TypeScript", "Next.js", "Tailwind", "Node.js"];

  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Key skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Add skills that recruiters should know about. These help with matching
          you to relevant jobs.
        </p>

        <div className="flex flex-wrap gap-2">
          {exampleSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-[11px] font-medium"
            >
              {skill}
            </span>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="space-y-1.5">
          <Label htmlFor="newSkill">Add another skill</Label>
          <Input
            id="newSkill"
            name="newSkill"
            placeholder="e.g. GraphQL, Redux, Testing Library..."
            className="bg-card"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER PREFERENCES ---------- */

function EmployerPreferencesCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Hiring preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="hiringLocations">Hiring locations</Label>
          <Input
            id="hiringLocations"
            name="hiringLocations"
            placeholder="Remote · Bengaluru · Mumbai"
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hiringFocus">Primary roles you hire for</Label>
          <Input
            id="hiringFocus"
            name="hiringFocus"
            placeholder="Frontend, Backend, Design, Product..."
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hiringNotes">Notes to candidates</Label>
          <textarea
            id="hiringNotes"
            name="hiringNotes"
            rows={3}
            placeholder="Share what you value in candidates, interview process highlights, etc."
            className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- EMPLOYER SNAPSHOT ---------- */

function EmployerSnapshotCard() {
  return (
    <Card className="border bg-background shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Snapshot visible to candidates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        <p>
          This is how your company will appear on job listings and candidate
          dashboards. Keep it updated for the best response.
        </p>

        <ul className="space-y-1.5 list-disc pl-4">
          <li>Company name & logo</li>
          <li>Industry, size, and locations</li>
          <li>Short description / mission</li>
          <li>Links to website and social profiles</li>
        </ul>

        <Separator className="my-2" />

        <p>
          As you post jobs and interact with candidates, your brand
          automatically gets stronger on HireOrbit.
        </p>
      </CardContent>
    </Card>
  );
}
