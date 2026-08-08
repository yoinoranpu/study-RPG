// ═══════════════════════════════════════════════════════
// 宝箱中身テーブル
// 確率を変えたい時はここだけ修正すればOK
// ═══════════════════════════════════════════════════════

import { WEAPON_DB, ARMOR_DB, ACCESSORY_DB, CONSUMABLE_DB, SPECIAL_DB, makeItem, getRarity } from "./items";
import { makeBook, rollBookRarity, rollBookId } from "./skills";

// ─── 宝箱レアリティ定義 ───
export const CHEST_TYPES = {
  common:   { id:"common",   label:"木箱",   color:"#a0a0a0", icon:"📦", image:"/assets/images/木箱.png" },
  uncommon: { id:"uncommon", label:"銀箱",   color:"#4ade80", icon:"🟩", image:"/assets/images/銀箱.png" },
  rare:     { id:"rare",     label:"金箱",   color:"#fbbf24", icon:"🟨", image:"/assets/images/金箱.png" },
  epic:     { id:"epic",     label:"虹箱",   color:"#a78bfa", icon:"🌟", image:"/assets/images/虹箱.png" },
};

// ─── 宝箱レアリティ抽選確率 ───
const CHEST_RARITY_TABLE = [
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
const CHEST_CONTENT_TABLE = {
  common: [
    { type:"gold",     prob:0.35, min:50,   max:200  },
    { type:"consumable",prob:0.20 },
    { type:"equipment", prob:0.22 },
    { type:"skillbook",  prob:0.15 },
    { type:"special",   prob:0.06 },
    { type:"key",       prob:0.02 },
  ],
  uncommon: [
    { type:"gold",     prob:0.22, min:200,  max:500  },
    { type:"consumable",prob:0.15 },
    { type:"equipment", prob:0.28 },
    { type:"skillbook",  prob:0.20 },
    { type:"special",   prob:0.10 },
    { type:"key",       prob:0.05 },
  ],
  rare: [
    { type:"gold",     prob:0.15, min:500,  max:1500 },
    { type:"consumable",prob:0.10 },
    { type:"equipment", prob:0.35 },
    { type:"skillbook",  prob:0.20 },
    { type:"special",   prob:0.15 },
    { type:"key",       prob:0.05 },
  ],
  epic: [
    { type:"gold",     prob:0.10, min:1000, max:3000 },
    { type:"consumable",prob:0.05 },
    { type:"equipment", prob:0.45 },
    { type:"skillbook",  prob:0.20 },
    { type:"special",   prob:0.15 },
    { type:"key",       prob:0.05 },
  ],
};

// ─── 宝箱から中身を生成 ───
// currentFloorは「全ダンジョン通算の深度(globalDepth)」を渡す想定（呼び出し側で計算）
export const openChest = (chestRarityId, currentFloor = 1, dungeonId = 1) => {
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
    // フロアに応じてレアリティフィルタ（ダンジョン1だけで最上位まで出し切る。items.jsのRARITY.unlockFloorと揃える）
    const maxRarityTier = currentFloor >= 28 ? 5 :
                          currentFloor >= 20 ? 4 :
                          currentFloor >= 12 ? 3 :
                          currentFloor >= 5 ? 2 : 1;
    const pool = [...WEAPON_DB, ...ARMOR_DB, ...ACCESSORY_DB].filter(it => {
      const tier = getRarity(it.rarity)?.tier || 1;
      return tier <= maxRarityTier + 1 && it.dropWeight > 0;
    });
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    return { type:"item", item: makeItem(tmpl), chestType };
  }

  if (category === "skillbook") {
    const rarity = rollBookRarity(chestRarityId, currentFloor);
    const book = makeBook(rollBookId(), rarity);
    return { type:"skillbook", book, chestType };
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
    // 今いるダンジョンの鍵（1ダンジョン=1種類）
    const keyId = `KEY00${dungeonId}`;
    const keyTmpl = SPECIAL_DB.find(it => it.id === keyId) || SPECIAL_DB.find(it => it.id === "KEY001");
    return { type:"item", item: makeItem(keyTmpl), chestType };
  }

  // フォールバック
  const gold = Math.floor(Math.random() * 100 + 50);
  return { type:"gold", gold, chestType };
};