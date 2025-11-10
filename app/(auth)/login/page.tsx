"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
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

function LoginPage() {
  const router = useRouter();

  // ✅ Auth guard: if already logged in, block this page
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      toast.success("You are already logged in.");
      router.replace("/dashboard");
    }
  }, [router]);

  // Google login handler (candidate + employer)
  const handleGoogleAuth = React.useCallback(
    async (
      role: "candidate" | "employer",
      credentialResponse: CredentialResponse
    ) => {
      try {
        if (!credentialResponse.credential) {
          console.error("No credential returned from Google");
          toast.error("Google login failed: No credential was returned.");
          return;
        }

        const { data } = await axios.post("/api/auth/google-login", {
          role,
          idToken: credentialResponse.credential,
        });

        // Expect backend to return { token, user, ... }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }

        toast.success(
          role === "candidate"
            ? "Login successful! Redirecting to your dashboard..."
            : "Login successful! Redirecting to employer dashboard..."
        );

        router.push("/dashboard");
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error("Google login error (axios):", {
            status: error.response?.status,
            data: error.response?.data,
          });

          const msg =
            (error.response?.data as any)?.message ||
            "Google login failed. Please try again.";
          toast.error(msg);
        } else {
          console.error("Google login error (unknown):", error);
          toast.error("Google login failed due to an unexpected error.");
        }
      }
    },
    [router]
  );

  // Credentials login handler (candidate + employer)
  const handleCredentialsLogin = React.useCallback(
    async (
      e: React.FormEvent<HTMLFormElement>,
      role: "candidate" | "employer"
    ) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const email = formData.get("email");
      const password = formData.get("password");

      if (typeof email !== "string" || typeof password !== "string") {
        console.error("Invalid form data");
        toast.error("Invalid data. Please check your email and password.");
        return;
      }

      try {
        const { data } = await axios.post("/api/auth/login", {
          email,
          password,
          role,
        });

        // Expect backend to return { token, user, ... }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }

        toast.success(
          role === "candidate"
            ? "Login successful! Redirecting to your dashboard..."
            : "Login successful! Redirecting to employer dashboard..."
        );

        router.push("/dashboard");
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error("Credentials login error (axios):", {
            status: error.response?.status,
            data: error.response?.data,
          });

          const msg =
            (error.response?.data as any)?.message ||
            "Login failed. Invalid credentials or server error.";
          toast.error(msg);
        } else {
          console.error("Credentials login error (unknown):", error);
          toast.error("Login failed due to an unexpected error.");
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
                  HireOrbit · Platform
                </p>
                <h2 className="text-2xl font-semibold leading-snug md:text-3xl">
                  Log in and keep your{" "}
                  <span className="bg-linear-to-r from-indigo-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                    hiring in orbit.
                  </span>
                </h2>
                <p className="max-w-sm text-sm text-slate-300/90">
                  Switch between Candidate and Employer view with a single
                  account and manage your journey from one dashboard.
                </p>
              </div>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800/80" />
                  <div>
                    <p className="font-medium text-slate-50">Candidates</p>
                    <p className="text-xs text-slate-300/80">
                      Track applications, saved roles, and interview status.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800/80" />
                  <div>
                    <p className="font-medium text-slate-50">Employers</p>
                    <p className="text-xs text-slate-300/80">
                      Post jobs, review candidates, and collaborate with your
                      team.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-slate-400">
                “HireOrbit keeps both sides of the hiring process in sync and
                focused.”
              </p>
            </div>
          </div>
        </div>

        {/* Right panel (login form) */}
        <div className="flex-1">
          <Tabs defaultValue="candidate" className="w-full">
            <Card className="border border-border/70 shadow-lg">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Sign in to your HireOrbit account as a candidate or
                      employer.
                    </CardDescription>
                  </div>
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="candidate">Candidate</TabsTrigger>
                    <TabsTrigger value="employer">Employer</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* CANDIDATE LOGIN */}
                <TabsContent value="candidate" className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Log in as a{" "}
                    <span className="text-primary">Candidate</span> to find and
                    apply for jobs.
                  </p>

                  {/* Google login (official button) */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(cred) =>
                        handleGoogleAuth("candidate", cred)
                      }
                      onError={() =>
                        toast.error("Google login failed (candidate).")
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* Email/password form */}
                  <form
                    className="space-y-4"
                    onSubmit={(e) => handleCredentialsLogin(e, "candidate")}
                  >
                    <input type="hidden" name="role" value="candidate" />

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

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <p className="text-muted-foreground">
                        Having trouble?{" "}
                        <Link
                          href="/contact"
                          className="font-medium text-primary hover:underline"
                        >
                          Contact support
                        </Link>
                      </p>
                      <Link
                        href="/forgot-password"
                        className="font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="mt-2 flex w-full items-center justify-center gap-2"
                    >
                      Login as Candidate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                {/* EMPLOYER LOGIN */}
                <TabsContent value="employer" className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Log in as an{" "}
                    <span className="text-primary">Employer</span> to post jobs
                    and manage candidates.
                  </p>

                  {/* Google login (official button) */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(cred) =>
                        handleGoogleAuth("employer", cred)
                      }
                      onError={() =>
                        toast.error("Google login failed (employer).")
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
                    onSubmit={(e) => handleCredentialsLogin(e, "employer")}
                  >
                    <input type="hidden" name="role" value="employer" />

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

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <p className="text-muted-foreground">
                        Need help?{" "}
                        <Link
                          href="/contact"
                          className="font-medium text-primary hover:underline"
                        >
                          Contact support
                        </Link>
                      </p>
                      <Link
                        href="/forgot-password"
                        className="font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="mt-2 flex w-full items-center justify-center gap-2"
                    >
                      Login as Employer
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t bg-muted/40 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have an account yet?
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                  >
                    <Link href="/signup">Create an account</Link>
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

export default LoginPage;
