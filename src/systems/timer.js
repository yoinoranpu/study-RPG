// タイマーのロジック（UIから分離）

export const calcExp = (minutes) => {
  if (minutes < 10) return Math.floor(minutes);
  if (minutes < 20) return Math.floor(minutes * 3);
  return minutes * 5;
};

export const calcGold = (minutes) => {
  return Math.floor(Math.random() * (minutes * 4) + minutes * 2);
};

// マッピング計算（1セット20%、5セットで1F進む）
export const MAPPING_PER_SET = 20;

export const calcFloorProgress = (currentMapping, addAmount) => {
  const newMapping = currentMapping + addAmount;
  if (newMapping >= 100) {
    return {
      newFloor: true,
      mapping: newMapping - 100,
    };
  }
  return {
    newFloor: false,
    mapping: newMapping,
  };
};

// レベル計算
export const expToLevel = (totalExp) => {
  let lv = 1, used = 0;
  while (lv < 100) {
    const need = Math.floor(8 * Math.pow(lv, 1.2));
    if (used + need > totalExp) break;
    used += need;
    lv++;
  }
  return lv;
};

export const expForLevel = (lv) => Math.floor(8 * Math.pow(lv, 1.2));

export const expUsedUpTo = (lv) => {
  let s = 0;
  for (let i = 1; i < lv; i++) s += Math.floor(8 * Math.pow(i, 1.2));
  return s;
};