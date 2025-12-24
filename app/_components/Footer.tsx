"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Linkedin, Instagram, Mail } from "lucide-react";
import { XLogoIcon } from "@phosphor-icons/react";

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:gap-12 md:py-12">
        {/* Left: Brand + description */}
        <div className="flex flex-1 flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Images/Logo/logo.svg"
              alt="HireOrbit Logo"
              width={140}
              height={140}
            />
          </Link>

          <p className="max-w-sm text-sm text-muted-foreground">
            HireOrbit connects ambitious companies with top talent through a
            modern, streamlined hiring experience tailored for growing teams.
          </p>

          {/* Socials */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Follow us
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                asChild
              >
                <Link href="https://linkedin.com" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                asChild
              >
                <Link href="https://twitter.com" aria-label="Twitter">
                  <XLogoIcon className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                asChild
              >
                <Link href="https://instagram.com" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Contact quick link (replaces newsletter) */}
          <div className="mt-1 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Contact
            </span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              Reach us via contact page
            </Link>
          </div>
        </div>

        {/* Right: Link columns (kept) */}
        <div className="flex flex-1 flex-col gap-6 text-sm md:flex-row md:justify-between md:gap-14">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">For candidates</h3>
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Browse jobs
            </Link>
            <Link
              href="/signup"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">For employers</h3>
            <Link
              href="/dashboard/jobs-new"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Post a job
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Employer dashboard
            </Link>
            <Link
              href="/dashboard/candidates"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Candidates
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Company</h3>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              href="/support"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Support
            </Link>
          </div>
        </div>
      </div>

      <Separator className="mx-auto w-full max-w-6xl" />

      {/* Bottom bar */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} HireOrbit. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-foreground">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
