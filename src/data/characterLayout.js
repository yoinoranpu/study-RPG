// CharacterPage「装備」タブの装備サマリー欄のサイズ・配置調整。CharacterLayoutEditor.jsxで調整できる。
export const CHARACTER_LAYOUT_DEFAULT = {
  roomHeight: 240,        // 部屋イラストの表示高さ(px)
  roomPanY: 35,           // 部屋イラストの縦方向の見せ方(0=上端基準〜100=下端基準)
  equipSlotSize: 72,      // 武器/防具/アクセの装備枠の一辺(px)
  specialSlotSize: 44,    // 特殊スロット(S1〜S3)の一辺(px)
  statsPanelWidth: 150,   // ステータス欄(ATK等)の幅(px)
  contentPaddingTop: 26,  // 装備欄全体を部屋の上端からどれだけ下げるか(px)
  panelGap: 8,            // 装備パネルとステータスパネルの間隔(px)
};
