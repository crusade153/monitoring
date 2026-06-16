import type { Briefing } from '@/lib/types';
import type { NewsItem } from '@/lib/types';

interface Props {
  briefing: Briefing | null;
  evidenceNews?: NewsItem[];
}

/** AI 일일 브리핑 — 바쁜 사람은 이 섹션만 읽어도 되도록 최상단 배치 */
export default function BriefingCard({ briefing, evidenceNews = [] }: Props) {
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
      {evidenceNews.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs font-medium text-accent">근거로 확인할 뉴스</p>
          <ul className="space-y-2">
            {evidenceNews.map((item) => (
              <li key={item.link}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded border border-line px-3 py-2 transition hover:bg-line/40"
                >
                  <p className="text-sm leading-snug">{item.title}</p>
                  <p className="tnum mt-1 font-mono text-xs text-muted">
                    {item.keyword} · {item.source ?? '출처 미상'} · {item.pub_date}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        뉴스 제목 기반 AI 생성 요약 — 의사결정 전 원문 확인 필요
      </p>
    </div>
  );
}
