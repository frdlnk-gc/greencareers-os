"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/", label: "Vermögen", icon: ChartIcon },
  { href: "/analyse", label: "Analyse", icon: PieIcon },
  { href: "/wealth", label: "Prognose", icon: SparkIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/" || pathname.startsWith("/depot")
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] ${
                active ? "text-neutral-100" : "text-neutral-500"
              }`}
            >
              <span
                className={`flex h-9 w-16 items-center justify-center rounded-full ${
                  active ? "bg-neutral-800" : ""
                }`}
              >
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-6 4 4 6-8" />
      <path d="M3 21h18" />
    </svg>
  );
}
function PieIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 9 9h-9z" />
      <path d="M12 3v9h9A9 9 0 0 0 12 3z" opacity="0.5" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l6-8 4 3 6-9" />
    </svg>
  );
}
