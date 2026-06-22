import { create } from "zustand";
import { savePlayerData } from "../firebase/saveLoad";

// 保存をまとめて遅延実行（連続更新でも1回だけ保存）
let saveTimer = null;
const debounceSave = (uid, data) => {
  if (!uid) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePlayerData(uid, data);
  }, 2000); // 2秒後に保存
};

const usePlayerStore = create((set, get) => ({
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

  updatePlayer: (data) => {
    set((state) => {
      const newState = { ...state, ...data };
      // 自動保存
      debounceSave(newState.uid, newState);
      return newState;
    });
  },

  resetPlayer: () => {
    const uid = get().uid;
    const resetData = {
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
    };
    set(resetData);
    debounceSave(uid, resetData);
  },
}));

export default usePlayerStore;