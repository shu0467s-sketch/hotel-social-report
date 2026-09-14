"use client";

import { useMemo, useRef, useState } from "react";

type Step = "rating" | "draw" | "result";
type Tier = "感谢礼" | "惊喜礼" | "特别礼";
type Reward = {
  id: string;
  tier: Tier;
  name: string;
  amount?: string;
  detail: string;
  receive: string;
  method: "微信账户" | "支付宝账户" | "我的礼遇卡包";
  valid: string;
};

const serviceInfo = {
  robot: "前台机器人 A01",
  scene: "酒店前台接待",
  content: "早餐时间咨询",
  version: "v1.3.2",
};

const rewards: Reward[] = [
  {
    id: "cash-1",
    tier: "感谢礼",
    name: "现金红包",
    amount: "2 元",
    detail: "小额即时感谢，完成评价后可选择领取账户。",
    receive: "领取至微信或支付宝账户，按页面提示完成授权后发放。",
    method: "微信账户",
    valid: "24 小时内有效",
  },
  {
    id: "points",
    tier: "感谢礼",
    name: "会员积分",
    amount: "80 积分",
    detail: "用于酒店会员成长或下次入住权益兑换。",
    receive: "自动存入酒店会员账户，可在前台或会员中心查看。",
    method: "我的礼遇卡包",
    valid: "30 天内有效",
  },
  {
    id: "stay-kit",
    tier: "惊喜礼",
    name: "入住礼包",
    detail: "可包含客房补给、欢迎小食或住中服务礼遇。",
    receive: "自动存入我的礼遇卡包，前台出示券码领取。",
    method: "我的礼遇卡包",
    valid: "入住期间有效",
  },
  {
    id: "dining",
    tier: "惊喜礼",
    name: "餐饮礼遇",
    detail: "可用于酒店餐厅、早餐折扣或指定餐饮优惠。",
    receive: "自动存入我的礼遇卡包，到店消费时出示核销。",
    method: "我的礼遇卡包",
    valid: "退房当日 12:00 前有效",
  },
  {
    id: "next-stay",
    tier: "特别礼",
    name: "下次入住礼遇",
    detail: "包含房型升级资格、延迟退房或下次入住优惠。",
    receive: "自动存入我的礼遇卡包，下次入住时向前台出示。",
    method: "我的礼遇卡包",
    valid: "60 天内有效",
  },
  {
    id: "parking",
    tier: "特别礼",
    name: "出行礼遇",
    detail: "可用于停车权益或酒店合作出行优惠。",
    receive: "自动存入我的礼遇卡包，离店前按规则核销使用。",
    method: "我的礼遇卡包",
    valid: "入住期间有效",
  },
];

const ratingTags = {
  high: ["回答准确", "速度很快", "表达清楚", "节省时间", "服务友好", "指引清楚"],
  mid: ["基本解决问题", "可以更详细", "希望更快", "说明更清楚"],
  low: ["没听懂问题", "回答不准确", "等待较久", "没解决问题", "需要人工帮助"],
};

function pickWeightedReward() {
  const roll = Math.random() * 100;
  const pool =
    roll < 65
      ? rewards.filter((item) => item.tier === "感谢礼")
      : roll < 90
        ? rewards.filter((item) => item.tier === "惊喜礼")
        : rewards.filter((item) => item.tier === "特别礼");
  return pool[Math.floor(Math.random() * pool.length)];
}

function rewardTitle(reward: Reward) {
  return reward.amount ? `${reward.amount}${reward.name}` : reward.name;
}

