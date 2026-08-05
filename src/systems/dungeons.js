// ═══════════════════════════════════════════════════════
// ダンジョン定義
// 100階の単一ダンジョンから、30階×3ダンジョンへ再構成。
// レベル・装備・スキル書はダンジョン間で共通（キャラは引き継がれる）。
// レアリティ解放やボス報酬は「全ダンジョン通算の深度(globalDepth)」で
// 継続してスケールする（ダンジョンごとにコモンからやり直しにならないため）。
// ═══════════════════════════════════════════════════════

export const DUNGEON_FLOOR_COUNT = 30;

export const DUNGEONS = [
  { id:1, name:"ダンジョン1", keyEffect:"dungeon_key_1" },
  { id:2, name:"ダンジョン2", keyEffect:"dungeon_key_2" },
  { id:3, name:"ダンジョン3", keyEffect:"dungeon_key_3" },
];

export const getDungeon = (dungeonId) => DUNGEONS.find(d => d.id === dungeonId) || DUNGEONS[0];

// ─── 全ダンジョン通算の深度（レアリティ解放・ボス報酬のスケールに使う）───
export const globalDepth = (dungeonId, floor) => (dungeonId - 1) * DUNGEON_FLOOR_COUNT + floor;

// ─── 次のダンジョンが解放されているか（1は常に解放、以降は前ダンジョンのクリアが条件）───
export const isDungeonUnlocked = (dungeons, dungeonId) =>
  dungeonId === 1 || !!dungeons?.[dungeonId - 1]?.cleared;

// ─── 到達済みの最大深度（ショップの品揃え解放などに使う）───
export const getGlobalUnlockDepth = (dungeons) =>
  Math.max(1, ...DUNGEONS.map(d => globalDepth(d.id, dungeons?.[d.id]?.maxFloor || 1)));

// ─── 新規プレイヤーのダンジョン進行初期値 ───
export const makeInitialDungeons = () => {
  const out = {};
  DUNGEONS.forEach(d => { out[d.id] = { floor:1, maxFloor:1, floorMapping:0, cleared:false }; });
  return out;
};
