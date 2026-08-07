import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIfeK0RikmFkPY4nTr32ZChIzqLRjh4wM",
  authDomain: "study-rpg-cae70.firebaseapp.com",
  projectId: "study-rpg-cae70",
  storageBucket: "study-rpg-cae70.firebasestorage.app",
  messagingSenderId: "925055240345",
  appId: "1:925055240345:web:2cf616670651d665e25008"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
// オフライン永続化を有効化：接続不安定時の書き込みはIndexedDBに自動でキューイングされ、
// 再接続時にSDKが自動でリトライ・同期する（手動リトライ実装は不要）
// initializeFirestoreはアプリごとに一度しか呼べないため、開発時のHMR等で
// 二重初期化された場合はgetFirestore()で既存インスタンスを再利用する
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;
export default app;