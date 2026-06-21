import { useEffect, useState } from "react";
import { loginAsGuest, watchAuthState, loadPlayerData, savePlayerData } from "./firebase/saveLoad";
import usePlayerStore from "./store/usePlayerStore";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(true);
  const { updatePlayer, setUid, setIsGuest, setIsLoggedIn } = usePlayerStore();

  useEffect(() => {
    // 認証状態を監視
    const unsubscribe = watchAuthState(async (user) => {
      if (user) {
        // ログイン済み
        setUid(user.uid);
        setIsGuest(user.isAnonymous);
        setIsLoggedIn(true);

        // データ読み込み
        const data = await loadPlayerData(user.uid);
        if (data) updatePlayer(data);

        setLoading(false);
      } else {
        // 未ログイン→ゲストログイン
        try {
          await loginAsGuest();
        } catch (e) {
          console.error("ログインエラー", e);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#06060f",
        color: "#a78bfa", fontFamily: "monospace", fontSize: 18, letterSpacing: 4,
      }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#06060f", flexDirection: "column", gap: 12,
    }}>
      <div style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>
        STUDY DUNGEON
      </div>
      <div style={{ color: "#4ade80", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>
        ゲスト認証完了 ✅
      </div>
      <div style={{ color: "#4a4a6a", fontFamily: "monospace", fontSize: 10 }}>
        勉強している間に、もう一つの人生が進む。
      </div>
    </div>
  );
}