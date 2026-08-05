// ═══════════════════════════════════════════════════════
// スキル書システム
// スキル書 = 装備と同じレアリティ制のアイテム
// アクティブ書（戦闘中発動）・パッシブ書（常時効果）
// レアリティが上がると効果スケール（自動計算）
// ═══════════════════════════════════════════════════════

// ─── レアリティ係数（効果の自動スケール）───
export const BOOK_RARITY_MUL = {
  common:    1.00,
  uncommon:  1.15,
  rare:      1.30,
  epic:      1.50,
  legendary: 1.75,
  mythic:    2.05,
  origin:    2.40,
};

export const BOOK_RARITY_ORDER = ["common","uncommon","rare","epic","legendary","mythic","origin"];

// ─── 合成：次のレアリティ ───
export const nextBookRarity = (r) => BOOK_RARITY_ORDER[BOOK_RARITY_ORDER.indexOf(r) + 1] || null;

// ─── 合成コスト（同じ書×2 → 1つ上のレアリティ）───
export const BOOK_SYNTHESIS_COST = {
  common:    200,
  uncommon:  800,
  rare:      3000,
  epic:      8000,
  legendary: 20000,
  mythic:    50000,
};

// ─── 売却価格 ───
export const BOOK_SELL_PRICE = {
  common:    40,
  uncommon:  120,
  rare:      350,
  epic:      900,
  legendary: 2200,
  mythic:    6000,
  origin:    16000,
};
export const getBookSellPrice = (rarity) => BOOK_SELL_PRICE[rarity] || 40;

export const BOOK_RARITY_COLOR = {
  common:    "#9ca3af",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
  mythic:    "#f87171",
  origin:    "#f472b6",
};

export const BOOK_RARITY_LABEL = {
  common:"コモン", uncommon:"アンコモン", rare:"レア",
  epic:"エピック", legendary:"レジェンド", mythic:"ミシック", origin:"オリジン",
};

// ═══════════════════════════════════════════════════════
// スキル書マスターデータ
// base: コモン時の基準値。実際の効果は base × レアリティ係数
// scaleKeys: レアリティでスケールさせる数値キー
// ═══════════════════════════════════════════════════════

