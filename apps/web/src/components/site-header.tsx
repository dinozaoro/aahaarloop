"use client";

import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/browse", label: "Find food" },
  { href: "/dashboard", label: "For donors" },
  { href: "/recipient", label: "For organisations" },
  { href: "/claims", label: "Pickups" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  if (["/dashboard", "/browse", "/donations", "/claims", "/impact", "/notifications", "/profile"].some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname.startsWith("/donations/new")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95">
      <div className="site-shell flex h-[4.25rem] items-center gap-8">
        <Link href="/" aria-label="AahaarLoop home" className="shrink-0 rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "quiet-link relative py-1 text-sm font-medium",
                  active && "text-foreground after:absolute after:inset-x-0 after:-bottom-[1.15rem] after:h-0.5 after:bg-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <Link className="quiet-link text-sm font-medium" href="/signin">Sign in</Link>
          <Link href="/donations/new" className={cn(buttonVariants({ size: "sm" }))}>
            Offer surplus
          </Link>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto border-0 md:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <SheetHeader className="border-b border-border pb-5">
              <SheetTitle><Logo /></SheetTitle>
              <SheetDescription>Move good food to a nearby table.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-1 py-4">
              {NAV_ITEMS.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn("rounded-md px-3 py-3 text-base font-medium", pathname === item.href ? "bg-secondary text-foreground" : "text-muted-foreground")}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5">
              <SheetClose asChild><Link href="/donations/new" className={cn(buttonVariants(), "w-full")}>Offer surplus</Link></SheetClose>
              <SheetClose asChild><Link href="/signin" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>Sign in</Link></SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
