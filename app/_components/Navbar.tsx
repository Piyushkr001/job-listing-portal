"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Jobs", href: "/jobs" },
  { name: "About", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "Contact", href: "/contact" },
];

const AUTH_TOKEN_KEY = "hireorbit_token";

function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Check auth whenever the route changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAuth = () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      setIsAuthenticated(!!token);
    };

    syncAuth();
  }, [pathname]);

  const handleLogout = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setIsAuthenticated(false);
    setIsOpen(false);
    router.push("/");
  }, [router]);

  return (
    <header className="sticky top-0 z-50 rounded-3xl border-b bg-background/80 backdrop-blur">
      {/* Main bar */}
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 md:py-4">
        {/* Left: Logo (flex-1) */}
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/Images/Logo/logo.svg"
              alt="HireOrbit Logo"
              width={140}
              height={140}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Center: Nav links (desktop) */}
        <nav className="hidden flex-1 justify-center gap-6 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={[
                  "text-sm font-medium px-3 py-1.5 rounded-full transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/70",
                ].join(" ")}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth buttons (desktop) + Mobile toggle */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div>
            <ModeToggle />
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full px-4"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild  className="rounded-full px-4">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="rounded-full px-4"
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle navigation</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={[
                    "rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  ].join(" ")}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="mt-2 flex flex-col gap-2">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-full">
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full rounded-full"
                  variant="outline"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
