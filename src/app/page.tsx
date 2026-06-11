import BriefingCard from "@/components/BriefingCard";
import ChartPanel from "@/components/ChartPanel";
import NewsFeed from "@/components/NewsFeed";
import PriceCard from "@/components/PriceCard";
import { getLatestBriefing, getPriceSeries, getRecentNews } from "@/lib/queries";
import { todayKst } from "@/lib/types";

// 인증 쿠키 뒤의 페이지 — 페이지 캐시 대신 unstable_cache로 데이터만 캐시
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [usdkrw, jpykrw, wti, natgas, news, briefing] = await Promise.all([
    getPriceSeries("usdkrw"),
    getPriceSeries("jpykrw"),
    getPriceSeries("wti"),
    getPriceSeries("natgas"),
    getRecentNews(),
    getLatestBriefing(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-accent">
            H2 MORNING WATCH
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            데일리 모닝 브리핑
          </h1>
        </div>
        <p className="tnum font-mono text-xs text-muted">{todayKst()}</p>
      </header>

      <section className="mt-6">
        <BriefingCard briefing={briefing} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PriceCard label="USD/KRW 환율" unit="₩" series={usdkrw} />
        <PriceCard label="JPY/KRW 환율 (100엔)" unit="₩" series={jpykrw} />
        <PriceCard label="WTI 유가 (배럴)" unit="$" series={wti} />
        <PriceCard label="천연가스 (MMBtu)" unit="$" series={natgas} />
      </section>

      <section className="mt-4">
        <ChartPanel
          series={[
            { key: "usdkrw", label: "USD/KRW", data: usdkrw, color: "#e8b34b" },
            { key: "jpykrw", label: "JPY/KRW", data: jpykrw, color: "#c084fc" },
            { key: "wti", label: "WTI", data: wti, color: "#4f8df9" },
            { key: "natgas", label: "천연가스", data: natgas, color: "#34d399" },
          ]}
        />
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium text-muted">
          키워드 뉴스 · 최근 7일
        </h2>
        <NewsFeed items={news} />
      </section>
    </main>
  );
}
