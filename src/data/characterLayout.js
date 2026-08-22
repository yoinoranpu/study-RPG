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

// スマホ(横画面)用。ユーザーが実機のDEBUG配置エディタで調整した値。
export const CHARACTER_LAYOUT_LANDSCAPE = {
  roomHeight: 120,
  roomPanY: 50,
  equipSlotSize: 70,
  specialSlotSize: 60,
  statsPanelWidth: 160,
  contentPaddingTop: 24,
  panelGap: 12,
  equipItemPos: {
    equippedWeapon: { x: 0,   y: 0 },
    equippedArmor:  { x: -20, y: 0 },
    equippedAcc1:   { x: 155, y: -101 },
    equippedAcc2:   { x: 135, y: -101 },
  },
  specialItemPos: [
    { x: 320, y: -190 },
    { x: 325, y: -190 },
    { x: 330, y: -190 },
  ],
  statItemPos: {
    ATK:  { x: -10, y: -20 },
    MAG:  { x: -10, y: -20 },
    DEF:  { x: -10, y: -20 },
    MDEF: { x: -10, y: -20 },
    EVA:  { x: -10, y: -20 },
    CRIT: { x: -10, y: -20 },
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
