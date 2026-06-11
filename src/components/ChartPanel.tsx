'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { PricePoint } from '@/lib/types';

// recharts는 무거우므로 클라이언트에서 lazy 로드
const TrendChart = dynamic(() => import('./TrendChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted">
      차트 로딩 중…
    </div>
  ),
});

const RANGES = [30, 90] as const;

export interface ChartSeries {
  key: string;
  label: string;
  data: PricePoint[]; // 최근 90일, 날짜 오름차순
  color: string;
}

interface Props {
  series: ChartSeries[];
}

/** 시세 탭 전환형 단일 차트 패널 — 세로 스크롤 최소화 */
export default function ChartPanel({ series }: Props) {
  const [activeKey, setActiveKey] = useState(series[0]?.key);
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);

  const active = series.find((s) => s.key === activeKey) ?? series[0];
  const sliced = active.data.slice(-range);

  return (
    <div className="rounded-lg border border-line bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {series.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active.key === s.key
                  ? 'bg-line text-accent'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-md border border-line p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 font-mono text-xs transition ${
                range === r ? 'bg-line text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {r}일
            </button>
          ))}
        </div>
      </div>
      {sliced.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted">
          데이터 없음
        </div>
      ) : (
        <TrendChart data={sliced} color={active.color} />
      )}
    </div>
  );
}
