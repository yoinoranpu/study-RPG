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
  hpItemPos: {
    hp: { x: 0, y: -120 },
  },
};

// スマホ(縦画面)用。ユーザーが実機のDEBUG配置エディタで調整した値。
// キャラ画面は横画面対応を廃止したため、スマホは向きに関わらず常にこのレイアウトを使う。
// roomHeightは背景画像(character_room.jpg)を切り取る高さで、装備列の実際の
// 中身の高さ(≒305px、itemPos等のズレを適用する前の通常フロー基準)より小さいと、
// 画像が届かない下端が背景色(黒)のまま露出する。以前はHPバーがちょうどその境目に
// 自然な位置で描画されていて目立たなかったが、hpItemPosで上に引き上げた結果、
// 露出していた黒い余白がそのまま見えるようになっていた
export const CHARACTER_LAYOUT_MOBILE = {
  roomHeight: 305,
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
  hpItemPos: {
    hp: { x: 0, y: -75 },
  },
};
