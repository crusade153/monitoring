# H2 Morning Watch

수소 압력용기 원가 핵심 변수(환율 2종, 선물 2종, 탄소섬유·수소 뉴스)를 매일 자동 수집·적재하는 팀 모닝 브리핑 대시보드. (구명: H2 Material Watch)

- **스택**: Next.js 15 (App Router) + Neon DB + Vercel Cron
- **시세 4종**: USD/KRW, JPY/KRW(100엔 기준), WTI(CL=F), 천연가스(NG=F)
- **데이터 소스**: open.er-api.com (환율 2종) / Yahoo Finance chart API (선물 2종) / Google News RSS (키워드 5종)
  - 기획서의 Stooq CSV는 2026-06 기준 단종(404) 확인되어 Yahoo로 교체. 어댑터는 [src/lib/collectors.ts](src/lib/collectors.ts)에 소스별 분리

## 설정 순서

### 1. Neon DB

1. [Neon](https://neon.tech) 프로젝트 생성 → SQL Editor에서 [sql/schema.sql](sql/schema.sql) 실행
2. **pooled** connection string 복사 (호스트에 `-pooler` 포함된 것)

### 2. 로컬 환경

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```

### 3. 초기 데이터 백필 (90일치, 1회)

```bash
node --env-file=.env.local scripts/backfill.mjs
```

### 4. 수집 수동 트리거 (검증용)

```powershell
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/collect
```

응답 JSON의 `results`에서 소스별 ok/fail 확인. 실패한 소스가 있어도 나머지는 적재됨 (다음날 자동 정상화).

### 5. Vercel 배포

1. `vercel` 또는 GitHub 연동으로 배포
2. 환경변수 3종 등록: `DATABASE_URL`, `CRON_SECRET`, `DASH_PASSWORD`
3. cron은 [vercel.json](vercel.json)으로 자동 등록 — 매일 22:30 UTC (= KST 07:30, Hobby라 ±수십분 오차 허용)
4. **첫날 필수**: Vercel → Settings → Billing → Spend Management에서 hard limit $30 설정

## 동작 방식

- 수집: `/api/cron/collect`가 일 1회 환율→WTI→뉴스 직렬 수집. 같은 날짜 재실행은 `ON CONFLICT DO UPDATE`로 멱등. 90일 경과 뉴스는 자동 삭제
- 뉴스 수집 기준: 키워드별 Google News 검색 RSS에 `when:7d`(최근 7일)를 붙여 수집. 언론사만 다른 받아쓰기 기사는 같은 키워드 내 제목 유사도(문자 bigram Jaccard ≥ 0.3, 실데이터로 튜닝)로 최초 1건만 저장
- 캐시: 모든 SELECT는 `unstable_cache(revalidate: 600, tags: ['dash'])`, cron 성공 시 `revalidateTag('dash')`로 즉시 갱신
- 인증: middleware가 httpOnly 쿠키(SHA-256, 30일) 검사. 비밀번호는 `DASH_PASSWORD`
- 수집 실패 표시: 시세 마지막 적재일이 **2일 이상** 지나면 카드에 "수집 실패" 뱃지 (주말 휴장 1일은 정상 취급)
- AI 브리핑: cron 마지막 단계에서 Groq API로 1일 1회 생성 (시세 30일 + 뉴스 7일 제목 입력 → 핵심요약/주요뉴스/인사이트). 실패해도 시세·뉴스 적재와 무관. 모델은 `GROQ_MODEL`로 교체 가능

## 키워드 변경

[src/lib/keywords.ts](src/lib/keywords.ts)의 `NEWS_KEYWORDS` 수정 후 재배포 (P1에서 관리 UI 예정).
