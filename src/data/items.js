// アイテムデータベース

export const RARITY_COLOR = ["","#a0a0a0","#60a5fa","#a78bfa","#fbbf24","#ef4444"];
export const RARITY_LABEL = ["","★","★★","★★★","★★★★","★★★★★"];

export const ITEM_DB = {
  weapon: [
    { id:"W001", name:"旅人の剣", type:"weapon",    rarity:1, icon:"⚔", atk:8,  mag:0,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"EXP+5%",      desc:"初心者用の軽い剣",      shopWeight:10 },
    { id:"W002", name:"錆びた大剣", type:"weapon",  rarity:1, icon:"⚔", atk:14, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"命中-3%",      desc:"重く錆びついた大剣",    shopWeight:8  },
    { id:"W003", name:"鉄の剣", type:"weapon",      rarity:1, icon:"⚔", atk:10, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:1, sp1:"",             desc:"標準的な剣",            shopWeight:12 },
    { id:"W004", name:"鋼の剣", type:"weapon",      rarity:2, icon:"⚔", atk:15, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:2, sp1:"",             desc:"強化された剣",          shopWeight:10 },
    { id:"W005", name:"狼牙の短剣", type:"weapon",  rarity:3, icon:"🗡", atk:12, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"出血+5%",      desc:"出血付与の短剣",        shopWeight:5  },
    { id:"W006", name:"吸血剣", type:"weapon",      rarity:3, icon:"🩸", atk:14, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"与ダメ5%回復", desc:"吸血する剣",            shopWeight:4  },
    { id:"W007", name:"魔力欠けの杖", type:"weapon",rarity:1, icon:"✨", atk:0,  mag:10, def:0, mdef:0, hp:0, eva:0, crit:1, sp1:"魔法武器",     desc:"魔力が不安定な杖",      shopWeight:8  },
    { id:"W008", name:"魔導短剣", type:"weapon",    rarity:3, icon:"🗡", atk:8,  mag:8,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"物理魔法複合", desc:"ハイブリッドビルド向け",shopWeight:4  },
    { id:"W009", name:"狩人の弓", type:"weapon",    rarity:2, icon:"🏹", atk:11, mag:0,  def:0, mdef:0, hp:0, eva:3, crit:4, sp1:"",             desc:"遠距離狩猟用武器",      shopWeight:8  },
    { id:"W010", name:"火炎剣", type:"weapon",      rarity:3, icon:"🔥", atk:14, mag:0,  def:0, mdef:0, hp:0, eva:0, crit:0, sp1:"炎上付与",     desc:"炎上を付与する剣",      shopWeight:5  },
  ],
  armor: [
    { id:"A001", name:"布の服", type:"armor",      rarity:1, icon:"👘", atk:0, mag:0, def:3,  mdef:3,  hp:0,  eva:2, crit:0, sp1:"",           desc:"初心者用の軽装",        shopWeight:12 },
    { id:"A002", name:"革の鎧", type:"armor",      rarity:1, icon:"🛡", atk:0, mag:0, def:5,  mdef:5,  hp:0,  eva:1, crit:0, sp1:"",           desc:"軽量防具",              shopWeight:12 },
    { id:"A003", name:"鉄の鎧", type:"armor",      rarity:2, icon:"🪖", atk:0, mag:0, def:10, mdef:8,  hp:0,  eva:0, crit:0, sp1:"",           desc:"標準的な鎧",            shopWeight:10 },
    { id:"A004", name:"鋼の鎧", type:"armor",      rarity:3, icon:"🪖", atk:0, mag:0, def:15, mdef:10, hp:10, eva:0, crit:0, sp1:"",           desc:"強化された鎧",          shopWeight:7  },
    { id:"A005", name:"魔導ローブ", type:"armor",  rarity:2, icon:"🔮", atk:0, mag:5, def:5,  mdef:15, hp:0,  eva:0, crit:0, sp1:"",           desc:"魔法職向け防具",        shopWeight:8  },
    { id:"A006", name:"風纏いのローブ", type:"armor",rarity:2,icon:"🌀",atk:0, mag:0, def:5,  mdef:12, hp:0,  eva:3, crit:0, sp1:"",           desc:"魔法回避型装備",        shopWeight:8  },
    { id:"A007", name:"影隠れの外套", type:"armor",rarity:2, icon:"🌑", atk:0, mag:0, def:0,  mdef:0,  hp:0,  eva:8, crit:0, sp1:"",           desc:"回避特化ビルド向け",    shopWeight:6  },
    { id:"A008", name:"竜鱗鎧", type:"armor",      rarity:3, icon:"🐉", atk:0, mag:0, def:18, mdef:10, hp:0,  eva:0, crit:0, sp1:"",           desc:"高耐久バランス型",      shopWeight:4  },
    { id:"A009", name:"冒険者の軽鎧", type:"armor",rarity:2, icon:"🛡", atk:0, mag:0, def:6,  mdef:6,  hp:5,  eva:0, crit:0, sp1:"",           desc:"標準冒険装備",          shopWeight:10 },
    { id:"A010", name:"再生の鎧", type:"armor",    rarity:3, icon:"💚", atk:0, mag:0, def:12, mdef:0,  hp:0,  eva:0, crit:0, sp1:"リジェネ",   desc:"ターン毎HP3%回復",      shopWeight:4  },
  ],
  accessory: [
    { id:"AC001", name:"木の指輪", type:"accessory",    rarity:1, icon:"💍", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:1, sp1:"",            desc:"クリティカル入門",      shopWeight:12 },
    { id:"AC002", name:"初心者の護符", type:"accessory",rarity:1, icon:"📿", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:0, sp1:"EXP+5%",     desc:"成長を助ける護符",      shopWeight:12 },
    { id:"AC003", name:"探索の指輪", type:"accessory",  rarity:2, icon:"💍", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:0, sp1:"ドロップ+2%", desc:"探索補助装備",          shopWeight:8  },
    { id:"AC004", name:"幸運のコイン", type:"accessory",rarity:2, icon:"🪙", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:0, sp1:"ドロップ+3%", desc:"周回効率強化",          shopWeight:8  },
    { id:"AC005", name:"狩人の腕輪", type:"accessory",  rarity:2, icon:"📿", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:2, sp1:"",            desc:"クリティカル強化",      shopWeight:8  },
    { id:"AC006", name:"盗賊の指輪", type:"accessory",  rarity:2, icon:"💍", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:3, crit:0, sp1:"",            desc:"回避ビルド用",          shopWeight:8  },
    { id:"AC007", name:"生命の護符", type:"accessory",  rarity:2, icon:"❤",  atk:0, mag:0, def:0, mdef:0, hp:10, eva:0, crit:0, sp1:"",            desc:"耐久安定化",            shopWeight:8  },
    { id:"AC008", name:"魔力の指輪", type:"accessory",  rarity:3, icon:"💍", atk:0, mag:5, def:0, mdef:0, hp:0,  eva:0, crit:0, sp1:"",            desc:"魔法ビルド基礎強化",    shopWeight:5  },
    { id:"AC009", name:"竜の護符", type:"accessory",    rarity:3, icon:"🐉", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:3, sp1:"ボスドロップ+2%",desc:"中盤〜後半向け",      shopWeight:4  },
    { id:"AC010", name:"旅人の護符", type:"accessory",  rarity:1, icon:"📿", atk:0, mag:0, def:0, mdef:0, hp:0,  eva:0, crit:0, sp1:"EXP+3%",     desc:"バランス育成用",        shopWeight:10 },
  ],
};

