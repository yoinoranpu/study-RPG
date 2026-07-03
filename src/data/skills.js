// ═══════════════════════════════════════
// スキルデータ統合ファイル
// type: "stat" → 取得時点でステータスに直接反映
// type: "passive" → キャラタブで選ぶ・常時発動
// type: "active" → キャラタブで選ぶ・将来実装
// ═══════════════════════════════════════

export const SKILLS = {

  // ─── スタート ───
  start: {
    id:"start", name:"冒険者", icon:"⭐", color:"#fbbf24",
    type:"stat", sp:0, req:[],
    desc:"すべての始まり",
    stat:{ hp:10 },
  },

  // ─── ステータス強化系（取得で即反映） ───
  atk1: { id:"atk1", name:"攻撃強化I",   icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["start"],  desc:"ATK+5",    stat:{ atk:5  } },
  atk2: { id:"atk2", name:"攻撃強化II",  icon:"⚔", color:"#f87171", type:"stat", sp:2, req:["atk1"],   desc:"ATK+10",   stat:{ atk:10 } },
  atk3: { id:"atk3", name:"攻撃強化III", icon:"⚔", color:"#ef4444", type:"stat", sp:3, req:["atk2"],   desc:"ATK+20",   stat:{ atk:20 } },
  mag1: { id:"mag1", name:"魔力強化I",   icon:"✨", color:"#a78bfa", type:"stat", sp:1, req:["start"],  desc:"MAG+5",    stat:{ mag:5  } },
  mag2: { id:"mag2", name:"魔力強化II",  icon:"✨", color:"#a78bfa", type:"stat", sp:2, req:["mag1"],   desc:"MAG+10",   stat:{ mag:10 } },
  def1: { id:"def1", name:"防御強化I",   icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["start"],  desc:"DEF+5",    stat:{ def:5  } },
  def2: { id:"def2", name:"防御強化II",  icon:"🛡", color:"#60a5fa", type:"stat", sp:2, req:["def1"],   desc:"DEF+10",   stat:{ def:10 } },
  mdef1:{ id:"mdef1",name:"魔法防御I",   icon:"🔮", color:"#38bdf8", type:"stat", sp:1, req:["start"],  desc:"MDEF+5",   stat:{ mdef:5 } },
  mdef2:{ id:"mdef2",name:"魔法防御II",  icon:"🔮", color:"#38bdf8", type:"stat", sp:2, req:["mdef1"],  desc:"MDEF+10",  stat:{ mdef:10} },
  hp1:  { id:"hp1",  name:"生命力I",     icon:"❤", color:"#fb923c", type:"stat", sp:1, req:["start"],  desc:"HP+30",    stat:{ hp:30  } },
  hp2:  { id:"hp2",  name:"生命力II",    icon:"❤", color:"#fb923c", type:"stat", sp:2, req:["hp1"],    desc:"HP+50",    stat:{ hp:50  } },
  hp3:  { id:"hp3",  name:"生命力III",   icon:"❤", color:"#ea580c", type:"stat", sp:3, req:["hp2"],    desc:"HP+100",   stat:{ hp:100 } },
  eva1: { id:"eva1", name:"回避I",       icon:"💨", color:"#34d399", type:"stat", sp:1, req:["start"],  desc:"回避+3%",  stat:{ eva:3  } },
  eva2: { id:"eva2", name:"回避II",      icon:"💨", color:"#34d399", type:"stat", sp:2, req:["eva1"],   desc:"回避+5%",  stat:{ eva:5  } },
  crit1:{ id:"crit1",name:"クリ強化I",   icon:"🎯", color:"#fbbf24", type:"stat", sp:1, req:["start"],  desc:"クリ率+3%",stat:{ crit:3 } },
  crit2:{ id:"crit2",name:"クリ強化II",  icon:"🎯", color:"#fbbf24", type:"stat", sp:2, req:["crit1"],  desc:"クリ率+5%",stat:{ crit:5 } },

  // ─── パッシブスキル（キャラタブで選ぶ・常時発動） ───
  gold1: {
    id:"gold1", name:"金運I", icon:"🪙", color:"#fbbf24",
    type:"passive", sp:1, req:["start"],
    desc:"G獲得+15%",
    passive:{ goldBonus:15 },
  },
  gold2: {
    id:"gold2", name:"金運II", icon:"🪙", color:"#f59e0b",
    type:"passive", sp:2, req:["gold1"],
    desc:"G獲得+25%",
    passive:{ goldBonus:25 },
  },
  exp1: {
    id:"exp1", name:"学習I", icon:"📖", color:"#38bdf8",
    type:"passive", sp:1, req:["start"],
    desc:"EXP獲得+10%",
    passive:{ expBonus:10 },
  },
  exp2: {
    id:"exp2", name:"学習II", icon:"📖", color:"#0ea5e9",
    type:"passive", sp:2, req:["exp1"],
    desc:"EXP獲得+20%",
    passive:{ expBonus:20 },
  },
  exp3: {
    id:"exp3", name:"学習III", icon:"🎓", color:"#0284c7",
    type:"passive", sp:3, req:["exp2"],
    desc:"EXP獲得+30%",
    passive:{ expBonus:30 },
  },
  drop1: {
    id:"drop1", name:"採取I", icon:"📦", color:"#fb923c",
    type:"passive", sp:1, req:["start"],
    desc:"素材ドロップ+10%",
    passive:{ dropBonus:10 },
  },
  drop2: {
    id:"drop2", name:"採取II", icon:"📦", color:"#ea580c",
    type:"passive", sp:2, req:["drop1"],
    desc:"素材ドロップ+20%",
    passive:{ dropBonus:20 },
  },
  map1: {
    id:"map1", name:"探索眼", icon:"🗺", color:"#60a5fa",
    type:"passive", sp:1, req:["start"],
    desc:"マッピング速度+10%",
    passive:{ mapBonus:10 },
  },
  chest1: {
    id:"chest1", name:"宝探し", icon:"💎", color:"#fbbf24",
    type:"passive", sp:2, req:["map1"],
    desc:"宝箱出現率+10%",
    passive:{ chestBonus:10 },
  },

  // ─── アクティブスキル（将来実装・枠だけ） ───
  slash: {
    id:"slash", name:"斬撃", icon:"⚡", color:"#f87171",
    type:"active", sp:2, req:["atk1"],
    desc:"ATK×1.8倍の物理ダメージ（将来実装）",
    active:{ future:true },
  },
  fireball: {
    id:"fireball", name:"火炎球", icon:"🔥", color:"#a78bfa",
    type:"active", sp:2, req:["mag1"],
    desc:"MAG×2.0倍の魔法ダメージ（将来実装）",
    active:{ future:true },
  },
  heal: {
    id:"heal", name:"回復", icon:"💚", color:"#4ade80",
    type:"active", sp:2, req:["hp1"],
    desc:"HP30%回復（将来実装）",
    active:{ future:true },
  },
  summon: {
    id:"summon", name:"召喚", icon:"🐺", color:"#a78bfa",
    type:"active", sp:3, req:["mag2"],
    desc:"使い魔を召喚して戦闘を補助（将来実装）",
    active:{ future:true },
  },
};

