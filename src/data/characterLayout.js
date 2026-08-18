// CharacterPage「装備」タブの装備サマリー欄のサイズ・配置調整。CharacterLayoutEditor.jsxで調整できる。
export const CHARACTER_LAYOUT_DEFAULT = {
  roomHeight: 240,        // 部屋イラストの表示高さ(px)
  roomPanY: 35,           // 部屋イラストの縦方向の見せ方(0=上端基準〜100=下端基準)
  equipSlotSize: 72,      // 武器/防具/アクセの装備枠の一辺(px)
  specialSlotSize: 44,    // 特殊スロット(S1〜S3)の一辺(px)
  statsPanelWidth: 150,   // ステータス欄(ATK等)の幅(px)
  contentPaddingTop: 26,  // 装備欄全体を部屋の上端からどれだけ下げるか(px)
  panelGap: 8,            // 装備パネルとステータスパネルの間隔(px)

  // 個別配置：グリッド上の通常位置からのズレ(px)。{x:0,y:0}なら通常位置のまま。
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
