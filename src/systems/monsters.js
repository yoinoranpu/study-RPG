import { rollRarity, rollTitles, TRIBE_MAT } from "./events";

// モンスターベースデータ
export const MONSTER_BASE = [
  { id:"slime", name:"スライム", tribe:"粘体", star:1, hp:25, atk:8, def:5, mag:10, mdef:8, eva:3, crit:2, expMul:1.0, gMul:1.0,
    actions:[{type:"atk",pct:80,label:"体当たり"},{type:"def",pct:10,label:"固まる"},{type:"skip",pct:10,label:"ぐにゃぐにゃ"}]},
  { id:"slime_army", name:"スライム軍団", tribe:"粘体", star:2, hp:40, atk:10, def:8, mag:12, mdef:10, eva:5, crit:2, expMul:1.2, gMul:1.2,
    actions:[{type:"atk",pct:70,label:"集団攻撃"},{type:"matk",pct:20,label:"酸液"},{type:"def",pct:10,label:"合体"}]},
  { id:"giant_slime", name:"巨大スライム", tribe:"粘体", star:3, hp:120, atk:15, def:20, mag:20, mdef:25, eva:2, crit:5, expMul:1.8, gMul:1.8,
    actions:[{type:"atk",pct:60,label:"押しつぶす"},{type:"matk",pct:30,label:"消化液"},{type:"def",pct:10,label:"再生"}]},
  { id:"wolf", name:"オオカミ", tribe:"獣", star:1, hp:35, atk:15, def:6, mag:5, mdef:4, eva:10, crit:6, expMul:1.0, gMul:1.0,
    actions:[{type:"atk",pct:70,label:"噛みつく"},{type:"atk",pct:20,label:"引っかく"},{type:"skip",pct:10,label:"うなる"}]},
  { id:"dire_wolf", name:"ダイアウルフ", tribe:"獣", star:2, hp:60, atk:20, def:10, mag:8, mdef:8, eva:12, crit:8, expMul:1.4, gMul:1.4,
    actions:[{type:"atk",pct:60,label:"強襲"},{type:"atk",pct:30,label:"連続噛みつき"},{type:"def",pct:10,label:"毛を逆立てる"}]},
  { id:"fenrir", name:"フェンリル", tribe:"獣", star:4, hp:150, atk:32, def:20, mag:15, mdef:18, eva:22, crit:15, expMul:2.5, gMul:2.5,
    actions:[{type:"atk",pct:60,label:"神速の一咬み"},{type:"atk",pct:30,label:"暴嵐爪"},{type:"def",pct:10,label:"月に吠える"}]},
  { id:"goblin", name:"ゴブリン", tribe:"ゴブリン", star:1, hp:30, atk:10, def:6, mag:5, mdef:5, eva:5, crit:3, expMul:1.0, gMul:1.2,
    actions:[{type:"atk",pct:70,label:"棍棒"},{type:"atk",pct:20,label:"石投げ"},{type:"skip",pct:10,label:"怯む"}]},
  { id:"goblin_king", name:"ゴブリンキング", tribe:"ゴブリン", star:4, hp:140, atk:28, def:22, mag:18, mdef:18, eva:10, crit:12, expMul:2.2, gMul:2.5,
    actions:[{type:"atk",pct:50,label:"王の一撃"},{type:"matk",pct:30,label:"号令"},{type:"def",pct:20,label:"鎧を纏う"}]},
  { id:"skeleton", name:"スケルトン", tribe:"不死", star:1, hp:40, atk:12, def:12, mag:0, mdef:18, eva:5, crit:5, expMul:1.0, gMul:1.0,
    actions:[{type:"atk",pct:70,label:"骨の剣"},{type:"def",pct:20,label:"骨で防ぐ"},{type:"skip",pct:10,label:"骨が鳴る"}]},
  { id:"death_knight", name:"デスナイト", tribe:"不死", star:4, hp:160, atk:32, def:26, mag:20, mdef:22, eva:10, crit:15, expMul:2.3, gMul:2.3,
    actions:[{type:"atk",pct:50,label:"冥府の剣"},{type:"matk",pct:30,label:"死の波動"},{type:"def",pct:20,label:"不死の鎧"}]},
  { id:"imp", name:"インプ", tribe:"悪魔", star:1, hp:30, atk:10, def:5, mag:18, mdef:10, eva:15, crit:10, expMul:1.1, gMul:1.3,
    actions:[{type:"matk",pct:60,label:"火炎弾"},{type:"atk",pct:30,label:"引っかく"},{type:"skip",pct:10,label:"飛び回る"}]},
  { id:"demon_soldier", name:"魔界兵", tribe:"悪魔", star:4, hp:180, atk:36, def:30, mag:25, mdef:25, eva:10, crit:18, expMul:2.4, gMul:2.4,
    actions:[{type:"atk",pct:50,label:"魔剣撃"},{type:"matk",pct:30,label:"魔界炎"},{type:"def",pct:20,label:"魔鎧展開"}]},
  { id:"moss_slime", name:"苔スライム", tribe:"植物", star:1, hp:45, atk:8, def:15, mag:12, mdef:20, eva:2, crit:2, expMul:1.1, gMul:1.0,
    actions:[{type:"atk",pct:50,label:"胞子攻撃"},{type:"def",pct:30,label:"固まる"},{type:"skip",pct:20,label:"光合成"}]},
  { id:"world_tree", name:"世界樹の苗木", tribe:"植物", star:4, hp:220, atk:15, def:40, mag:38, mdef:50, eva:0, crit:5, expMul:3.0, gMul:3.0,
    actions:[{type:"matk",pct:60,label:"生命の雷"},{type:"def",pct:30,label:"神聖な壁"},{type:"skip",pct:10,label:"根が揺れる"}]},
  { id:"kobold", name:"コボルト", tribe:"竜", star:1, hp:30, atk:10, def:8, mag:5, mdef:6, eva:8, crit:4, expMul:1.1, gMul:1.2,
    actions:[{type:"atk",pct:70,label:"爪攻撃"},{type:"atk",pct:20,label:"噛みつく"},{type:"skip",pct:10,label:"ドラゴンポーズ"}]},
  { id:"fire_dragon", name:"火竜", tribe:"竜", star:3, hp:220, atk:45, def:30, mag:40, mdef:25, eva:12, crit:18, expMul:2.8, gMul:3.2,
    actions:[{type:"matk",pct:50,label:"炎ブレス"},{type:"atk",pct:40,label:"炎爪"},{type:"def",pct:10,label:"炎を纏う"}]},
];
// ─── ボスモンスターデータ ───
export const BOSS_DATA = [
  // B5F〜B35F（既存強化版）
  { floor:5,  baseId:"slime",      name:"大スライム",     hpMul:8,  atkMul:2.0, defMul:1.5 },
  { floor:10, baseId:"skeleton",   name:"骸骨の将",         hpMul:8,  atkMul:2.0, defMul:1.5 },
  { floor:15, baseId:"kobold",     name:"コボルト族長",     hpMul:8,  atkMul:2.0, defMul:1.5 },
  { floor:20, baseId:"moss_slime", name:"古代苔の巨躯",     hpMul:8,  atkMul:2.0, defMul:1.5 },
  { floor:25, baseId:"imp",        name:"魔王の使い",       hpMul:10, atkMul:2.2, defMul:1.8 },
  { floor:30, baseId:"wolf",       name:"白銀の狼王",       hpMul:10, atkMul:2.2, defMul:1.8 },
  { floor:35, baseId:"goblin",     name:"ゴブリン大将",     hpMul:10, atkMul:2.2, defMul:1.8 },
  { floor:40, baseId:"giant_slime",name:"原初の大スライム", hpMul:12, atkMul:2.5, defMul:2.0 },
  { floor:45, baseId:"death_knight",name:"冥府の騎士王",   hpMul:12, atkMul:2.5, defMul:2.0 },
  { floor:50, baseId:"demon_soldier",name:"魔界将軍",       hpMul:12, atkMul:2.5, defMul:2.0 },
  { floor:55, baseId:"world_tree", name:"世界樹の守護者",   hpMul:15, atkMul:2.8, defMul:2.2 },
  { floor:60, baseId:"goblin_king",name:"ゴブリン大王",     hpMul:15, atkMul:2.8, defMul:2.2 },
  { floor:65, baseId:"fenrir",     name:"神狼フェンリル",   hpMul:15, atkMul:2.8, defMul:2.2 },
  { floor:70, baseId:"fire_dragon",name:"炎竜王イフリート", hpMul:18, atkMul:3.0, defMul:2.5 },
  // B75F〜B100F: 専用ボス（将来追加）
  // { floor:75, baseId:null, name:"???", ... },
];

