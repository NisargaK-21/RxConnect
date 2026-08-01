export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  accent = "teal",
  footer,
  loading = false,
}) {
  const accents = {
    teal: {
      bg: "from-teal-500 to-emerald-500",
      soft: "from-teal-50 to-emerald-50",
      border: "border-teal-100",
      text: "text-teal-700",
      shadow: "shadow-teal-500/20",
      dot: "bg-teal-500",
    },
    blue: {
      bg: "from-blue-500 to-cyan-500",
      soft: "from-blue-50 to-cyan-50",
      border: "border-blue-100",
      text: "text-blue-700",
      shadow: "shadow-blue-500/20",
      dot: "bg-blue-500",
    },
    amber: {
      bg: "from-amber-500 to-orange-500",
      soft: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      text: "text-amber-700",
      shadow: "shadow-amber-500/20",
      dot: "bg-amber-500",
    },
    purple: {
      bg: "from-purple-500 to-fuchsia-500",
      soft: "from-purple-50 to-fuchsia-50",
      border: "border-purple-100",
      text: "text-purple-700",
      shadow: "shadow-purple-500/20",
      dot: "bg-purple-500",
    },
    emerald: {
      bg: "from-emerald-500 to-green-500",
      soft: "from-emerald-50 to-green-50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      shadow: "shadow-emerald-500/20",
      dot: "bg-emerald-500",
    },
    rose: {
      bg: "from-rose-500 to-pink-500",
      soft: "from-rose-50 to-pink-50",
      border: "border-rose-100",
      text: "text-rose-700",
      shadow: "shadow-rose-500/20",
      dot: "bg-rose-500",
    },
    indigo: {
      bg: "from-indigo-500 to-violet-500",
      soft: "from-indigo-50 to-violet-50",
      border: "border-indigo-100",
      text: "text-indigo-700",
      shadow: "shadow-indigo-500/20",
      dot: "bg-indigo-500",
    },
  };

  const a = accents[accent] || accents.teal;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 animate-pulse-soft">
        <div className="h-4 w-24 bg-slate-200 rounded animate-shimmer mb-3" />
        <div className="h-9 w-32 bg-slate-200 rounded animate-shimmer mb-4" />
        <div className="h-3 w-40 bg-slate-200 rounded animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br bg-white border border-slate-200 p-6 card-hover animate-fade-in-up">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${a.soft} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/3 translate-x-1/3 blur-2xl`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </h3>
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold ${
                  trend >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {trend >= 0 ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {trendLabel && (
            <p className="mt-2 text-xs text-slate-500">{trendLabel}</p>
          )}
        </div>

        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.bg} text-white shadow-lg ${a.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      </div>

      {footer && (
        <div className={`relative mt-5 pt-4 border-t ${a.border}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
