// 図鑑アイコンに「顔クロップ」を表示するための仕組み。
// 新しい顔専用イラストは発注せず、既存の立ち絵(MULTIPART_MONSTERS等のbody/src)を
// 実寸(natural size)ベースのbackground-size/positionで拡大トリミングして使い回す
// (MonsterPortrait.jsxのuseMonsterPortraitStyle参照)。
import {
  MULTIPART_MONSTERS, SIMPLE_IMAGE_MONSTERS, GROUP_IMAGE_MONSTERS,
  SWAY_IMAGE_MONSTERS, FLOAT_IMAGE_MONSTERS, FLOAT_RIG_MONSTERS, GROUND_RIG_MONSTERS,
} from "./multipartMonsters";

// モンスターIDから「代表となる1枚絵」を解決する。既存の立ち絵データを流用するだけで、
// 新規アセットは一切追加しない。
export function getMonsterPortraitSrc(id) {
  if (MULTIPART_MONSTERS[id]) {
    return { src: MULTIPART_MONSTERS[id].body, tint: null };
  }
  if (SIMPLE_IMAGE_MONSTERS[id]) {
    return { src: SIMPLE_IMAGE_MONSTERS[id], tint: null };
  }
  if (GROUP_IMAGE_MONSTERS[id]) {
    const main = GROUP_IMAGE_MONSTERS[id].find(p => p.dx === 0) || GROUP_IMAGE_MONSTERS[id][0];
    return { src: main.src, tint: null };
  }
  if (SWAY_IMAGE_MONSTERS[id]) {
    return { src: SWAY_IMAGE_MONSTERS[id].src, tint: null };
  }
  if (FLOAT_IMAGE_MONSTERS[id]) {
    return { src: FLOAT_IMAGE_MONSTERS[id], tint: null };
  }
  if (FLOAT_RIG_MONSTERS[id]) {
    const cfg = FLOAT_RIG_MONSTERS[id];
    const headPart = cfg.parts?.find(p => p.key === "head");
    return { src: headPart ? headPart.img : cfg.body, tint: cfg.tint || null };
  }
  if (GROUND_RIG_MONSTERS[id]) {
    const cfg = GROUND_RIG_MONSTERS[id];
    // bodyが胴体だけ(頭が完全に別パーツ)のモンスターは、bodyをそのまま顔クロップに
    // 使うと顔が写らない(ゴブリンシャーマン等)。headパーツがあればそちらを優先する。
    const headPart = cfg.parts?.find(p => p.key === "head");
    return { src: headPart ? headPart.img : cfg.body, tint: cfg.tint || null };
  }
  return null;
}

// 顔クロップの位置調整値。x/y は background-position(%)、zoomは拡大率(1=ちょうどcover)。
// MonsterPortraitEditor(DEBUG専用)でユーザーが1体ずつ目視調整した最終値。
export const MONSTER_PORTRAIT_DEFAULT = {
  fenrir:            { x: 0,                 y: 3.2575757575757596,  zoom: 2.2 },
  wolf:              { x: 0,                 y: 28.512396694214875,  zoom: 2.1 },
  dire_wolf:         { x: 100,                y: 13.863636363636363,  zoom: 2.2 },
  blood_wolf_chief:  { x: 100,                y: 21.818181818181817,  zoom: 2.5 },
  armored_boar:      { x: 100,                y: 55.268595041322314,  zoom: 2.2 },
  slime:             { x: 100,                y: 0,                   zoom: 1 },
  giant_slime:       { x: 100,                y: 0,                   zoom: 1.2 },
  acid_slime:        { x: 85.14630872420423,  y: 30.530303030303035,  zoom: 2.2 },
  abyss_slime:       { x: 87.16691493517962,  y: 19.829545454545453,  zoom: 2 },
  slime_army:        { x: 50,                 y: 15,                  zoom: 1 },
  moss_slime:        { x: 76.86946258040933,  y: 29.097496706192363,  zoom: 3.3 },
  world_tree:        { x: 52.18118506647702,  y: 48.712121212121204,  zoom: 3 },
  man_eater:         { x: 77.79217455384324,  y: 0,                   zoom: 1.7 },
  cursed_tree:       { x: 53.26364713482965,  y: 55.03246753246753,   zoom: 4.5 },
  death_knight:      { x: 64.7985735470325,   y: 0,                   zoom: 4.9 },
  skeleton:          { x: 61.41775186335188,  y: 0,                   zoom: 3.5 },
  wraith_knight:     { x: 31.222049068173963, y: 4.812834224598929,   zoom: 4.4 },
  fallen_queen:      { x: 82.2325999284253,   y: 5.785123966942149,   zoom: 3.2 },
  fallen_angel:      { x: 54.19850597683754,  y: 3.7337662337662345,  zoom: 4.3 },
  goblin:            { x: 68.15949622876477,  y: 0,                   zoom: 2.2 },
  goblin_king:       { x: 81.00949490953946,  y: 6.060606060606062,   zoom: 3.1 },
  goblin_pope:       { x: 31.378557391367636, y: 7.727272727272725,   zoom: 3.5 },
  goblin_shaman:     { x: 13.223514262974923, y: 20.77594123048668,   zoom: 2.1 },
  imp:               { x: 35.07290392926645,  y: 11.538461538461538,  zoom: 3.6 },
  demon_soldier:     { x: 43.24866885768433,  y: 13.094582185491277,  zoom: 4.6 },
  imp_captain:       { x: 48.88854391606966,  y: 0,                   zoom: 4.2 },
  kobold:            { x: 68.87306466177719,  y: 0,                   zoom: 2.4 },
  fire_dragon:       { x: 99.86854436935826,  y: 42.72727272727273,   zoom: 4 },
  young_dragon:      { x: 100,                y: 40,                  zoom: 3.6 },
  black_dragon:      { x: 99.0491651205937,   y: 40.54858934169278,   zoom: 3.9 },
};
