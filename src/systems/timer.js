// タイマーのロジック（UIから分離）

// EXP獲得（控えめ・装備が主役）
export const calcExp = (minutes) => {
  if (minutes < 10) return Math.floor(minutes * 0.5);
  if (minutes < 20) return Math.floor(minutes * 1.0);
  return Math.floor(minutes * 1.5); // 25分 → 37EXP
};

// G獲得（2倍に増やす）
export const calcGold = (minutes) => {
  return Math.floor(Math.random() * (minutes * 8) + minutes * 4);
  // 25分 → 100〜300G（平均200G）
};

// マッピング計算
export const MAPPING_PER_SET = 20;

export const calcFloorProgress = (currentMapping, addAmount) => {
  const newMapping = currentMapping + addAmount;
  if (newMapping >= 100) {
    return { newFloor: true, mapping: newMapping - 100 };
  }
  return { newFloor: false, mapping: newMapping };
};

// レベル計算（緩やかに・装備が主役）
// 目標: 毎日2セット → 1ヶ月でLv20〜25
export const expToLevel = (totalExp) => {
  let lv = 1, used = 0;
  while (lv < 100) {
    const need = Math.floor(15 * Math.pow(lv, 1.3));
    if (used + need > totalExp) break;
    used += need;
    lv++;
  }
  return lv;
};

export const expForLevel = (lv) => Math.floor(15 * Math.pow(lv, 1.3));

export const expUsedUpTo = (lv) => {
  let s = 0;
  for (let i = 1; i < lv; i++) s += Math.floor(15 * Math.pow(i, 1.3));
  return s;
};

// レベル解放コンテンツ
export const LEVEL_UNLOCKS = {
  5:  { label:"スキルツリー解放",        desc:"スキルを習得できるようになった！" },
  10: { label:"強化上限+5解放",          desc:"装備を+5まで強化できるようになった！" },
  15: { label:"ショップ品揃え拡充",      desc:"ショップに新しいアイテムが並び始めた！" },
  20: { label:"強化上限+10解放",         desc:"装備を+10まで強化できるようになった！" },
  25: { label:"B5F以降解放",             desc:"より深い階層への道が開けた！" },
  30: { label:"強化上限+15解放",         desc:"装備を+15まで強化できるようになった！" },
  40: { label:"強化上限+20解放",         desc:"装備を+20まで強化できるようになった！" },
  50: { label:"伝説装備解放",            desc:"伝説の装備が手に入るようになった！" },
};