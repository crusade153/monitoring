import BriefingCard from "@/components/BriefingCard";
import ChartPanel from "@/components/ChartPanel";
import NewsFeed from "@/components/NewsFeed";
import PriceCard from "@/components/PriceCard";
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-accent">
            CAMS MORNING WATCH
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            대표님 데일리 모니터링
          </h1>
          <p className="mt-1 text-xs text-muted">
            현대차 수요 · 환율 · 범퍼 원자재(PP) 선행지표
          </p>
        </div>
        <p className="tnum font-mono text-xs text-muted">{todayKst()}</p>
      </header>

      <section className="mt-6">
        <BriefingCard briefing={briefing} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PriceCard label="현대차 주가" unit="₩" series={hyundai} decimals={0} />
        <PriceCard label="기아 주가" unit="₩" series={kia} decimals={0} />
        <PriceCard label="USD/KRW 환율" unit="₩" series={usdkrw} />
        <PriceCard label="WTI 유가 (PP원가 선행)" unit="$" series={wti} />
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
