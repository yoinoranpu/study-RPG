import { db, auth } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ゲストログイン
export const loginAsGuest = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};

// データ保存
export const savePlayerData = async (uid, data) => {
  try {
    await setDoc(doc(db, "players", uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // オフライン時はlocalStorageに一時保存
    localStorage.setItem("sd_offline_save", JSON.stringify(data));
  }
};

// データ読み込み
export const loadPlayerData = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "players", uid));
    if (snap.exists()) return snap.data();
    // Firestoreにない場合はlocalStorageから復元
    const local = localStorage.getItem("sd_offline_save");
    return local ? JSON.parse(local) : null;
  } catch (e) {
    const local = localStorage.getItem("sd_offline_save");
    return local ? JSON.parse(local) : null;
  }
};

// 認証状態の監視
export const watchAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};