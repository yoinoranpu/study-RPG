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
  // 保存しないフィールドを除外
  const saveData = { ...data };
  delete saveData.uid;
  delete saveData.isGuest;
  delete saveData.isLoggedIn;

  try {
    await setDoc(doc(db, "players", uid), {
      ...saveData,
      updatedAt: new Date().toISOString(),
    });
    // 成功したらローカルも更新
    localStorage.setItem("sd_save", JSON.stringify(saveData));
  } catch (e) {
    // オフライン時はlocalStorageに一時保存
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
      return snap.data();
    }
    // Firestoreにない場合はlocalStorageから復元
    const local = localStorage.getItem("sd_save");
    return local ? JSON.parse(local) : null;
  } catch (e) {
    // オフライン時はlocalStorageから復元
    console.log("オフライン読み込み:", e.message);
    const local = localStorage.getItem("sd_save");
    return local ? JSON.parse(local) : null;
  }
};

// 認証状態の監視
export const watchAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};