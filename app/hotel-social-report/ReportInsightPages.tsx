"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./ReportInsightPages.module.css";
import extra from "./ReportInsightPagesExtra.module.css";

type Brand = "全部品牌" | "亚朵" | "全季";
type PageMode = "ugc" | "advertiser";

type Post = {
  brand: Exclude<Brand, "全部品牌">;
  platform: string;
  date: string;
  sentiment?: string;
  title: string;
  excerpt: string;
  analysis: string;
  tags: string[];
};

const UGC_POSTS: Post[] = [
  {
    brand: "全季",
    platform: "社媒内容",
    date: "夜间内容",
    sentiment: "负面",
    title: "全季入住帖提到：",
    excerpt: "“call总台服务慢慢吞吞得三催四请，自动送餐服务要等半个钟以上，半夜时不时开门关门隔音巨差。”",
    analysis: "夜间送物是典型的服务断链。产品需要具备任务状态、预计送达时间、超时升级和送达确认；否则，机器人只是能够移动的设备。",
    tags: ["送物送餐", "响应慢", "噪音"],
  },
  {
    brand: "全季",
    platform: "社媒内容",
    date: "夜间内容",
    sentiment: "负面",
    title: "全季住客称，凌晨回酒店发现房门处于打开状态，后续前台多次给出不同解释。",
    excerpt: "凌晨回酒店发现房门处于打开状态，后续前台多次给出不同解释。",
    analysis: "保洁任务完成不等于客房已安全关闭。门状态出现异常后，必须由人员核验、处理并留痕。",
    tags: ["客房安全", "服务沟通"],
  },
  {
    brand: "全季",
    platform: "社媒内容",
    date: "夜间内容",
    sentiment: "负面",
    title: "全季住客反馈卫生异常后，等待处理约半小时；无房可换时，酒店用机器人送蚊香让住客自行解决。",
    excerpt: "卫生异常后等待处理约半小时。无房可换时，酒店用机器人送蚊香让住客自行解决。",
    analysis: "产品应判断事件等级，并调度替代方案，例如核查空房、升级至值班经理，或提供明确的补偿和转移方案，而非机械完成“送物”任务。",
    tags: ["卫生异常", "异常处置", "机器人送物"],
  },
  {
    brand: "亚朵",
    platform: "社媒内容",
    date: "夜间内容",
    sentiment: "混合",
    title: "亚朵前台从业者提到，夜班需要给会员送夜宵，家人认为女生独自去客房区域送东西不安全。",
    excerpt: "夜班需要给会员送夜宵，家人认为女生独自去客房区域送东西不安全。",
    analysis: "产品可承担夜间低价值配送，并在必要时提供人机协同与安全保障。",
    tags: ["夜宵配送", "夜班安全"],
  },
];

const ADVERTISER_POSTS: Post[] = [
  {
    brand: "亚朵",
    platform: "小红书",
    date: "2026.08.29",
    title: "深夜粥、夜宵",
    excerpt: "亚朵传播“21:30—23:00深夜粥到”；全季内容传播“22点后预约，机器人送餐到房”。",
    analysis: "已有用户提到，深夜粥标注供应至 23 点，但约 22 点时已基本无供给。这说明，夜间餐食的稳定兑现比营销文案更重要。联动库存、需求预估、机器人运力、排队时长和缺货告警。",
    tags: ["深夜粥到", "夜间服务"],
  },
  {
    brand: "全季",
    platform: "小红书",
    date: "2026.08.26",
    title: "机器人送物与隐私",
    excerpt: "内容强调“机器人送餐”“隐私度高”“智能客控”。",
    analysis: "重在让系统判断任务优先级、确认楼层通行、预估到达时间、验证门口交付，并在任务失败后转由人工处理。",
    tags: ["夜宵", "机器人送物"],
  },
  {
    brand: "亚朵",
    platform: "小红书",
    date: "2026.08.29",
    title: "深睡、安静、恢复感",
    excerpt: "亚朵 3.6 强调深睡床垫、柔和灯光、隔音遮光，许多内容提及安静、舒适和“住得好”，并销售枕头。",
    analysis: "让睡眠卖点具备服务恢复能力，例如静夜模式、噪音报障、换房协调和补给派送，不只展示床垫、香氛和智能面板。",
    tags: ["位置出行", "安静", "夜宵"],
  },
];

