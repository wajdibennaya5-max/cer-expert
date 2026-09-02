"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

export function AdminNav({
  links,
  horizontal = false,
}: {
  links: { href: string; label: string; icon: string }[];
  horizontal?: boolean;
}) {
  const pathname = usePathname() ?? "";

  function active(href: string): boolean {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  if (horizontal) {
    return (
      <nav
        aria-label="Navigation"
        className="no-scrollbar flex gap-1 overflow-x-auto border-t border-mist-200 px-4 py-2"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              active(link.href) ? "bg-ink-900 text-white" : "text-slate-600 hover:bg-mist-100"
            }`}
          >
            <Icon name={link.icon} size={16} />
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            active(link.href)
              ? "bg-gradient-to-r from-aqua-500/20 to-transparent text-aqua-200"
              : "text-slate-400 hover:bg-white/6 hover:text-white"
          }`}
        >
          <Icon name={link.icon} size={18} />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
