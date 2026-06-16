import BriefingCard from "@/components/BriefingCard";
import ChartPanel from "@/components/ChartPanel";
import ImpactSummary from "@/components/ImpactSummary";
import NewsFeed from "@/components/NewsFeed";
import PriceCard from "@/components/PriceCard";
import {
  buildBusinessSignals,
  buildDashboardStatus,
  getEvidenceNews,
  metricSnapshot,
} from "@/lib/dashboard-insights";
import { getLatestBriefing, getPriceSeries, getRecentNews } from "@/lib/queries";
import { todayKst } from "@/lib/types";

// 공개 대시보드 — 페이지 캐시 대신 unstable_cache로 데이터만 캐시
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [hyundai, kia, usdkrw, wti, news, briefing] = await Promise.all([
    getPriceSeries("hyundai"),
    getPriceSeries("kia"),
    getPriceSeries("usdkrw"),
    getPriceSeries("wti"),
    getRecentNews(),
    getLatestBriefing(),
  ]);
  const snapshotMap = {
    hyundai: metricSnapshot("hyundai", hyundai),
    kia: metricSnapshot("kia", kia),
    usdkrw: metricSnapshot("usdkrw", usdkrw),
    wti: metricSnapshot("wti", wti),
  };
  const status = buildDashboardStatus(Object.values(snapshotMap), news, briefing);
  const signals = buildBusinessSignals(snapshotMap, news);
  const evidenceNews = getEvidenceNews(news);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-accent">
            CAMS MORNING WATCH
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            경영 브리핑 대시보드
          </h1>
          <p className="mt-1 text-xs text-muted">
            고객사 수요 · 원가 압력 · 환율 부담 · 통상 리스크
          </p>
        </div>
        <p className="tnum font-mono text-xs text-muted">{todayKst()}</p>
      </header>

      <ImpactSummary signals={signals} status={status} />

      <section className="mt-6">
        <BriefingCard briefing={briefing} evidenceNews={evidenceNews} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PriceCard
          signalLabel="수요 신호"
          label="현대차 주가"
          unit="₩"
          series={hyundai}
          decimals={0}
          helperText="고객사 생산·판매 뉴스와 함께 범퍼 발주 방향을 봅니다."
        />
        <PriceCard
          signalLabel="수요 신호"
          label="기아 주가"
          unit="₩"
          series={kia}
          decimals={0}
          helperText="완성차 업황 보조 신호로 현대차 흐름과 같이 확인합니다."
        />
        <PriceCard
          signalLabel="환율 부담"
          label="USD/KRW"
          unit="₩"
          series={usdkrw}
          helperText="원재료 수입 단가와 원화 결제 부담의 선행 신호입니다."
        />
        <PriceCard
          signalLabel="원가 압력"
          label="WTI 유가"
          unit="$"
          series={wti}
          helperText="PP·납사 가격 흐름을 보기 위한 원가 선행 프록시입니다."
        />
      </section>

      <section className="mt-4">
        <ChartPanel
          series={[
            { key: "hyundai", label: "현대차", data: hyundai, color: "#4f8df9" },
            { key: "kia", label: "기아", data: kia, color: "#c084fc" },
            { key: "usdkrw", label: "USD/KRW", data: usdkrw, color: "#e8b34b" },
            { key: "wti", label: "WTI 유가", data: wti, color: "#34d399" },
          ]}
        />
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium text-muted">
          현대차 관련 뉴스 · 항목별 · 최근 7일
        </h2>
        <NewsFeed items={news} />
      </section>
    </main>
  );
}