export const SKILL_LIST = Object.values(SKILLS);

// パッシブボーナスの合計を計算（セット中のもののみ）
export const calcPassiveBonus = (passiveSlots = []) => {
  const bonus = {
    goldBonus:0, expBonus:0, dropBonus:0, mapBonus:0, chestBonus:0,
  };
  passiveSlots.forEach(id => {
    if (!id) return;
    const sk = SKILLS[id];
    if (!sk?.passive) return;
    Object.entries(sk.passive).forEach(([k,v]) => {
      if (k in bonus) bonus[k] += v;
    });
  });
  return bonus;
};

// ステータス強化スキルの合計を計算（取得済み全部）
export const calcStatBonus = (learnedSkills = []) => {
  const bonus = { atk:0, mag:0, def:0, mdef:0, hp:0, eva:0, crit:0 };
  learnedSkills.forEach(id => {
    const sk = SKILLS[id];
    if (!sk?.stat) return;
    Object.entries(sk.stat).forEach(([k,v]) => {
      if (k in bonus) bonus[k] += v;
    });
  });
  return bonus;
};

// スキルツリーの座標
export const SKILL_POSITIONS = {
  start:    { x:400, y:420 },
  // ステータス系
  atk1:     { x:280, y:320 }, atk2:  { x:200, y:240 }, atk3:  { x:140, y:170 },
  mag1:     { x:520, y:320 }, mag2:  { x:600, y:240 },
  def1:     { x:360, y:310 }, def2:  { x:320, y:230 },
  mdef1:    { x:440, y:310 }, mdef2: { x:480, y:230 },
  hp1:      { x:400, y:300 }, hp2:   { x:400, y:220 }, hp3:   { x:400, y:140 },
  eva1:     { x:540, y:380 }, eva2:  { x:620, y:330 },
  crit1:    { x:260, y:380 }, crit2: { x:180, y:330 },
  // パッシブ系
  gold1:    { x:500, y:490 }, gold2: { x:580, y:450 },
  exp1:     { x:300, y:490 }, exp2:  { x:220, y:450 }, exp3: { x:160, y:390 },
  drop1:    { x:450, y:530 }, drop2: { x:530, y:510 },
  map1:     { x:350, y:530 }, chest1:{ x:310, y:610 },
  // アクティブ系
  slash:    { x:240, y:260 },
  fireball: { x:560, y:260 },
  heal:     { x:400, y:200 },
  summon:   { x:640, y:170 },
};