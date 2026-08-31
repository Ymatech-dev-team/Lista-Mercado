"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { HomeIcon, ListIcon, ClockIcon, UserIcon, ChevronLeft, ChevronRight } from "@/components/icons";

const NAV = [
  { href: "/inicio", label: "Início", mobile: "Início", Icon: HomeIcon },
  { href: "/lista", label: "Minha lista", mobile: "Listas", Icon: ListIcon },
  { href: "/historico", label: "Histórico", mobile: "Histórico", Icon: ClockIcon },
  { href: "/perfil", label: "Perfil", mobile: "Perfil", Icon: UserIcon },
];

const STORAGE_KEY = "mm:sidebar-collapsed";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function CartMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M6 6 5 3H3" />
    </svg>
  );
}

export function AppShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const pathname = usePathname();
  const initials = userEmail.slice(0, 2).toUpperCase();

  // Estado de colapso persistido. Inicia expandido (bate com o SSR); aplica o salvo após montar.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* localStorage indisponível */
    }
  }, []);
  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="md:flex md:min-h-screen">
      {/* Barra lateral colapsável — desktop */}
      <aside
        className={cn(
          "hidden flex-none flex-col border-r border-hairline bg-surface-sunken p-3 transition-[width] duration-200",
          "md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        {/* topo: marca + botão de recolher */}
        <div className={cn("mb-3 flex h-9 items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && (
            <Link href="/inicio" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent-fill text-on-primary">
                <CartMark />
              </span>
              <span className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-ink">Meu Mercado</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex h-10 items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                isActive(pathname, href) ? "bg-selection text-primary-strong" : "text-muted hover:bg-surface hover:text-ink"
              )}
            >
              <Icon className="h-5 w-5 flex-none" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          {collapsed ? (
            <Link
              href="/perfil"
              title={userEmail}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-selection text-sm font-medium text-primary-strong"
            >
              {initials}
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-2.5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-selection text-sm font-medium text-primary-strong">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{userEmail}</p>
                <LogoutButton className="text-xs text-muted transition-colors hover:text-ink">Sair</LogoutButton>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>

      {/* Abas — celular */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-hairline bg-surface md:hidden"
      >
        {NAV.map(({ href, mobile, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className={cn(
              "flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive(pathname, href) ? "text-primary" : "text-muted"
            )}
          >
            <Icon className="h-[22px] w-[22px]" />
            {mobile}
          </Link>
        ))}
      </nav>
    </div>
  );
}
