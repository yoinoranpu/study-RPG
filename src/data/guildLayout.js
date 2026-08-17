// TownPage「街」タブのギルドシーン(壁+掲示板+クエスト掲示板+本+トロフィー)の配置。
// 単位は%(壁イラストのwidth/heightに対する割合)。GuildLayoutEditor.jsxで調整できる。
export const GUILD_LAYOUT_DEFAULT = {
  board:      { left: 3.7, top: 4, width: 56 },
  questBoard: { left: 63, top: 15, width: 11 },
  book:       { left: 13, bottom: -1, width: 18 },
  trophy:     { right: 35, bottom: 3, width: 14 },
};
