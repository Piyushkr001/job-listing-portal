// app/reset-password/page.tsx

"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, KeyRound, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      toast.success("Password reset successfully. You can now log in.");
      router.push("/login");
    } catch (error: any) {
      console.error("Reset password error:", error);
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
              Reset password
            </CardTitle>
            <p className="text-center text-xs text-muted-foreground">
              Enter the OTP sent to your email, then choose a new password.
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {/* Email */}
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

              {/* OTP */}
              <div className="space-y-1.5">
                <Label htmlFor="otp">OTP</Label>
                <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset password"}
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
