// イベント抽選システム

// 種族と素材の対応
export const TRIBE_MAT = {
  "粘体": "スライムゼリー",
  "獣": "狼の牙",
  "ゴブリン": "粗鉄片",
  "不死": "亡者の骨",
  "悪魔": "魔石",
  "植物": "生命の葉",
  "竜": "竜鱗",
};

// イベント種別の確率
// 戦闘60% 宝箱20% 罠10% NPC10%
export const rollEventType = () => {
  const r = Math.random();
  if (r < 0.60) return "battle";
  if (r < 0.80) return "chest";
  if (r < 0.90) return "trap";
  return "npc";
};

// NPCイベント
export const NPC_EVENTS = [
  { icon: "💧", text: "回復の泉でHPが全回復した", color: "#38bdf8", effect: "heal" },
  { icon: "🧝", text: "冒険者に会った。マップ+5%", color: "#34d399", effect: "map" },
  { icon: "🧚", text: "妖精がランダムバフを授けた", color: "#f472b6", effect: "buff" },
  { icon: "👻", text: "精霊が装備を強化してくれた", color: "#a78bfa", effect: "enhance" },
];

export const rollNpcEvent = () =>
  NPC_EVENTS[Math.floor(Math.random() * NPC_EVENTS.length)];

// 宝箱レアリティ
export const CHEST_RARITY = [
  { label: "COMMON",     color: "#a0a0a0", prob: 0.63, icon: "📦" },
  { label: "RARE",       color: "#60a5fa", prob: 0.30, icon: "🔵" },
  { label: "SUPER RARE", color: "#a78bfa", prob: 0.06, icon: "💜" },
  { label: "LEGEND",     color: "#fbbf24", prob: 0.01, icon: "🌟" },
];

export const rollChest = () => {
  let r = Math.random(), acc = 0;
  for (const c of CHEST_RARITY) {
    acc += c.prob;
    if (r < acc) return c;
  }
  return CHEST_RARITY[0];
};

// モンスターレアリティ
export const RARITY_LIST = [
  { id: "none",   label: "",   color: "#888",    mul: 1.0, prob: 0.70 },
  { id: "elite",  label: "精鋭", color: "#60a5fa", mul: 1.3, prob: 0.20 },
  { id: "hero",   label: "英雄", color: "#a78bfa", mul: 1.8, prob: 0.08 },
  { id: "legend", label: "伝説", color: "#fbbf24", mul: 3.0, prob: 0.02 },
];

export const rollRarity = () => {
  let r = Math.random(), acc = 0;
  for (const x of RARITY_LIST) {
    acc += x.prob;
    if (r < acc) return x;
  }
  return RARITY_LIST[0];
};

// 二つ名
export const TITLE_LIST = [
  { id: "none",     label: "",   stat: null,   bonus: 0,    prob: 0.79 },
  { id: "pride",    label: "傲慢", stat: "def",  bonus: 0.25, prob: 0.03 },
  { id: "greed",    label: "強欲", stat: "crit", bonus: 0.25, prob: 0.03 },
  { id: "envy",     label: "嫉妬", stat: "eva",  bonus: 0.15, prob: 0.03 },
  { id: "wrath",    label: "憤怒", stat: "atk",  bonus: 0.25, prob: 0.03 },
  { id: "lust",     label: "色欲", stat: "mdef", bonus: 0.25, prob: 0.03 },
  { id: "gluttony", label: "暴食", stat: "hp",   bonus: 0.25, prob: 0.03 },
  { id: "sloth",    label: "怠惰", stat: "mag",  bonus: 0.25, prob: 0.03 },
];

export const rollTitle = () => {
  let r = Math.random(), acc = 0;
  for (const x of TITLE_LIST) {
    acc += x.prob;
    if (r < acc) return x;
  }
  return TITLE_LIST[0];
};

export const rollTitles = () => {
  const t1 = rollTitle();
  if (t1.id === "none") return [t1];
  const t2 = rollTitle();
  if (t2.id === "none" || t2.id === t1.id) return [t1];
  return [t1, t2];
};