export default function FeedbackRewardsPage() {
  const phoneRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [reward, setReward] = useState<Reward | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [cashAccount, setCashAccount] = useState<"微信账户" | "支付宝账户">("微信账户");
  const [showRules, setShowRules] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const availableTags = useMemo(() => {
    if (rating >= 4) return ratingTags.high;
    if (rating === 3) return ratingTags.mid;
    return ratingTags.low;
  }, [rating]);

  const selectedReward = reward
    ? reward.method === "微信账户" || reward.method === "支付宝账户"
      ? { ...reward, method: cashAccount, receive: `领取至${cashAccount}，按页面提示完成授权后发放。` }
      : reward
    : null;

  const scrollToTop = () => {
    window.setTimeout(() => {
      phoneRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 40);
  };

  const submitRating = () => {
    if (!rating) return;
    setStep("draw");
    scrollToTop();
  };

  const draw = () => {
    if (spinning) return;
    const nextReward = pickWeightedReward();
    setReward(nextReward);
    setSpinning(true);
    setRotation((current) => current + 1440 + Math.floor(Math.random() * 360));
    window.setTimeout(() => {
      setSpinning(false);
      setStep("result");
      setShowResultModal(true);
      scrollToTop();
    }, 1600);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  return (
    <main className="feedback-app">
      <section className="feedback-phone" ref={phoneRef}>
        <header className="feedback-hero">
          <div className="phone-status">
            <span>15:39</span>
            <span>5G 89%</span>
          </div>
          <div className="hero-copy">
            <p>服务体验反馈</p>
            <h1>评价本次机器人服务</h1>
            <span>提交评价后参与入住礼遇抽取</span>
          </div>
          <div className="service-ticket">
            <div>
              <b>{serviceInfo.robot}</b>
              <span>{serviceInfo.scene} · {serviceInfo.content}</span>
            </div>
            <small>{serviceInfo.version}</small>
          </div>
        </header>

        {step === "rating" && (
          <section className="feedback-card rating-card">
            <p className="feedback-kicker">本次服务已完成</p>
            <h2>请评价本次机器人服务体验</h2>
            <div className="rating-stars" aria-label="评分">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={score <= rating ? "star active" : "star"}
                  onClick={() => {
                    setRating(score);
                    setSelectedTags([]);
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="rating-hint">
              {rating ? ["不满意", "不太满意", "一般", "比较满意", "非常满意"][rating - 1] : "选择评分后可提交评价"}
            </p>
            <div className="tag-grid">
              {availableTags.map((tag) => (
                <button key={tag} className={selectedTags.includes(tag) ? "tag active" : "tag"} onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <label className="feedback-textarea">
              <span>还有其他想补充的吗？可选填</span>
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="例如：早餐位置回答很清楚，希望下次能同时提醒营业时间。" />
            </label>
            <button className="feedback-primary" disabled={!rating} onClick={submitRating}>
              提交评价并参与抽奖
            </button>
          </section>
        )}

        {step !== "rating" && (
          <section className="feedback-card draw-card">
            <p className="feedback-kicker">评价已提交</p>
            <h2>感谢参与，请抽奖</h2>
            <div className="wheel-wrap">
              <div className="wheel-pointer" />
              <div className={spinning ? "reward-wheel spinning" : "reward-wheel"} style={{ transform: `rotate(${rotation}deg)` }}>
                {rewards.map((item, index) => (
                  <span
                    key={item.id}
                    className="wheel-token"
                    style={{ transform: `rotate(${index * 60 + 30}deg) translateY(-104px) rotate(-${index * 60 + 30}deg)` }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
              <button className="wheel-button" disabled={spinning || step === "result"} onClick={draw}>
                {spinning ? "抽取中" : step === "result" ? "已抽取" : "立即抽奖"}
              </button>
            </div>
            {step === "draw" && <p className="draw-note">完成评价即可参与抽取，评分高低不影响结果。</p>}
          </section>
        )}

        <section className="feedback-card tier-card">
          <button className="rules-toggle" onClick={() => setShowTiers((value) => !value)}>
            评价有礼 <span>{showTiers ? "收起" : "查看"}</span>
          </button>
          {showTiers && (
            <div className="tier-marketing">
              <b>参与评价即可获得感谢礼，还有机会获得入住礼遇与特别礼遇。</b>
              <p>感谢礼包含现金红包或会员积分；惊喜礼可包含入住礼包、餐饮礼遇；特别礼可包含下次入住礼遇或出行礼遇。</p>
              <small>具体奖励内容、有效期和使用条件以抽取结果及酒店当前活动配置为准。</small>
            </div>
          )}
        </section>

        <section className="feedback-card rules-card">
          <button className="rules-toggle" onClick={() => setShowRules((value) => !value)}>
            活动规则 <span>{showRules ? "收起" : "展开"}</span>
          </button>
          {showRules && (
            <ul>
              <li>完成评价即可参与一次抽奖，评分高低不影响中奖概率。</li>
              <li>同一用户每日最多参与一次，奖品数量有限。</li>
              <li>现金红包可领取至微信或支付宝账户。</li>
              <li>酒店权益自动存入我的礼遇卡包，具体使用以酒店规则为准。</li>
            </ul>
          )}
        </section>

        {showResultModal && selectedReward && (
          <div className="reward-modal-backdrop" role="dialog" aria-modal="true">
            <section className="reward-modal">
              <button className="modal-close" onClick={() => setShowResultModal(false)} aria-label="关闭">×</button>
              <p>{selectedReward.tier}</p>
              <h2>获得{rewardTitle(selectedReward)}</h2>
              <span>{selectedReward.detail}</span>
              <div className="modal-claim">
                <b>领取方式</b>
                <small>{selectedReward.receive}</small>
                <em>有效期：{selectedReward.valid}</em>
              </div>
              {selectedReward.name === "现金红包" ? (
                <div className="modal-actions two">
                  <button onClick={() => setCashAccount("微信账户")}>领取至微信</button>
                  <button onClick={() => setCashAccount("支付宝账户")}>领取至支付宝</button>
                </div>
              ) : (
                <div className="modal-actions">
                  <button>查看我的礼遇卡包</button>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
