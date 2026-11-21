"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/donations", label: "Donations" },
  { href: "/recipient", label: "Recipient" },
  { href: "/browse", label: "Browse" },
  { href: "/claims", label: "Claims" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-primary text-primary-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">
            Demo data
          </Badge>
          <Link
            href="/donations/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden sm:inline-flex press-scale"
            )}
          >
            Donate food
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden press-scale"
                aria-label="Open menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-dark">
              <SheetHeader className="border-b border-border">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Jump to a workspace. This prototype runs on demo data.
                </SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <SheetFooter>
                <SheetClose asChild>
                  <Link
                    href="/donations/new"
                    className={cn(buttonVariants(), "w-full press-scale")}
                  >
                    Donate food
                  </Link>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
