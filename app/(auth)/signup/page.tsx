"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const AUTH_TOKEN_KEY = "hireorbit_token";
const ROLE_KEY = "hireorbit_role"; // ✅ store role here too

function SignupPage() {
  const router = useRouter();

  // ✅ Auth guard: if already logged in, block signup page
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      toast.success("You are already logged in.");
      router.replace("/dashboard");
    }
  }, [router]);

  // Google signup handler (candidate + employer)
  const handleGoogleSignup = React.useCallback(
    async (
      role: "candidate" | "employer",
      credentialResponse: CredentialResponse
    ) => {
      try {
        if (!credentialResponse.credential) {
          console.error("No credential returned from Google");
          toast.error(
            "Google signup failed: No credential was returned from Google."
          );
          return;
        }

        // ✅ unified google-login route that can handle signup/login
        const { data } = await axios.post("/api/auth/google-login", {
          role,
          idToken: credentialResponse.credential,
          // if you need companyName for employers with Google, add it here later
        });

        // Expect backend to return { token, user, ... }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          window.localStorage.setItem(ROLE_KEY, role); // ✅ save role
        }

        toast.success(
          role === "candidate"
            ? "Candidate account created. Redirecting to dashboard..."
            : "Employer account created. Redirecting to dashboard..."
        );

        router.push("/dashboard");
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error("Google signup error (axios):", {
            status: error.response?.status,
            data: error.response?.data,
          });

          const msg =
            (error.response?.data as any)?.message ||
            "Google signup failed. Please try again.";
          toast.error(msg);
        } else {
          console.error("Google signup error (unknown):", error);
          toast.error("Google signup failed due to an unexpected error.");
        }
      }
    },
    [router]
  );

  // Credentials signup handler (candidate + employer)
  const handleCredentialsSignup = React.useCallback(
    async (
      e: React.FormEvent<HTMLFormElement>,
      role: "candidate" | "employer"
    ) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
      const company = formData.get("company"); // only for employer

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof confirmPassword !== "string"
      ) {
        console.error("Invalid form data");
        toast.error("Invalid form data. Please fill all required fields.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      try {
        const payload: any = {
          name,
          email,
          password,
          confirmPassword,
          role,
        };

        if (role === "employer" && typeof company === "string") {
          payload.companyName = company;
        }

        const { data } = await axios.post("/api/auth/signup", payload);

        // Expect backend to return { token, user, ... }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          window.localStorage.setItem(ROLE_KEY, role); // ✅ save role
        }

        toast.success(
          role === "candidate"
            ? "Candidate account created. Redirecting to dashboard..."
            : "Employer account created. Redirecting to dashboard..."
        );

        router.push("/dashboard");
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error("Signup error (axios):", {
            status: error.response?.status,
            data: error.response?.data,
          });

          const msg =
            (error.response?.data as any)?.message ||
            "Signup failed. Please check your details and try again.";
          toast.error(msg);
        } else {
          console.error("Signup error (unknown):", error);
          toast.error("Signup failed due to an unexpected error.");
        }
      }
    },
    [router]
  );

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-stretch md:gap-12">
        {/* Left panel (brand / marketing) */}
        <div className="hidden flex-1 md:flex">
          <div className="flex-1 rounded-2xl bg-linear-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-px">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-slate-950/90 px-8 py-8 text-slate-50">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  HireOrbit · Get started
                </p>
                <h2 className="text-2xl font-semibold leading-snug md:text-3xl">
                  Create an account and keep your{" "}
                  <span className="bg-linear-to-r from-indigo-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                    journey in orbit.
                  </span>
                </h2>
                <p className="max-w-sm text-sm text-slate-300/90">
                  Choose whether you&apos;re signing up as a candidate or
                  employer—HireOrbit adapts the experience to your role.
                </p>
              </div>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800/80" />
                  <div>
                    <p className="font-medium text-slate-50">
                      For candidates
                    </p>
                    <p className="text-xs text-slate-300/80">
                      Build a profile, save roles, and track your applications.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800/80" />
                  <div>
                    <p className="font-medium text-slate-50">
                      For employers
                    </p>
                    <p className="text-xs text-slate-300/80">
                      Post jobs, review pipelines, and collaborate with hiring
                      managers.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-slate-400">
                “One platform that respects both candidate and employer
                experience.”
              </p>
            </div>
          </div>
        </div>

        {/* Right panel (signup form) */}
        <div className="flex-1">
          <Tabs defaultValue="candidate" className="w-full">
            <Card className="border border-border/70 shadow-lg">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      Create your account
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Sign up as a candidate or employer to get started with
                      HireOrbit.
                    </CardDescription>
                  </div>
                  <TabsList className="grid w-[220px] grid-cols-2">
                    <TabsTrigger value="candidate">Candidate</TabsTrigger>
                    <TabsTrigger value="employer">Employer</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* CANDIDATE SIGNUP */}
                <TabsContent value="candidate" className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sign up as a{" "}
                    <span className="text-primary">Candidate</span> to find and
                    apply for jobs.
                  </p>

                  {/* Google signup */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(cred) =>
                        handleGoogleSignup("candidate", cred)
                      }
                      onError={() =>
                        toast.error("Google signup failed for candidate.")
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={(e) => handleCredentialsSignup(e, "candidate")}
                  >
                    <input type="hidden" name="role" value="candidate" />

                    <div className="space-y-2">
                      <Label htmlFor="candidate-name">Full name</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="candidate-name"
                          name="name"
                          type="text"
                          placeholder="Alex Sharma"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="candidate-email">Email</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="candidate-email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="candidate-password">Password</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="candidate-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="candidate-confirm-password">
                        Confirm password
                      </Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="candidate-confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      By creating an account, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="font-medium text-primary hover:underline"
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <Button
                      type="submit"
                      className="mt-1 flex w-full items-center justify-center gap-2"
                    >
                      Create candidate account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                {/* EMPLOYER SIGNUP */}
                <TabsContent value="employer" className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sign up as an{" "}
                    <span className="text-primary">Employer</span> to post jobs
                    and manage candidates.
                  </p>

                  {/* Google signup */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(cred) =>
                        handleGoogleSignup("employer", cred)
                      }
                      onError={() =>
                        toast.error("Google signup failed for employer.")
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={(e) => handleCredentialsSignup(e, "employer")}
                  >
                    <input type="hidden" name="role" value="employer" />

                    <div className="space-y-2">
                      <Label htmlFor="employer-name">Your name</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employer-name"
                          name="name"
                          type="text"
                          placeholder="Riya Singh"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company name</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company-name"
                          name="company"
                          type="text"
                          placeholder="Orbit Labs Pvt. Ltd."
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employer-email">Work email</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employer-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employer-password">Password</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employer-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employer-confirm-password">
                        Confirm password
                      </Label>
                      <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employer-confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      By creating an account, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="font-medium text-primary hover:underline"
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <Button
                      type="submit"
                      className="mt-1 flex w-full items-center justify-center gap-2"
                    >
                      Create employer account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t bg-muted/40 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Already have an account?
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                  >
                    <Link href="/login">Login instead</Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

export default SignupPage;
