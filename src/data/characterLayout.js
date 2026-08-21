// CharacterPage「装備」タブの装備サマリー欄のサイズ・配置調整。CharacterLayoutEditor.jsxで調整できる。
export const CHARACTER_LAYOUT_DEFAULT = {
  roomHeight: 300,
  roomPanY: 65,
  equipSlotSize: 95,
  specialSlotSize: 80,
  statsPanelWidth: 260,
  contentPaddingTop: 26,
  panelGap: 8,

  // 個別配置：グリッド上の通常位置からのズレ(px)。{x:0,y:0}なら通常位置のまま。
  equipItemPos: {
    equippedWeapon: { x: 0, y: 0 },
    equippedArmor:  { x: 0, y: 0 },
    equippedAcc1:   { x: 0, y: 0 },
    equippedAcc2:   { x: 0, y: 0 },
  },
  specialItemPos: [
    { x: 275, y: -105 },
    { x: 275, y: -105 },
    { x: 275, y: -105 },
  ],
  statItemPos: {
    ATK:  { x: 0, y: 0 },
    MAG:  { x: 0, y: 0 },
    DEF:  { x: 0, y: 40 },
    MDEF: { x: 0, y: 40 },
    EVA:  { x: 0, y: 80 },
    CRIT: { x: 0, y: 80 },
  },
};

// スマホ(横画面)用。横画面は縦画面と違い幅に余裕がある一方で高さが乏しいため、装備列と
// ステータス欄を縦積みにせず、デスクトップと同じ横並び(row)構造をそのまま縮小して使う。
// ここに置いた数値は暫定の初期値。実機のDEBUG配置エディタで個別に微調整する想定。
export const CHARACTER_LAYOUT_LANDSCAPE = {
  roomHeight: 218,
  roomPanY: 50,
  equipSlotSize: 36,
  specialSlotSize: 26,
  statsPanelWidth: 160,
  contentPaddingTop: 16,
  panelGap: 12,
  equipItemPos: {
    equippedWeapon: { x: 0, y: 0 },
    equippedArmor:  { x: 0, y: 0 },
    equippedAcc1:   { x: 0, y: 0 },
    equippedAcc2:   { x: 0, y: 0 },
  },
  specialItemPos: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  statItemPos: {
    ATK:  { x: 0, y: 0 },
    MAG:  { x: 0, y: 0 },
    DEF:  { x: 0, y: 0 },
    MDEF: { x: 0, y: 0 },
    EVA:  { x: 0, y: 0 },
    CRIT: { x: 0, y: 0 },
  },
};

// スマホ(縦画面)用。ユーザーが実機のDEBUG配置エディタで調整した値。
export const CHARACTER_LAYOUT_MOBILE = {
  roomHeight: 230,
  roomPanY: 40,
  equipSlotSize: 65,
  specialSlotSize: 45,
  statsPanelWidth: 180,
  contentPaddingTop: 26,
  panelGap: 0,
  equipItemPos: {
    equippedWeapon: { x: -50,  y: 0 },
    equippedArmor:  { x: -140, y: 0 },
    equippedAcc1:   { x: -50,  y: -5 },
    equippedAcc2:   { x: -140, y: -5 },
  },
  specialItemPos: [
    { x: 155, y: -83 },
    { x: 165, y: -84 },
    { x: 175, y: -84 },
  ],
  statItemPos: {
    ATK:  { x: -5,  y: -300 },
    MAG:  { x: -96, y: -255 },
    DEF:  { x: -3,  y: -256 },
    MDEF: { x: -2,  y: -345 },
    EVA:  { x: 91,  y: -345 },
    CRIT: { x: -2,  y: -301 },
  },
};
