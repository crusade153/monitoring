import type { BusinessSignal, DashboardStatus, SignalTone } from '@/lib/dashboard-insights';

interface Props {
  signals: BusinessSignal[];
  status: DashboardStatus;
}

const toneClass: Record<SignalTone, string> = {
  good: 'border-down/40 text-down',
  neutral: 'border-line text-muted',
  watch: 'border-accent/50 text-accent',
  risk: 'border-up/50 text-up',
};

const dotClass: Record<SignalTone, string> = {
  good: 'bg-down',
  neutral: 'bg-muted',
  watch: 'bg-accent',
  risk: 'bg-up',
};

export default function ImpactSummary({ signals, status }: Props) {
  return (
    <section className="mt-6 rounded-lg border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-accent">
            오늘의 CAMS 영향 요약
          </p>
          <h2 className="mt-1 text-lg font-semibold">수요 · 원가 · 환율 · 리스크</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="tnum font-mono">데이터 기준 {status.asOf}</span>
          {status.items.map((item) => (
            <span
              key={item.label}
              className={`rounded border px-2 py-1 ${toneClass[item.tone]}`}
            >
              {item.label} {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => (
          <article key={signal.key} className="rounded-md border border-line bg-bg/35 p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dotClass[signal.tone]}`} />
              <p className="text-xs font-medium text-muted">{signal.title}</p>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug">{signal.headline}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{signal.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
