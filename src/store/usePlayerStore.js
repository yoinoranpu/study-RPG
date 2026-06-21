import { create } from "zustand";

const usePlayerStore = create((set) => ({
  // プレイヤー基本情報
  uid: null,
  isGuest: true,
  isLoggedIn: false,

  // ゲームデータ
  totalExp: 0,
  gold: 500,
  floor: 1,
  maxFloor: 1,
  floorMapping: 0,
  hp: 100,
  maxHp: 100,

  // 装備
  equippedWeapon: null,
  equippedArmor: null,
  equippedAcc1: null,
  equippedAcc2: null,
  specialSlots: [null, null, null],

  // アイテム・素材
  itemBox: [],
  materials: {},

  // スキル
  learnedSkills: ["start"],
  spUsed: 0,
  activeSkillSlots: [null, null, null, null],
  passiveSkillSlots: [null, null, null, null, null, null],
  battleStyle: "balanced",

  // タイマー設定
  timerWork: 25,
  timerBreak: 5,
  timerSets: 4,

  // 学習記録
  studyMinutesTotal: 0,
  studyMinutesToday: 0,
  studyMinutesWeek: 0,

  // アクション
  setUid: (uid) => set({ uid }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  updatePlayer: (data) => set((state) => ({ ...state, ...data })),
  resetPlayer: () => set({
    totalExp: 0, gold: 500, floor: 1, maxFloor: 1,
    floorMapping: 0, hp: 100, maxHp: 100,
    equippedWeapon: null, equippedArmor: null,
    equippedAcc1: null, equippedAcc2: null,
    specialSlots: [null, null, null],
    itemBox: [], materials: {},
    learnedSkills: ["start"], spUsed: 0,
    activeSkillSlots: [null, null, null, null],
    passiveSkillSlots: [null, null, null, null, null, null],
    battleStyle: "balanced",
    studyMinutesTotal: 0, studyMinutesToday: 0, studyMinutesWeek: 0,
  }),
}));

export default usePlayerStore;