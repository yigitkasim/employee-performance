// Small presentational primitives shared across screens.

export function GapBar({
  cur,
  target,
  max = 5,
}: {
  cur: number;
  target: number;
  max?: number;
}) {
  return (
    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-visible">
      <div
        className="absolute left-0 top-0 bottom-0 bg-indigo-600 rounded-full"
        style={{ width: `${(cur / max) * 100}%` }}
      />
      <div
        className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700"
        style={{ left: `${(target / max) * 100}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  valueClass = "",
  subClass = "text-slate-500",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClass?: string;
  subClass?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-semibold ${valueClass}`}>{value}</span>
        {sub && <span className={`text-xs ${subClass}`}>{sub}</span>}
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-5 gap-3 md:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex gap-2 items-center flex-wrap md:flex-nowrap md:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
