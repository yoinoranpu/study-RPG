// ─── 実績（アチーブメント）───
// クエストと違い一度きり・永続。達成したら二度と取り消されない設計。

import { MONSTER_BASE, TRIBES } from "./monsters";
import { SKILL_BOOK_LIST } from "../data/skills";
import { RARITY } from "../data/items";

export const makeInitialStats = () => ({
  totalMonstersDefeated: 0,
  totalChestsOpened: 0,
  totalGoldEarned: 0,
  totalGoldSpent: 0,
  totalSynthesisCount: 0,
  maxUpgradeLevelEver: 0,
  lastPlayDate: null,
  currentStreak: 0,
  bestStreak: 0,
  flags: {
    firstBossWin: false, bossNoDamageWin: false, noDamageWin: false,
    hp1DigitWin: false, undyingWin: false,
    assassinateKill: false, counterKill: false, summonFinish: false,
    poisonKill: false, freezeKill: false, bigCritHit: false, aoeDoubleKill: false,
    midnightSession: false, hasOwnedMythic: false, hasOwnedOrigin: false,
  },
});

export const makeInitialAchievements = () => ({ claimed: {} });

// ─── データリセット実績だけは特殊：resetPlayer()で消える通常stateではなく
// localStorageで管理し、リセットしても記録が残るようにする ───
const RESET_ACHIEVEMENT_KEY = "sd_reset_achievement";
export const markResetAchievement = () => { try { localStorage.setItem(RESET_ACHIEVEMENT_KEY, "1"); } catch { /* noop */ } };
const hasResetOnce = () => { try { return localStorage.getItem(RESET_ACHIEVEMENT_KEY) === "1"; } catch { return false; } };

const tribeKillCounts = (player) => {
  const book = player.monsterBook || {};
  const counts = {};
  TRIBES.forEach(t => { counts[t] = 0; });
  MONSTER_BASE.forEach(m => { counts[m.tribe] = (counts[m.tribe] || 0) + (book[m.id]?.count || 0); });
  return counts;
};

const equippedAllLegendaryUp = (player) => {
  const slots = [player.equippedWeapon, player.equippedArmor, player.equippedAcc1, player.equippedAcc2];
  return slots.every(it => it && (RARITY[it.rarity]?.tier || 0) >= 5);
};

const allSkillSlotsFull = (player) =>
  (player.activeSkillSlots || []).filter(Boolean).length >= 4 &&
  (player.passiveSkillSlots || []).filter(Boolean).length >= 6;

