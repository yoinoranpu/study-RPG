// ─── クエスト（デイリー／ウィークリー）───
// 日付/週の境界判定はショップの日替わり在庫(ShopTab.jsx)と同じtoDateString()流儀に揃える。

export const getTodayKey = () => new Date().toDateString();

// その週の月曜日をキーにする（週の境界判定用）
export const getWeekKey = () => {
  const d = new Date();
  const day = d.getDay(); // 0=日〜6=土
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  return monday.toDateString();
};

export const makeInitialQuests = () => ({
  dailyDate: getTodayKey(),
  weeklyDate: getWeekKey(),
  setsToday: 0,
  setsWeek: 0,
  chestsWeek: 0,
  claimedDaily: {},
  claimedWeekly: {},
});

// 日付/週が変わっていればカウンタ・受取状態をリセットした新しいquestsを返す（純粋関数）
export const resetQuestsIfNeeded = (quests) => {
  let next = quests || makeInitialQuests();
  let dailyReset = false, weeklyReset = false;

  const todayKey = getTodayKey();
  if (next.dailyDate !== todayKey) {
    next = { ...next, dailyDate: todayKey, setsToday: 0, claimedDaily: {} };
    dailyReset = true;
  }

  const weekKey = getWeekKey();
  if (next.weeklyDate !== weekKey) {
    next = { ...next, weeklyDate: weekKey, setsWeek: 0, chestsWeek: 0, claimedWeekly: {} };
    weeklyReset = true;
  }

  return { quests: next, dailyReset, weeklyReset };
};

// ─── クエスト定義 ───
// get(quests, player) が現在の進捗値を返す。targetに達したら受取可能。
export const QUEST_DEFS = {
  daily: [
    { id:"daily_set1",      label:"今日1セット完了する",  target:1,   get:(q)=>q.setsToday,                    reward:{ gold:50,  exp:15 } },
    { id:"daily_set3",      label:"今日3セット完了する",  target:3,   get:(q)=>q.setsToday,                    reward:{ gold:150, exp:40 } },
    { id:"daily_minutes60", label:"今日60分勉強する",     target:60,  get:(q,p)=>p.studyMinutesToday||0,       reward:{ gold:100, exp:30 } },
  ],
  weekly: [
    { id:"weekly_set10",       label:"今週10セット完了する",   target:10,  get:(q)=>q.setsWeek,                  reward:{ gold:400, exp:100 } },
    { id:"weekly_minutes300",  label:"今週300分勉強する",      target:300, get:(q,p)=>p.studyMinutesWeek||0,     reward:{ gold:500, exp:120, chestRarity:"uncommon" } },
    { id:"weekly_chest5",      label:"今週宝箱を5個開ける",    target:5,   get:(q)=>q.chestsWeek,                reward:{ gold:300, exp:80 } },
  ],
};