const UGC_ROWS = [
  ["送物、送餐慢", "用户关心什么时候到、给前台打电话收到已经安排的回复，模棱两可。", "将“请求—派单—预计到达—送达确认—超时升级”做成闭环；实时选择机器及前台机器人，超过时限自动升级优先级。", "可直接改善。重点不是聊天回复，而是在流程里完成任务并确定优先级。"],
  ["客房安全失控", "房门未关、房卡管理混乱，以及深夜独处时遭遇不友好服务，都可能迅速加剧用户对人身和财物安全的担忧。", "roboclaw接入门锁、门磁、保洁任务和客房状态等数据，识别“无人房门长时间开启”等异常情况，及时派机器人/人工核验，并记录处置结果，形成闭环。", "可直接改善异常预警和处置流程，但不能替代门锁管理、安保制度和人工责任。"],
  ["夜间异常处置失效", "出现卫生、异味或虫害等问题后，若前台只安排送物，或让用户自行处理，问题本身并没有得到升级和解决。", "识别高严重度事件后，自动核查可用空房、值班经理和其他可调配资源，避免将“送蚊香”等临时措施视为虫害问题的最终处理结果。", "只能提升处置，不会消灭卫生质量问题本身。还需要人工/聚焦归纳整理的机器人厂家合作"],
  ["噪音与睡眠被打断", "半夜开关门、下水道异响、隔音差，会直接毁掉入住体验。", "建立“静夜模式”：用户一键报障、优先派单、可选换房/耳塞等补救；公共区域可做非录音式噪声事件监测。", "无法改变建筑隔音，不能以房内持续录音换取体验。"],
];

const ADVERTISER_ROWS = [
  ["深夜粥、夜宵", "亚朵传播“21:30—23:00深夜粥到”；全季内容传播“22点后预约，机器人送餐到房”。", "已有用户提到，深夜粥标注供应至 23 点，但约 22 点时已基本无供给。这说明，夜间餐食的稳定兑现比营销文案更重要。联动库存、需求预估、机器人运力、排队时长和缺货告警。"],
  ["深睡、安静、恢复感", "亚朵 3.6 强调深睡床垫、柔和灯光、隔音遮光，许多内容提及安静、舒适和“住得好”，并销售枕头", "让睡眠卖点具备服务恢复能力，例如静夜模式、噪音报障、换房协调和补给派送，不只展示床垫、香氛和智能面板"],
  ["机器人送物与隐私", "内容强调“机器人送餐”“隐私度高”“智能客控”。", "重在让系统判断任务优先级、确认楼层通行、预估到达时间、验证门口交付，并在任务失败后转由人工处理"],
];

function BrandFilter({ brand, onChange }: { brand: Brand; onChange: (brand: Brand) => void }) {
  return (
    <label className={styles.brandFilter}>
      品牌
      <select value={brand} onChange={(event) => onChange(event.target.value as Brand)}>
        <option>全部品牌</option>
        <option>亚朵</option>
        <option>全季</option>
      </select>
    </label>
  );
}