export const SKILL_BOOKS = {
  // ─── アクティブ：剣術系 ───
  sb_slash: {
    id:"sb_slash", name:"斬撃の書", icon:"⚡", type:"active", tree:"sword",
    desc:"ATK倍率で単体物理攻撃",
    active:{ type:"attack", dmgMul:1.8, target:"single" },
    scaleKeys:["dmgMul"],
  },
  sb_spin: {
    id:"sb_spin", name:"旋風斬の書", icon:"🌀", type:"active", tree:"sword",
    desc:"ATK倍率で全体物理攻撃",
    active:{ type:"attack", dmgMul:1.2, target:"all" },
    scaleKeys:["dmgMul"],
  },
  sb_iai: {
    id:"sb_iai", name:"居合の書", icon:"⚔", type:"active", tree:"sword",
    desc:"先制・必中の一撃",
    active:{ type:"attack", dmgMul:2.5, firstStrike:true },
    scaleKeys:["dmgMul"],
  },

  // ─── アクティブ：魔法系 ───
  sb_fireball: {
    id:"sb_fireball", name:"火の玉の書", icon:"🔥", type:"active", tree:"magic",
    desc:"MAG倍率の魔法攻撃・火傷付与",
    active:{ type:"magic", dmgMul:1.8, burn:0.40 },
    scaleKeys:["dmgMul","burn"],
  },
  sb_thunder: {
    id:"sb_thunder", name:"雷撃の書", icon:"⚡", type:"active", tree:"magic",
    desc:"MAG倍率の魔法攻撃・麻痺付与",
    active:{ type:"magic", dmgMul:1.5, paralyze:0.30 },
    scaleKeys:["dmgMul","paralyze"],
  },
  sb_blizzard: {
    id:"sb_blizzard", name:"吹雪の書", icon:"❄", type:"active", tree:"magic",
    desc:"MAG倍率の全体魔法・凍結付与",
    active:{ type:"magic", dmgMul:1.2, target:"all", freeze:0.20 },
    scaleKeys:["dmgMul","freeze"],
  },

  // ─── アクティブ：召喚系 ───
  sb_familiar: {
    id:"sb_familiar", name:"使い魔召喚の書", icon:"👻", type:"active", tree:"magic",
    desc:"使い魔を召喚（後衛・MAG参照）",
    active:{ type:"summon", summonType:"familiar" },
    scaleKeys:[],
  },
  sb_wolf: {
    id:"sb_wolf", name:"オオカミ召喚の書", icon:"🐺", type:"active", tree:"magic",
    desc:"オオカミを召喚（前衛・ATK参照）",
    active:{ type:"summon", summonType:"wolf" },
    scaleKeys:[],
  },
  sb_skeleton: {
    id:"sb_skeleton", name:"スケルトン召喚の書", icon:"💀", type:"active", tree:"magic",
    desc:"スケルトン3体を召喚（前衛・盾役）",
    active:{ type:"summon", summonType:"skeleton", count:3 },
    scaleKeys:[],
  },
  sb_turret: {
    id:"sb_turret", name:"タレット召喚の書", icon:"🔫", type:"active", tree:"bow",
    desc:"タレットを召喚（前衛・ATK参照）",
    active:{ type:"summon", summonType:"turret" },
    scaleKeys:[],
  },

  // ─── アクティブ：弓系 ───
  sb_snipe: {
    id:"sb_snipe", name:"狙撃の書", icon:"🎯", type:"active", tree:"bow",
    desc:"次の1撃のクリ率を大幅上昇",
    active:{ type:"buff", stat:"crit", val:20, duration:1 },
    scaleKeys:["val"],
  },
  sb_rapid: {
    id:"sb_rapid", name:"連射の書", icon:"🏹", type:"active", tree:"bow",
    desc:"ATK倍率で3回攻撃",
    active:{ type:"multiAttack", dmgMul:0.6, hits:3 },
    scaleKeys:["dmgMul"],
  },
  sb_poison_arrow: {
    id:"sb_poison_arrow", name:"毒矢の書", icon:"☠", type:"active", tree:"bow",
    desc:"攻撃＋毒付与",
    active:{ type:"attack", dmgMul:0.8, poison:0.40 },
    scaleKeys:["dmgMul","poison"],
  },

  // ─── アクティブ：盗賊系 ───
  sb_poison_blade: {
    id:"sb_poison_blade", name:"毒手の書", icon:"☠", type:"active", tree:"thief",
    desc:"攻撃＋高確率で毒付与",
    active:{ type:"attack", dmgMul:0.8, poison:0.50 },
    scaleKeys:["dmgMul","poison"],
  },
  sb_kick: {
    id:"sb_kick", name:"蹴りの書", icon:"🦶", type:"active", tree:"thief",
    desc:"防御無視の固定ダメージ",
    active:{ type:"fixedDmg", ignoresDef:true, base:30 },
    scaleKeys:["base"],
  },
  sb_assassinate: {
    id:"sb_assassinate", name:"暗殺の書", icon:"🗡", type:"active", tree:"thief",
    desc:"低HPの敵を確殺（ボスは大ダメージ）",
    active:{ type:"assassinate", threshold:0.20, bossDmg:3.0 },
    scaleKeys:["threshold","bossDmg"],
  },

  // ─── アクティブ：防御系 ───
  sb_guard: {
    id:"sb_guard", name:"ガード構えの書", icon:"🛡", type:"active", tree:"defense",
    desc:"この戦闘中DEF上昇",
    active:{ type:"buff", stat:"def", mul:0.30, scope:"battle" },
    scaleKeys:["mul"],
  },
  sb_counter: {
    id:"sb_counter", name:"カウンターの書", icon:"🔄", type:"active", tree:"defense",
    desc:"被ダメージ時に反撃",
    active:{ type:"counter", dmgMul:1.5, trigger:"onHit" },
    scaleKeys:["dmgMul"],
  },

  // ─── アクティブ：探索系 ───
  sb_trap: {
    id:"sb_trap", name:"罠設置の書", icon:"⚠", type:"active", tree:"explore",
    desc:"確率でスタン・毒を付与",
    active:{ type:"trap", stun:0.30, poison:0.20 },
    scaleKeys:["stun","poison"],
  },

  // ═══════════════════════════════════════════════
  // パッシブ書（常時効果）
  // ═══════════════════════════════════════════════

  // ─── パッシブ：戦闘スケール系 ───
  sb_kenshin: {
    id:"sb_kenshin", name:"研鑽の書", icon:"📈", type:"passive", tree:"sword",
    desc:"攻撃するたびATK上昇（探索中累積）",
    passive:{ scale:"atk", perHit:2, scope:"session" },
    scaleKeys:["perHit"],
  },
  sb_musou: {
    id:"sb_musou", name:"無双の書", icon:"🔥", type:"passive", tree:"sword",
    desc:"敵を倒すたびATK上昇（探索中累積）",
    passive:{ scale:"atk", perKill:5, scope:"session" },
    scaleKeys:["perKill"],
  },
  sb_accumulate: {
    id:"sb_accumulate", name:"魔力蓄積の書", icon:"📈", type:"passive", tree:"magic",
    desc:"呪文を使うたびMAG上昇（探索中累積）",
    passive:{ scale:"mag", perCast:3, scope:"session" },
    scaleKeys:["perCast"],
  },
  sb_wound: {
    id:"sb_wound", name:"傷の怒りの書", icon:"🔥", type:"passive", tree:"defense",
    desc:"ダメージを受けるたびATK上昇（戦闘中）",
    passive:{ scale:"atk", perHit:4, scope:"battle" },
    scaleKeys:["perHit"],
  },
  sb_hawkeye: {
    id:"sb_hawkeye", name:"鷹の目覚醒の書", icon:"👁", type:"passive", tree:"bow",
    desc:"クリティカル時にEVA上昇（戦闘中）",
    passive:{ scale:"eva", perCrit:5, scope:"battle" },
    scaleKeys:["perCrit"],
  },
  sb_snipeeye: {
    id:"sb_snipeeye", name:"狙撃眼の書", icon:"🎯", type:"passive", tree:"bow",
    desc:"ターン経過でクリ率上昇（戦闘中）",
    passive:{ scale:"crit", perTurn:5, scope:"battle" },
    scaleKeys:["perTurn"],
  },
  sb_toxicscale: {
    id:"sb_toxicscale", name:"毒蓄積の書", icon:"📈", type:"passive", tree:"thief",
    desc:"毒ダメージを与えるたびATK上昇（探索中）",
    passive:{ scale:"atk", perPoison:3, scope:"session" },
    scaleKeys:["perPoison"],
  },

  // ─── パッシブ：召喚サポート系 ───
  sb_tactician: {
    id:"sb_tactician", name:"戦術家の書", icon:"⚙", type:"passive", tree:"explore",
    desc:"召喚物が攻撃するたびATK・MAG上昇（探索中）",
    passive:{ scale:"atkMag", perSummonHit:1, scope:"session" },
    scaleKeys:["perSummonHit"],
  },
  sb_commander: {
    id:"sb_commander", name:"指揮官の書", icon:"🔱", type:"passive", tree:"explore",
    desc:"召喚物ATK上昇＋召喚攻撃でATK・MAG上昇",
    passive:{ summonAtkMul:1.5, scale:"atkMag", perSummonHit:2, scope:"session" },
    scaleKeys:["perSummonHit"],
  },

  // ─── パッシブ：生存系 ───
  sb_undying: {
    id:"sb_undying", name:"不屈の書", icon:"💫", type:"passive", tree:"defense",
    desc:"HP0になった時1回だけ耐える",
    passive:{ deathSave:0.10 },
    scaleKeys:["deathSave"],
  },
  sb_tetsuwall: {
    id:"sb_tetsuwall", name:"鉄壁の書", icon:"🏰", type:"passive", tree:"defense",
    desc:"探索中の被ダメージ軽減",
    passive:{ dmgReduction:0.15, scope:"session" },
    scaleKeys:["dmgReduction"],
  },
  sb_shadow: {
    id:"sb_shadow", name:"影移動の書", icon:"🌑", type:"passive", tree:"thief",
    desc:"戦闘で先手確定",
    passive:{ alwaysFirst:true },
    scaleKeys:[],
  },
  sb_heal: {
    id:"sb_heal", name:"回復魔法の書", icon:"💚", type:"passive", tree:"magic",
    desc:"戦闘終了後にHP回復",
    passive:{ healAfterBattle:10 },
    scaleKeys:["healAfterBattle"],
  },

  // ─── パッシブ：収集系 ───
  sb_gold: {
    id:"sb_gold", name:"金運の書", icon:"🪙", type:"passive", tree:"thief",
    desc:"獲得ゴールド増加",
    passive:{ goldBonus:15 },
    scaleKeys:["goldBonus"],
  },
  sb_luck: {
    id:"sb_luck", name:"幸運の書", icon:"🍀", type:"passive", tree:"thief",
    desc:"ドロップ率上昇",
    passive:{ dropBonus:15 },
    scaleKeys:["dropBonus"],
  },
  sb_harvest: {
    id:"sb_harvest", name:"採取の書", icon:"📦", type:"passive", tree:"explore",
    desc:"素材ドロップ率上昇",
    passive:{ dropBonus:20 },
    scaleKeys:["dropBonus"],
  },
  sb_mapper: {
    id:"sb_mapper", name:"地図師の書", icon:"🗺", type:"passive", tree:"explore",
    desc:"マッピング速度上昇",
    passive:{ mapBonus:25 },
    scaleKeys:["mapBonus"],
  },
  sb_treasure: {
    id:"sb_treasure", name:"宝探しの書", icon:"💎", type:"passive", tree:"explore",
    desc:"宝箱出現率上昇",
    passive:{ chestBonus:20 },
    scaleKeys:["chestBonus"],
  },
};

