// ═══════════════════════════════════════════════════════
// アイテムデータベース
// 新しい武器を追加するときはITEM_DBの各配列に追加するだけでOK
// ═══════════════════════════════════════════════════════

// ─── レアリティ定義 ───
export const RARITY = {
  common:    { id:"common",    label:"Common",    color:"#a0a0a0", tier:1, unlockFloor:0  },
  uncommon:  { id:"uncommon",  label:"Uncommon",  color:"#4ade80", tier:2, unlockFloor:10 },
  rare:      { id:"rare",      label:"Rare",       color:"#60a5fa", tier:3, unlockFloor:25 },
  epic:      { id:"epic",      label:"Epic",       color:"#a78bfa", tier:4, unlockFloor:50 },
  legendary: { id:"legendary", label:"Legendary",  color:"#fbbf24", tier:5, unlockFloor:75 },
  mythic:    { id:"mythic",    label:"Mythic",     color:"#ef4444", tier:6, unlockFloor:999 }, // 合成限定
  origin:    { id:"origin",    label:"Origin",     color:"#FFD700", tier:7, unlockFloor:999, border:"#ef4444" }, // 合成限定
};

export const RARITY_LIST = Object.values(RARITY);
export const getRarity = (id) => RARITY[id] || RARITY.common;

// ─── ランダム能力プール（内部用・プレイヤーには数値だけ見える）───
export const RANDOM_ABILITY_POOL = {
  // 基本ステータス
  atk:      { key:"atk",      label:"ATK+",     suffix:"",  tiers:[2,4,6,8,10], type:"stat" },
  def:      { key:"def",      label:"DEF+",     suffix:"",  tiers:[2,4,6,8,10], type:"stat" },
  hp:       { key:"hp",       label:"HP+",      suffix:"",  tiers:[10,20,30,40,50], type:"stat" },
  mag:      { key:"mag",      label:"MAG+",     suffix:"",  tiers:[2,4,6,8,10], type:"stat" },
  mdef:     { key:"mdef",     label:"MDEF+",    suffix:"",  tiers:[2,4,6,8,10], type:"stat" },

  // 火力
  crit_rate:{ key:"crit_rate",label:"クリ率+",  suffix:"%", tiers:[1,2,3,4,5],  type:"percent" },
  crit_dmg: { key:"crit_dmg", label:"クリダメ+",suffix:"%", tiers:[5,10,15,20,25], type:"percent" },
  eva:      { key:"eva",      label:"回避率+",  suffix:"%", tiers:[1,2,3,4,5],  type:"percent" },

  // 収集
  gold_bonus:{ key:"gold_bonus",label:"G獲得+", suffix:"%", tiers:[5,8,12,16,20], type:"percent" },
  exp_bonus: { key:"exp_bonus", label:"EXP獲得+",suffix:"%",tiers:[3,5,8,12,15], type:"percent" },
  drop_rate: { key:"drop_rate", label:"素材ドロップ+",suffix:"%",tiers:[3,5,8,12,15], type:"percent" },

  // 回復
  lifesteal: { key:"lifesteal",label:"吸血+",   suffix:"%", tiers:[2,3,5,7,10], type:"percent" },

  // 将来実装（枠だけ確保）
  poison:   { key:"poison",   label:"毒付与+",  suffix:"%", tiers:[5,10,15,20,25], type:"status", future:true },
  burn:     { key:"burn",     label:"火傷付与+", suffix:"%", tiers:[5,10,15,20,25], type:"status", future:true },
  freeze:   { key:"freeze",   label:"凍結付与+", suffix:"%", tiers:[3,5,8,12,15],  type:"status", future:true },
  paralyze: { key:"paralyze", label:"麻痺付与+", suffix:"%", tiers:[3,5,8,12,15],  type:"status", future:true },
};

