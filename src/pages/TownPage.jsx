import { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import ShopTab from "../components/ShopTab";
import ForgeTab from "../components/ForgeTab";
import CharacterPage from "./CharacterPage";
import SettingsPage from "./SettingsPage";
import MonsterBookTab from "../components/MonsterBookTab";
import SkillBookTab from "../components/SkillBookTab";
import QuestTab from "../components/QuestTab";
import DebugItemTab from "../components/DebugItemTab";
import { DUNGEONS, isDungeonUnlocked, getGlobalUnlockDepth } from "../systems/dungeons";
import { resetQuestsIfNeeded } from "../systems/quests";

const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

export default function TownPage({ onEnterDungeon }) {
  const [tab, setTab] = useState("home");
  const [subTab, setSubTab] = useState("home");
  const [bookTab, setBookTab] = useState("monster");
  const [showSettings, setShowSettings] = useState(false);
  const player = usePlayerStore();
  const { updatePlayer } = usePlayerStore();
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const DEBUG = import.meta.env.DEV;

  // セッションを跨がずに日付/週が変わっていた場合の保険リセット（表示の陳腐化防止）
  useEffect(() => {
    const { quests: resetQuests, dailyReset, weeklyReset } = resetQuestsIfNeeded(player.quests);
    if (dailyReset || weeklyReset) {
      updatePlayer({
        quests: resetQuests,
        ...(dailyReset ? { studyMinutesToday: 0 } : {}),
        ...(weeklyReset ? { studyMinutesWeek: 0 } : {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id:"home",      icon:"🏰", label:"街"      },
    { id:"character", icon:"🧙", label:"キャラ"  },
    { id:"shop",      icon:"🏪", label:"ショップ" },
    { id:"forge",     icon:"🔨", label:"鍛冶屋"  },
  ];
  return (
    <div style={{ height:"100vh", background:"#06060f", fontFamily:"monospace", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ヘッダー */}
      <div style={{ background:"linear-gradient(180deg,#120820 0%,#06060f 100%)", padding:"14px 16px 10px", borderBottom:"1px solid #1e1e2e", flexShrink:0 }}>
        <div style={{ fontSize:10, letterSpacing:5, color:"#a78bfa", marginBottom:2, opacity:0.7 }}>STUDY DUNGEON</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>街</div>
          <div style={{ flex:1 }} />
          <button onClick={() => setShowSettings(true)} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:"4px 8px", cursor:"pointer", fontSize:12 }}>⚙</button>
          <div style={{ textAlign:"right" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
              <span style={{ fontSize:10, color:"#86efac" }}>Lv {lv}</span>
              <div style={{ width:44, height:4, background:"#0a1a0a", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:2 }} />
              </div>
            </div>
            <div style={{ fontSize:12, color:"#fbbf24", marginTop:1 }}>G {player.gold.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"7px 2px", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>
            <span style={{ fontSize:10, color:tab===t.id?"#a78bfa":DIM }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div style={{ flex:1, overflowY:"auto", padding: ["character","shop","forge"].includes(tab) ? 0 : 14 }}>

        {/* ホーム */}
        {tab === "home" && subTab === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:"#0d0d1a", border:"1px solid #3a3a55", borderRadius:8, padding:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:28 }}>🧙</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:900, color:"#e8e0d0" }}>Lv {lv}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                    <div style={{ flex:1, height:5, background:"#0a1a0a", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:10, color:DIM }}>{player.totalExp - used}/{need}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, color:"#fbbf24", fontWeight:700 }}>G {player.gold.toLocaleString()}</div>
                  <div style={{ fontSize:10, color:DIM, marginTop:2 }}>通算深度{getGlobalUnlockDepth(player.dungeons)}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { label:"今日", val:`${player.studyMinutesToday||0}分`, color:"#86efac" },
                  { label:"今週", val:`${player.studyMinutesWeek||0}分`,  color:"#60a5fa" },
                  { label:"累計", val:`${((player.studyMinutesTotal||0)/60).toFixed(1)}h`, color:"#a78bfa" },
                ].map(({label,val,color})=>(
                  <div key={label} style={{ flex:1, background:"#080810", borderRadius:4, padding:"6px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:DIM, marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, color, fontWeight:700 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(player.materials||{}).length > 0 && (
              <div style={{ background:"#0d0d1a", border:"1px solid #3a3a55", borderRadius:8, padding:10 }}>
                <div style={{ fontSize:10, color:"#fb923c", marginBottom:6, letterSpacing:2 }}>所持素材</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {Object.entries(player.materials).map(([name,cnt])=>(
                    <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"3px 8px", fontSize:10, color:"#fb923c" }}>{name}×{cnt}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {DUNGEONS.map(d => {
                const ds = player.dungeons?.[d.id] || { floor:1, maxFloor:1, floorMapping:0, cleared:false };
                const unlocked = isDungeonUnlocked(player.dungeons, d.id);
                return (
                  <button key={d.id} disabled={!unlocked}
                    onClick={() => { if (!unlocked) return; updatePlayer({ currentDungeonId: d.id }); onEnterDungeon(); }}
                    style={{ width:"100%", padding:"12px 16px", background: unlocked ? "linear-gradient(135deg,#0a1a0a,#122212)" : "#0a0a0a", border:`2px solid ${unlocked ? "#4ade80" : "#3a3a55"}`, borderRadius:8, cursor: unlocked?"pointer":"default", fontFamily:"monospace", display:"flex", alignItems:"center", gap:12, textAlign:"left", boxShadow: unlocked ? "0 0 16px #4ade8022" : "none" }}>
                    <span style={{ fontSize:22 }}>{!unlocked ? "🔒" : ds.cleared ? "🏆" : "🚪"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:900, color: unlocked?"#fff":FAINT, letterSpacing:1 }}>
                        {d.name}{ds.cleared && unlocked ? "（クリア済）" : ""}
                      </div>
                      <div style={{ fontSize:10, color: unlocked?"#86efac":FAINT, letterSpacing:1, marginTop:2 }}>
                        {unlocked ? `B${ds.floor}F・マップ${Math.floor(ds.floorMapping||0)}%` : "前のダンジョンをクリアで解放"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setSubTab("book")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #60a5fa44", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                <span style={{ fontSize:18 }}>📖</span>
                <span style={{ fontSize:10, color:"#60a5fa" }}>図鑑</span>
              </button>
              <button onClick={() => setSubTab("quest")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #fbbf2444", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                <span style={{ fontSize:18 }}>🎯</span>
                <span style={{ fontSize:10, color:"#fbbf24" }}>クエスト</span>
              </button>
            </div>
          </div>
        )}

        {/* 図鑑 */}
        {tab === "home" && subTab === "book" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:DIM, cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
              {[{id:"monster",label:"👾 モンスター"},{id:"skill",label:"📖 スキル書"}].map(t=>(
                <button key={t.id} onClick={()=>setBookTab(t.id)} style={{ flex:1, padding:"8px 0", background:bookTab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${bookTab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:bookTab===t.id?"#a78bfa":DIM, fontSize:10, fontFamily:"monospace" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ flex:1, overflow:"hidden" }}>
              {bookTab === "monster" ? <MonsterBookTab /> : <SkillBookTab />}
            </div>
          </div>
        )}

        {/* クエスト */}
        {tab === "home" && subTab === "quest" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:DIM, cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ flex:1, overflow:"hidden" }}>
              <QuestTab />
            </div>
          </div>
        )}
        {/* DEBUGクリエイティブ */}
        {tab === "home" && subTab === "debug" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:DIM, cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ fontSize:10, color:"#a78bfa", padding:"4px 12px", letterSpacing:2 }}>DEBUG - 全アイテム取得</div>
            <div style={{ flex:1, overflowY:"auto", padding:10 }}>
              <DebugItemTab />
            </div>
          </div>
        )}
        {DEBUG && (
                <button onClick={() => setSubTab("debug")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #a78bfa44", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <span style={{ fontSize:18 }}>🔧</span>
                  <span style={{ fontSize:10, color:"#a78bfa" }}>DEBUG</span>
                </button>
              )}

        {tab === "character" && <CharacterPage />}
        {tab === "shop"      && <ShopTab />}
        {tab === "forge"     && <ForgeTab />}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}