// ショップ価格
export const getShopPrice = (item) => ({
  1:100, 2:250, 3:600, 4:1500, 5:5000
}[item.rarity] || 300);

export const getSellPrice = (item) =>
  Math.floor(getShopPrice(item) / 2 + (item.upgradeLevel || 0) * 50);

// 日替わりショップ在庫生成
const RARITY_SHOP_W = [0, 40, 30, 20, 8, 2];

export const generateShopStock = (dateStr) => {
  const seed = dateStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

  const pick = (items, count, off) => {
  const pool = items.filter(it => !it.dropOnly && (it.shopWeight || 0) > 0);
  const picked = [];
  for (let i = 0; i < count; i++) {
    const tw = pool.reduce((s, it) => s + (it.shopWeight || 1) * (RARITY_SHOP_W[it.rarity] || 1), 0);
    let r = rng(seed + off + i * 7) * tw;
    for (const it of pool) {
      r -= (it.shopWeight || 1) * (RARITY_SHOP_W[it.rarity] || 1);
      if (r <= 0 && !picked.find(p => p.id === it.id)) {
        // ここで個体差を付けた商品を生成
        picked.push(makeItem(it));
        break;
      }
    }
    if (picked.length <= i) picked.push(makeItem(pool[Math.floor(rng(seed + i) * pool.length)] || pool[0]));
  }
  return picked.filter(Boolean);
};

  return {
    weapon:    pick(ITEM_DB.weapon,    3, 0),
    armor:     pick(ITEM_DB.armor,     3, 100),
    accessory: pick(ITEM_DB.accessory, 3, 200),
  };
};

// アイテムインスタンス生成

const VARIANCE = 0.15;

const applyVariance = (val) => {
  if (!val || val === 0) return 0;
  
  const r = Math.random();
  
  // 60%: 基本値そのまま
  if (r < 0.60) return val;
  
  // 20%: ±1
  if (r < 0.80) {
    return val + (Math.random() < 0.5 ? 1 : -1);
  }
  
  // 10%: ±2
  if (r < 0.90) {
    return val + (Math.random() < 0.5 ? 2 : -2);
  }
  
  // 5%: ±3
  if (r < 0.95) {
    return val + (Math.random() < 0.5 ? 3 : -3);
  }
  
  // 5%: ±4〜5（レアな大外れ・大当たり）
  const big = 4 + Math.floor(Math.random() * 2);
  return val + (Math.random() < 0.5 ? big : -big);
};

let _uid = 0;
export const makeItem = (tmpl) => ({
  ...tmpl,
  atk:  applyVariance(tmpl.atk),
  mag:  applyVariance(tmpl.mag),
  def:  applyVariance(tmpl.def),
  mdef: applyVariance(tmpl.mdef),
  hp:   applyVariance(tmpl.hp),
  eva:  applyVariance(tmpl.eva),
  crit: applyVariance(tmpl.crit),
  uid: `i${Date.now()}_${_uid++}`,
  upgradeLevel: 0,
  bonuses: {},
});

// 装備ステータス計算
export const getItemStats = (item) => {
  if (!item) return {};
  const s = {
    atk: item.atk || 0, mag: item.mag || 0,
    def: item.def || 0, mdef: item.mdef || 0,
    hp: item.hp || 0, eva: item.eva || 0, crit: item.crit || 0,
  };
  Object.entries(item.bonuses || {}).forEach(([k, v]) => { if (s[k] !== undefined) s[k] += v; });
  return s;
};