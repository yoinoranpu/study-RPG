import { create } from "zustand";
import { savePlayerData } from "../firebase/saveLoad";

let saveTimer = null;
const debounceSave = (uid, data) => {
  if (!uid) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const saveData = {
      totalExp: data.totalExp,
      gold: data.gold,
      floor: data.floor,
      maxFloor: data.maxFloor,
      floorMapping: data.floorMapping,
      hp: data.hp,
      maxHp: data.maxHp,
      equippedWeapon: data.equippedWeapon,
      equippedArmor: data.equippedArmor,
      equippedAcc1: data.equippedAcc1,
      equippedAcc2: data.equippedAcc2,
      specialSlots: data.specialSlots,
      itemBox: data.itemBox,
      materials: data.materials,
      learnedSkills: data.learnedSkills,
      spUsed: data.spUsed,
      activeSkillSlots: data.activeSkillSlots,
      passiveSkillSlots: data.passiveSkillSlots,
      skillMode: data.skillMode || "order",
      battleStyle: data.battleStyle,
      timerWork: data.timerWork,
      timerBreak: data.timerBreak,
      timerSets: data.timerSets,
      studyMinutesTotal: data.studyMinutesTotal,
      studyMinutesToday: data.studyMinutesToday,
      studyMinutesWeek: data.studyMinutesWeek,
      unlockedRarity: data.unlockedRarity || "common",
      monsterBook: data.monsterBook || {},
    };
    savePlayerData(uid, saveData);
  }, 2000);
};

const usePlayerStore = create((set, get) => ({
  uid: null,
  isGuest: true,
  isLoggedIn: false,

  totalExp: 0,
  gold: 500,
  floor: 1,
  maxFloor: 1,
  floorMapping: 0,
  hp: 100,
  maxHp: 100,

  equippedWeapon: null,
  equippedArmor: null,
  equippedAcc1: null,
  equippedAcc2: null,
  specialSlots: [null, null, null],

  itemBox: [],
  materials: {},

  learnedSkills: ["start"],
  spUsed: 0,
  activeSkillSlots: [null, null, null, null],
  passiveSkillSlots: [null, null, null, null, null, null],
  skillMode: "order",
  battleStyle: "balanced",

  timerWork: 25,
  timerBreak: 5,
  timerSets: 4,

  studyMinutesTotal: 0,
  studyMinutesToday: 0,
  studyMinutesWeek: 0,

  monsterBook: {},

  setUid: (uid) => set({ uid }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

  updatePlayer: (data) => {
    set((state) => {
      const newState = { ...state, ...data };
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
      skillMode: "order",
      battleStyle: "balanced",
      studyMinutesTotal: 0, studyMinutesToday: 0, studyMinutesWeek: 0,
      monsterBook: {},
      unlockedRarity: "common",
    };
    set(resetData);
    debounceSave(uid, resetData);
  },
}));

export default usePlayerStore;