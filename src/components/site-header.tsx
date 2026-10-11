"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LibraryBig, LogOut, MessagesSquare } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => Array.from(part)[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function SiteHeader() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const pathname = usePathname();
  const authed = status === "authenticated";

  const links = [
    { href: "/library", label: t.nav.library, icon: LibraryBig },
    { href: "/chat", label: t.nav.chat, icon: MessagesSquare },
  ];

  return (
    <header className="frosted sticky top-0 z-40 h-[var(--nav-h)] border-b border-[var(--nav-line)]">
      <div className="mx-auto flex h-full max-w-[980px] items-center gap-7 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={t.nav.home}
          className="flex items-center gap-2 rounded-lg text-[17px] font-semibold tracking-headline text-foreground"
        >
          <AppIcon size={28} />
          <span>Cite</span>
        </Link>

        {authed && (
          <nav aria-label={t.nav.main} className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-[13px] transition-opacity hover:opacity-100",
                    active ? "text-foreground opacity-100" : "text-foreground opacity-75"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          <ThemeToggle />
          {authed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t.nav.account}
                  className="ml-1 rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials(session.user.name ?? "?")}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[14rem]">
                <DropdownMenuLabel className="flex flex-col gap-0.5 pb-1.5">
                  <span className="text-[14px] font-semibold text-foreground">{session.user.name}</span>
                  <span className="truncate text-[12px] font-normal text-muted">{session.user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map((link) => (
                  <DropdownMenuItem key={link.href} className="md:hidden" asChild>
                    <Link href={link.href}>
                      <link.icon />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                  <LogOut />
                  {t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === "unauthenticated" && pathname !== "/login" ? (
            <Button asChild size="sm" className="ml-1.5 h-7 px-3 text-[12px] max-sm:h-8">
              <Link href="/login">{t.nav.signIn}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