// ランダム能力を抽選する（tierは1〜5）
export const rollAbility = (tier = 1) => {
  const pool = Object.values(RANDOM_ABILITY_POOL).filter(a => !a.future);
  const ability = pool[Math.floor(Math.random() * pool.length)];
  const val = ability.tiers[Math.min(tier - 1, 4)];
  return { key: ability.key, label: ability.label, suffix: ability.suffix, value: val, type: ability.type };
};

// レアリティに応じたスロット数
export const getAbilitySlots = (rarityId) => {
  const slots = { common:0, uncommon:1, rare:2, epic:3, legendary:3, mythic:3, origin:3 };
  return slots[rarityId] || 0;
};

// レアリティに応じた能力tier
export const getAbilityTier = (rarityId) => {
  const tiers = { common:0, uncommon:1, rare:2, epic:3, legendary:4, mythic:5, origin:5 };
  return tiers[rarityId] || 1;
};

// ─── 固有能力定義 ───
export const INNATE = {
  none:          { key:"none",          label:"",              desc:"" },
  fire_dmg:      { key:"fire_dmg",      label:"火属性+20%",    desc:"火属性ダメージ+20%（将来実装）" },
  thunder_stun:  { key:"thunder_stun",  label:"感電+15%",      desc:"感電付与率+15%（将来実装）" },
  armor_pierce:  { key:"armor_pierce",  label:"防御貫通+10%",  desc:"防御を10%無視する" },
  vampiric:      { key:"vampiric",      label:"吸血+5%",       desc:"与ダメの5%をHP回復" },
  explorer:      { key:"explorer",      label:"探索+10%",      desc:"マッピング速度+10%" },
  lucky:         { key:"lucky",         label:"幸運+10%",      desc:"ドロップ率+10%" },
  berserker:     { key:"berserker",     label:"狂戦士",        desc:"HP50%以下でATK+30%（将来実装）" },
  guardian:      { key:"guardian",      label:"守護+15%",      desc:"被ダメージ-15%（将来実装）" },
  swift:         { key:"swift",         label:"迅速",          desc:"先攻率+20%" },
  poison_blade:  { key:"poison_blade",  label:"毒刃",          desc:"毒付与率+20%（将来実装）" },
};

