"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, logout } from "@/utils/auth";
import { getNavForRole } from "@/lib/navigation";
import { useCart } from "@/context/CartContext";

export default function AppShell({ children, variant = "app" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { cartCount } = useCart();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  const nav = user ? getNavForRole(user.role) : [];

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const roleColors = {
    admin: "bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 text-purple-700 border-purple-200",
    customer: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 border-blue-200",
    staff: "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 border-teal-200",
    pharmacist: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 border-emerald-200",
    delivery: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200",
  };

  const roleInitialBg = {
    admin: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
    customer: "bg-gradient-to-br from-blue-500 to-cyan-600",
    staff: "bg-gradient-to-br from-teal-500 to-emerald-600",
    pharmacist: "bg-gradient-to-br from-emerald-500 to-green-600",
    delivery: "bg-gradient-to-br from-amber-500 to-orange-600",
  };

  const isAppVariant = variant === "app" && user;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft text-slate-900 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              href={user ? (user.role === "customer" ? "/catalog" : "/dashboard") : "/"}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 transition-transform group-hover:scale-105">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent text-xl font-bold tracking-tight leading-none">
                  RxConnect
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                  Healthcare Platform
                </span>
              </div>
            </Link>

            {isAppVariant && (
              <nav className="hidden lg:flex items-center gap-1 ml-4 border-l border-slate-200 pl-4">
                {nav.slice(0, 6).map((item, index) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`animate-fade-in-up stagger-${index + 1} flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 shadow-sm border border-teal-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className={`w-4 h-4 ${active ? "text-teal-600" : "text-slate-400"}`}
                      dangerouslySetInnerHTML={{ __html: item.icon }}/>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/customer"
              className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 transition-all shadow-sm btn-press focus-ring"
            >
              <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-1.5 text-xs font-bold text-white shadow-sm shadow-teal-500/30">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md ${roleInitialBg[user.role] || "bg-slate-500"}`}>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <span
                    className={`hidden sm:inline-flex rounded-xl border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      roleColors[user.role] || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm btn-press focus-ring"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors btn-press focus-ring"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 hover:from-teal-700 hover:to-emerald-700 transition-all btn-press focus-ring"
                >
                  Sign up
                </Link>
              </div>
            )}

            {user && nav.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition btn-press focus-ring"
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {mobileNavOpen && user && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1.5 animate-fade-in-down">
            {nav.map((item, index) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`animate-fade-in-up stagger-${index + 1} flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 shadow-sm border border-teal-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={active ? "text-teal-600" : "text-slate-400"}
                    dangerouslySetInnerHTML={{ __html: item.icon }} 
                    />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <div className="flex flex-1 w-full mx-auto max-w-[1600px]">
        <main className="flex-1 w-full px-4 py-8 sm:px-6 lg:px-8 animate-fade-in-up overflow-hidden">
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur py-5 text-center text-xs text-slate-500">
        <div className="mx-auto w-full max-w-[1600px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <span className="font-medium text-slate-600">
              RxConnect Healthcare Platform
            </span>
          </div>
          <span>&copy; {new Date().getFullYear()} — All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
