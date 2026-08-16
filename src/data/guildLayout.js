// TownPage「街」タブのギルドシーン(壁+掲示板+クエスト掲示板+本+トロフィー)の配置。
// 単位は%(壁イラストのwidth/heightに対する割合)。GuildLayoutEditor.jsxで調整できる。
export const GUILD_LAYOUT_DEFAULT = {
  board:      { left: 23.5, top: 5, width: 37 },
  questBoard: { left: 62.5, top: 6, width: 14 },
  book:       { left: 27, bottom: 1, width: 11 },
  trophy:     { right: 27, bottom: 1, width: 9 },
};
