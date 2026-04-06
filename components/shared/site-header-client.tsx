"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/plans", label: "Plans" },
  { href: "/ai-planner", label: "AI Planner" },
];

export function SiteHeaderClient({
  email,
  supabaseEnabled,
}: {
  email: string | null;
  supabaseEnabled: boolean;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 glass-header transition-shadow duration-300">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Gatherly</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 grid gap-1 px-2" aria-label="Mobile">
                {navLinks.map((l) => (
                  <Button
                    key={l.href}
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href={l.href}>{l.label}</Link>
                  </Button>
                ))}
                {email ? (
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/profile">Profile</Link>
                  </Button>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="hover:opacity-85 transition-opacity select-none"
            aria-label="Gatherly home"
          >
            <img
              src="/gatherly-logo.png"
              alt="Gatherly"
              className="h-26 w-auto object-contain"
            />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navLinks.map((l) => (
              <Button key={l.href} asChild variant="ghost" size="sm">
                <Link href={l.href}>{l.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu email={email} supabaseEnabled={supabaseEnabled} />
        </div>
      </div>
    </header>
  );
}