export const SKILL_BOOK_LIST = Object.values(SKILL_BOOKS);

// ─── レアリティ適用後の効果値を取得 ───
export const getBookEffect = (bookId, rarity = "common") => {
  const book = SKILL_BOOKS[bookId];
  if (!book) return null;
  const mul = BOOK_RARITY_MUL[rarity] || 1.0;
  const src = book.active || book.passive || {};
  const scaled = { ...src };
  (book.scaleKeys || []).forEach(key => {
    if (typeof src[key] === "number") {
      // 確率系(1.0以下)は上限1.0でクランプ
      const val = src[key] * mul;
      scaled[key] = (key === "burn" || key === "poison" || key === "paralyze" ||
                     key === "freeze" || key === "stun")
        ? Math.min(1.0, Math.round(val * 100) / 100)
        : Math.round(val * 100) / 100;
    }
  });
  return { ...book, effect: scaled, rarity };
};

// ─── スキル書の個体を生成（uid付き）───
let bookUidCounter = 0;
export const makeBook = (bookId, rarity = "common") => {
  const book = SKILL_BOOKS[bookId];
  if (!book) return null;
  return {
    uid: `book_${Date.now()}_${bookUidCounter++}`,
    id: bookId,
    rarity,
  };
};

// ─── 自然入手（宝箱・ドロップ）のレアリティ抽選 ───
// mythic/origin は合成でのみ入手可能（自然ドロップ対象外）
export const BOOK_DROP_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

