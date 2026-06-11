import type { PricePoint } from '@/lib/types';
import { todayKst } from '@/lib/types';

interface Props {
  label: string;
  unit: string;
  series: PricePoint[]; // 날짜 오름차순
}

const fmt = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PriceCard({ label, unit, series }: Props) {
  const latest = series.at(-1);
  const prev = series.at(-2);

  if (!latest) {
    return (
      <div className="rounded-lg border border-line bg-card p-6">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-4 text-sm text-muted">데이터 없음 — 백필 또는 첫 수집 대기</p>
      </div>
    );
  }

  const delta = prev ? latest.value - prev.value : 0;
  const pct = prev ? (delta / prev.value) * 100 : 0;
  const tone = delta > 0 ? 'text-up' : delta < 0 ? 'text-down' : 'text-muted';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';

  // 마지막 적재일이 이틀 이상 지났으면 수집 문제로 간주 (주말 휴장 1일은 허용)
  const staleDays = Math.floor(
    (Date.parse(todayKst()) - Date.parse(latest.date)) / 86_400_000
  );

  return (
    <div className="rounded-lg border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        {staleDays >= 2 && (
          <span className="rounded border border-up/40 px-2 py-0.5 text-xs text-up">
            수집 실패 · 마지막 {latest.date}
          </span>
        )}
      </div>
      <p className="tnum mt-3 font-mono text-3xl font-semibold leading-none xl:text-4xl">
        <span className="mr-1 text-lg text-muted">{unit}</span>
        {fmt(latest.value)}
      </p>
      <p className={`tnum mt-3 font-mono text-sm ${tone}`}>
        {arrow} {fmt(Math.abs(delta))} ({pct >= 0 ? '+' : ''}
        {pct.toFixed(2)}%)
      </p>
      <p className="tnum mt-1 font-mono text-xs text-muted">
        전일 대비 · {latest.date}
      </p>
    </div>
  );
}
