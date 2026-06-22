import { useEffect, useState } from "react";
import { loginAsGuest, watchAuthState, loadPlayerData } from "./firebase/saveLoad";
import usePlayerStore from "./store/usePlayerStore";
import TownPage from "./pages/TownPage";
import DungeonPage from "./pages/DungeonPage";
import "./App.css";

const SCREENS = { TOWN:"town", DUNGEON:"dungeon" };

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
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#06060f", color:"#a78bfa", fontFamily:"monospace", fontSize:18, letterSpacing:4 }}>
      LOADING...
    </div>
  );

  return (
    <div style={{ height:"100vh", background:"#06060f" }}>
      {screen === SCREENS.TOWN && (
        <TownPage onEnterDungeon={() => setScreen(SCREENS.DUNGEON)} />
      )}
      {screen === SCREENS.DUNGEON && (
        <DungeonPage onBack={() => setScreen(SCREENS.TOWN)} />
      )}
    </div>
  );
}