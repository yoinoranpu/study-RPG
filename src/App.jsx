import { useEffect, useState } from "react";
import { loginAsGuest, watchAuthState, loadPlayerData } from "./firebase/saveLoad";
import usePlayerStore from "./store/usePlayerStore";
import DungeonPage from "./pages/DungeonPage";
import "./App.css";

const SCREENS = {
  TOWN: "town",
  DUNGEON: "dungeon",
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState(SCREENS.TOWN);
  const { updatePlayer, setUid, setIsGuest, setIsLoggedIn } = usePlayerStore();

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      if (user) {
        setUid(user.uid);
        setIsGuest(user.isAnonymous);
        setIsLoggedIn(true);
        const data = await loadPlayerData(user.uid);
        if (data) updatePlayer(data);
        setLoading(false);
      } else {
        try {
          await loginAsGuest();
        } catch (e) {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#06060f", color: "#a78bfa", fontFamily: "monospace", fontSize: 18, letterSpacing: 4 }}>
      LOADING...
    </div>
  );

  return (
    <div style={{ height: "100vh", background: "#06060f", fontFamily: "monospace" }}>
      {screen === SCREENS.TOWN && (
        <TownPlaceholder onEnterDungeon={() => setScreen(SCREENS.DUNGEON)} />
      )}
      {screen === SCREENS.DUNGEON && (
        <DungeonPage onBack={() => setScreen(SCREENS.TOWN)} />
      )}
    </div>
  );
}

function TownPlaceholder({ onEnterDungeon }) {
  const { totalExp, gold, floor } = usePlayerStore();
  const lv = Math.floor(Math.sqrt(totalExp / 10)) + 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{ color: "#a78bfa", fontSize: 24, fontWeight: 900, letterSpacing: 4 }}>STUDY DUNGEON</div>
      <div style={{ color: "#4a4a6a", fontSize: 10, letterSpacing: 2 }}>勉強している間に、もう一つの人生が進む。</div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <div style={{ color: "#86efac", fontSize: 12 }}>Lv {lv}</div>
        <div style={{ color: "#fbbf24", fontSize: 12 }}>G {gold}</div>
        <div style={{ color: "#60a5fa", fontSize: 12 }}>B{floor}F</div>
      </div>
      <button onClick={onEnterDungeon} style={{ marginTop: 16, padding: "12px 32px", background: "#0a1a0a", border: "1px solid #4ade80", borderRadius: 6, cursor: "pointer", color: "#4ade80", fontSize: 14, letterSpacing: 4 }}>
        ダンジョンへ
      </button>
    </div>
  );
}