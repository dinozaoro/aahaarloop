"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Papicon } from "@/components/papicon";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/browse", label: "Discover food", icon: "search" },
  { href: "/donations", label: "My donations", icon: "archive" },
  { href: "/claims", label: "Pickups", icon: "bus" },
  { href: "/impact", label: "Impact", icon: "pie" },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="workspace">
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <Link href="/dashboard" className="workspace-brand"><span className="brand-mark"><Papicon name="cutlery" /></span><span>AahaarLoop</span></Link>
        <p className="workspace-label">Workspace</p>
        <nav className="workspace-nav">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={`workspace-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined}><Papicon name={icon} />{label}{label === "Pickups" ? <span className="nav-count">2</span> : null}</Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/notifications" className="workspace-link"><Papicon name="bell" />Notifications<span className="notification-dot" /></Link>
          <Link href="/profile" className="profile-mini"><span className="avatar">MR</span><span><strong>Meera Rao</strong><small>Annapurna Kitchen</small></span><Papicon name="chevron-down" className="profile-chevron" /></Link>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar"><div className="crumb">Annapurna Community Kitchen <span>/</span> <strong>{NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Workspace"}</strong></div><div className="topbar-right"><span className="sync-status"><i /> All changes saved</span><Link href="/signin" aria-label="Notifications" className="topbar-bell"><Papicon name="bell" /><b /></Link><span className="avatar top-avatar">MR</span></div></header>
        <div className="workspace-content">{children}</div>
      </div>
      <nav className="mobile-workspace-nav" aria-label="Mobile navigation">
        {NAV.slice(0, 4).map(({ href, label, icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><Papicon name={icon} /><span>{label === "Discover food" ? "Discover" : label === "My donations" ? "Donations" : label}</span></Link>)}
      </nav>
    </div>
  );
}
