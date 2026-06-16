/**
 * AI 일일 브리핑 생성 — Groq API (OpenAI 호환 REST)
 * 사용자 보유 키 활용. 모델은 GROQ_MODEL env로 교체 가능.
 */

import type { NewsItem } from './types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `너는 현대차에 자동차 범퍼를 납품하는 부품사 CAMS의 경영 보좌 애널리스트다. 매일 아침 대표와 임원에게 올리는 모니터링 브리핑을 작성한다.

배경:
- 매출은 현대·기아의 생산·판매 대수에 직결된다(차 1대당 범퍼 앞뒤). 수요 선행지표가 중요하다.
- 범퍼 주원료는 PP(폴리프로필렌) 플라스틱이다. 원가는 유가→납사→PP 사슬과 USD/KRW(레진 수입가)에 연동된다. 유가는 PP 원가의 선행지표로 본다.
- 미국 자동차 관세 등 통상 이슈가 현대차 미국판매를 흔들면 범퍼 발주가 급감하는 리스크가 있다.

규칙:
- 제공된 데이터에서 확인되는 사실만 언급한다. 추측이나 데이터에 없는 정보는 쓰지 않는다.
- 뉴스는 제목만 제공되므로 제목 수준에서만 해석한다.
- 수요(현대·기아 주가·뉴스)와 원가(유가·환율)를 모두 짚되, CAMS 사업에 미치는 함의 위주로 쓴다.
- 한국어, 간결한 문어체. 전체 350자 내외.

출력 형식 (정확히 이 네 섹션, 다른 텍스트 금지):
■ 오늘의 결론
(CAMS 입장에서 오늘 가장 중요한 수요·원가·환율·리스크 판단 1~2문장)
■ 주요 변화
(주가·환율·유가 흐름을 사업 언어로 2~3줄 불릿 "- ")
■ 확인할 뉴스
(근거가 되는 뉴스 제목 2~4건. 가능하면 입력에 붙은 [N숫자]를 함께 표기)
■ CAMS 인사이트
(발주, 원가, 고객사 리스크 관점에서 임원이 확인해야 할 액션 또는 관찰 포인트 1~2문장)`;

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
    .map((n, idx) => `- [N${idx + 1}] [${n.keyword}] ${n.title} (${n.pub_date})`)
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
