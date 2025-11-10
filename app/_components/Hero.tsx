"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Briefcase, Search, Users } from "lucide-react";

function HeroSection() {
  return (
    <section className="relative border-b bg-background">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl">
        <div className="h-64 w-64 rounded-full bg-linear-to-tr from-indigo-500/20 via-cyan-400/20 to-emerald-400/20" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-10 px-4 py-10 md:min-h-[80vh] md:flex-row md:items-center md:gap-12 md:py-16 lg:py-20">
        {/* Left column */}
        <div className="flex-1 space-y-8">
          <Badge className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white/80" />
            Hire smarter. Grow faster.
          </Badge>

          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Hire the{" "}
              <span className="bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                right talent
              </span>{" "}
              in one orbit.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              HireOrbit helps teams discover, evaluate, and hire top candidates
              faster—with a streamlined job discovery and application experience
              tailored for modern companies.
            </p>
          </div>

          {/* Search / CTA row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full border bg-card/80 px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles e.g. Frontend Developer"
                className="h-8 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button className="h-10 rounded-full px-5 text-sm sm:text-base">
              Find Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Small stats row */}
          <div className="flex flex-wrap gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">
                500+ curated roles this week
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="text-muted-foreground">
                Trusted by 100+ growing teams
              </span>
            </div>
          </div>
        </div>

        {/* Right column: preview card */}
        <div className="flex-1 w-full max-w-md">
          <Card className="relative overflow-hidden border border-border/70 bg-linear-to-b from-background to-muted/70 shadow-xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-linear-to-tr from-indigo-500/15 via-cyan-400/15 to-emerald-400/15 blur-3xl" />
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
                Recommended roles
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Live matches
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tailored suggestions based on your skills, preferences, and
                activity.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Job card 1 */}
              <div className="flex items-start justify-between rounded-xl border bg-card/80 px-3 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-medium">
                      Senior Frontend Engineer
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Remote · ₹18–25 LPA · Full-time
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      React
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      TypeScript
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Next.js
                    </Badge>
                  </div>
                </div>
                <Button size="sm" className="h-8 rounded-full px-3 text-xs">
                  View
                </Button>
              </div>

              {/* Job card 2 */}
              <div className="flex items-start justify-between rounded-xl border bg-card/80 px-3 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-500" />
                    <p className="text-sm font-medium">Product Designer</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bengaluru · Hybrid · Growth-stage startup
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      Figma
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      UI/UX
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                >
                  Save
                </Button>
              </div>

              {/* Bottom helper text */}
              <p className="pt-1 text-[11px] text-muted-foreground">
                Create a free account to unlock tailored recommendations, saved
                roles, and 1-click applications—designed to keep your hiring in
                orbit.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