// ─── 武器データ ───
// 追加するときはここに1行加えるだけでOK
// innate: 固有能力キー
// baseAtk: 基礎ATK（個体差・強化で変動）
export const WEAPON_DB = [
  // ────── Common ──────
  { id:"W001", name:"旅人の剣",     icon:"⚔", rarity:"common",   type:"weapon", subtype:"sword",  baseAtk:8,  baseMag:0,  innate:"none",         shopWeight:10, dropWeight:10 },
  { id:"W002", name:"錆びた大剣",   icon:"⚔", rarity:"common",   type:"weapon", subtype:"sword",  baseAtk:12, baseMag:0,  innate:"none",         shopWeight:8,  dropWeight:8  },
  { id:"W003", name:"木の杖",       icon:"✨", rarity:"common",   type:"weapon", subtype:"staff",  baseAtk:0,  baseMag:10, innate:"none",         shopWeight:10, dropWeight:10 },
  { id:"W004", name:"狩人の弓",     icon:"🏹", rarity:"common",   type:"weapon", subtype:"bow",    baseAtk:9,  baseMag:0,  innate:"none",         shopWeight:10, dropWeight:10 },
  { id:"W005", name:"旅人の短剣",   icon:"🗡", rarity:"common",   type:"weapon", subtype:"dagger", baseAtk:7,  baseMag:0,  innate:"none",         shopWeight:10, dropWeight:10 },

  // ────── Uncommon ──────
  { id:"W101", name:"鉄の剣",       icon:"⚔", rarity:"uncommon", type:"weapon", subtype:"sword",  baseAtk:14, baseMag:0,  innate:"none",         shopWeight:8,  dropWeight:8  },
  { id:"W102", name:"魔力欠けの杖", icon:"✨", rarity:"uncommon", type:"weapon", subtype:"staff",  baseAtk:0,  baseMag:14, innate:"none",         shopWeight:8,  dropWeight:8  },
  { id:"W103", name:"探索者の弓",   icon:"🏹", rarity:"uncommon", type:"weapon", subtype:"bow",    baseAtk:12, baseMag:0,  innate:"explorer",     shopWeight:6,  dropWeight:6  },
  { id:"W104", name:"幸運の短剣",   icon:"🗡", rarity:"uncommon", type:"weapon", subtype:"dagger", baseAtk:10, baseMag:0,  innate:"lucky",        shopWeight:6,  dropWeight:6  },
  { id:"W105", name:"鋼の大剣",     icon:"⚔", rarity:"uncommon", type:"weapon", subtype:"sword",  baseAtk:18, baseMag:0,  innate:"none",         shopWeight:5,  dropWeight:5  },

  // ────── Rare ──────
  { id:"W201", name:"炎の剣",       icon:"🔥", rarity:"rare",     type:"weapon", subtype:"sword",  baseAtk:18, baseMag:0,  innate:"fire_dmg",     shopWeight:4,  dropWeight:4  },
  { id:"W202", name:"雷の杖",       icon:"⚡", rarity:"rare",     type:"weapon", subtype:"staff",  baseAtk:0,  baseMag:20, innate:"thunder_stun", shopWeight:4,  dropWeight:4  },
  { id:"W203", name:"吸血剣",       icon:"🩸", rarity:"rare",     type:"weapon", subtype:"sword",  baseAtk:16, baseMag:0,  innate:"vampiric",     shopWeight:3,  dropWeight:3  },
  { id:"W204", name:"騎士の剣",     icon:"⚔", rarity:"rare",     type:"weapon", subtype:"sword",  baseAtk:20, baseMag:0,  innate:"armor_pierce", shopWeight:3,  dropWeight:3  },
  { id:"W205", name:"迅速の短剣",   icon:"🗡", rarity:"rare",     type:"weapon", subtype:"dagger", baseAtk:14, baseMag:0,  innate:"swift",        shopWeight:3,  dropWeight:3  },

  // ────── Epic ──────
  { id:"W301", name:"竜殺しの剣",   icon:"🐉", rarity:"epic",     type:"weapon", subtype:"sword",  baseAtk:28, baseMag:0,  innate:"armor_pierce", shopWeight:0,  dropWeight:2  },
  { id:"W302", name:"冥界の杖",     icon:"💀", rarity:"epic",     type:"weapon", subtype:"staff",  baseAtk:0,  baseMag:30, innate:"vampiric",     shopWeight:0,  dropWeight:2  },
  { id:"W303", name:"狂戦士の斧",   icon:"🪓", rarity:"epic",     type:"weapon", subtype:"axe",    baseAtk:35, baseMag:0,  innate:"berserker",    shopWeight:0,  dropWeight:2  },
  { id:"W304", name:"毒の短剣",     icon:"🗡", rarity:"epic",     type:"weapon", subtype:"dagger", baseAtk:20, baseMag:0,  innate:"poison_blade", shopWeight:0,  dropWeight:2  },

  // ────── Legendary ──────
  { id:"W401", name:"神剣カラドボルグ",icon:"✨",rarity:"legendary",type:"weapon",subtype:"sword",  baseAtk:45, baseMag:0,  innate:"armor_pierce", shopWeight:0,  dropWeight:1  },
  { id:"W402", name:"天雷の杖",     icon:"⚡", rarity:"legendary", type:"weapon", subtype:"staff",  baseAtk:0,  baseMag:50, innate:"thunder_stun", shopWeight:0,  dropWeight:1  },

  // ────── Mythic・Origin（合成限定・将来追加） ──────
  // { id:"W501", name:"???", ... },
];