function PostList({ posts, brand, tone }: { posts: Post[]; brand: Brand; tone: PageMode }) {
  const filtered = useMemo(() => brand === "全部品牌" ? posts : posts.filter((post) => post.brand === brand), [brand, posts]);
  return (
    <div className={styles.posts}>
      {filtered.length ? filtered.map((post) => (
        <article className={`${styles.post} ${tone === "advertiser" ? styles.postOrange : ""}`} key={`${post.brand}-${post.title}`}>
          <div className={styles.postHeader}><b>{post.title}</b><span>{post.brand} · {post.platform} · {post.date}{post.sentiment ? ` · ${post.sentiment}` : ""}</span></div>
          <p>{post.excerpt}</p>
          <p className={extra.postAnalysis}>{post.analysis}</p>
          <div className={styles.tags}>{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </article>
      )) : <p className={styles.noPosts}>当前品牌下没有选出的代表性帖子。</p>}
    </div>
  );
}

export function ReportInsightPage({ mode }: { mode: PageMode }) {
  const [brand, setBrand] = useState<Brand>("全部品牌");
  const isUgc = mode === "ugc";
  const posts = isUgc ? UGC_POSTS : ADVERTISER_POSTS;

  return (
    <main className={`${styles.page} ${isUgc ? styles.ugcPage : styles.advertiserPage}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}><span>R</span><div><strong>酒店服务社媒调研</strong><small>近 30 天 · 亚朵 / 全季</small></div></div>
          <nav className={styles.nav} aria-label="报告页面">
            <Link href="/hotel-social-report">总览</Link>
            <Link className={isUgc ? styles.active : ""} href="/hotel-social-report/ugc">用户（UGC）</Link>
            <Link className={!isUgc ? styles.active : ""} href="/hotel-social-report/advertiser">广告（商家）</Link>
          </nav>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.pageTitle}>
          <div><p>{isUgc ? "用户自发内容" : "商业和种草内容"}</p><h1>{isUgc ? "用户视角_夜间服务的闭环" : "商家视角_被照顾感的落地"}</h1></div>
          <BrandFilter brand={brand} onChange={setBrand} />
        </div>

        {isUgc ? <UgcContent brand={brand} posts={posts} /> : <AdvertiserContent brand={brand} posts={posts} />}
      </section>
    </main>
  );
}

function UgcContent({ brand, posts }: { brand: Brand; posts: Post[] }) {
  return <>
    <section className={styles.sampleStrip} aria-label="用户侧样本">
      <span>样本共 644 条，其中夜间内容 457 条。</span>
      <span>用户侧筛出 135 条夜间、非广告、负面或混合情感的社媒内容，其中 71 条以第一人称讲述真实经历。</span>
    </section>
    <p className={extra.reportLead}>用户自发分享的负面体验显示，夜间服务的问题主要集中在睡眠与噪音、服务响应和卫生异常。送物或机器人相关的直接负面提及不算最多，但与夜间人手不足、用户安全感密切相关，应被优先关注。对用户而言，问题不只是“有没有人服务”即夜间人手是否充足，而是从提出需求到完成服务的过程是否可靠。客房门未关、夜班人员独自送物等情况，可能因一次失误严重损害用户信任，酒店场景的客户可以通过产品能力直接或间接降低这类风险。</p>
    <section className={styles.summaryGrid}>
      <article><p>用户自发分享的负面体验显示</p><h2>睡眠与噪音、服务响应和卫生异常</h2><small>送物或机器人相关的直接负面提及不算最多，但与夜间人手不足、用户安全感密切相关，应被优先关注。</small></article>
      <article><p>对用户而言</p><h2>问题不只是“有没有人服务”</h2><small>即夜间人手是否充足，而是从提出需求到完成服务的过程是否可靠。</small></article>
      <article><p>酒店场景的客户可以通过产品能力</p><h2>直接或间接降低这类风险</h2><small>客房门未关、夜班人员独自送物等情况，可能因一次失误严重损害用户信任。</small></article>
    </section>
    <section className={styles.twoColumn}>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><p>用户不满的点</p><h2>我们的产品能做什么</h2></div><span>边界</span></div>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>情况</th><th>用户遇到什么</th><th>RoboClaw 能做什么</th><th>边界</th></tr></thead><tbody>{UGC_ROWS.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><p>代表性原帖内容</p><h2>{brand === "全部品牌" ? "详见数据明细" : `${brand}相关内容`}</h2></div><span>对应分析</span></div>
        <PostList posts={posts} brand={brand} tone="ugc" />
      </article>
    </section>
    <section className={styles.bottomConclusion}>
      <p>产品结论：从“智能设备”转向“夜间服务操作系统”</p>
      <ol><li>夜间即时供给闭环：当用户需要饮用水、夜宵、外卖或客用品时，系统能够结合库存、机器人位置、人力状态和预计到达时间安排服务；任务超时后自动升级处理。</li><li>安全异常闭环：针对房门未关、异常出入、深夜公共区域求助等事件，系统识别风险后派人核验，向住客告知处理结果，并保留审计记录。</li><li>服务失败补救闭环：出现卫生、设备、噪音或无房可换等问题后，系统判断事件严重度并调度相应资源，而不是把一次送物当作问题已经解决。</li></ol>
    </section>
  </>;
}

function AdvertiserContent({ brand, posts }: { brand: Brand; posts: Post[] }) {
  return <>
    <section className={styles.sampleStrip} aria-label="商家侧样本">
      <span>商家侧样本为 109 条夜间商业或种草类社媒内容。</span>
    </section>
    <p className={extra.reportLead}>商家在官方发布和 KOC/KOL 合作内容中，最常传播的卖点包括区位和出行便利 46 条、价格与优惠 39 条、睡眠与安静 39 条、品牌氛围 32 条、智能和机器人 29 条、服务礼遇 26 条，以及夜宵和深夜餐食 25 条。这些内容共同传递的是“被照顾感”。其中区位和价格虽然出现频率高，但与我们的产品方向相关性较小；我们的产品应围绕商家已经作出的服务承诺，提升夜间响应、任务执行和异常处理的确定性，让用户感受到的“被照顾感”成为可稳定兑现的入住体验。</p>
    <section className={`${styles.summaryGrid} ${styles.orangeSummary}`}>
      <article><p>商家传播卖点</p><h2>区位和出行便利 46 条、价格与优惠 39 条、睡眠与安静 39 条</h2><small>品牌氛围 32 条、智能和机器人 29 条、服务礼遇 26 条，以及夜宵和深夜餐食 25 条。</small></article>
      <article><p>这些内容共同传递的是</p><h2>“被照顾感”</h2><small>其中区位和价格虽然出现频率高，但与我们的产品方向相关性较小。</small></article>
      <article><p>我们的产品应围绕商家已经作出的服务承诺</p><h2>提升夜间响应、任务执行和异常处理的确定性</h2><small>让用户感受到的“被照顾感”成为可稳定兑现的入住体验。</small></article>
    </section>
    <section className={styles.twoColumn}>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><p>商家传播卖点</p><h2>数据中的表达</h2></div><span>我们的产品能做什么</span></div>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>商家卖点</th><th>内容里的表达</th><th>RoboClaw 能做什么</th></tr></thead><tbody>{ADVERTISER_ROWS.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><p>相关原帖</p><h2>{brand === "全部品牌" ? "商家怎么讲服务" : `${brand}怎么讲服务`}</h2></div><span>对应分析</span></div>
        <PostList posts={posts} brand={brand} tone="advertiser" />
      </article>
    </section>
    <section className={`${styles.bottomConclusion} ${styles.orangeConclusion}`}>
      <p>综合本次社媒数据分析，对酒店客户而言，产品价值不在于“更智能”，而在于能否改善四项可量化指标：</p>
      <ol><li>夜间请求响应时长。</li><li>任务按时完成率。</li><li>超时自动升级率。</li><li>安全异常闭环率。</li></ol>
      <small className={extra.summaryTail}>核心承诺重点是夜间服务不再依赖人手的调用，而是由一套可执行、可追踪、可升级的机制持续保障。</small>
    </section>
  </>;
}
