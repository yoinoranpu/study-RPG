// 図鑑アイコンに「顔クロップ」を表示するための仕組み。
// 新しい顔専用イラストは発注せず、既存の立ち絵(MULTIPART_MONSTERS等のbody/src)を
// object-fit:cover + object-position + transform:scaleで拡大トリミングして使い回す。
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
    return { src: FLOAT_RIG_MONSTERS[id].body, tint: FLOAT_RIG_MONSTERS[id].tint || null };
  }
  if (GROUND_RIG_MONSTERS[id]) {
    return { src: GROUND_RIG_MONSTERS[id].body, tint: GROUND_RIG_MONSTERS[id].tint || null };
  }
  return null;
}

// 顔クロップの位置調整値。x/y は object-position(%)、zoomはtransform:scale倍率。
// 全モンスター同じ既定値からスタートし、MonsterPortraitEditor(DEBUG専用)で
// 1体ずつ目視調整してJSONを貼り戻す運用を想定。
const DEFAULT_CROP = { x: 50, y: 15, zoom: 2.2 };

export const MONSTER_PORTRAIT_DEFAULT = Object.fromEntries(
  Object.keys({
    ...MULTIPART_MONSTERS, ...SIMPLE_IMAGE_MONSTERS, ...GROUP_IMAGE_MONSTERS,
    ...SWAY_IMAGE_MONSTERS, ...FLOAT_IMAGE_MONSTERS, ...FLOAT_RIG_MONSTERS, ...GROUND_RIG_MONSTERS,
  }).map(id => [id, { ...DEFAULT_CROP }])
);
