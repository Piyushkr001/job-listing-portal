// app/forgot-password/page.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/auth/forgot-password", { email });

      toast.success(
        "If an account exists, an OTP has been sent to your email."
      );

      // Redirect to reset-password with email in query
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="border bg-background shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-xl font-semibold">
              Forgot password
            </CardTitle>
            <p className="text-center text-xs text-muted-foreground">
              Enter your registered email and we&apos;ll send you a one-time OTP
              to reset your password.
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <p className="mt-2 text-center text-xs text-muted-foreground">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Back to login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
