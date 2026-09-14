"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { hotelSocialRecords, type HotelSocialRecord } from "./hotelSocialData";
import styles from "./HotelSocialOverview.module.css";

const ALL_PLATFORMS = ["小红书", "抖音", "微博", "新闻"];
const ALL_SENTIMENTS = ["正面", "中性", "混合", "负面"];
const ALL_SCENES = ["入住与前台", "房内服务", "投诉与异常", "智能与自助"];
const MIN_DATE = "2026-08-11";
const MAX_DATE = "2026-09-10";

type AdFilter = "all" | "ugc" | "ad";
type Filters = {
  night: "night" | "all";
  platform: string;
  ad: AdFilter;
  brand: string;
  sentiment: string;
  scene: string;
  start: string;
  end: string;
};

type CountItem = { label: string; count: number };

const INITIAL_FILTERS: Filters = {
  night: "night",
  platform: "all",
  ad: "all",
  brand: "all",
  sentiment: "all",
  scene: "all",
  start: MIN_DATE,
  end: MAX_DATE,
};

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function countTags(records: HotelSocialRecord[], key: "problemTags" | "adTags") {
  const counts = countBy(records.flatMap((record) => record[key]));
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}

function dateList(start: string, end: string) {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const final = new Date(`${end}T00:00:00`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(final.getTime()) || current > final) return dates;
  while (current <= final) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateRange(start: string, end: string) {
  const compact = (date: string) => date.replaceAll("-", ".");
  return `${compact(start)} — ${compact(end)}`;
}

function percentage(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function TrendChart({ records, start, end }: { records: HotelSocialRecord[]; start: string; end: string }) {
  const days = useMemo(() => dateList(start, end), [start, end]);
  const trend = useMemo(() => {
    const byDay = countBy(records.map((record) => record.date));
    const ugcByDay = countBy(records.filter((record) => !record.ad).map((record) => record.date));
    return days.map((date) => ({ date, total: byDay[date] || 0, ugc: ugcByDay[date] || 0 }));
  }, [days, records]);

  const width = 760;
  const height = 258;
  const inset = { top: 18, right: 14, bottom: 32, left: 38 };
  const plotWidth = width - inset.left - inset.right;
  const plotHeight = height - inset.top - inset.bottom;
  const maxValue = Math.max(1, ...trend.flatMap((item) => [item.total, item.ugc]));
  const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const point = (value: number, index: number) => {
    const x = inset.left + (trend.length <= 1 ? 0 : (index / (trend.length - 1)) * plotWidth);
    const y = inset.top + plotHeight - (value / yMax) * plotHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  };
  const totalPoints = trend.map((item, index) => point(item.total, index)).join(" ");
  const ugcPoints = trend.map((item, index) => point(item.ugc, index)).join(" ");
  const xLabels = trend.length ? [0, Math.floor((trend.length - 1) / 2), trend.length - 1] : [];
  const yTicks = [0, Math.round(yMax / 2), yMax];

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartLegend}>
        <span><i className={styles.legendTotal} />全部内容</span>
        <span><i className={styles.legendUgc} />用户自发</span>
      </div>
      {trend.length === 0 ? (
        <div className={styles.emptyChart}>当前筛选没有可展示的日期数据</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.trendSvg} aria-label="每日内容量趋势图" role="img">
          {yTicks.map((tick) => {
            const y = inset.top + plotHeight - (tick / yMax) * plotHeight;
            return (
              <g key={tick}>
                <line x1={inset.left} x2={width - inset.right} y1={y} y2={y} className={styles.gridLine} />
                <text x={inset.left - 8} y={y + 4} textAnchor="end" className={styles.axisText}>{tick}</text>
              </g>
            );
          })}
          <polyline points={ugcPoints} fill="none" className={styles.ugcLine} />
          <polyline points={totalPoints} fill="none" className={styles.totalLine} />
          {xLabels.map((index) => (
            <text key={trend[index].date} x={inset.left + (trend.length <= 1 ? 0 : (index / (trend.length - 1)) * plotWidth)} y={height - 7} textAnchor={index === 0 ? "start" : index === trend.length - 1 ? "end" : "middle"} className={styles.axisText}>
              {trend[index].date.slice(5).replace("-", "/")}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

function Donut({ value, total, tone = "blue" }: { value: number; total: number; tone?: "blue" | "orange" }) {
  const share = percentage(value, total);
  const color = tone === "blue" ? "#2669e8" : "#f28a3b";
  const background = total ? `conic-gradient(${color} 0 ${share}%, #e9edf5 ${share}% 100%)` : "#e9edf5";
  return (
    <div className={styles.donut} style={{ background }}>
      <div><strong>{share}%</strong><span>{value} 条</span></div>
    </div>
  );
}

function RankedBars({ items, color, maxItems = 5 }: { items: CountItem[]; color: string; maxItems?: number }) {
  const shown = items.slice(0, maxItems);
  const maximum = Math.max(...shown.map((item) => item.count), 1);
  if (!shown.length) return <p className={styles.emptyState}>当前筛选下暂无数据</p>;
  return (
    <ol className={styles.rankedList}>
      {shown.map((item, index) => (
        <li key={item.label}>
          <span className={styles.rank}>{index + 1}</span>
          <span className={styles.rankLabel}>{item.label}</span>
          <span className={styles.barTrack}><i style={{ width: `${(item.count / maximum) * 100}%`, background: color }} /></span>
          <strong>{item.count}</strong>
        </li>
      ))}
    </ol>
  );
}

function PlatformBars({ records }: { records: HotelSocialRecord[] }) {
  const counts = countBy(records.map((record) => record.platform));
  const maximum = Math.max(...ALL_PLATFORMS.map((platform) => counts[platform] || 0), 1);
  return (
    <div className={styles.platformBars}>
      {ALL_PLATFORMS.map((platform) => {
        const count = counts[platform] || 0;
        return (
          <div key={platform} className={styles.platformRow}>
            <span>{platform}</span>
            <div><i style={{ width: `${(count / maximum) * 100}%` }} /></div>
            <b>{count}</b>
          </div>
        );
      })}
    </div>
  );
}

export function HotelSocialOverview() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [openFilters, setOpenFilters] = useState(false);

  const visibleRecords = useMemo(() => hotelSocialRecords.filter((record) => {
    if (filters.night === "night" && !record.night) return false;
    if (record.date < filters.start || record.date > filters.end) return false;
    if (filters.platform !== "all" && record.platform !== filters.platform) return false;
    if (filters.ad === "ugc" && record.ad) return false;
    if (filters.ad === "ad" && !record.ad) return false;
    if (filters.brand !== "all" && !record.brand.includes(filters.brand)) return false;
    if (filters.sentiment !== "all" && record.sentiment !== filters.sentiment) return false;
    if (filters.scene !== "all" && !record.scene.includes(filters.scene)) return false;
    return true;
  }), [filters]);

  const derived = useMemo(() => {
    const ugc = visibleRecords.filter((record) => !record.ad);
    const commercial = visibleRecords.filter((record) => record.ad);
    const problemRecords = ugc.filter((record) => record.sentiment === "负面" || record.sentiment === "混合");
    const risk = visibleRecords.filter((record) => record.sentiment === "负面" || record.sentiment === "混合");
    const sentimentCounts = countBy(visibleRecords.map((record) => record.sentiment));
    return {
      ugc,
      commercial,
      problemTags: countTags(problemRecords, "problemTags"),
      adTags: countTags(commercial, "adTags"),
      riskCount: risk.length,
      sentimentCounts,
    };
  }, [visibleRecords]);

  const cloudItems = useMemo(() => [
    ...derived.problemTags.slice(0, 6).map((item) => ({ ...item, kind: "user" as const })),
    ...derived.adTags.slice(0, 6).map((item) => ({ ...item, kind: "seller" as const })),
  ].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN")), [derived]);
  const cloudMax = Math.max(...cloudItems.map((item) => item.count), 1);
  const isNightScope = filters.night === "night";
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "night") return value !== "night";
    if (key === "start") return value !== MIN_DATE;
    if (key === "end") return value !== MAX_DATE;
    return value !== "all";
  }).length;
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main className={styles.report}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <span className={styles.brandMark}>R</span>
            <div><strong>酒店服务社媒调研</strong><small>近 30 天 · 亚朵 / 全季</small></div>
          </div>
          <nav className={styles.tabs} aria-label="报告页面">
            <span className={styles.activeTab}>总览</span>
            <Link href="/hotel-social-report/ugc">用户（UGC）</Link>
            <Link href="/hotel-social-report/advertiser">广告（商家）</Link>
          </nav>
          <div className={styles.status}><i /> 数据已接入</div>
        </div>
      </header>

      <section className={styles.container}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>酒店服务 · 社媒数据报告</p>
            <h1>{isNightScope ? "夜间内容总览" : "内容总览"}</h1>
          </div>
          <button type="button" className={styles.resetButton} onClick={() => setFilters(INITIAL_FILTERS)}>重置筛选</button>
        </div>

        <section className={styles.filterPanel} aria-label="数据筛选">
          <div className={styles.filterHeader}>
            <div><b>筛选条件</b><span>默认夜间，可切换全部</span></div>
            <button type="button" className={styles.filterToggle} onClick={() => setOpenFilters((open) => !open)} aria-expanded={openFilters}>
              {openFilters ? "收起筛选" : "展开筛选"}{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </button>
          </div>
          <div className={`${styles.filterGrid} ${openFilters ? styles.filterGridOpen : ""}`}>
            <label>是否夜间<select value={filters.night} onChange={(event) => updateFilter("night", event.target.value as Filters["night"])}><option value="night">夜间</option><option value="all">全部</option></select></label>
            <label>平台<select value={filters.platform} onChange={(event) => updateFilter("platform", event.target.value)}><option value="all">全部平台</option>{ALL_PLATFORMS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>是否广告<select value={filters.ad} onChange={(event) => updateFilter("ad", event.target.value as AdFilter)}><option value="all">全部内容</option><option value="ugc">用户自发（非广告）</option><option value="ad">广告 / 商业化</option></select></label>
            <label>品牌<select value={filters.brand} onChange={(event) => updateFilter("brand", event.target.value)}><option value="all">全部品牌</option><option value="亚朵">亚朵（含联名提及）</option><option value="全季">全季（含联名提及）</option></select></label>
            <label>情感<select value={filters.sentiment} onChange={(event) => updateFilter("sentiment", event.target.value)}><option value="all">全部情感</option>{ALL_SENTIMENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>场景<select value={filters.scene} onChange={(event) => updateFilter("scene", event.target.value)}><option value="all">全部场景</option>{ALL_SCENES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>开始日期<span className={styles.fixedDate}>{MIN_DATE.replaceAll("-", ".")}</span></label>
            <label>结束日期<span className={styles.fixedDate}>{MAX_DATE.replaceAll("-", ".")}</span></label>
          </div>
        </section>

        <section className={styles.metrics} aria-label="核心数据">
          <article><span>{isNightScope ? "夜间内容量" : "内容量"}</span><strong>{visibleRecords.length}</strong><small>筛选结果 · 内容记录数</small></article>
          <article><span>用户自发内容</span><strong>{derived.ugc.length}</strong><small>非广告内容 · {percentage(derived.ugc.length, visibleRecords.length)}%</small></article>
          <article><span>广告 / 商业化内容</span><strong>{derived.commercial.length}</strong><small>广告初筛为“是” · {percentage(derived.commercial.length, visibleRecords.length)}%</small></article>
          <article><span>混合及负面内容</span><strong>{derived.riskCount}</strong><small>混合 {derived.sentimentCounts["混合"] || 0} · 负面 {derived.sentimentCounts["负面"] || 0}</small></article>
        </section>

        <section className={styles.primaryGrid}>
          <article className={`${styles.panel} ${styles.trendPanel}`}>
            <div className={styles.panelHeading}><div><p>趋势</p><h2>每日{isNightScope ? "夜间" : ""}内容量</h2></div><span>{formatDateRange(filters.start, filters.end)}</span></div>
            <TrendChart records={visibleRecords} start={filters.start} end={filters.end} />
          </article>
          <article className={`${styles.panel} ${styles.distributionPanel}`}>
            <div className={styles.panelHeading}><div><p>内容构成</p><h2>用户与广告</h2></div></div>
            <div className={styles.donutRow}>
              <Donut value={derived.ugc.length} total={visibleRecords.length} />
              <div><b>用户自发</b><strong>{derived.ugc.length}</strong><span>广告 / 商业化 {derived.commercial.length}</span></div>
            </div>
            <div className={styles.panelDivider} />
            <div className={styles.platformTitle}><span>平台分布</span><small>内容记录数</small></div>
            <PlatformBars records={visibleRecords} />
          </article>
        </section>

        <section className={styles.insightGrid}>
          <article className={`${styles.panel} ${styles.insightPanel}`}>
            <div className={styles.insightHeading}><div><p className={styles.userKicker}>用户视角</p><h2>{isNightScope ? "夜间高频问题" : "高频问题"}</h2></div><span>混合 / 负面 UGC</span></div>
            <RankedBars items={derived.problemTags} color="#246bdb" />
            <p className={styles.cardNote}>用于识别需优先验证的夜间服务问题。</p>
          </article>
          <article className={`${styles.panel} ${styles.insightPanel}`}>
            <div className={styles.insightHeading}><div><p className={styles.sellerKicker}>商家视角</p><h2>广告高频卖点</h2></div><span>广告 / 商业化内容</span></div>
            <RankedBars items={derived.adTags} color="#e78238" />
            <p className={styles.cardNote}>用于观察商家反复强调的服务与体验。</p>
          </article>
          <article className={`${styles.panel} ${styles.cloudPanel}`}>
            <div className={styles.insightHeading}><div><p className={styles.neutralKicker}>话题词云</p><h2>当前筛选高频话题</h2></div><span>词越大 · 提及越多</span></div>
            {cloudItems.length ? (
              <div className={styles.cloud}>
                {cloudItems.map((item) => (
                  <span key={`${item.kind}-${item.label}`} className={item.kind === "user" ? styles.cloudUser : styles.cloudSeller} style={{ fontSize: `${13 + (item.count / cloudMax) * 15}px` }}>
                    {item.label}<sup>{item.count}</sup>
                  </span>
                ))}
              </div>
            ) : <p className={styles.emptyState}>当前筛选下暂无可归类的话题</p>}
          </article>
        </section>

        <p className={styles.methodNote}>统计口径：默认统计清洗表中“是否夜间”为“是”的内容记录，也可切换为全部内容；话题按标题、核心内容、核心评论的固定关键词规则归类，一条内容可命中多个话题。话题提及数不等于独立事件数。</p>
      </section>
    </main>
  );
}