// ─── 防具データ ───
export const ARMOR_DB = [
  { id:"A001", name:"布の服",       icon:"👘", rarity:"common",   type:"armor", subtype:"light",  baseDef:3,  baseMdef:3,  baseHp:0,  innate:"none",    shopWeight:12, dropWeight:10 },
  { id:"A002", name:"革の鎧",       icon:"🛡", rarity:"common",   type:"armor", subtype:"light",  baseDef:5,  baseMdef:5,  baseHp:0,  innate:"none",    shopWeight:12, dropWeight:10 },
  { id:"A003", name:"鉄の鎧",       icon:"🪖", rarity:"uncommon", type:"armor", subtype:"heavy",  baseDef:10, baseMdef:8,  baseHp:0,  innate:"none",    shopWeight:8,  dropWeight:6  },
  { id:"A004", name:"魔導ローブ",   icon:"🔮", rarity:"uncommon", type:"armor", subtype:"robe",   baseDef:5,  baseMdef:15, baseHp:0,  innate:"none",    shopWeight:6,  dropWeight:6  },
  { id:"A005", name:"鋼の鎧",       icon:"🪖", rarity:"rare",     type:"armor", subtype:"heavy",  baseDef:16, baseMdef:10, baseHp:10, innate:"guardian",shopWeight:0,  dropWeight:3  },
  { id:"A006", name:"竜鱗鎧",       icon:"🐉", rarity:"epic",     type:"armor", subtype:"heavy",  baseDef:24, baseMdef:14, baseHp:20, innate:"guardian",shopWeight:0,  dropWeight:2  },
  { id:"A007", name:"影の外套",     icon:"🌑", rarity:"rare",     type:"armor", subtype:"light",  baseDef:6,  baseMdef:6,  baseHp:0,  innate:"swift",   shopWeight:0,  dropWeight:3  },
];

// ─── アクセサリーデータ ───
export const ACCESSORY_DB = [
  { id:"AC001", name:"木の指輪",    icon:"💍", rarity:"common",   type:"accessory", innate:"none",    baseCrit:1, baseEva:0, shopWeight:12, dropWeight:10 },
  { id:"AC002", name:"初心者の護符",icon:"📿", rarity:"common",   type:"accessory", innate:"exp_bonus",baseCrit:0,baseEva:0, shopWeight:12, dropWeight:10 },
  { id:"AC003", name:"探索の指輪",  icon:"💍", rarity:"uncommon", type:"accessory", innate:"lucky",   baseCrit:0, baseEva:0, shopWeight:6,  dropWeight:6  },
  { id:"AC004", name:"狩人の腕輪",  icon:"📿", rarity:"uncommon", type:"accessory", innate:"none",    baseCrit:3, baseEva:0, shopWeight:6,  dropWeight:6  },
  { id:"AC005", name:"盗賊の指輪",  icon:"💍", rarity:"rare",     type:"accessory", innate:"swift",   baseCrit:0, baseEva:5, shopWeight:0,  dropWeight:3  },
  { id:"AC006", name:"竜の護符",    icon:"🐉", rarity:"epic",     type:"accessory", innate:"lucky",   baseCrit:4, baseEva:0, shopWeight:0,  dropWeight:2  },
];

// ─── 消耗品データ ───
export const CONSUMABLE_DB = [
  { id:"C001", name:"小ポーション",   icon:"🧪", rarity:"common",   type:"consumable", effect:"heal_30",   desc:"HPを30%回復",           shopWeight:15 },
  { id:"C002", name:"中ポーション",   icon:"🧪", rarity:"uncommon", type:"consumable", effect:"heal_50",   desc:"HPを50%回復",           shopWeight:10 },
  { id:"C003", name:"大ポーション",   icon:"🧪", rarity:"rare",     type:"consumable", effect:"heal_100",  desc:"HPを全回復",            shopWeight:4  },
  { id:"C004", name:"攻撃の秘薬",     icon:"⚗", rarity:"uncommon", type:"consumable", effect:"atk_up_20", desc:"1セット中ATK+20%",      shopWeight:6  },
  { id:"C005", name:"帰還の巻物",     icon:"📜", rarity:"uncommon", type:"consumable", effect:"escape",    desc:"ダンジョンから即帰還",  shopWeight:5  },
  { id:"C006", name:"経験値の書",     icon:"📖", rarity:"rare",     type:"consumable", effect:"exp_up_50", desc:"次のセットEXP+50%",     shopWeight:3  },
  { id:"C007", name:"幸運のお守り",   icon:"🍀", rarity:"rare",     type:"consumable", effect:"luck_up",   desc:"次のセットレア率+20%",  shopWeight:3  },
];

