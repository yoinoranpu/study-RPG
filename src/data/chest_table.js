// ═══════════════════════════════════════════════════════
// 宝箱中身テーブル
// 確率を変えたい時はここだけ修正すればOK
// ═══════════════════════════════════════════════════════

import { WEAPON_DB, ARMOR_DB, ACCESSORY_DB, CONSUMABLE_DB, makeItem, getRarity } from "./items";

// ─── 宝箱レアリティ定義 ───
export const CHEST_TYPES = {
  common:   { id:"common",   label:"木箱",   color:"#a0a0a0", icon:"📦" },
  uncommon: { id:"uncommon", label:"銀箱",   color:"#4ade80", icon:"🟩" },
  rare:     { id:"rare",     label:"金箱",   color:"#fbbf24", icon:"🟨" },
  epic:     { id:"epic",     label:"虹箱",   color:"#a78bfa", icon:"🌟" },
};

// ─── 宝箱レアリティ抽選確率 ───
export const CHEST_RARITY_TABLE = [
  { id:"common",   prob:0.63 },
  { id:"uncommon", prob:0.27 },
  { id:"rare",     prob:0.08 },
  { id:"epic",     prob:0.02 },
];

export const rollChestRarity = () => {
  let r = Math.random(), acc = 0;
  for (const c of CHEST_RARITY_TABLE) {
    acc += c.prob;
    if (r < acc) return c.id;
  }
  return "common";
};

// ─── 宝箱中身カテゴリ確率 ───
// 将来変更するときはここの数値だけ変える
export const CHEST_CONTENT_TABLE = {
  common: [
    { type:"gold",     prob:0.40, min:50,   max:200  },
    { type:"consumable",prob:0.25 },
    { type:"equipment", prob:0.25 },
    { type:"special",   prob:0.08 },
    { type:"key",       prob:0.02 },
  ],
  uncommon: [
    { type:"gold",     prob:0.30, min:200,  max:500  },
    { type:"consumable",prob:0.20 },
    { type:"equipment", prob:0.35 },
    { type:"special",   prob:0.10 },
    { type:"key",       prob:0.05 },
  ],
  rare: [
    { type:"gold",     prob:0.20, min:500,  max:1500 },
    { type:"consumable",prob:0.15 },
    { type:"equipment", prob:0.45 },
    { type:"special",   prob:0.15 },
    { type:"key",       prob:0.05 },
  ],
  epic: [
    { type:"gold",     prob:0.15, min:1000, max:3000 },
    { type:"consumable",prob:0.10 },
    { type:"equipment", prob:0.55 },
    { type:"special",   prob:0.15 },
    { type:"key",       prob:0.05 },
  ],
};

// ─── 宝箱から中身を生成 ───
export const openChest = (chestRarityId, currentFloor = 1) => {
  const table = CHEST_CONTENT_TABLE[chestRarityId] || CHEST_CONTENT_TABLE.common;
  const chestType = CHEST_TYPES[chestRarityId] || CHEST_TYPES.common;

  // カテゴリ抽選
  let r = Math.random(), acc = 0;
  let category = "gold";
  for (const row of table) {
    acc += row.prob;
    if (r < acc) { category = row.type; break; }
  }

  // カテゴリごとに中身を決定
  if (category === "gold") {
    const row = table.find(t => t.type === "gold");
    const gold = Math.floor(Math.random() * (row.max - row.min) + row.min);
    return { type:"gold", gold, chestType };
  }

  if (category === "consumable") {
    const pool = CONSUMABLE_DB.filter(it => it.shopWeight > 0);
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    return { type:"item", item: makeItem(tmpl), chestType };
  }

  if (category === "equipment") {
    // フロアに応じてレアリティフィルタ
    const maxRarityTier = currentFloor >= 75 ? 5 :
                          currentFloor >= 50 ? 4 :
                          currentFloor >= 25 ? 3 :
                          currentFloor >= 10 ? 2 : 1;
    const pool = [...WEAPON_DB, ...ARMOR_DB, ...ACCESSORY_DB].filter(it => {
      const tier = getRarity(it.rarity)?.tier || 1;
      return tier <= maxRarityTier + 1 && it.dropWeight > 0;
    });
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    return { type:"item", item: makeItem(tmpl), chestType };
  }

  if (category === "special") {
    const pool = [
      { id:"SP001", name:"スキルリセット石", icon:"🔮", rarity:"rare",     type:"special", effect:"skill_reset", desc:"習得スキルをリセット" },
      { id:"SP002", name:"経験値の書",       icon:"📖", rarity:"rare",     type:"special", effect:"exp_up_50",   desc:"次のセットEXP+50%" },
      { id:"SP003", name:"幸運のお守り",     icon:"🍀", rarity:"rare",     type:"special", effect:"luck_up",     desc:"次のセットレア率+20%" },
      { id:"SP004", name:"強化の秘石",       icon:"💠", rarity:"epic",     type:"special", effect:"forge_up_2",  desc:"選択装備を+2強化" },
    ];
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    return { type:"item", item: makeItem(tmpl), chestType };
  }

  if (category === "key") {
    // フロアに応じた鍵
    const keyTmpl = currentFloor >= 25
      ? { id:"KEY002", name:"封印の鍵", icon:"🔑", rarity:"rare",     type:"special", effect:"boss_key_2", desc:"B40F〜B70Fのボス部屋を開ける" }
      : { id:"KEY001", name:"古びた鍵", icon:"🗝", rarity:"uncommon", type:"special", effect:"boss_key_1", desc:"B5F〜B35Fのボス部屋を開ける" };
    return { type:"item", item: makeItem(keyTmpl), chestType };
  }

  // フォールバック
  const gold = Math.floor(Math.random() * 100 + 50);
  return { type:"gold", gold, chestType };
};