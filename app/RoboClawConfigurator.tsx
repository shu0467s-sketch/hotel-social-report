"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";

type Page = "工作台" | "方案配置" | "上线运营" | "帮助支持" | "数据分析";
type Industry = "酒店" | "商场" | "展厅" | "迎宾";
type Status = "配置中" | "待发布" | "运行中" | "已暂停" | "异常";
type UploadState = "待上传" | "解析中" | "已完成" | "需修改";
type PlaceType = "入口" | "服务点" | "关键地点";

type Place = { id: number; name: string; type: PlaceType; x: number; y: number };
type Message = { role: "用户" | "机器人"; text: string; source?: string };

type ServiceState = {
  name: string;
  industry: Industry;
  scene: string;
  status: Status;
  step: number;
  abilities: string[];
  uploads: Record<string, UploadState>;
  systems: Record<string, boolean>;
  places: Place[];
  voice: string;
  volume: number;
  speed: number;
  welcome: string;
  robot: string;
  published: boolean;
  version: number;
  lastModified: string;
};

const STORAGE_KEY = "roboclaw-client-demo-260728";

const steps = ["选择行业", "选择业务场景", "能力配置", "上传业务资料", "空间配置", "语音配置", "测试发布"];

type ScenarioConfig = {
  summary: string;
  scenes: string[];
  defaultScene: string;
  abilities: string[];
  prepare: string[];
  systems: string[];
  voice: string;
  welcome: string;
  questions: string[];
};

const industryData: Record<Industry, ScenarioConfig> = {
  酒店: {
    summary: "适用于酒店大堂、客房、餐厅等空间的迎宾接待、住客咨询、入住退房说明和地点指引。",
    scenes: ["前台接待", "设施咨询", "客房引导", "夜间值守"],
    defaultScene: "前台接待",
    abilities: ["主动欢迎", "回答问题", "多轮交流", "酒店介绍", "信息查询", "地点指引"],
    prepare: ["酒店介绍", "房型信息", "设施信息", "常见问题"],
    systems: ["酒店管理系统", "会员系统", "工单系统"],
    voice: "亲切稳重女声",
    welcome: "您好，欢迎来到悦澜酒店。我可以为您介绍酒店设施、回答入住问题，也可以指引您前往目标地点。",
    questions: ["早餐在哪里？", "退房时间是多少？", "健身房开放吗？", "餐厅怎么走？"],
  },
  商场: {
    summary: "适用于商场、门店和零售空间的商品讲解、活动咨询、商品推荐和导航带路。",
    scenes: ["商品导购", "活动讲解", "区域带路", "售后咨询"],
    defaultScene: "商品导购",
    abilities: ["主动欢迎", "回答问题", "多轮交流", "商品介绍", "商品推荐", "带路服务"],
    prepare: ["商品资料", "商品价格", "商品卖点", "库存信息"],
    systems: ["商品管理系统", "库存系统", "客户管理系统"],
    voice: "热情活力女声",
    welcome: "您好，欢迎光临。我可以为您介绍商品、推荐合适选择，并带您前往对应区域。",
    questions: ["这个商品多少钱？", "有没有类似产品？", "今天有什么活动？", "带我去新品区。"],
  },
  展厅: {
    summary: "适用于企业展厅、科技馆和展会现场的展品讲解、路线导览、参观接待和常见问题解答。",
    scenes: ["展品讲解", "路线导览", "参观接待", "会议引导"],
    defaultScene: "展品讲解",
    abilities: ["主动欢迎", "回答问题", "多轮交流", "商品介绍", "地点指引", "带路服务"],
    prepare: ["展品资料", "讲解话术", "参观路线", "常见问题"],
    systems: ["展厅内容系统", "预约系统", "访客系统"],
    voice: "清晰明快男声",
    welcome: "您好，欢迎参观。我可以为您介绍重点展项，也可以带您前往指定展区。",
    questions: ["这个展品讲的是什么？", "下一站去哪里？", "参观需要多久？", "带我去核心展区。"],
  },
  迎宾: {
    summary: "适用于楼宇大堂、园区前台和活动入口的访客接待、信息咨询、登记提醒和路线指引。",
    scenes: ["访客接待", "信息咨询", "身份确认", "会议引导"],
    defaultScene: "访客接待",
    abilities: ["主动欢迎", "回答问题", "多轮交流", "信息查询", "地点指引", "带路服务"],
    prepare: ["访客须知", "楼层信息", "会议室信息", "常见问题"],
    systems: ["访客系统", "会议系统", "门禁系统"],
    voice: "温和礼貌男声",
    welcome: "您好，欢迎到访。我可以协助您了解访客流程，并指引您前往目标地点。",
    questions: ["我找的公司在哪层？", "会议室怎么走？", "访客登记在哪里？", "带我去电梯口。"],
  },
};

