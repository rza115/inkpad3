"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarNavItemProps = {
  href: string;
  label: string;
  /** Path data SVG (stroke icon 24x24) */
  iconD: string;
  /** Sidebar collapsed: sembunyikan label, icon saja */
  collapsed?: boolean;
  /** Dipanggil saat item diklik (dipakai MobileNav buat nutup drawer) */
  onNavigate?: () => void;
};

export function SidebarNavItem({
  href,
  label,
  iconD,
  collapsed = false,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
        active
          ? "bg-parchment/10 font-medium text-parchment"
          : "text-parchment/70 hover:bg-parchment/10 hover:text-parchment"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      {/* Ribbon — signature element, penanda nav item aktif */}
      {active && (
        <span
          aria-hidden
          className="absolute -top-1 left-1.5 h-5 w-2 bg-wine [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]"
        />
      )}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 shrink-0"
      >
        <path d={iconD} />
      </svg>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
