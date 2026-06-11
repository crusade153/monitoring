'use client';

import { useState } from 'react';
import type { NewsItem } from '@/lib/types';
import { NEWS_KEYWORDS } from '@/lib/keywords';

interface Props {
  items: NewsItem[]; // 최신순
}

export default function NewsFeed({ items }: Props) {
  // 키워드 정의 순서대로 탭 구성 (정의에 없는 과거 키워드는 뒤에)
  const keywords = [
    ...NEWS_KEYWORDS.filter((k) => items.some((i) => i.keyword === k)),
    ...[...new Set(items.map((i) => i.keyword))].filter(
      (k) => !(NEWS_KEYWORDS as readonly string[]).includes(k)
    ),
  ];
  const [active, setActive] = useState<string | undefined>(keywords[0]);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-card p-6 text-sm text-muted">
        최근 7일 뉴스 없음 — 첫 수집 대기 중
      </p>
    );
  }

  const visible = items.filter((i) => i.keyword === active);

  return (
    <div className="rounded-lg border border-line bg-card">
      <div className="flex flex-wrap gap-1 border-b border-line p-2">
        {keywords.map((keyword) => {
          const count = items.filter((i) => i.keyword === keyword).length;
          return (
            <button
              key={keyword}
              onClick={() => setActive(keyword)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active === keyword
                  ? 'bg-line text-accent'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {keyword} <span className="tnum font-mono">{count}</span>
            </button>
          );
        })}
      </div>
      <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
        {visible.map((item) => (
          <li key={item.link}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 transition hover:bg-line/40"
            >
              <p className="text-sm leading-snug">{item.title}</p>
              <p className="tnum mt-1 font-mono text-xs text-muted">
                {item.source ?? '출처 미상'} · {item.pub_date}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
