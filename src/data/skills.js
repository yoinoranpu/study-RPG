// ═══════════════════════════════════════════════════════
// スキルデータ統合ファイル
// type: "stat"    → 取得時点でステータスに直接反映
// type: "passive" → キャラタブでセット・常時発動
// type: "active"  → キャラタブでセット・戦闘中発動
// ═══════════════════════════════════════════════════════

// ─── スタートノード ───
const START = {
  start: {
    id:"start", name:"冒険者", icon:"⭐", color:"#fbbf24",
    type:"stat", sp:1, req:[],
    desc:"すべての始まり",
    stat:{ hp:10 },
    pos:{ x:0, y:0 },
  },
};

// ─── 剣術系（右上 / -85°〜-35°・基準-60°）───
const SWORD = {
  sw_atk1:  { id:"sw_atk1",  name:"剣の心得I",   icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["start"],   desc:"ATK+3",  stat:{ atk:3 }, pos:{ angle:-60, r:1 } },
  sw_atk2:  { id:"sw_atk2",  name:"剣の心得II",  icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk1"], desc:"ATK+3",  stat:{ atk:3 }, pos:{ angle:-60, r:2 } },
  sw_atk3:  { id:"sw_atk3",  name:"剣の心得III", icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk2"], desc:"ATK+5",  stat:{ atk:5 }, pos:{ angle:-60, r:3 } },
  sw_atk4:  { id:"sw_atk4",  name:"剣術強化I",   icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk3"], desc:"ATK+5",  stat:{ atk:5 }, pos:{ angle:-60, r:4 } },
  sw_atk5:  { id:"sw_atk5",  name:"剣術強化II",  icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk4"], desc:"ATK+8",  stat:{ atk:8 }, pos:{ angle:-60, r:5 } },
  sw_atk6:  { id:"sw_atk6",  name:"剣士の力",    icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk5"], desc:"ATK+1",  stat:{ atk:1 }, pos:{ angle:-60, r:6 } },
  sw_atk7:  { id:"sw_atk7",  name:"剣士の力II",  icon:"⚔", color:"#f87171", type:"stat", sp:1, req:["sw_atk6"], desc:"ATK+1",  stat:{ atk:1 }, pos:{ angle:-60, r:7 } },
  sw_crit1: { id:"sw_crit1", name:"急所狙いI",   icon:"🎯", color:"#fbbf24", type:"stat", sp:1, req:["start"],    desc:"クリ率+2%", stat:{ crit:2 }, pos:{ angle:-74, r:1.4 } },
  sw_crit2: { id:"sw_crit2", name:"急所狙いII",  icon:"🎯", color:"#fbbf24", type:"stat", sp:1, req:["sw_crit1"], desc:"クリ率+2%", stat:{ crit:2 }, pos:{ angle:-76, r:2.2 } },
  sw_crit3: { id:"sw_crit3", name:"急所狙いIII", icon:"🎯", color:"#fbbf24", type:"stat", sp:1, req:["sw_crit2"], desc:"クリ率+3%", stat:{ crit:3 }, pos:{ angle:-78, r:3 } },
  sw_cdmg1: { id:"sw_cdmg1", name:"致命の一撃I", icon:"💥", color:"#fbbf24", type:"stat", sp:1, req:["sw_crit3"], desc:"クリダメ+10%", stat:{ critDmg:10 }, pos:{ angle:-82, r:3.8 } },
  sw_cdmg2: { id:"sw_cdmg2", name:"致命の一撃II",icon:"💥", color:"#fbbf24", type:"stat", sp:1, req:["sw_cdmg1"], desc:"クリダメ+15%", stat:{ critDmg:15 }, pos:{ angle:-84, r:4.6 } },

  sw_slash:   { id:"sw_slash",   name:"斬撃",          icon:"⚡", color:"#f87171", type:"active",  sp:1, req:["sw_atk3"],  desc:"ATK×1.8倍 単体物理攻撃",           active:{ type:"attack", dmgMul:1.8, target:"single" }, pos:{ angle:-48, r:3.2 } },
  sw_spin:    { id:"sw_spin",    name:"旋風斬",        icon:"🌀", color:"#f87171", type:"active",  sp:1, req:["sw_slash"], desc:"ATK×1.2倍 全体物理攻撃",           active:{ type:"attack", dmgMul:1.2, target:"all" },    pos:{ angle:-46, r:4.2 } },
  sw_iai:     { id:"sw_iai",     name:"居合",          icon:"⚡", color:"#ef4444", type:"active",  sp:1, req:["sw_atk2"],  desc:"先制ATK×2.5倍・必中",              active:{ type:"attack", dmgMul:2.5, firstStrike:true }, pos:{ angle:-44, r:2.4 } },
  sw_counter: { id:"sw_counter", name:"カウンター",    icon:"🔄", color:"#f87171", type:"active",  sp:1, req:["sw_crit3"], desc:"被ダメ後に受けたダメ×1.5で反撃",   active:{ type:"counter", dmgMul:1.5, trigger:"onHit" }, pos:{ angle:-70, r:4 } },
  sw_multi:   { id:"sw_multi",   name:"連撃",          icon:"⚔", color:"#f87171", type:"passive", sp:1, req:["sw_atk4"],  desc:"30%で追加攻撃",                     passive:{ multiHit:0.30 },      pos:{ angle:-52, r:5 } },
  sw_mastery: { id:"sw_mastery", name:"武器マスタリー",icon:"⚔", color:"#ef4444", type:"passive", sp:1, req:["sw_atk5"],  desc:"装備ATKの10%を追加ダメージ",        passive:{ weaponMastery:0.10 }, pos:{ angle:-66, r:5.5 } },
  sw_kenshin: { id:"sw_kenshin", name:"研鑽",          icon:"📈", color:"#ef4444", type:"passive", sp:1, req:["sw_atk4"],  desc:"攻撃するたびATK+2・全セット中累積", passive:{ scale:"atk", perHit:2, scope:"session" }, pos:{ angle:-68, r:4.6 } },

  sw_kensei: { id:"sw_kensei", name:"剣聖", icon:"👑", color:"#ef4444", type:"passive", sp:1, req:["sw_atk7","sw_mastery"], desc:"ATK+30% クリ率+10% DEF-20%",            passive:{ atk:30, crit:10, def:-20 },             pos:{ angle:-60, r:8 } },
  sw_musou:  { id:"sw_musou",  name:"無双", icon:"🔥", color:"#ef4444", type:"passive", sp:1, req:["sw_kensei"],            desc:"敵を倒すたびATK+5・全セット中・上限なし", passive:{ scale:"atk", perKill:5, scope:"session" }, pos:{ angle:-60, r:9 } },
};

// ─── 防御系（右 / -25°〜25°・基準0°）───
const DEFENSE = {
  df_def1:  { id:"df_def1",  name:"防御の心得I",  icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["start"],   desc:"DEF+3", stat:{ def:3 }, pos:{ angle:0, r:1 } },
  df_def2:  { id:"df_def2",  name:"防御の心得II", icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def1"], desc:"DEF+3", stat:{ def:3 }, pos:{ angle:0, r:2 } },
  df_def3:  { id:"df_def3",  name:"防御強化I",    icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def2"], desc:"DEF+5", stat:{ def:5 }, pos:{ angle:0, r:3 } },
  df_def4:  { id:"df_def4",  name:"防御強化II",   icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def3"], desc:"DEF+5", stat:{ def:5 }, pos:{ angle:0, r:4 } },
  df_def5:  { id:"df_def5",  name:"防御強化III",  icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def4"], desc:"DEF+8", stat:{ def:8 }, pos:{ angle:0, r:5 } },
  df_def6:  { id:"df_def6",  name:"砦の守り",     icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def5"], desc:"DEF+1", stat:{ def:1 }, pos:{ angle:0, r:6 } },
  df_def7:  { id:"df_def7",  name:"砦の守りII",   icon:"🛡", color:"#60a5fa", type:"stat", sp:1, req:["df_def6"], desc:"DEF+1", stat:{ def:1 }, pos:{ angle:0, r:7 } },
  df_hp1:   { id:"df_hp1",   name:"生命力I",      icon:"❤", color:"#fb923c", type:"stat", sp:1, req:["start"],   desc:"HP+20", stat:{ hp:20 }, pos:{ angle:14, r:1.4 } },
  df_hp2:   { id:"df_hp2",   name:"生命力II",     icon:"❤", color:"#fb923c", type:"stat", sp:1, req:["df_hp1"],  desc:"HP+20", stat:{ hp:20 }, pos:{ angle:16, r:2.2 } },
  df_hp3:   { id:"df_hp3",   name:"生命力III",    icon:"❤", color:"#fb923c", type:"stat", sp:1, req:["df_hp2"],  desc:"HP+30", stat:{ hp:30 }, pos:{ angle:18, r:3 } },
  df_both1: { id:"df_both1", name:"鋼の肉体",     icon:"💪", color:"#60a5fa", type:"stat", sp:1, req:["df_def2"], desc:"DEF+3 MDEF+3", stat:{ def:3, mdef:3 }, pos:{ angle:-8, r:2.6 } },
  df_both2: { id:"df_both2", name:"全耐性",       icon:"💪", color:"#60a5fa", type:"stat", sp:1, req:["df_both1"],desc:"DEF+5 MDEF+5", stat:{ def:5, mdef:5 }, pos:{ angle:-8, r:3.6 } },
  df_mdef1: { id:"df_mdef1", name:"魔法防御I",    icon:"🔮", color:"#38bdf8", type:"stat", sp:1, req:["df_def1"], desc:"MDEF+3", stat:{ mdef:3 }, pos:{ angle:-16, r:1.8 } },
  df_mdef2: { id:"df_mdef2", name:"魔法防御II",   icon:"🔮", color:"#38bdf8", type:"stat", sp:1, req:["df_mdef1"],desc:"MDEF+5", stat:{ mdef:5 }, pos:{ angle:-18, r:2.6 } },

  df_guard:    { id:"df_guard",    name:"ガード構え",   icon:"🛡", color:"#60a5fa", type:"active",  sp:1, req:["df_def3"], desc:"この戦闘中DEF+30%",              active:{ type:"buff", stat:"def", mul:0.30, scope:"battle" }, pos:{ angle:-12, r:4 } },
  df_counter:  { id:"df_counter",  name:"カウンター盾", icon:"🔄", color:"#60a5fa", type:"active",  sp:1, req:["df_def4"], desc:"被ダメ×1.5で反撃",               active:{ type:"counter", dmgMul:1.5, trigger:"onHit" }, pos:{ angle:10, r:4.4 } },
  df_tetsuwall:{ id:"df_tetsuwall",name:"鉄壁",         icon:"🏰", color:"#60a5fa", type:"passive", sp:1, req:["df_def4"], desc:"この全セット被ダメ-15%",         passive:{ dmgReduction:0.15, scope:"session" }, pos:{ angle:-6, r:5 } },
  df_reflect:  { id:"df_reflect",  name:"反撃の誓い",   icon:"⚡", color:"#60a5fa", type:"passive", sp:1, req:["df_hp3"],  desc:"HP50%以下でATK+20%",             passive:{ lowHpAtk:0.20, threshold:0.50 }, pos:{ angle:20, r:3.8 } },
  df_undying:  { id:"df_undying",  name:"不屈",         icon:"💫", color:"#fb923c", type:"passive", sp:1, req:["df_hp3"],  desc:"HP0になった時1回だけHP10%で耐える", passive:{ deathSave:0.10 }, pos:{ angle:22, r:4.6 } },
  df_wound:    { id:"df_wound",    name:"傷の怒り",     icon:"🔥", color:"#ef4444", type:"passive", sp:1, req:["df_def5"], desc:"ダメ受けるたびATK+4・戦闘中累積", passive:{ scale:"atk", perHit:4, scope:"battle" }, pos:{ angle:-20, r:4.4 } },
  df_shield:   { id:"df_shield",   name:"盾マスタリー", icon:"🛡", color:"#60a5fa", type:"passive", sp:1, req:["df_def3","sw_atk3"], desc:"装備DEFの15%をATKに加算", passive:{ defToAtk:0.15 }, pos:{ angle:-30, r:4 } },

  df_fortress: { id:"df_fortress", name:"不動の砦", icon:"👑", color:"#60a5fa", type:"passive", sp:1, req:["df_def7","df_tetsuwall"], desc:"DEF+40% HP+100 ATK-20%", passive:{ def:40, hp:100, atk:-20 }, pos:{ angle:0, r:8 } },
  df_oath:     { id:"df_oath",     name:"盾の誓い", icon:"🔱", color:"#60a5fa", type:"passive", sp:1, req:["df_fortress"],             desc:"DEFの30%をATKに恒久加算", passive:{ defToAtk:0.30 },           pos:{ angle:0, r:9 } },
};

// ─── 弓系（右下 / 35°〜85°・基準60°）───
const BOW = {
  bw_crit1: { id:"bw_crit1", name:"鷹の目I",    icon:"👁", color:"#fbbf24", type:"stat", sp:1, req:["start"],    desc:"クリ率+3%", stat:{ crit:3 }, pos:{ angle:60, r:1 } },
  bw_crit2: { id:"bw_crit2", name:"鷹の目II",   icon:"👁", color:"#fbbf24", type:"stat", sp:1, req:["bw_crit1"], desc:"クリ率+3%", stat:{ crit:3 }, pos:{ angle:60, r:2 } },
  bw_crit3: { id:"bw_crit3", name:"鷹の目III",  icon:"👁", color:"#fbbf24", type:"stat", sp:1, req:["bw_crit2"], desc:"クリ率+5%", stat:{ crit:5 }, pos:{ angle:60, r:3 } },
  bw_key1:  { id:"bw_key1",  name:"弓王の素質", icon:"🏹", color:"#34d399", type:"stat", sp:1, req:["bw_snipe"], desc:"ATK+1 クリ率+1%", stat:{ atk:1, crit:1 }, pos:{ angle:60, r:5 } },
  bw_key2:  { id:"bw_key2",  name:"弓王の素質II",icon:"🏹",color:"#34d399", type:"stat", sp:1, req:["bw_key1"],  desc:"ATK+1 クリ率+1%", stat:{ atk:1, crit:1 }, pos:{ angle:60, r:6 } },
  bw_atk1:  { id:"bw_atk1",  name:"弓の心得I",  icon:"🏹", color:"#34d399", type:"stat", sp:1, req:["start"],    desc:"ATK+3", stat:{ atk:3 }, pos:{ angle:46, r:1.4 } },
  bw_atk2:  { id:"bw_atk2",  name:"弓の心得II", icon:"🏹", color:"#34d399", type:"stat", sp:1, req:["bw_atk1"],  desc:"ATK+3", stat:{ atk:3 }, pos:{ angle:44, r:2.2 } },
  bw_atk3:  { id:"bw_atk3",  name:"弓術強化",   icon:"🏹", color:"#34d399", type:"stat", sp:1, req:["bw_atk2"],  desc:"ATK+5", stat:{ atk:5 }, pos:{ angle:46, r:3 } },
  bw_eva1:  { id:"bw_eva1",  name:"身軽I",      icon:"💨", color:"#34d399", type:"stat", sp:1, req:["start"],    desc:"EVA+2%", stat:{ eva:2 }, pos:{ angle:74, r:1.4 } },
  bw_eva2:  { id:"bw_eva2",  name:"身軽II",     icon:"💨", color:"#34d399", type:"stat", sp:1, req:["bw_eva1"],  desc:"EVA+3%", stat:{ eva:3 }, pos:{ angle:76, r:2.2 } },
  bw_cdmg1: { id:"bw_cdmg1", name:"貫通射撃I",  icon:"💥", color:"#fbbf24", type:"stat", sp:1, req:["bw_crit2"], desc:"クリダメ+10%", stat:{ critDmg:10 }, pos:{ angle:68, r:2.8 } },
  bw_cdmg2: { id:"bw_cdmg2", name:"貫通射撃II", icon:"💥", color:"#fbbf24", type:"stat", sp:1, req:["bw_cdmg1"], desc:"クリダメ+15%", stat:{ critDmg:15 }, pos:{ angle:70, r:3.6 } },
  bd_bridge:{ id:"bd_bridge",name:"回避の型",   icon:"🛡", color:"#4ade80", type:"stat", sp:1, req:["df_hp2","bw_eva1"], desc:"DEF+3 EVA+2%", stat:{ def:3, eva:2 }, pos:{ angle:30, r:2.8 } },

  bw_snipe:    { id:"bw_snipe",    name:"狙撃",       icon:"🎯", color:"#34d399", type:"active",  sp:1, req:["bw_crit3"], desc:"クリ率+20% 次の1撃",           active:{ type:"buff", stat:"crit", val:20, duration:1 }, pos:{ angle:60, r:4 } },
  bw_rapid:    { id:"bw_rapid",    name:"連射",       icon:"🏹", color:"#34d399", type:"active",  sp:1, req:["bw_atk3"],  desc:"ATK×0.6倍を3回攻撃",           active:{ type:"multiAttack", dmgMul:0.6, hits:3 }, pos:{ angle:44, r:4 } },
  bw_poison:   { id:"bw_poison",   name:"毒矢",       icon:"☠", color:"#34d399", type:"active",  sp:1, req:["bw_eva2"],  desc:"毒付与40%",                     active:{ type:"attack", dmgMul:0.8, poison:0.40 }, pos:{ angle:78, r:3 } },
  bw_turret:   { id:"bw_turret",   name:"タレット召喚",icon:"🔫",color:"#34d399", type:"active",  sp:1, req:["bw_atk3","ex_drop1"], desc:"毎ターンATK×0.3倍追加攻撃・前衛", active:{ type:"summon", summonType:"turret" }, pos:{ angle:88, r:3.6 } },
  bw_hawkeye:  { id:"bw_hawkeye",  name:"鷹の目覚醒", icon:"👁", color:"#22c55e", type:"passive", sp:1, req:["bw_crit3"], desc:"クリ時EVA+5%・戦闘中累積",      passive:{ scale:"eva", perCrit:5, scope:"battle" }, pos:{ angle:52, r:3.6 } },
  bw_snipeeye: { id:"bw_snipeeye", name:"狙撃眼",     icon:"🎯", color:"#22c55e", type:"passive", sp:1, req:["bw_cdmg2"], desc:"ターン経過でクリ率+5%・戦闘中", passive:{ scale:"crit", perTurn:5, scope:"battle" }, pos:{ angle:66, r:4.4 } },
  bw_dodge:    { id:"bw_dodge",    name:"回避射撃",   icon:"💨", color:"#34d399", type:"passive", sp:1, req:["bw_eva2"],  desc:"EVA成功時にATK×1.0倍反撃",      passive:{ evaCounter:1.0 }, pos:{ angle:72, r:4.4 } },

  bw_hawkking: { id:"bw_hawkking", name:"鷹王",     icon:"👑", color:"#22c55e", type:"passive", sp:1, req:["bw_key2","bw_snipeeye"], desc:"クリ率+25% クリダメ+50% HP-20%", passive:{ crit:25, critDmg:50, hp:-20 }, pos:{ angle:60, r:7 } },
  bw_perfect:  { id:"bw_perfect",  name:"完全回避", icon:"🌟", color:"#22c55e", type:"passive", sp:1, req:["bw_hawkking"],            desc:"EVAが高いほど被ダメ軽減率上昇",   passive:{ evaScaling:true },             pos:{ angle:60, r:8 } },
};

// ─── 探索系（左下 / 95°〜145°・基準120°）───
const EXPLORE = {
  ex_drop1: { id:"ex_drop1", name:"採取I",       icon:"📦", color:"#fb923c", type:"stat", sp:1, req:["start"],    desc:"ドロップ率+5%",  stat:{ dropBonus:5 },  pos:{ angle:120, r:1 } },
  ex_drop2: { id:"ex_drop2", name:"採取II",      icon:"📦", color:"#fb923c", type:"stat", sp:1, req:["ex_drop1"], desc:"ドロップ率+5%",  stat:{ dropBonus:5 },  pos:{ angle:120, r:2 } },
  ex_drop3: { id:"ex_drop3", name:"採取III",     icon:"📦", color:"#fb923c", type:"stat", sp:1, req:["ex_drop2"], desc:"ドロップ率+10%", stat:{ dropBonus:10 }, pos:{ angle:120, r:3 } },
  ex_key1:  { id:"ex_key1",  name:"探窟家の素質",icon:"🗺", color:"#fb923c", type:"stat", sp:1, req:["ex_harvest"],desc:"マップ+5% ドロップ+5%", stat:{ mapBonus:5, dropBonus:5 }, pos:{ angle:120, r:5 } },
  ex_key2:  { id:"ex_key2",  name:"探窟家の素質II",icon:"🗺",color:"#fb923c",type:"stat", sp:1, req:["ex_key1"],  desc:"マップ+5% ドロップ+5%", stat:{ mapBonus:5, dropBonus:5 }, pos:{ angle:120, r:6 } },
  ex_map1:  { id:"ex_map1",  name:"探索眼I",     icon:"🗺", color:"#fb923c", type:"stat", sp:1, req:["start"],    desc:"マップ速度+5%",  stat:{ mapBonus:5 },  pos:{ angle:132, r:1.4 } },
  ex_map2:  { id:"ex_map2",  name:"探索眼II",    icon:"🗺", color:"#fb923c", type:"stat", sp:1, req:["ex_map1"],  desc:"マップ速度+5%",  stat:{ mapBonus:5 },  pos:{ angle:134, r:2.2 } },
  ex_map3:  { id:"ex_map3",  name:"探索眼III",   icon:"🗺", color:"#fb923c", type:"stat", sp:1, req:["ex_map2"],  desc:"マップ速度+10%", stat:{ mapBonus:10 }, pos:{ angle:136, r:3 } },
  ex_chest1:{ id:"ex_chest1",name:"宝探しI",     icon:"💎", color:"#fbbf24", type:"stat", sp:1, req:["start"],    desc:"宝箱出現率+5%",  stat:{ chestBonus:5 }, pos:{ angle:142, r:1.6 } },
  ex_chest2:{ id:"ex_chest2",name:"宝探しII",    icon:"💎", color:"#fbbf24", type:"stat", sp:1, req:["ex_chest1"],desc:"宝箱出現率+5%",  stat:{ chestBonus:5 }, pos:{ angle:144, r:2.4 } },
  ex_gold1: { id:"ex_gold1", name:"金運I",       icon:"🪙", color:"#fbbf24", type:"stat", sp:1, req:["start"],    desc:"G獲得+8%",       stat:{ goldBonus:8 },  pos:{ angle:104, r:1.4 } },
  ex_gold2: { id:"ex_gold2", name:"金運II",      icon:"🪙", color:"#fbbf24", type:"stat", sp:1, req:["ex_gold1"], desc:"G獲得+8%",       stat:{ goldBonus:8 },  pos:{ angle:102, r:2.2 } },
  ex_atk1:  { id:"ex_atk1",  name:"兵站I",       icon:"⚙", color:"#fb923c", type:"stat", sp:1, req:["ex_drop2"], desc:"ATK+1 MAG+1",    stat:{ atk:1, mag:1 }, pos:{ angle:112, r:2.8 } },
  ex_atk2:  { id:"ex_atk2",  name:"兵站II",      icon:"⚙", color:"#fb923c", type:"stat", sp:1, req:["ex_atk1"],  desc:"ATK+1 MAG+1",    stat:{ atk:1, mag:1 }, pos:{ angle:112, r:3.8 } },

  ex_harvest:  { id:"ex_harvest",  name:"採取強化",     icon:"📦", color:"#fb923c", type:"passive", sp:1, req:["ex_drop3"], desc:"素材ドロップ+20%", passive:{ dropBonus:20 }, pos:{ angle:120, r:4 } },
  ex_mapper:   { id:"ex_mapper",   name:"地図師",       icon:"🗺", color:"#fb923c", type:"passive", sp:1, req:["ex_map3"],  desc:"マップ速度+25%",   passive:{ mapBonus:25 },  pos:{ angle:138, r:4 } },
  ex_scroll:   { id:"ex_scroll",   name:"魔法スクロール",icon:"📜",color:"#a78bfa", type:"active",  sp:1, req:["ex_drop3"], desc:"ランダム魔法効果発動", active:{ type:"scroll", random:true }, pos:{ angle:108, r:4.2 } },
  ex_trap:     { id:"ex_trap",     name:"罠設置",       icon:"⚠", color:"#fb923c", type:"active",  sp:1, req:["ex_map3","th_eva2"], desc:"確率でスタン・毒付与", active:{ type:"trap", stun:0.30, poison:0.20 }, pos:{ angle:150, r:3 } },
  ex_tactician:{ id:"ex_tactician",name:"戦術家",       icon:"⚙", color:"#f59e0b", type:"passive", sp:1, req:["ex_atk2"],  desc:"召喚物が攻撃するたびATK+1・MAG+1・全セット", passive:{ scale:"atkMag", perSummonHit:1, scope:"session" }, pos:{ angle:112, r:4.8 } },
  ex_supply:   { id:"ex_supply",   name:"補給線",       icon:"🔗", color:"#fb923c", type:"passive", sp:1, req:["ex_gold2"], desc:"召喚物生存中EXP・G獲得+10%", passive:{ summonBonus:{ exp:10, gold:10 } }, pos:{ angle:100, r:3 } },
  ex_discovery:{ id:"ex_discovery",name:"発見の喜び",   icon:"✨", color:"#fbbf24", type:"passive", sp:1, req:["ex_chest2"],desc:"新フロアごとにドロップ+2%・永続", passive:{ scale:"drop", perFloor:2, scope:"permanent" }, pos:{ angle:144, r:3.4 } },

  ex_wanderer: { id:"ex_wanderer", name:"放浪者", icon:"👑", color:"#fb923c", type:"passive", sp:1, req:["ex_key2","ex_mapper"], desc:"マップ+30% ドロップ+30% 宝箱+20%", passive:{ mapBonus:30, dropBonus:30, chestBonus:20 }, pos:{ angle:120, r:7 } },
  ex_commander:{ id:"ex_commander",name:"指揮官", icon:"🔱", color:"#f59e0b", type:"passive", sp:1, req:["ex_wanderer"],           desc:"召喚物ATK+50% 召喚物が攻撃するたびATK+2・MAG+2", passive:{ summonAtkMul:1.5, scale:"atkMag", perSummonHit:2, scope:"session" }, pos:{ angle:120, r:8 } },
};

// ─── 盗賊系（左 / 155°〜205°・基準180°）───
const THIEF = {
  th_eva1:  { id:"th_eva1",  name:"俊足I",       icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["start"],    desc:"EVA+2%", stat:{ eva:2 }, pos:{ angle:180, r:1 } },
  th_eva2:  { id:"th_eva2",  name:"俊足II",      icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["th_eva1"],  desc:"EVA+2%", stat:{ eva:2 }, pos:{ angle:180, r:2 } },
  th_eva3:  { id:"th_eva3",  name:"俊足III",     icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["th_eva2"],  desc:"EVA+3%", stat:{ eva:3 }, pos:{ angle:180, r:3 } },
  th_eva4:  { id:"th_eva4",  name:"疾風",        icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["th_eva3"],  desc:"EVA+5%", stat:{ eva:5 }, pos:{ angle:180, r:4 } },
  th_key1:  { id:"th_key1",  name:"影の素質",    icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["th_eva4"],  desc:"EVA+1%", stat:{ eva:1 }, pos:{ angle:180, r:5 } },
  th_key2:  { id:"th_key2",  name:"影の素質II",  icon:"💨", color:"#a78bfa", type:"stat", sp:1, req:["th_key1"],  desc:"EVA+1%", stat:{ eva:1 }, pos:{ angle:180, r:6 } },
  th_crit1: { id:"th_crit1", name:"急所I",       icon:"🎯", color:"#a78bfa", type:"stat", sp:1, req:["start"],    desc:"クリ率+2%", stat:{ crit:2 }, pos:{ angle:166, r:1.4 } },
  th_crit2: { id:"th_crit2", name:"急所II",      icon:"🎯", color:"#a78bfa", type:"stat", sp:1, req:["th_crit1"], desc:"クリ率+3%", stat:{ crit:3 }, pos:{ angle:164, r:2.2 } },
  th_cdmg1: { id:"th_cdmg1", name:"致命打I",     icon:"💥", color:"#a78bfa", type:"stat", sp:1, req:["th_crit2"], desc:"クリダメ+10%", stat:{ critDmg:10 }, pos:{ angle:162, r:3 } },
  th_atk1:  { id:"th_atk1",  name:"短刀術I",     icon:"🗡", color:"#a78bfa", type:"stat", sp:1, req:["start"],    desc:"ATK+3", stat:{ atk:3 }, pos:{ angle:158, r:1.6 } },
  th_atk2:  { id:"th_atk2",  name:"短刀術II",    icon:"🗡", color:"#a78bfa", type:"stat", sp:1, req:["th_atk1"],  desc:"ATK+3", stat:{ atk:3 }, pos:{ angle:158, r:2.4 } },
  th_gold1: { id:"th_gold1", name:"小遣い稼ぎI", icon:"🪙", color:"#fbbf24", type:"stat", sp:1, req:["start"],    desc:"G獲得+8%", stat:{ goldBonus:8 }, pos:{ angle:194, r:1.4 } },
  th_gold2: { id:"th_gold2", name:"小遣い稼ぎII",icon:"🪙", color:"#fbbf24", type:"stat", sp:1, req:["th_gold1"], desc:"G獲得+8%", stat:{ goldBonus:8 }, pos:{ angle:196, r:2.2 } },
  th_poison:{ id:"th_poison",name:"毒知識I",     icon:"☠", color:"#a78bfa", type:"stat", sp:1, req:["th_atk2"],  desc:"毒ダメ+5%", stat:{ poisonBonus:5 }, pos:{ angle:202, r:2.6 } },

  th_shadow:  { id:"th_shadow",  name:"影移動", icon:"🌑", color:"#a78bfa", type:"passive", sp:1, req:["th_eva4"],  desc:"先攻確定",                 passive:{ alwaysFirst:true }, pos:{ angle:172, r:5 } },
  th_luck:    { id:"th_luck",    name:"幸運",   icon:"🍀", color:"#fbbf24", type:"passive", sp:1, req:["th_gold2"], desc:"ドロップ率+15%",           passive:{ dropBonus:15 }, pos:{ angle:198, r:3 } },
  th_money:   { id:"th_money",   name:"金運",   icon:"💰", color:"#fbbf24", type:"passive", sp:1, req:["th_luck"],  desc:"G獲得+25% 宝箱出現率+10%", passive:{ goldBonus:25, chestBonus:10 }, pos:{ angle:198, r:4 } },
  th_poisonblade:{ id:"th_poisonblade",name:"毒手",icon:"☠",color:"#a78bfa", type:"active", sp:1, req:["th_poison"],desc:"毒付与50% 継続ダメージ",   active:{ type:"attack", dmgMul:0.8, poison:0.50 }, pos:{ angle:204, r:3.4 } },
  th_kick:    { id:"th_kick",    name:"蹴り",   icon:"🦶", color:"#a78bfa", type:"active",  sp:1, req:["th_atk2"],  desc:"DEF無視固定ダメージ",      active:{ type:"fixedDmg", ignoresDef:true, base:30 }, pos:{ angle:156, r:3 } },
  th_toxicscale:{ id:"th_toxicscale",name:"毒蓄積",icon:"📈",color:"#8b5cf6",type:"passive", sp:1, req:["th_poisonblade","mg_mag2"], desc:"毒ダメ与えるたびATK+3・全セット", passive:{ scale:"atk", perPoison:3, scope:"session" }, pos:{ angle:210, r:4 } },
  th_vital:   { id:"th_vital",   name:"急所",   icon:"🎯", color:"#a78bfa", type:"passive", sp:1, req:["th_crit2"], desc:"クリ時に追加でATK×0.5倍",  passive:{ critBonus:0.5 }, pos:{ angle:168, r:3.2 } },

  th_shadowking:{ id:"th_shadowking",name:"影の王",icon:"👑",color:"#8b5cf6", type:"passive", sp:1, req:["th_key2","th_shadow"], desc:"EVA+20% G獲得+50% HP-20%", passive:{ eva:20, goldBonus:50, hp:-20 }, pos:{ angle:180, r:7 } },
  th_assassin:  { id:"th_assassin",  name:"暗殺",  icon:"☠", color:"#8b5cf6", type:"active",  sp:1, req:["th_shadowking"],        desc:"敵HP20%以下で確殺（ボス: HP30%以下でダメ×3.0倍）", active:{ type:"assassinate", threshold:0.20, bossDmg:3.0 }, pos:{ angle:180, r:8 } },
};

// ─── 魔法系（左上 / 215°〜265°・基準240°）───
const MAGIC = {
  mg_mag1:  { id:"mg_mag1",  name:"魔力の心得I",  icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["start"],   desc:"MAG+3", stat:{ mag:3 }, pos:{ angle:240, r:1 } },
  mg_mag2:  { id:"mg_mag2",  name:"魔力の心得II", icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["mg_mag1"], desc:"MAG+3", stat:{ mag:3 }, pos:{ angle:240, r:2 } },
  mg_mag3:  { id:"mg_mag3",  name:"魔力強化I",    icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["mg_mag2"], desc:"MAG+5", stat:{ mag:5 }, pos:{ angle:240, r:3 } },
  mg_mag4:  { id:"mg_mag4",  name:"魔力強化II",   icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["mg_mag3"], desc:"MAG+5", stat:{ mag:5 }, pos:{ angle:240, r:4 } },
  mg_mag5:  { id:"mg_mag5",  name:"魔力強化III",  icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["mg_mag4"], desc:"MAG+8", stat:{ mag:8 }, pos:{ angle:240, r:5 } },
  mg_mag6:  { id:"mg_mag6",  name:"大魔道の素質", icon:"✨", color:"#c084fc", type:"stat", sp:1, req:["mg_mag5"], desc:"MAG+1", stat:{ mag:1 }, pos:{ angle:240, r:6 } },
  mg_mag7:  { id:"mg_mag7",  name:"大魔道の素質II",icon:"✨",color:"#c084fc", type:"stat", sp:1, req:["mg_mag6"], desc:"MAG+1", stat:{ mag:1 }, pos:{ angle:240, r:7 } },
  mg_mdef1: { id:"mg_mdef1", name:"魔法防御I",    icon:"🔮", color:"#38bdf8", type:"stat", sp:1, req:["start"],   desc:"MDEF+3", stat:{ mdef:3 }, pos:{ angle:226, r:1.6 } },
  mg_mdef2: { id:"mg_mdef2", name:"魔法防御II",   icon:"🔮", color:"#38bdf8", type:"stat", sp:1, req:["mg_mdef1"],desc:"MDEF+5", stat:{ mdef:5 }, pos:{ angle:224, r:2.4 } },
  mg_crit1: { id:"mg_crit1", name:"魔法急所I",    icon:"💫", color:"#c084fc", type:"stat", sp:1, req:["mg_mag2"], desc:"クリ率+2%", stat:{ crit:2 }, pos:{ angle:254, r:1.8 } },
  mg_crit2: { id:"mg_crit2", name:"魔法急所II",   icon:"💫", color:"#c084fc", type:"stat", sp:1, req:["mg_crit1"],desc:"クリ率+3%", stat:{ crit:3 }, pos:{ angle:256, r:2.6 } },
  mg_heal1: { id:"mg_heal1", name:"回復魔法I",    icon:"💚", color:"#4ade80", type:"stat", sp:1, req:["mg_mag2","sw_atk2"], desc:"戦闘後HP+5%回復", stat:{ healAfterBattle:5 }, pos:{ angle:266, r:2.6 } },
  mg_heal2: { id:"mg_heal2", name:"回復魔法II",   icon:"💚", color:"#4ade80", type:"stat", sp:1, req:["mg_heal1"], desc:"戦闘後HP+10%回復", stat:{ healAfterBattle:10 }, pos:{ angle:270, r:3.4 } },

  mg_fireball: { id:"mg_fireball", name:"火の玉",       icon:"🔥", color:"#ef4444", type:"active",  sp:1, req:["mg_mag3"],    desc:"MAG×1.8倍 火傷付与",         active:{ type:"magic", dmgMul:1.8, burn:0.40 }, pos:{ angle:250, r:3.6 } },
  mg_thunder:  { id:"mg_thunder",  name:"雷撃",         icon:"⚡", color:"#fbbf24", type:"active",  sp:1, req:["mg_fireball"],desc:"MAG×1.5倍 麻痺付与30%",      active:{ type:"magic", dmgMul:1.5, paralyze:0.30 }, pos:{ angle:248, r:4.6 } },
  mg_blizzard: { id:"mg_blizzard", name:"吹雪",         icon:"❄", color:"#38bdf8", type:"active",  sp:1, req:["mg_mag4"],    desc:"MAG×1.2倍 全体 凍結20%",     active:{ type:"magic", dmgMul:1.2, target:"all", freeze:0.20 }, pos:{ angle:234, r:4.6 } },
  mg_familiar: { id:"mg_familiar", name:"使い魔召喚",   icon:"👻", color:"#c084fc", type:"active",  sp:1, req:["mg_mag3"],    desc:"毎ターンMAG×0.4倍・後衛攻撃", active:{ type:"summon", summonType:"familiar" }, pos:{ angle:222, r:3 } },
  mg_wolf:     { id:"mg_wolf",     name:"オオカミ召喚", icon:"🐺", color:"#c084fc", type:"active",  sp:1, req:["mg_familiar"],desc:"HP50 毎ターンATK×0.6倍・前衛", active:{ type:"summon", summonType:"wolf" }, pos:{ angle:220, r:4 } },
  mg_skeleton: { id:"mg_skeleton", name:"スケルトン召喚",icon:"💀",color:"#c084fc", type:"active",  sp:1, req:["mg_familiar"],desc:"HP20×3体 分散攻撃・盾役",     active:{ type:"summon", summonType:"skeleton", count:3 }, pos:{ angle:226, r:4.2 } },
  mg_amplify:  { id:"mg_amplify",  name:"魔力増幅",     icon:"📈", color:"#c084fc", type:"passive", sp:1, req:["mg_mag4"],    desc:"MAGの15%追加ダメージ",        passive:{ magAmplify:0.15 }, pos:{ angle:246, r:5.2 } },
  mg_accumulate:{ id:"mg_accumulate",name:"魔力蓄積",   icon:"📈", color:"#9333ea", type:"passive", sp:1, req:["mg_mag4"],    desc:"呪文使うたびMAG+3・全セット中", passive:{ scale:"mag", perCast:3, scope:"session" }, pos:{ angle:232, r:5.4 } },

  mg_archimage:{ id:"mg_archimage",name:"大魔道士", icon:"👑", color:"#9333ea", type:"passive", sp:1, req:["mg_mag7","mg_amplify"], desc:"MAG+40% HP-20%",                     passive:{ mag:40, hp:-20 }, pos:{ angle:240, r:8 } },
  mg_wisdom:   { id:"mg_wisdom",   name:"英知解放", icon:"🔱", color:"#9333ea", type:"passive", sp:1, req:["mg_archimage"],          desc:"MAGをATKとして扱う（魔法剣士の核）", passive:{ magAsAtk:true }, pos:{ angle:240, r:9 } },
};

// ─── 全スキル統合 ───
export const SKILLS = {
  ...START,
  ...SWORD,
  ...DEFENSE,
  ...BOW,
  ...EXPLORE,
  ...THIEF,
  ...MAGIC,
};

export const SKILL_LIST = Object.values(SKILLS);

// ─── パッシブボーナス計算（セット中のもの）───
export const calcPassiveBonus = (passiveSlots = []) => {
  const bonus = {
    goldBonus:0, expBonus:0, dropBonus:0, mapBonus:0, chestBonus:0,
  };
  passiveSlots.forEach(id => {
    if (!id) return;
    const sk = SKILLS[id];
    if (!sk?.passive) return;
    if (sk.passive.goldBonus)  bonus.goldBonus  += sk.passive.goldBonus;
    if (sk.passive.expBonus)   bonus.expBonus   += sk.passive.expBonus;
    if (sk.passive.dropBonus)  bonus.dropBonus  += sk.passive.dropBonus;
    if (sk.passive.mapBonus)   bonus.mapBonus   += sk.passive.mapBonus;
    if (sk.passive.chestBonus) bonus.chestBonus += sk.passive.chestBonus;
  });
  return bonus;
};

// ─── ステータス強化スキル計算（取得済み全部）───
export const calcStatBonus = (learnedSkills = []) => {
  const bonus = {
    atk:0, mag:0, def:0, mdef:0, hp:0, eva:0, crit:0,
    critDmg:0, mapBonus:0, dropBonus:0, goldBonus:0, chestBonus:0,
    poisonBonus:0, healAfterBattle:0,
  };
  learnedSkills.forEach(id => {
    const sk = SKILLS[id];
    if (!sk?.stat) return;
    Object.entries(sk.stat).forEach(([k, v]) => {
      if (k in bonus) bonus[k] += v;
    });
  });
  return bonus;
};