export const getBossData = (floor) => BOSS_DATA.find(b => b.floor === floor);

export const generateBoss = (bossData) => {
  const base = MONSTER_BASE.find(m => m.id === bossData.baseId);
  if (!base) return null;
  return {
    ...base,
    name: bossData.name,
    displayName: bossData.name,
    hp:   Math.floor(base.hp   * bossData.hpMul),
    maxHp:Math.floor(base.hp   * bossData.hpMul),
    atk:  Math.floor(base.atk  * bossData.atkMul),
    def:  Math.floor(base.def  * bossData.defMul),
    mag:  Math.floor(base.mag  * bossData.atkMul),
    mdef: Math.floor(base.mdef * bossData.defMul),
    isBoss: true,
    rarity: { id:"legend", label:"BOSS", color:"#ef4444", mul:1 },
    dangerStar: 10,
    expGain:  Math.floor(base.expGain  * bossData.hpMul * 2),
    goldGain: Math.floor(base.goldGain * bossData.hpMul * 2),
  };
};

export const TRIBES = ["粘体","獣","ゴブリン","不死","悪魔","植物","竜"];


// モンスター生成
export const generateMonster = (base, floor = 1) => {
  const rarity = rollRarity();
  const titles = rollTitles();
  const fm = 1 + (floor - 1) * 0.05;

  let hp   = Math.floor(base.hp   * rarity.mul * fm);
  let atk  = Math.floor(base.atk  * rarity.mul * fm);
  let def  = Math.floor(base.def  * rarity.mul * fm);
  let mag  = Math.floor(base.mag  * rarity.mul * fm);
  let mdef = Math.floor(base.mdef * rarity.mul * fm);
  let eva  = base.eva;
  let crit = base.crit;

  for (const t of titles) {
    if (!t.stat) continue;
    if (t.stat === "def")  def  = Math.floor(def  * (1 + t.bonus));
    if (t.stat === "crit") crit = Math.floor(crit * (1 + t.bonus));
    if (t.stat === "eva")  eva  = Math.floor(eva  * (1 + t.bonus));
    if (t.stat === "atk")  atk  = Math.floor(atk  * (1 + t.bonus));
    if (t.stat === "mdef") mdef = Math.floor(mdef * (1 + t.bonus));
    if (t.stat === "hp")   hp   = Math.floor(hp   * (1 + t.bonus));
    if (t.stat === "mag")  mag  = Math.floor(mag  * (1 + t.bonus));
  }

  const titleLabels = titles.filter(t => t.id !== "none").map(t => t.label);
  const namePrefix  = [rarity.label, ...titleLabels].filter(Boolean).join("・");
  const displayName = namePrefix ? `${namePrefix}の${base.name}` : base.name;
  const rarityScore = { none:0, elite:1, hero:2, legend:3 }[rarity.id] || 0;
  const dangerStar  = Math.min(10, base.star + rarityScore + titles.filter(t => t.id !== "none").length);

  return {
    ...base, hp, maxHp: hp, atk, def, mag, mdef, eva, crit,
    rarity, titles, displayName, dangerStar,
    expGain:  Math.floor(10 * base.expMul * rarity.mul * fm),
    goldGain: Math.floor(20 * base.gMul  * rarity.mul * fm),
    material: TRIBE_MAT[base.tribe] || "素材",
  };
};

// 出現モンスター抽選
export const pickMonsters = (floor = 1) => {
  const tribe = TRIBES[Math.floor(Math.random() * TRIBES.length)];
  const starProbs = [{ star:1, p:0.60 },{ star:2, p:0.25 },{ star:3, p:0.10 },{ star:4, p:0.05 }];
  let r = Math.random(), acc = 0, star = 1;
  for (const s of starProbs) { acc += s.p; if (r < acc) { star = s.star; break; } }

  const pool = MONSTER_BASE.filter(m => m.tribe === tribe && m.star === star);
  const src  = pool.length > 0 ? pool : MONSTER_BASE.filter(m => m.tribe === tribe);
  const base = src[Math.floor(Math.random() * src.length)];
  const result = [generateMonster(base, floor)];

  // 20%で2体出現
  if (Math.random() < 0.20) {
    const base2 = src[Math.floor(Math.random() * src.length)];
    result.push(generateMonster(base2, floor));
  }
  return result;
};