// ─── 特殊アイテムデータ ───
export const SPECIAL_DB = [
  { id:"S001", name:"スキルリセット石",icon:"🔮", rarity:"rare",     type:"special", effect:"skill_reset", desc:"習得スキルをリセット",     shopWeight:2 },
  { id:"S002", name:"レア素材パック",  icon:"📦", rarity:"rare",     type:"special", effect:"mat_pack",    desc:"ランダム素材×5個",         shopWeight:3 },
  { id:"S003", name:"強化の秘石",      icon:"💠", rarity:"epic",     type:"special", effect:"forge_up_2",  desc:"選択装備を+2強化",         shopWeight:1 },
];

// ─── 全アイテムDB（統合） ───
export const ALL_ITEMS = [
  ...WEAPON_DB,
  ...ARMOR_DB,
  ...ACCESSORY_DB,
  ...CONSUMABLE_DB,
  ...SPECIAL_DB,
];

// ─── 後方互換用（既存コードが参照してる場合） ───
export const ITEM_DB = {
  weapon:    WEAPON_DB,
  armor:     ARMOR_DB,
  accessory: ACCESSORY_DB,
  consumable: CONSUMABLE_DB,
  special:   SPECIAL_DB,
};

// ─── ショップ価格 ───
export const getShopPrice = (item) => {
  const prices = { common:80, uncommon:200, rare:500, epic:1200, legendary:3000, mythic:0, origin:0 };
  return prices[item.rarity] || 200;
};

export const getSellPrice = (item) =>
  Math.floor(getShopPrice(item) / 4 + (item.upgradeLevel || 0) * 50);

// ─── 日替わりショップ在庫生成 ───
const RARITY_WEIGHT = { common:40, uncommon:30, rare:20, epic:8, legendary:2, mythic:0, origin:0 };

export const generateShopStock = (dateStr, unlockedFloor = 0) => {
  const seed = dateStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

  const pick = (items, count, off) => {
    // 解放済みレアリティのみ
    const pool = items.filter(it =>
      (it.shopWeight || 0) > 0 &&
      (getRarity(it.rarity)?.unlockFloor || 0) <= unlockedFloor
    );
    const picked = [];
    for (let i = 0; i < count; i++) {
      const tw = pool.reduce((s, it) => s + (it.shopWeight||1) * (RARITY_WEIGHT[it.rarity]||1), 0);
      let r = rng(seed + off + i * 7) * tw;
      for (const it of pool) {
        r -= (it.shopWeight||1) * (RARITY_WEIGHT[it.rarity]||1);
        if (r <= 0 && !picked.find(p => p.id === it.id)) { picked.push(it); break; }
      }
      if (picked.length <= i) picked.push(pool[Math.floor(rng(seed+i)*pool.length)]||pool[0]);
    }
    return picked.filter(Boolean);
  };

  return {
    weapon:     pick(WEAPON_DB,    3, 0),
    armor:      pick(ARMOR_DB,     3, 100),
    accessory:  pick(ACCESSORY_DB, 3, 200),
    consumable: pick(CONSUMABLE_DB,4, 300),
    special:    pick(SPECIAL_DB.filter(it=>it.shopWeight>0), 2, 400),
  };
};

// ─── アイテムインスタンス生成 ───
let _uid = 0;

const VARIANCE_TABLE = [0.6, 0.2, 0.1, 0.05, 0.05]; // 基本値60%・±1 20%・±2 10%など

