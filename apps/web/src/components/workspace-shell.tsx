"use client";

import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRecipient = pathname.startsWith("/recipient");
  const isVolunteer = pathname.startsWith("/volunteer");
  const homeHref = isRecipient
    ? "/recipient"
    : isVolunteer
      ? "/volunteer"
      : "/dashboard";
  const activityHref = isRecipient
    ? "/recipient/claims"
    : isVolunteer
      ? "/volunteer/profile"
      : "/donations";
  const accountHref = isRecipient
    ? "/recipient/profile"
    : isVolunteer
      ? "/volunteer/profile"
      : "/profile";
  const links = [
    { href: homeHref, label: "Home" },
    { href: "/browse", label: "Discover" },
    ...(isVolunteer ? [] : [{ href: activityHref, label: "My activity" }]),
    { href: "/impact", label: "Impact" },
    { href: "/install", label: "Get the app" },
  ];

  return (
    <div className="workspace">
      <header className="workspace-navigation">
        <Link
          href="/#hero"
          aria-label="AahaarLoop home"
          className="workspace-brand"
        >
          <Logo />
        </Link>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`workspace-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="workspace-navigation-actions">
          <span className="workspace-location">
            <MapPin aria-hidden="true" /> Bengaluru
          </span>
          <NotificationBell />
          <Link href={accountHref} className="workspace-account">
            Account
          </Link>
        </div>
      </header>
      <div className="workspace-content">{children}</div>
    </div>
  );
}
