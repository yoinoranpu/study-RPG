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
// 係数はタイマーEXP+戦闘EXPの実測想定値から逆算（毎日2セット×30日 ≒ 4100EXPでLv23前後になるよう調整）
export const expToLevel = (totalExp) => {
  let lv = 1, used = 0;
  while (lv < 100) {
    const need = Math.floor(7 * Math.pow(lv, 1.3));
    if (used + need > totalExp) break;
    used += need;
    lv++;
  }
  return lv;
};

export const expForLevel = (lv) => Math.floor(7 * Math.pow(lv, 1.3));

export const expUsedUpTo = (lv) => {
  let s = 0;
  for (let i = 1; i < lv; i++) s += Math.floor(7 * Math.pow(i, 1.3));
  return s;
};

// レベルアップ時の演出メッセージ（純粋な節目のお祝い。実際の装備レアリティ解放等は
// ダンジョン深度側で管理しているため、ここでは存在しないゲートを謳わない）
export const LEVEL_UNLOCKS = {
  5:  { label:"駆け出し卒業",   desc:"装備の扱いが板についてきた！" },
  10: { label:"中堅冒険者",     desc:"着実に力をつけている！" },
  15: { label:"熟練の一歩手前", desc:"戦い方に余裕が出てきた！" },
  20: { label:"頼れる冒険者",   desc:"多くの敵を退けられるようになった！" },
  25: { label:"手練れの証",     desc:"どんな敵にも臆さず立ち向かえる！" },
  30: { label:"百戦錬磨",       desc:"数々の死線をくぐり抜けてきた！" },
  40: { label:"伝説へ王手",     desc:"伝説の域に手が届きつつある！" },
  50: { label:"生ける伝説",     desc:"その名は多くの冒険者に知れ渡っている！" },
};