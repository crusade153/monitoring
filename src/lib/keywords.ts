/**
 * 뉴스 수집 키워드 (CAMS — 현대차 범퍼 납품사 모니터링용)
 *
 * label : 대시보드 뉴스 탭에 보이는 항목명 (DB news.keyword에 저장)
 * query : Google News 검색에 실제로 쓰는 질의 (OR/괄호 사용 가능)
 *
 * 항목 추가/변경 시 이 배열만 수정 후 재배포.
 */
export interface NewsKeyword {
  label: string;
  query: string;
}

export const NEWS_KEYWORDS: NewsKeyword[] = [
  // 수요 선행지표 — 차가 팔리고 생산돼야 범퍼 발주가 난다
  { label: '현대차 판매·생산', query: '현대차 (판매 OR 생산 OR 실적 OR 출고 OR 내수)' },
  // 정책 리스크 — 미국 관세가 현대차 미국판매를 흔들면 발주 급감
  { label: '자동차 관세·통상', query: '자동차 관세 OR 현대차 관세 OR 미국 자동차 관세' },
  // 원가 선행지표 — 범퍼 주원료 PP의 가격 사슬(납사·석유화학)
  { label: 'PP·납사·석유화학', query: '폴리프로필렌 가격 OR 납사 가격 OR PP 가격' },
  // 부품업계·EV — 신차/모비스 발주, 범퍼 사양 변화
  { label: '자동차 부품·전기차', query: '현대차 전기차 OR 현대모비스 OR 자동차 부품' },
];
