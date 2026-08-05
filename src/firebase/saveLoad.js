import { db, auth } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
} from "firebase/auth";
import { makeInitialDungeons } from "../systems/dungeons";

// ゲストログイン
export const loginAsGuest = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};

// スキルスロットを常に指定の長さに補正（古いセーブデータの長さ不整合対策）
const normalizeSlotLength = (slots, len) => {
  const arr = [...(slots || [])];
  while (arr.length < len) arr.push(null);
  arr.length = len;
  return arr;
};

// 旧セーブ（単一100階ダンジョン）を3ダンジョン制へ移行。
// レベル・ゴールド・装備・スキル書はそのまま、階層進行だけダンジョン1のB1Fからやり直しにする。
const migrateDungeons = (data) => {
  if (data.dungeons) return data.dungeons;
  return makeInitialDungeons();
};

// ロードしたデータのスロット長・ダンジョン構造を補正
const normalizeLoadedData = (data) => {
  if (!data) return data;
  return {
    ...data,
    activeSkillSlots: normalizeSlotLength(data.activeSkillSlots, 4),
    passiveSkillSlots: normalizeSlotLength(data.passiveSkillSlots, 6),
    dungeons: migrateDungeons(data),
    currentDungeonId: data.currentDungeonId || 1,
  };
};

// データ保存
export const savePlayerData = async (uid, data) => {
  const saveData = {
    totalExp: data.totalExp || 0,
    gold: data.gold || 500,
    currentDungeonId: data.currentDungeonId || 1,
    dungeons: data.dungeons || makeInitialDungeons(),
    hp: data.hp || 100,
    maxHp: data.maxHp || 100,
    equippedWeapon: data.equippedWeapon || null,
    equippedArmor: data.equippedArmor || null,
    equippedAcc1: data.equippedAcc1 || null,
    equippedAcc2: data.equippedAcc2 || null,
    specialSlots: data.specialSlots || [null,null,null],
    itemBox: data.itemBox || [],
    materials: data.materials || {},
    skillBooks: data.skillBooks || [],
    activeSkillSlots: normalizeSlotLength(data.activeSkillSlots, 4),
    passiveSkillSlots: normalizeSlotLength(data.passiveSkillSlots, 6),
    skillMode: data.skillMode || "order",
    battleStyle: data.battleStyle || "balanced",
    timerWork: data.timerWork || 25,
    timerBreak: data.timerBreak || 5,
    timerSets: data.timerSets || 4,
    studyMinutesTotal: data.studyMinutesTotal || 0,
    studyMinutesToday: data.studyMinutesToday || 0,
    studyMinutesWeek: data.studyMinutesWeek || 0,
    unlockedRarity: data.unlockedRarity || "common",
    monsterBook: data.monsterBook || {},
    skillBookDex: data.skillBookDex || {},
  };

  try {
    await setDoc(doc(db, "players", uid), {
      ...saveData,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem("sd_save", JSON.stringify(saveData));
  } catch (e) {
    console.log("オフライン保存:", e.message);
    localStorage.setItem("sd_save", JSON.stringify(saveData));
  }
};

// データ読み込み
export const loadPlayerData = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "players", uid));
    if (snap.exists()) {
      // Firestoreのデータを返す
      return normalizeLoadedData(snap.data());
    }
    // Firestoreにない場合はlocalStorageから復元
    const local = localStorage.getItem("sd_save");
    return local ? normalizeLoadedData(JSON.parse(local)) : null;
  } catch (e) {
    // オフライン時はlocalStorageから復元
    console.log("オフライン読み込み:", e.message);
    const local = localStorage.getItem("sd_save");
    return local ? normalizeLoadedData(JSON.parse(local)) : null;
  }
};

// 認証状態の監視
export const watchAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};
// Googleログイン
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

// ゲストアカウントをGoogleと連携
export const linkGuestToGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    return result.user;
  } catch (e) {
    // すでにGoogleアカウントが存在する場合はそちらでログイン
    if (e.code === "auth/credential-already-in-use") {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
    throw e;
  }
};

// ログアウト
export const logout = async () => {
  await auth.signOut();
};