const BOOK_DROP_WEIGHT_BY_CHEST = {
  common:   [70, 25, 5,  0,  0],
  uncommon: [45, 35, 18, 2,  0],
  rare:     [20, 35, 30, 13, 2],
  epic:     [10, 25, 30, 25, 10],
};

export const rollBookRarity = (chestRarityId = "common", floor = 1) => {
  const maxTier = floor >= 75 ? 4 : floor >= 50 ? 3 : floor >= 25 ? 2 : floor >= 10 ? 1 : 0;
  const weights = BOOK_DROP_WEIGHT_BY_CHEST[chestRarityId] || BOOK_DROP_WEIGHT_BY_CHEST.common;
  const pool = BOOK_DROP_RARITY_ORDER.slice(0, maxTier + 1);
  const w = pool.map((_, i) => weights[i] || 0);
  const total = w.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * total, acc = 0;
  for (let i = 0; i < pool.length; i++) {
    acc += w[i];
    if (r < acc) return pool[i];
  }
  return pool[0];
};

// ─── ランダムなスキル書idを抽選 ───
export const rollBookId = () => {
  const ids = Object.keys(SKILL_BOOKS);
  return ids[Math.floor(Math.random() * ids.length)];
};

// ─── スキル図鑑：入手済みスキル書を記録（一度入手すれば売却/合成消費後も図鑑には残る）───
export const mergeBookDex = (dex = {}, newBooks = []) => {
  const next = { ...dex };
  newBooks.forEach(b => {
    if (!b) return;
    const rarityIdx = BOOK_RARITY_ORDER.indexOf(b.rarity);
    const cur = next[b.id];
    if (!cur) {
      next[b.id] = { count: 1, bestRarity: b.rarity };
    } else {
      const curIdx = BOOK_RARITY_ORDER.indexOf(cur.bestRarity);
      next[b.id] = { count: cur.count + 1, bestRarity: rarityIdx > curIdx ? b.rarity : cur.bestRarity };
    }
  });
  return next;
};

// ─── セット中パッシブ書のボーナス集計（収集系のみ）───
export const calcBookPassiveBonus = (passiveSlots = [], skillBooks = []) => {
  const bonus = { goldBonus:0, expBonus:0, dropBonus:0, mapBonus:0, chestBonus:0 };
  passiveSlots.forEach(uid => {
    if (!uid) return;
    const owned = skillBooks.find(b => b.uid === uid);
    if (!owned) return;
    const eff = getBookEffect(owned.id, owned.rarity);
    if (!eff?.effect) return;
    ["goldBonus","expBonus","dropBonus","mapBonus","chestBonus"].forEach(k => {
      if (eff.effect[k]) bonus[k] += eff.effect[k];
    });
  });
  return bonus;
};