const applyVariance = (val) => {
  if (!val || val === 0) return 0;
  const r = Math.random();
  if (r < 0.60) return val;
  if (r < 0.80) return val + (Math.random() < 0.5 ? 1 : -1);
  if (r < 0.90) return val + (Math.random() < 0.5 ? 2 : -2);
  if (r < 0.95) return val + (Math.random() < 0.5 ? 3 : -3);
  const big = 4 + Math.floor(Math.random() * 2);
  return val + (Math.random() < 0.5 ? big : -big);
};

export const makeItem = (tmpl) => {
  const rarityId = tmpl.rarity || "common";
  const slots = getAbilitySlots(rarityId);
  const tier  = getAbilityTier(rarityId);

  // ランダム能力を抽選
  const abilities = [];
  const usedKeys = new Set();
  for (let i = 0; i < slots; i++) {
    let ab = rollAbility(tier);
    let tries = 0;
    while (usedKeys.has(ab.key) && tries < 10) { ab = rollAbility(tier); tries++; }
    usedKeys.add(ab.key);
    abilities.push(ab);
  }

  return {
    ...tmpl,
    uid: `i${Date.now()}_${_uid++}`,
    upgradeLevel: 0,
    bonuses: {},
    abilities, // ランダム能力配列
    // 個体差
    atk:  applyVariance(tmpl.baseAtk  || tmpl.atk  || 0),
    mag:  applyVariance(tmpl.baseMag  || tmpl.mag  || 0),
    def:  applyVariance(tmpl.baseDef  || tmpl.def  || 0),
    mdef: applyVariance(tmpl.baseMdef || tmpl.mdef || 0),
    hp:   applyVariance(tmpl.baseHp   || tmpl.hp   || 0),
    crit: applyVariance(tmpl.baseCrit || tmpl.crit || 0),
    eva:  applyVariance(tmpl.baseEva  || tmpl.eva  || 0),
  };
};

// ─── 装備ステータス計算 ───
export const getItemStats = (item) => {
  if (!item) return {};
  const s = {
    atk:  item.atk  || 0,
    mag:  item.mag  || 0,
    def:  item.def  || 0,
    mdef: item.mdef || 0,
    hp:   item.hp   || 0,
    crit: item.crit || 0,
    eva:  item.eva  || 0,
  };
  // 強化ボーナス
  Object.entries(item.bonuses || {}).forEach(([k, v]) => {
    if (s[k] !== undefined) s[k] += v;
  });
  // ランダム能力（stat系のみ加算）
  (item.abilities || []).forEach(ab => {
    if (ab.type === "stat" && s[ab.key] !== undefined) s[ab.key] += ab.value;
    if (ab.key === "crit_rate") s.crit = (s.crit || 0) + ab.value;
    if (ab.key === "eva")       s.eva  = (s.eva  || 0) + ab.value;
  });
  return s;
};

// ─── 合成コスト ───
export const SYNTHESIS_COST = {
  common:    { gold:100,   mat:null,            matCount:0 },
  uncommon:  { gold:500,   mat:"通常素材",       matCount:3 },
  rare:      { gold:2000,  mat:"上位素材",       matCount:3 },
  epic:      { gold:5000,  mat:"ボス素材",       matCount:1 },
  legendary: { gold:10000, mat:"ボス素材",       matCount:3 },
  mythic:    { gold:30000, mat:"伝説素材",       matCount:1 },
};

// ─── レアリティ名表示 ───
export const RARITY_LABEL = {
  common:"", uncommon:"★", rare:"★★", epic:"★★★",
  legendary:"★★★★", mythic:"★★★★★", origin:"★★★★★★"
};
export const RARITY_COLOR = {
  common:"#a0a0a0", uncommon:"#4ade80", rare:"#60a5fa",
  epic:"#a78bfa", legendary:"#fbbf24", mythic:"#ef4444", origin:"#FFD700"
};