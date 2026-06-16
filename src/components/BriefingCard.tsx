import type { Briefing } from '@/lib/types';

interface Props {
  briefing: Briefing | null;
}

/** AI 일일 브리핑 — 바쁜 사람은 이 섹션만 읽어도 되도록 최상단 배치 */
export default function BriefingCard({ briefing }: Props) {
  if (!briefing) {
    return (
      <div className="rounded-lg border border-line bg-card p-5 text-sm text-muted">
        AI 브리핑 대기 중 — 다음 수집 때 생성됩니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-accent">
          AI 분석 · 핵심 요약과 인사이트
        </p>
        <p className="tnum font-mono text-xs text-muted">
          {briefing.date}
          {briefing.model && ` · ${briefing.model}`}
        </p>
      </div>
      <div className="whitespace-pre-line text-sm leading-relaxed">
        {briefing.content}
      </div>
      <p className="mt-3 text-xs text-muted">
        뉴스 제목 기반 AI 생성 요약 — 의사결정 전 원문 확인 필요
      </p>
    </div>
  );
}