export const ACHIEVEMENT_DEFS = [
  // ─── 進行度 ───
  { id:"prog_d1_b10",  category:"進行度", label:"ダンジョン1 B10F到達", desc:"ダンジョン1の10階に到達する", hidden:false, target:10,
    get:(p)=>p.dungeons?.[1]?.maxFloor||1, reward:{gold:200, exp:50} },
  { id:"prog_d1_clear", category:"進行度", label:"ダンジョン1クリア", desc:"ダンジョン1をクリアする", hidden:false, target:1,
    get:(p)=>p.dungeons?.[1]?.cleared?1:0, reward:{gold:500, exp:150} },
  { id:"prog_d2_clear", category:"進行度", label:"ダンジョン2クリア", desc:"ダンジョン2をクリアする", hidden:false, target:1,
    get:(p)=>p.dungeons?.[2]?.cleared?1:0, reward:{gold:1000, exp:300} },
  { id:"prog_d3_clear", category:"進行度", label:"ダンジョン3クリア（全クリア）", desc:"ダンジョン3をクリアする", hidden:false, target:1,
    get:(p)=>p.dungeons?.[3]?.cleared?1:0, reward:{gold:3000, exp:800} },

  // ─── 継続 ───
  { id:"cont_3day",  category:"継続", label:"3日連続でセット完了", desc:"3日連続でセットを完了する", hidden:false, target:3,
    get:(p)=>p.stats?.bestStreak||0, reward:{gold:100, exp:30} },
  { id:"cont_7day",  category:"継続", label:"7日連続でセット完了", desc:"7日連続でセットを完了する", hidden:false, target:7,
    get:(p)=>p.stats?.bestStreak||0, reward:{gold:300, exp:80} },
  { id:"cont_30day", category:"継続", label:"30日連続でセット完了", desc:"30日連続でセットを完了する", hidden:false, target:30,
    get:(p)=>p.stats?.bestStreak||0, reward:{gold:1500, exp:400} },
  { id:"cont_10h",  category:"継続", label:"累計10時間勉強", desc:"累計学習時間が10時間に到達する", hidden:false, target:600,
    get:(p)=>p.studyMinutesTotal||0, reward:{gold:200, exp:60} },
  { id:"cont_50h",  category:"継続", label:"累計50時間勉強", desc:"累計学習時間が50時間に到達する", hidden:false, target:3000,
    get:(p)=>p.studyMinutesTotal||0, reward:{gold:800, exp:250} },
  { id:"cont_100h", category:"継続", label:"累計100時間勉強", desc:"累計学習時間が100時間に到達する", hidden:false, target:6000,
    get:(p)=>p.studyMinutesTotal||0, reward:{gold:2000, exp:600} },

  // ─── 戦闘：討伐数 ───
  { id:"cmb_kill1",    category:"戦闘", label:"初めての討伐", desc:"モンスターを初めて倒す", hidden:false, target:1,
    get:(p)=>p.stats?.totalMonstersDefeated||0, reward:{gold:20, exp:5} },
  { id:"cmb_kill100",  category:"戦闘", label:"百戦錬磨", desc:"モンスターを累計100体倒す", hidden:false, target:100,
    get:(p)=>p.stats?.totalMonstersDefeated||0, reward:{gold:200, exp:50} },
  { id:"cmb_kill1000", category:"戦闘", label:"千の敵を屠る者", desc:"モンスターを累計1000体倒す", hidden:false, target:1000,
    get:(p)=>p.stats?.totalMonstersDefeated||0, reward:{gold:1000, exp:250} },
  { id:"cmb_kill5000", category:"戦闘", label:"殺戮の化身", desc:"モンスターを累計5000体倒す", hidden:false, target:5000,
    get:(p)=>p.stats?.totalMonstersDefeated||0, reward:{gold:3000, exp:800} },

  // ─── 戦闘：種族制覇 ───
  { id:"cmb_tribe_all", category:"戦闘", label:"七種族の覇者", desc:"7種族すべてを1体以上倒す", hidden:false, target:TRIBES.length,
    get:(p)=>Object.values(tribeKillCounts(p)).filter(c=>c>0).length, reward:{gold:300, exp:80} },
  { id:"cmb_tribe_100", category:"戦闘", label:"モンスターハンター", desc:"いずれかの種族を累計100体倒す", hidden:false, target:100,
    get:(p)=>Math.max(0, ...Object.values(tribeKillCounts(p))), reward:{gold:400, exp:100} },

  // ─── 戦闘：ボス ───
  { id:"cmb_boss_first", category:"戦闘", label:"初めてのボス撃破", desc:"ボスを初めて倒す", hidden:false, target:1,
    get:(p)=>p.stats?.flags?.firstBossWin?1:0, reward:{gold:150, exp:40} },
  { id:"cmb_boss_nodmg", category:"戦闘", label:"完全勝利", desc:"ボス戦でダメージを一切受けずに勝利する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.bossNoDamageWin?1:0, reward:{gold:500, exp:150} },

  // ─── 戦闘：状態異常・特殊技（隠し）───
  { id:"cmb_poison_kill", category:"戦闘", label:"毒の刃", desc:"毒の継続ダメージで敵にとどめを刺す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.poisonKill?1:0, reward:{gold:100, exp:30} },
  { id:"cmb_freeze_kill", category:"戦闘", label:"氷結の裁き", desc:"凍結中の敵にとどめを刺す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.freezeKill?1:0, reward:{gold:100, exp:30} },
  { id:"cmb_assassinate", category:"戦闘", label:"闇に潜む者", desc:"暗殺の書で敵を仕留める", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.assassinateKill?1:0, reward:{gold:150, exp:40} },
  { id:"cmb_counter_kill", category:"戦闘", label:"返し討ち", desc:"カウンターで敵を撃破する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.counterKill?1:0, reward:{gold:150, exp:40} },
  { id:"cmb_summon_finish", category:"戦闘", label:"従者の手柄", desc:"召喚モンスターにとどめを刺させる", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.summonFinish?1:0, reward:{gold:100, exp:30} },

  // ─── 戦闘：サバイバル・逆転（隠し）───
  { id:"cmb_hp1digit", category:"戦闘", label:"薄氷の勝利", desc:"HPが1桁の状態で戦闘に勝利する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.hp1DigitWin?1:0, reward:{gold:300, exp:80} },
  { id:"cmb_undying", category:"戦闘", label:"不屈の魂", desc:"不屈の書で復活し、そのまま勝利する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.undyingWin?1:0, reward:{gold:300, exp:80} },
  { id:"cmb_nodmg_win", category:"戦闘", label:"無傷の戦士", desc:"被ダメージ0で戦闘に勝利する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.noDamageWin?1:0, reward:{gold:250, exp:70} },

  // ─── 戦闘：クリティカル・火力（隠し）───
  { id:"cmb_bigcrit", category:"戦闘", label:"会心の一撃", desc:"クリティカルで大ダメージを出す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.bigCritHit?1:0, reward:{gold:150, exp:40} },
  { id:"cmb_aoe_double", category:"戦闘", label:"薙ぎ払い", desc:"全体攻撃で敵を2体同時に倒す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.aoeDoubleKill?1:0, reward:{gold:150, exp:40} },

  // ─── 収集 ───
  { id:"col_book50",  category:"収集", label:"モンスター図鑑 半分制覇", desc:"モンスター図鑑を50%埋める", hidden:false, target:50,
    get:(p)=>Math.floor(Object.keys(p.monsterBook||{}).length / MONSTER_BASE.length * 100), reward:{gold:200, exp:60} },
  { id:"col_book100", category:"収集", label:"モンスター図鑑コンプリート", desc:"モンスター図鑑を100%埋める", hidden:false, target:100,
    get:(p)=>Math.floor(Object.keys(p.monsterBook||{}).length / MONSTER_BASE.length * 100), reward:{gold:800, exp:200} },
  { id:"col_allbooks", category:"収集", label:"スキル書コレクター", desc:"全種類のスキル書を1冊ずつ入手する", hidden:false, target:SKILL_BOOK_LIST.length,
    get:(p)=>Object.keys(p.skillBookDex||{}).length, reward:{gold:500, exp:150} },
  { id:"col_mythic", category:"収集", label:"神話の輝き", desc:"mythicレアリティの装備を1つ合成で作り出す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.hasOwnedMythic?1:0, reward:{gold:500, exp:150} },
  { id:"col_origin", category:"収集", label:"起源に至る者", desc:"originレアリティの装備を1つ合成で作り出す", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.hasOwnedOrigin?1:0, reward:{gold:1000, exp:300} },

  // ─── 経済 ───
  { id:"eco_earn1w",  category:"経済", label:"小金持ち", desc:"累計1万Gを稼ぐ", hidden:false, target:10000,
    get:(p)=>p.stats?.totalGoldEarned||0, reward:{gold:300, exp:80} },
  { id:"eco_earn10w", category:"経済", label:"富豪", desc:"累計10万Gを稼ぐ", hidden:false, target:100000,
    get:(p)=>p.stats?.totalGoldEarned||0, reward:{gold:2000, exp:500} },
  { id:"eco_spend5k", category:"経済", label:"買い物好き", desc:"ショップで累計5000G使う", hidden:false, target:5000,
    get:(p)=>p.stats?.totalGoldSpent||0, reward:{gold:200, exp:50} },
  { id:"eco_synth10", category:"経済", label:"鍛冶職人", desc:"合成を累計10回行う", hidden:false, target:10,
    get:(p)=>p.stats?.totalSynthesisCount||0, reward:{gold:300, exp:80} },
  { id:"eco_upgrade20", category:"経済", label:"極めの鍛冶師", desc:"装備を+20まで強化する", hidden:false, target:20,
    get:(p)=>p.stats?.maxUpgradeLevelEver||0, reward:{gold:500, exp:150} },

  // ─── 遊び心（隠し）───
  { id:"fun_chest50", category:"遊び心", label:"宝箱ハンター", desc:"累計50個の宝箱を開ける", hidden:true, target:50,
    get:(p)=>p.stats?.totalChestsOpened||0, reward:{gold:300, exp:80} },
  { id:"fun_midnight", category:"遊び心", label:"夜更かし冒険者", desc:"深夜0時〜4時にセットを完了する", hidden:true, target:1,
    get:(p)=>p.stats?.flags?.midnightSession?1:0, reward:{gold:200, exp:60} },
  { id:"fun_all_legendary", category:"遊び心", label:"全部乗せ", desc:"装備4部位すべてをlegendary以上で埋める", hidden:true, target:1,
    get:(p)=>equippedAllLegendaryUp(p)?1:0, reward:{gold:800, exp:200} },
  { id:"fun_all_slots", category:"遊び心", label:"スキルフル装備", desc:"アクティブ4枠・パッシブ6枠をすべて埋める", hidden:true, target:1,
    get:(p)=>allSkillSlotsFull(p)?1:0, reward:{gold:300, exp:80} },
  { id:"fun_reset", category:"遊び心", label:"三日坊主", desc:"データを一度リセットする", hidden:true, target:1,
    get:()=>hasResetOnce()?1:0, reward:{gold:100, exp:20} },
];