const allAbilities = [
  { name: "主动欢迎", group: "交流服务", text: "识别客人靠近后主动问候，并引导对话开始。" },
  { name: "回答问题", group: "交流服务", text: "根据已导入资料回答营业时间、价格、位置和规则。" },
  { name: "多轮交流", group: "交流服务", text: "在连续追问中保留上下文，减少重复确认。" },
  { name: "酒店介绍", group: "业务服务", text: "介绍酒店品牌、房型、设施和前台服务流程。" },
  { name: "商品介绍", group: "业务服务", text: "介绍商品或展品的卖点、价格、活动和适用人群。" },
  { name: "信息查询", group: "业务服务", text: "连接已有系统后查询会员、房态、库存或活动信息。" },
  { name: "商品推荐", group: "业务服务", text: "根据用户需求推荐商品、展品或活动路线。" },
  { name: "地点指引", group: "行动服务", text: "告诉用户目标地点的位置和前往方式。" },
  { name: "带路服务", group: "行动服务", text: "机器人带领用户前往餐厅、展区、货架或服务点。" },
  { name: "自动充电", group: "行动服务", text: "电量不足时返回充电点，减少人工值守压力。" },
];

const defaultPlaces: Place[] = [
  { id: 1, name: "大堂入口", type: "入口", x: 22, y: 36 },
  { id: 2, name: "服务台", type: "服务点", x: 48, y: 30 },
  { id: 3, name: "餐厅", type: "关键地点", x: 78, y: 68 },
];

const defaultService: ServiceState = {
  name: "悦澜酒店前台接待",
  industry: "酒店",
  scene: "前台接待",
  status: "配置中",
  step: 0,
  abilities: industryData["酒店"].abilities,
  uploads: { 酒店介绍: "已完成", 房型信息: "已完成", 设施信息: "待上传", 常见问题: "待上传" },
  systems: { 酒店管理系统: true, 会员系统: false, 工单系统: false },
  places: defaultPlaces,
  voice: "亲切稳重女声",
  volume: 64,
  speed: 50,
  welcome: industryData["酒店"].welcome,
  robot: "一号大堂机器人",
  published: false,
  version: 1,
  lastModified: "今天 10:24",
};

export function RoboClawConfigurator() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [guest, setGuest] = useState(false);
  const [page, setPage] = useState<Page>("工作台");
  const [service, setService] = useState<ServiceState>(defaultService);
  const [messages, setMessages] = useState<Message[]>([
    { role: "用户", text: "早餐在哪里？" },
    { role: "机器人", text: "早餐厅位于二楼，营业时间是早上七点到十点。我可以为您指引路线。", source: "来源：酒店设施信息" },
  ]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { service?: ServiceState };
      if (parsed.service) {
        setService(normalizeService(parsed.service));
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ service, loggedIn, guest }));
  }, [service, loggedIn, guest]);

  useEffect(() => {
    const question = getScenario(service).questions[0];
    setMessages([{ role: "用户", text: question }, robotReply(question, service)]);
  }, [service.industry, service.scene]);

  const checks = useMemo(() => getChecks(service), [service]);
  const rate = Math.round((checks.filter((item) => item.state === "完成").length / checks.length) * 100);

  const updateService = (patch: Partial<ServiceState>) =>
    setService((current) => ({ ...current, ...patch, lastModified: "刚刚" }));

  const enter = (isGuest = false) => {
    setGuest(isGuest);
    setLoggedIn(true);
    setPage("工作台");
  };

  const logout = () => {
    setLoggedIn(false);
    setGuest(false);
    setPage("工作台");
  };

  if (!loggedIn) {
    return <LoginPage onLogin={() => enter(false)} onGuest={() => enter(true)} />;
  }

  return (
    <main className="app-shell">
      <Sidebar page={page} setPage={setPage} create={() => { updateService({ step: 0 }); setPage("方案配置"); }} guest={guest} onLogout={logout} />
      <section className="content-shell">
        <Topbar page={page} service={service} guest={guest} />
        <div className="page-scroll">
          {page === "工作台" && <Dashboard service={service} rate={rate} setPage={setPage} />}
          {page === "方案配置" && (
            <CreateService
              service={service}
              updateService={updateService}
              checks={checks}
              messages={messages}
              setMessages={setMessages}
              setPage={setPage}
              guest={guest}
            />
          )}
          {page === "上线运营" && <OperationPage service={service} setPage={setPage} updateService={updateService} />}
          {page === "数据分析" && <DataBoard service={service} />}
          {page === "帮助支持" && <HelpPage setPage={setPage} />}
        </div>
      </section>
    </main>
  );
}

