// ═══════════════════════════════════════════════
// 状態異常・ランク補正システム
// ═══════════════════════════════════════════════

export const STATUS_DEFS = {
  poison: {
    name:"毒", icon:"☠", color:"#a78bfa",
    maxStacks: 5,
    permanent: true,
    dmgPerStack: 0.15,  // 付与者のMAG × これ × スタック数
  },
  burn: {
    name:"火傷", icon:"🔥", color:"#ef4444",
    duration: 3,
    dmgMul: 0.4,  // 付与者のMAG × これ
  },
  paralyze: {
    name:"麻痺", icon:"⚡", color:"#fbbf24",
    duration: 3,
    skipChance: 0.30,
    rankDebuff: { stat:"def", amount:-1 },
  },
  freeze: {
    name:"凍結", icon:"❄", color:"#38bdf8",
    duration: 1,
    fullSkip: true,
    rankDebuff: { stat:"spd", amount:-2, duration:2 },
  },
  stun: {
    name:"スタン", icon:"💫", color:"#e8e0d0",
    duration: 1,
    fullSkip: true,
  },
};

export const RANK_MAX = 3;
export const RANK_MIN = -3;

// ランク倍率
export const rankMul = (rank) => {
  const r = Math.max(RANK_MIN, Math.min(RANK_MAX, rank || 0));
  return r >= 0 ? 1 + r * 0.25 : 1 / (1 + Math.abs(r) * 0.25);
};

// エンティティ初期化
export const initStatusState = () => ({
  ranks: { atk:0, def:0, mag:0, mdef:0, spd:0, eva:0 },
  statuses: [],
});

// ランク変更
export const changeRank = (entity, stat, amount) => {
  if (!entity.ranks) entity.ranks = { atk:0, def:0, mag:0, mdef:0, spd:0, eva:0 };
  const before = entity.ranks[stat] || 0;
  entity.ranks[stat] = Math.max(RANK_MIN, Math.min(RANK_MAX, before + amount));
  return entity.ranks[stat] !== before;
};

// 状態異常を付与
export const applyStatus = (entity, type, sourceMag = 0) => {
  if (!entity.statuses) entity.statuses = [];
  const def = STATUS_DEFS[type];
  if (!def) return false;

  const existing = entity.statuses.find(s => s.type === type);

  if (type === "poison") {
    if (existing) {
      if (existing.stacks >= def.maxStacks) return false;
      existing.stacks += 1;
      existing.sourceMag = Math.max(existing.sourceMag, sourceMag);
      return true;
    }
    entity.statuses.push({ type, stacks:1, turns:-1, sourceMag });
    return true;
  }

  if (existing) {
    existing.turns = def.duration;
    existing.sourceMag = Math.max(existing.sourceMag || 0, sourceMag);
    return false; // 上書きなので「新規付与」ではない
  }

  entity.statuses.push({ type, turns: def.duration, sourceMag });

  // ランクデバフ適用
  if (def.rankDebuff) {
    changeRank(entity, def.rankDebuff.stat, def.rankDebuff.amount);
  }
  return true;
};

// 行動不能チェック
export const checkSkipTurn = (entity) => {
  if (!entity.statuses) return null;
  for (const st of entity.statuses) {
    const def = STATUS_DEFS[st.type];
    if (!def) continue;
    if (def.fullSkip) return st.type;
    if (def.skipChance && Math.random() < def.skipChance) return st.type;
  }
  return null;
};

// ターン終了時の継続ダメージ処理
// 戻り値: [{ type, dmg }]
export const tickStatuses = (entity) => {
  if (!entity.statuses || entity.statuses.length === 0) return [];
  const results = [];

  entity.statuses = entity.statuses.filter(st => {
    const def = STATUS_DEFS[st.type];
    if (!def) return false;

    // ダメージ計算
    if (st.type === "poison") {
      const dmg = Math.max(1, Math.floor((st.sourceMag || 10) * def.dmgPerStack * st.stacks));
      results.push({ type:"poison", dmg, stacks:st.stacks });
    } else if (st.type === "burn") {
      const dmg = Math.max(1, Math.floor((st.sourceMag || 10) * def.dmgMul));
      results.push({ type:"burn", dmg });
    }

    // ターン減少（永続以外）
    if (!def.permanent) {
      st.turns -= 1;
      if (st.turns <= 0) return false;
    }
    return true;
  });

  return results;
};

// 状態異常の表示用テキスト
export const statusLabel = (st) => {
  const def = STATUS_DEFS[st.type];
  if (!def) return "";
  if (st.type === "poison") return `${def.icon}${def.name}×${st.stacks}`;
  return `${def.icon}${def.name}`;
};