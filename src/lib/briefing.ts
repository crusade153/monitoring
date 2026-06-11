/**
 * AI 일일 브리핑 생성 — Groq API (OpenAI 호환 REST)
 * 사용자 보유 키 활용. 모델은 GROQ_MODEL env로 교체 가능.
 */

import type { NewsItem } from './types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `너는 수소 압력용기(Type 4) 제조사의 원자재 구매·원가 분석가다. 매일 아침 팀에게 보내는 시황 브리핑을 작성한다.

규칙:
- 제공된 데이터에서 확인되는 사실만 언급한다. 추측이나 데이터에 없는 정보는 쓰지 않는다.
- 뉴스는 제목만 제공되므로 제목 수준에서만 해석한다.
- 원가 관점(탄소섬유 수입가, AN 원료비, 에너지비)에서 의미 있는 것을 우선한다.
- 한국어, 간결한 문어체. 전체 250자 내외.

출력 형식 (정확히 이 세 섹션, 다른 텍스트 금지):
■ 핵심 요약
(시세 흐름 1~2문장)
■ 주요 뉴스
(원가 관련성 높은 뉴스 2~3건, 각 1줄 불릿 "- ")
■ 인사이트
(원가 관점 시사점 1~2문장)`;

export interface BriefingInput {
  date: string;
  prices: { label: string; unit: string; rows: { date: string; value: number }[] }[]; // rows는 날짜 오름차순 최근 30일
  news: NewsItem[];
}

export interface BriefingResult {
  content: string;
  model: string;
}

function priceLine(p: BriefingInput['prices'][number]): string {
  const last = p.rows.at(-1);
  const prev = p.rows.at(-2);
  const monthAgo = p.rows[0];
  if (!last) return `${p.label}: 데이터 없음`;
  const pct = prev ? (((last.value - prev.value) / prev.value) * 100).toFixed(2) : '?';
  const monthPct = monthAgo && monthAgo !== last
    ? (((last.value - monthAgo.value) / monthAgo.value) * 100).toFixed(1)
    : '?';
  return `${p.label}: ${p.unit}${last.value} (전일 대비 ${pct}%, 30일 대비 ${monthPct}%)`;
}

export async function generateBriefing(input: BriefingInput): Promise<BriefingResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const newsLines = input.news
    .map((n) => `- [${n.keyword}] ${n.title} (${n.pub_date})`)
    .join('\n');

  const userPrompt = `기준일: ${input.date}

[시세]
${input.prices.map(priceLine).join('\n')}

[최근 7일 뉴스 제목]
${newsLines || '(없음)'}`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      // 추론형 모델(gpt-oss 등)은 reasoning 토큰이 한도에 포함되므로 여유 있게
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`groq HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('groq: empty completion');
  }
  return { content: content.trim(), model };
}
