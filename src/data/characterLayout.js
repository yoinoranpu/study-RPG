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
    DEF:  { x: 0, y: 60 },
    MDEF: { x: 0, y: 60 },
    EVA:  { x: 0, y: 120 },
    CRIT: { x: 0, y: 120 },
  },
};