function LoginPage({ onLogin, onGuest }: { onLogin: () => void; onGuest: () => void }) {
  const [mode, setMode] = useState<"账号登录" | "验证码登录">("账号登录");
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">R</div>
        <h1>新建和管理机器人服务</h1>
        <p>面向酒店、商场和展厅运营人员，把业务场景、业务资料、空间点位和上线运营放进一条清晰流程。</p>
        <div className="flow-strip">
          {steps.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>
      <section className="login-card">
        <p className="eyebrow">企业空间</p>
        <h2>登录 RoboClaw</h2>
        <label className="field">
          <span>企业域名</span>
          <input defaultValue="hotel-demo.roboclaw.cn" />
        </label>
        <div className="segmented">
          {(["账号登录", "验证码登录"] as const).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        {mode === "账号登录" ? (
          <>
            <label className="field"><span>企业账号</span><input defaultValue="运营主管" /></label>
            <label className="field"><span>登录密码</span><input type="password" defaultValue="123456" /></label>
          </>
        ) : (
          <>
            <label className="field"><span>手机号</span><input defaultValue="138 0000 0000" /></label>
            <label className="field with-action"><span>验证码</span><input defaultValue="260728" /><button>获取验证码</button></label>
          </>
        )}
        <button className="primary-button wide" onClick={onLogin}>进入后台</button>
        <button className="secondary-button wide" onClick={onGuest}>游客体验</button>
        <div className="login-help">忘记密码 · 联系管理员 · 查看企业域名示例</div>
      </section>
    </main>
  );
}

function Sidebar({ page, setPage, create, guest, onLogout }: { page: Page; setPage: (p: Page) => void; create: () => void; guest: boolean; onLogout: () => void }) {
  const nav: Page[] = ["工作台", "方案配置", "上线运营", "帮助支持"];
  const [open, setOpen] = useState(false);
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-icon">R</div><div><strong>RoboClaw</strong><span>机器人服务后台</span></div></div>
      <nav>
        {nav.map((item) => (
          <button key={item} className={page === item ? "nav-active" : ""} onClick={() => item === "方案配置" ? create() : setPage(item)}>
            <span>{item}</span><b>›</b>
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="status-dot online" />
        {guest ? "游客体验中" : "企业账号已登录"}
      </div>
      <div className="sidebar-account">
        {open && (
          <div className="account-popover">
            <strong>{guest ? "游客体验账号" : "运营主管"}</strong>
            <span>{guest ? "体验空间" : "悦澜酒店企业空间"}</span>
            <span>{guest ? "仅可预览和测试" : "可创建、发布和查看运营数据"}</span>
            <button onClick={onLogout}>退出登录</button>
          </div>
        )}
        <button className="account-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
          <span className="avatar">{guest ? "游" : "运"}</span>
          <span className="account-text"><strong>{guest ? "游客" : "运营主管"}</strong><small>{guest ? "体验模式" : "企业账号"}</small></span>
          <b>⌄</b>
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page, service, guest }: { page: Page; service: ServiceState; guest: boolean }) {
  return (
    <header className="topbar">
      <div>
        <p>RoboClaw 机器人服务管理平台</p>
        <h1>{page}</h1>
      </div>
      <div className="topbar-right">
        <span className={service.status === "异常" ? "state-badge danger" : "state-badge"}>{service.status}</span>
        <span>{guest ? "游客" : "运营主管"}</span>
      </div>
    </header>
  );
}

function Dashboard({ service, rate, setPage }: { service: ServiceState; rate: number; setPage: (p: Page) => void }) {
  const services = [
    service,
    { ...service, name: "星环展厅展品讲解", industry: "展厅" as Industry, scene: "展品讲解", status: "运行中" as Status, published: true, lastModified: "昨天 16:18", version: 3 },
    { ...service, name: "一层商场商品导购", industry: "商场" as Industry, scene: "商品导购", status: "异常" as Status, lastModified: "周一 09:30", version: 2 },
  ];
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">统一配置流程</p>
          <h2>从“新建服务方案”开始，按统一流程完成机器人上线准备。</h2>
        </div>
        <button className="primary-button hero-action" onClick={() => setPage("方案配置")}>新建服务方案</button>
      </section>
      <FlowBanner />
      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">我的机器人服务</p><h3>服务列表</h3></div></div>
        <div className="service-grid">
          <button className="add-card prominent" onClick={() => setPage("方案配置")}><strong>新建服务方案</strong><span>从选择行业开始，预览完整流程并快速创建第一套机器人服务方案。</span></button>
          {services.map((item, index) => <ServiceCard key={`${item.name}-${index}`} service={item} rate={index === 0 ? rate : index === 1 ? 100 : 78} setPage={setPage} />)}
        </div>
      </section>
      <section className="metric-grid">
        <Metric title="运行中服务" value="2 个" />
        <Metric title="今日服务次数" value={service.published ? "128 次" : "36 次"} />
        <Metric title="异常提醒" value="1 条" tone="warn" />
        <Metric title="最近修改" value={service.lastModified} />
      </section>
    </div>
  );
}

function ServiceCard({ service, rate, setPage }: { service: ServiceState; rate: number; setPage: (p: Page) => void }) {
  return (
    <article className="service-card">
      <div className="card-top"><span className={`state-badge ${service.status === "异常" ? "danger" : service.status === "待发布" ? "warn" : ""}`}>{service.status}</span><span>{service.industry} · {service.scene}</span></div>
      <h4>{service.name}</h4>
      <div className="progress"><span style={{ width: `${rate}%` }} /></div>
      <p>配置进度 {rate}% · 最近修改 {service.lastModified}</p>
      <div className="card-actions"><button onClick={() => setPage("方案配置")}>继续配置</button><button onClick={() => setPage("上线运营")}>查看运行</button></div>
    </article>
  );
}

function CreateService({ service, updateService, checks, messages, setMessages, setPage, guest }: {
  service: ServiceState;
  updateService: (p: Partial<ServiceState>) => void;
  checks: ReturnType<typeof getChecks>;
  messages: Message[];
  setMessages: (m: Message[]) => void;
  setPage: (p: Page) => void;
  guest: boolean;
}) {
  const step = service.step;
  const setStep = (next: number) => updateService({ step: Math.max(0, Math.min(steps.length - 1, next)) });
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="config-head">
          <div>
            <p className="eyebrow">方案配置</p>
            <input className="title-input" value={service.name} onChange={(e) => updateService({ name: e.target.value })} />
          </div>
          <div className="config-selects">
            <select className="select-input" value={service.industry} onChange={(e) => applyIndustry(e.target.value as Industry, updateService)}>
              {(Object.keys(industryData) as Industry[]).map((industry) => <option key={industry}>{industry}</option>)}
            </select>
            <select className="select-input" value={service.scene} onChange={(e) => applyBusinessScene(e.target.value, updateService, service)}>
              {getScenario(service).scenes.map((scene) => <option key={scene}>{scene}</option>)}
            </select>
          </div>
        </div>
        <Stepper step={step} setStep={setStep} />
      </section>
      <section className="panel min-panel">
        {step === 0 && <IndustryStep service={service} updateService={updateService} />}
        {step === 1 && <BusinessSceneStep service={service} updateService={updateService} />}
        {step === 2 && <AbilityStep service={service} updateService={updateService} />}
        {step === 3 && <ContentStep service={service} updateService={updateService} />}
        {step === 4 && <SpaceStep service={service} updateService={updateService} />}
        {step === 5 && <RobotStep service={service} updateService={updateService} />}
        {step === 6 && <TestPublishStep service={service} checks={checks} updateService={updateService} setPage={setPage} guest={guest} messages={messages} setMessages={setMessages} />}
      </section>
      <div className="bottom-actions">
        <span>系统已预填推荐配置，可随时保存草稿并返回补充。</span>
        <div><button className="secondary-button" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button><button className="primary-button" onClick={() => step === 6 ? publish(updateService, setPage, guest, service.version) : setStep(step + 1)}>{step === 6 ? "完成并发布" : "下一步"}</button></div>
      </div>
    </div>
  );
}

function Stepper({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  return (
    <div className="stepper">
      {steps.map((item, index) => <button key={item} className={step === index ? "active" : ""} onClick={() => setStep(index)}><span>{index + 1}</span>{item}</button>)}
    </div>
  );
}

function IndustryStep({ service, updateService }: StepProps) {
  return (
    <>
      <StepTitle title="选择行业" text="先选择机器人将服务的行业，系统会自动带出该行业下常见业务场景和推荐配置。" />
      <div className="two-grid">
        {(Object.keys(industryData) as Industry[]).map((industry) => (
          <button key={industry} className={`choice-card ${service.industry === industry ? "selected" : ""}`} onClick={() => applyIndustry(industry, updateService)}>
            <span className="tag">{service.industry === industry ? "已选" : "未选"}</span>
            <h3>{industry}</h3><p>{industryData[industry].summary}</p>
            <InfoBlock title="常见业务场景" items={industryData[industry].scenes.slice(0, 4)} />
            <InfoBlock title="推荐能力" items={industryData[industry].abilities.slice(0, 5)} />
          </button>
        ))}
      </div>
    </>
  );
}

type StepProps = { service: ServiceState; updateService: (p: Partial<ServiceState>) => void };

function BusinessSceneStep({ service, updateService }: StepProps) {
  const data = getScenario(service);
  return (
    <>
      <StepTitle title="选择业务场景" text="在所选行业下选择机器人要承担的具体服务任务。不同业务场景会使用不同能力组合、资料清单和测试问题。" />
      <div className="toolbar"><label>筛选业务场景<select value={service.industry} onChange={(e) => applyIndustry(e.target.value as Industry, updateService)}>{(Object.keys(industryData) as Industry[]).map((industry) => <option key={industry}>{industry}</option>)}</select></label></div>
      <div className="two-grid">
        {data.scenes.map((scene) => (
          <button key={scene} className={`choice-card ${service.scene === scene ? "selected" : ""}`} onClick={() => applyBusinessScene(scene, updateService, service)}>
            <span className="tag">{service.scene === scene ? "已选" : "未选"}</span>
            <h3>{scene}</h3><p>{sceneDescription(service.industry, scene)}</p>
            <InfoBlock title="默认能力" items={getSceneAbilities(service.industry, scene)} />
            <InfoBlock title="需要准备资料" items={data.prepare} />
          </button>
        ))}
        <button className="support-card"><strong>没有你想要的场景？</strong><span>联系技术支持，为你的业务评估专属方案。</span></button>
      </div>
    </>
  );
}

function AbilityStep({ service, updateService }: StepProps) {
  const toggle = (name: string) => updateService({ abilities: service.abilities.includes(name) ? service.abilities.filter((i) => i !== name) : [...service.abilities, name] });
  return (
    <>
      <StepTitle title="能力配置" text="这里按“机器人可以提供什么服务”组织，不展示技术参数。推荐能力已默认开启。" />
      <div className="ability-grid">
        {allAbilities.map((item) => {
          const on = service.abilities.includes(item.name);
          return <button key={item.name} className={`ability-card ${on ? "selected" : ""}`} onClick={() => toggle(item.name)}><span className={`switch ${on ? "on" : ""}`} aria-hidden="true" /><small>{item.group}</small><h3>{item.name}</h3><p>{item.text}</p><b>{item.name.includes("商品") || item.name.includes("带路") ? "导览导购推荐" : "推荐"}</b></button>;
        })}
      </div>
    </>
  );
}

function ContentStep({ service, updateService }: StepProps) {
  const current = getScenario(service);
  const list = current.prepare;
  const systems = current.systems;
  const [sampleTip, setSampleTip] = useState("资料样表后续可内置为文档或表格格式。");
  const changeUpload = (name: string) => {
    const current = service.uploads[name] || "待上传";
    const next: UploadState = current === "待上传" ? "解析中" : current === "解析中" ? "已完成" : current === "已完成" ? "需修改" : "已完成";
    updateService({ uploads: { ...service.uploads, [name]: next } });
  };
  return (
    <>
      <StepTitle title="上传业务资料" text="可上传资料，也可连接已有系统。上传后展示解析状态、结果和修改建议。" />
      <div className="split-grid">
        <div className="sub-panel"><div className="section-head"><h3>上传资料</h3><button className="secondary-button" onClick={() => setSampleTip("资料样表暂未内置，后续可提供文档或表格下载。")}>下载资料样表</button></div>
          <p className="muted">{sampleTip}</p>
          <div className="upload-grid">{list.map((item) => <button key={item} className={`upload-card ${service.uploads[item] === "已完成" ? "selected" : ""}`} onClick={() => changeUpload(item)}><span className="tag">{service.uploads[item] || "待上传"}</span><h4>{item}</h4><p>{uploadAdvice(service.uploads[item] || "待上传")}</p></button>)}</div>
        </div>
        <div className="sub-panel"><h3>连接已有系统</h3><p className="muted">连接后可读取实时业务信息，也可以先用资料完成演示。</p>
          <div className="list-stack">{systems.map((item) => <button key={item} className={`system-row ${service.systems[item] ? "selected" : ""}`} onClick={() => updateService({ systems: { ...service.systems, [item]: !service.systems[item] } })}><span><strong>{item}</strong><small>{service.systems[item] ? "连接正常" : "点击模拟连接"}</small></span><span className={`switch ${service.systems[item] ? "on" : ""}`} aria-hidden="true" /></button>)}</div>
        </div>
      </div>
    </>
  );
}

function SpaceStep({ service, updateService }: StepProps) {
  const addPlace = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = Math.max(...service.places.map((p) => p.id), 0) + 1;
    updateService({ places: [...service.places, { id, name: `新地点${id}`, type: "关键地点", x: Math.round(((event.clientX - rect.left) / rect.width) * 100), y: Math.round(((event.clientY - rect.top) / rect.height) * 100) }] });
  };
  return (
    <>
      <StepTitle title="空间配置" text="地图与点位仍属于统一配置流程。点击地图添加地点，右侧可修改、删除并测试路线。" />
      <div className="split-grid">
        <button className="mock-map" onClick={addPlace}>
          <div className="room a" /><div className="room b" /><div className="room c" /><div className="route" />
          {service.places.map((p) => <span key={p.id} className={`pin ${p.type}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.name}</span>)}
        </button>
        <div className="sub-panel"><h3>地点设置</h3><div className="list-stack">{service.places.map((p) => <div className="place-row" key={p.id}><input value={p.name} onChange={(e) => updateService({ places: service.places.map((i) => i.id === p.id ? { ...i, name: e.target.value } : i) })} /><select value={p.type} onChange={(e) => updateService({ places: service.places.map((i) => i.id === p.id ? { ...i, type: e.target.value as PlaceType } : i) })}><option>入口</option><option>服务点</option><option>关键地点</option></select><button onClick={() => updateService({ places: service.places.filter((i) => i.id !== p.id) })}>删除</button></div>)}</div><div className="route-result">导航测试：路线可达，预计四十二秒到达。</div></div>
      </div>
    </>
  );
}

function RobotStep({ service, updateService }: StepProps) {
  const [sample, setSample] = useState("尚未试听");
  const voices = service.industry === "酒店" ? ["亲切稳重女声", "温和礼貌男声", "夜间柔和女声"] : ["热情活力女声", "清晰明快男声", "年轻自然女声"];
  return (
    <>
      <StepTitle title="语音配置" text="选择声音、音量、语速和欢迎语，并通过试听确认是否符合现场服务气质。" />
      <div className="split-grid">
        <div className="sub-panel"><h3>声音选择</h3><p className="muted">推荐：{service.industry === "酒店" ? "亲切、稳重" : "热情、有活力"}</p><div className="voice-grid">{voices.map((v) => <button key={v} className={`voice-card ${service.voice === v ? "selected" : ""}`} onClick={() => updateService({ voice: v })}><span className="voice-dot">声</span><strong>{v}</strong><small>{service.voice === v ? "当前声音" : "点击选择"}</small></button>)}</div></div>
        <div className="sub-panel"><h3>欢迎语和声音参数</h3><Range label="音量" value={service.volume} onChange={(v) => updateService({ volume: v })} /><Range label="语速" value={service.speed} onChange={(v) => updateService({ speed: v })} /><label className="field"><span>欢迎语</span><textarea value={service.welcome} onChange={(e) => updateService({ welcome: e.target.value })} /></label><button className="primary-button" onClick={() => setSample(`试听中：${service.voice}，音量 ${service.volume}，语速 ${service.speed}`)}>试听</button><span className="sample-text">{sample}</span></div>
      </div>
    </>
  );
}

function TestPublishStep({ service, checks, updateService, setPage, guest, messages, setMessages }: {
  service: ServiceState;
  checks: ReturnType<typeof getChecks>;
  updateService: (p: Partial<ServiceState>) => void;
  setPage: (p: Page) => void;
  guest: boolean;
  messages: Message[];
  setMessages: (m: Message[]) => void;
}) {
  const ready = checks.every((c) => c.state === "完成");
  const current = getScenario(service);
  const [input, setInput] = useState(current.questions[0]);
  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages([...messages, { role: "用户", text }, robotReply(text, service)]);
    setInput("");
  };
  return (
    <>
      <StepTitle title="测试发布" text="先用真实问题测试机器人回答、来源和导航任务，再完成上线前检查并发布。" />
      <div className="split-grid">
        <div className="chat-panel">
          <div className="question-row">{current.questions.map((q) => <button key={q} onClick={() => setInput(q)}>{q}</button>)}</div>
          <div className="chat-stream">{messages.map((m, i) => <div key={i} className={`bubble ${m.role === "用户" ? "user" : "robot"}`}><b>{m.role}</b><p>{m.text}</p>{m.source && <small>{m.source}</small>}</div>)}</div>
          <form className="chat-input" onSubmit={send}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入测试问题" /><button className="primary-button">发送</button></form>
          <div className="route-preview"><span>入口</span><span>服务点</span><span>{service.industry === "酒店" ? "餐厅" : "目标区域"}</span></div>
        </div>
        <div className="sub-panel">
          <h3>上线前检查</h3>
          <div className="list-stack">{checks.map((c) => <div key={c.name} className="check-row"><span className={c.state === "完成" ? "ok" : c.state === "错误" ? "bad" : "warn"}>{c.state}</span><strong>{c.name}</strong><small>{c.tip}</small></div>)}</div>
          <div className="publish-box">
            <h3>发布上线</h3>
            <p className="muted">{service.name} 将绑定到 {service.robot}。发布后进入上线运营页面查看运行概览、数据分析入口和版本管理。</p>
            <label className="field"><span>选择机器人</span><select value={service.robot} onChange={(e) => updateService({ robot: e.target.value })}><option>一号大堂机器人</option><option>二号导览机器人</option><option>三号展厅机器人</option></select></label>
            <div className="button-row"><button className="secondary-button" onClick={() => updateService({ status: "配置中" })}>保存草稿</button><button className="primary-button" disabled={!ready || guest} onClick={() => publish(updateService, setPage, guest, service.version)}>发布上线</button></div>
            {guest && <p className="hint">游客体验不能发布到真实机器人。</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function OperationPage({ service, setPage, updateService }: { service: ServiceState; setPage: (p: Page) => void; updateService: (p: Partial<ServiceState>) => void }) {
  const versions = [
    { number: service.version, label: "当前版本", text: "修改记录：业务资料、语音配置、发布上线。" },
    { number: Math.max(service.version - 1, 1), label: "历史发布版本", text: "版本差异：调整能力配置、上传业务资料和空间配置。" },
    { number: 0, label: "初始版本", text: "版本差异：保留初始业务场景、基础能力和默认语音配置。" },
  ];
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">机器人运行概览</p><h2>{service.name}</h2></div><span className="state-badge">{service.published ? "运行中" : "待发布"}</span></div>
        <div className="metric-grid operation-metrics">
          <Metric title="当前机器人状态" value={service.published ? "在线" : "未上线"} />
          <Metric title="服务次数" value={service.published ? "3,286" : "36"} />
          <Metric title="接待人数" value={service.published ? "1,942" : "18"} />
          <Metric title="对话次数" value={service.published ? "8,764" : "96"} />
          <Metric title="服务完成率" value="91%" />
          <Metric title="导航成功率" value="88%" />
          <Metric title="用户满意度" value="4.7 分" />
          <Metric title="异常次数" value="1" tone="warn" />
        </div>
      </section>
      <section className="split-grid">
        <div className="panel">
          <div className="section-head"><div><p className="eyebrow">服务运行情况</p><h3>近七日趋势</h3></div><span className="state-badge warn">有 1 条提醒</span></div>
          <div className="bar-chart compact">{[42, 58, 64, 73, 69, 82, 88].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
          <div className="alert-list">
            <div><strong>状态提醒</strong><span>昨日晚间有一次导航取消，建议检查“新品区”点位是否清晰。</span></div>
            <div><strong>运行记录</strong><span>十分钟前完成一次咨询服务，机器人在线，回答来源命中正常。</span></div>
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">数据分析入口</p>
          <h3>进入数据分析中心</h3>
          <p className="muted">查看更多业务数据分析能力。当前先保留入口和占位页面，深度筛选、导出和自助分析后续单独开发。</p>
          <button className="primary-button" onClick={() => setPage("数据分析")}>进入数据分析中心</button>
        </div>
      </section>
      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">版本管理</p><h3>当前运行版本与历史发布版本</h3></div><span className="state-badge">第 {service.version} 版</span></div>
        <p className="muted">真实业务环境中的每次配置修改都需要可追踪、可对比、可恢复。</p>
        <div className="version-list">{versions.map((v, i) => <div key={`${v.label}-${i}`} className="version-row"><span className="state-badge">{v.label}</span><strong>第 {v.number} 版</strong><p>{v.text}</p><button className="secondary-button" onClick={() => i > 0 ? updateService({ version: v.number, status: "运行中" }) : undefined}>{i === 0 ? "查看差异" : "恢复此版本"}</button></div>)}</div>
      </section>
    </div>
  );
}

function DataBoard({ service }: { service: ServiceState }) {
  return (
    <div className="page-stack">
      <section className="empty-state">
        <span>数</span>
        <h2>数据分析中心</h2>
        <p>进入数据分析中心，查看更多业务数据分析能力。当前仅展示入口占位，深度分析能力将在后续版本开发。</p>
        <div className="empty-list">
          <strong>后续能力方向</strong>
          <small>集团与门店对比</small>
          <small>高频问题分析</small>
          <small>服务质量趋势</small>
          <small>版本效果对比</small>
        </div>
      </section>
    </div>
  );
}

function HelpPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">帮助支持</p>
        <h2>遇到问题时从这里继续</h2>
        <p className="muted">面向非技术运营人员，提供流程示例、资料样表、常见问题和技术支持入口。</p>
      </section>
      <section className="three-grid">
        <div className="panel"><h3>流程示例</h3><p className="muted">查看酒店、商场、展厅和迎宾行业的推荐配置方式。</p><button className="secondary-button" onClick={() => setPage("方案配置")}>查看示例</button></div>
        <div className="panel"><h3>资料样表</h3><p className="muted">按照业务场景准备酒店资料、商品资料、常见问题和点位信息。</p><button className="secondary-button">查看样表</button></div>
        <div className="panel"><h3>联系支持</h3><p className="muted">找不到合适业务场景、资料解析失败或发布受阻时，可以联系技术支持。</p><button className="primary-button">联系技术支持</button></div>
      </section>
    </div>
  );
}

function FlowBanner() {
  return <section className="flow-banner">{steps.map((item, index) => <span key={item}><b>{index + 1}</b>{item}</span>)}</section>;
}

function Metric({ title, value, tone = "blue" }: { title: string; value: string; tone?: "blue" | "warn" }) {
  return <div className={`metric ${tone}`}><span>{title}</span><strong>{value}</strong></div>;
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return <div className="info-block"><strong>{title}</strong>{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

function StepTitle({ title, text }: { title: string; text: string }) {
  return <div className="step-title"><h2>{title}</h2><p>{text}</p></div>;
}

function Range({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <label className="range-row"><span>{label} {value}</span><input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function getScenario(service: ServiceState) {
  return industryData[service.industry] || industryData["酒店"];
}

function getSceneAbilities(industry: Industry, scene: string) {
  const data = industryData[industry];
  if (industry === "酒店" && scene === "夜间值守") return ["主动欢迎", "回答问题", "信息查询", "地点指引", "自动充电"];
  if (industry === "商场" && scene.includes("带路")) return ["主动欢迎", "回答问题", "地点指引", "带路服务", "商品推荐"];
  if (industry === "展厅" && scene.includes("导览")) return ["主动欢迎", "回答问题", "商品介绍", "地点指引", "带路服务"];
  if (industry === "迎宾" && scene.includes("身份")) return ["主动欢迎", "回答问题", "信息查询", "地点指引"];
  return data.abilities.slice(0, 5);
}

function sceneDescription(industry: Industry, scene: string) {
  const descriptions: Record<string, string> = {
    前台接待: "适合酒店大堂白天接待，覆盖欢迎、咨询、入住退房说明和设施介绍。",
    设施咨询: "适合高频设施问询，重点回答餐厅、健身房、停车场和营业时间。",
    客房引导: "适合住客到店后的楼层、电梯、客房区域和公共设施指引。",
    夜间值守: "适合夜间低人力时段，保留咨询、紧急联系、地点指引和充电保障。",
    商品导购: "适合门店或商场的商品介绍、价格咨询、卖点讲解和推荐。",
    活动讲解: "适合节假日促销、会员活动和现场活动规则介绍。",
    区域带路: "适合带领用户前往楼层、品牌店、服务台或指定区域。",
    售后咨询: "适合回答退换货、保修、会员权益和服务流程。",
    展品讲解: "适合企业展厅或展会展品介绍，突出讲解话术和亮点说明。",
    路线导览: "适合按参观路线带领用户从入口到重点展区。",
    参观接待: "适合访客到达后的欢迎、介绍、引导和常见问题。",
    会议引导: "适合引导访客前往会议室、活动区或接待点。",
    访客接待: "适合楼宇、园区、活动入口的访客欢迎和流程提醒。",
    信息咨询: "适合回答楼层、时间、规则和服务点位置。",
    身份确认: "适合需要登记提醒或访客系统联动的接待流程。",
  };
  return descriptions[scene] || `${industry}行业下的常用服务任务，系统会提供推荐配置。`;
}

function normalizeService(saved: Partial<ServiceState>): ServiceState {
  const legacyScene = saved.scene || "";
  const industry = saved.industry || (legacyScene === "导览导购" ? "商场" : legacyScene === "展品讲解" ? "展厅" : "酒店");
  const data = industryData[industry];
  const scene = legacyScene === "酒店前台接待" ? "前台接待" : legacyScene === "导览导购" ? "商品导购" : data.scenes.includes(legacyScene) ? legacyScene : data.defaultScene;
  return { ...defaultService, ...saved, industry, scene };
}

function applyIndustry(industry: Industry, updateService: (p: Partial<ServiceState>) => void) {
  const data = industryData[industry];
  updateService({
    industry,
    scene: data.defaultScene,
    name: `${industry}机器人${data.defaultScene}`,
    abilities: data.abilities,
    uploads: Object.fromEntries(data.prepare.map((item, index) => [item, index < 2 ? "已完成" : "待上传"])) as Record<string, UploadState>,
    systems: Object.fromEntries(data.systems.map((item, index) => [item, index === 0])) as Record<string, boolean>,
    voice: data.voice,
    welcome: data.welcome,
  });
}

function applyBusinessScene(scene: string, updateService: (p: Partial<ServiceState>) => void, service: ServiceState) {
  const data = getScenario(service);
  updateService({
    scene,
    name: `${service.industry}机器人${scene}`,
    abilities: getSceneAbilities(service.industry, scene),
    uploads: Object.fromEntries(data.prepare.map((item, index) => [item, index < 2 ? "已完成" : "待上传"])) as Record<string, UploadState>,
    systems: Object.fromEntries(data.systems.map((item, index) => [item, index === 0])) as Record<string, boolean>,
  });
}

function uploadAdvice(state: UploadState) {
  if (state === "解析中") return "正在识别文件内容，请稍后查看结果。";
  if (state === "已完成") return "解析成功，可用于机器人回答。";
  if (state === "需修改") return "建议补充时间、地点或价格等关键信息。";
  return "点击模拟上传文件。";
}

function robotReply(question: string, service: ServiceState): Message {
  if (service.industry === "商场" || service.industry === "展厅") {
    if (question.includes("钱") || question.includes("价格")) return { role: "机器人", text: "这款商品当前活动价为一千二百九十九元，我还可以为您对比类似产品。", source: "来源：商品价格" };
    if (question.includes("类似") || question.includes("推荐")) return { role: "机器人", text: "可以。根据您的需求，我推荐同系列两款产品，并可以带您到新品区查看。", source: "来源：商品卖点" };
    return { role: "机器人", text: "我可以为您介绍商品、展品、活动和路线，请告诉我想了解的内容。", source: "来源：业务资料" };
  }
  if (service.industry === "迎宾") {
    if (question.includes("会议") || question.includes("电梯")) return { role: "机器人", text: "会议区域可从右侧电梯到达，我可以为您指引前往路线。", source: "来源：楼层信息" };
    return { role: "机器人", text: "我可以协助您完成访客咨询，并指引您前往目标地点。", source: "来源：访客须知" };
  }
  if (question.includes("早餐")) return { role: "机器人", text: "早餐厅位于二楼，开放时间为早上七点到十点。我可以为您指引路线。", source: "来源：设施信息" };
  if (question.includes("退房")) return { role: "机器人", text: "标准退房时间为中午十二点，如需延迟退房可以联系前台确认。", source: "来源：常见问题" };
  return { role: "机器人", text: "我会结合酒店资料为您回答，也可以为您指引前往目标地点。", source: "来源：酒店介绍" };
}

function publish(updateService: (p: Partial<ServiceState>) => void, setPage: (p: Page) => void, guest: boolean, currentVersion: number) {
  if (guest) return;
  updateService({ published: true, status: "运行中", version: currentVersion + 1, step: 6 });
  setPage("上线运营");
}

function getChecks(service: ServiceState) {
  return [
    { name: "场景", state: service.scene ? "完成" : "错误", tip: service.scene },
    { name: "能力", state: service.abilities.length >= 4 ? "完成" : "待完善", tip: `开启 ${service.abilities.length} 项` },
    { name: "资料", state: Object.values(service.uploads).some((s) => s === "已完成") ? "完成" : "待完善", tip: "至少一项资料已完成" },
    { name: "地图", state: service.places.length >= 3 ? "完成" : "待完善", tip: `已设置 ${service.places.length} 个地点` },
    { name: "声音", state: service.voice && service.welcome ? "完成" : "待完善", tip: service.voice },
    { name: "测试", state: "完成", tip: "测试发布可正常使用" },
  ] as Array<{ name: string; state: "完成" | "待完善" | "错误"; tip: string }>;
}
