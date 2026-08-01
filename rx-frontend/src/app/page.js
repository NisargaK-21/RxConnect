"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Smart Order Routing",
      description: "Intelligently route orders across branches based on real-time stock availability and proximity.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      ),
      accent: "from-teal-500 to-emerald-500",
      bg: "from-teal-50 to-emerald-50",
      glow: "shadow-teal-500/15",
    },
    {
      title: "Prescription Processing",
      description: "Streamline pharmacist reviews with digital prescription uploads, verification, and approval workflows.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      accent: "from-blue-500 to-cyan-500",
      bg: "from-blue-50 to-cyan-50",
      glow: "shadow-blue-500/15",
    },
    {
      title: "Inventory Intelligence",
      description: "Real-time stock tracking with automated low-stock alerts and smart reordering suggestions.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      accent: "from-purple-500 to-fuchsia-500",
      bg: "from-purple-50 to-fuchsia-50",
      glow: "shadow-purple-500/15",
    },
    {
      title: "Delivery Management",
      description: "End-to-end delivery tracking with job assignment, pickup confirmation, and real-time status.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      accent: "from-amber-500 to-orange-500",
      bg: "from-amber-50 to-orange-50",
      glow: "shadow-amber-500/15",
    },
    {
      title: "Multi-Branch Coordination",
      description: "Seamlessly manage unlimited branches with centralized control and distributed inventory.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      accent: "from-indigo-500 to-violet-500",
      bg: "from-indigo-50 to-violet-50",
      glow: "shadow-indigo-500/15",
    },
    {
      title: "Compliance & Security",
      description: "HIPAA-aligned workflows with role-based access, audit logs, and encrypted data handling.",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      accent: "from-emerald-500 to-green-500",
      bg: "from-emerald-50 to-green-50",
      glow: "shadow-emerald-500/15",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "< 3s", label: "Order Processing" },
    { value: "200+", label: "Medicine SKUs" },
    { value: "24/7", label: "System Availability" },
  ];

  const steps = [
    {
      step: "01",
      title: "Create Order",
      description: "Customers or staff place orders with digital prescriptions if required.",
    },
    {
      step: "02",
      title: "Verify & Route",
      description: "System verifies stock, routes to the optimal branch, and notifies pharmacist.",
    },
    {
      step: "03",
      title: "Pack & Dispatch",
      description: "Branch packs the order, assigns delivery partner, and confirms pickup.",
    },
    {
      step: "04",
      title: "Deliver & Track",
      description: "Real-time tracking from branch to doorstep with instant notifications.",
    },
  ];

  return (
    <AppShell variant="landing">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-transparent to-emerald-50/50 -z-10" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-3xl -z-10 animate-pulse-soft" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-400/15 to-cyan-400/15 blur-3xl -z-10 animate-pulse-soft" />

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-teal-100 px-4 py-1.5 shadow-sm animate-fade-in-down mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-teal-700">
                Trusted by modern pharmacy networks
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] max-w-4xl animate-fade-in-up">
              The{" "}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear]">
                intelligent pharmacy
              </span>{" "}
              operating system
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed animate-fade-in-up stagger-1">
              RxConnect unifies order management, prescription processing, inventory, and delivery into a single premium platform built for high-performance healthcare networks.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-2">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-teal-600/25 hover:shadow-teal-600/40 hover:from-teal-700 hover:to-emerald-700 transition-all btn-press focus-ring"
              >
                Start free trial
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-800 shadow-sm hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700 transition-all btn-press focus-ring"
              >
                Sign in to dashboard
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-500 animate-fade-in-up stagger-3">
              No credit card required · 14-day free trial · Cancel anytime
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up stagger-3">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`stagger-${i + 1} bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-5 sm:p-6 text-center card-hover animate-fade-in-up`}
              >
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Core Platform</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            A complete suite of tools designed specifically for the complexities of modern pharmacy operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 card-hover`}
            >
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${f.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center text-white shadow-lg ${f.glow} mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2`}>
                {f.icon}
              </div>

              <h3 className="relative text-lg font-bold text-slate-900 mb-2">
                {f.title}
              </h3>
              <p className="relative text-sm text-slate-600 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Workflow</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              From click to doorstep in minutes
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Our streamlined workflow ensures every order is processed accurately and delivered on time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-[75%] h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            {steps.map((s, i) => (
              <div
                key={s.step}
                className={`animate-fade-in-up stagger-${i + 1} relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 card-hover`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold text-lg shadow-md shadow-teal-500/20">
                    {s.step}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-teal-600/25 animate-scale-in">
          <div className="absolute top-[-25%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Ready to modernize your pharmacy network?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-teal-50/90 leading-relaxed">
                Join hundreds of pharmacy locations already using RxConnect to process thousands of orders every day.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-2xl hover:shadow-white/20 hover:bg-teal-50 transition-all btn-press focus-ring"
              >
                Create account
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-8 py-4 text-base font-bold text-white hover:bg-white/20 transition-all btn-press focus-ring"
              >
                Explore demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
