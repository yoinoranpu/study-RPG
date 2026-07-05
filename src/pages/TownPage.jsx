import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import ShopTab from "../components/ShopTab";
import SkillTreeTab from "../components/SkillTreeTab";
import ForgeTab from "../components/ForgeTab";
import CharacterPage from "./CharacterPage";
import SettingsPage from "./SettingsPage";
import MonsterBookTab from "../components/MonsterBookTab";
import DebugItemTab from "../components/DebugItemTab";

export default function TownPage({ onEnterDungeon }) {
  const [tab, setTab] = useState("home");
  const [subTab, setSubTab] = useState("home");
  const [showSettings, setShowSettings] = useState(false);
  const player = usePlayerStore();
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const DEBUG = true;

  const tabs = [
    { id:"home",      icon:"🏰", label:"街"      },
    { id:"character", icon:"🧙", label:"キャラ"  },
    { id:"shop",      icon:"🏪", label:"ショップ" },
    { id:"skill",     icon:"🌳", label:"スキル"  },
    { id:"forge",     icon:"🔨", label:"鍛冶屋"  },
  ];

  return (
    <div style={{ height:"100vh", background:"#06060f", fontFamily:"monospace", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ヘッダー */}
      <div style={{ background:"linear-gradient(180deg,#120820 0%,#06060f 100%)", padding:"14px 16px 10px", borderBottom:"1px solid #1e1e2e", flexShrink:0 }}>
        <div style={{ fontSize:7, letterSpacing:5, color:"#a78bfa", marginBottom:2, opacity:0.7 }}>STUDY DUNGEON</div>
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
            <span style={{ fontSize:6, color:tab===t.id?"#a78bfa":"#4a4a6a" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div style={{ flex:1, overflowY:"auto", padding: ["character","shop","skill","forge"].includes(tab) ? 0 : 14 }}>

        {/* ホーム */}
        {tab === "home" && subTab === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:"#0d0d1a", border:"1px solid #2a2a3a", borderRadius:8, padding:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:28 }}>🧙</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:900, color:"#e8e0d0" }}>Lv {lv}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                    <div style={{ flex:1, height:5, background:"#0a1a0a", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:8, color:"#4a4a6a" }}>{player.totalExp - used}/{need}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, color:"#fbbf24", fontWeight:700 }}>G {player.gold.toLocaleString()}</div>
                  <div style={{ fontSize:9, color:"#4a4a6a", marginTop:2 }}>B{player.maxFloor||1}F到達</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { label:"今日", val:`${player.studyMinutesToday||0}分`, color:"#86efac" },
                  { label:"今週", val:`${player.studyMinutesWeek||0}分`,  color:"#60a5fa" },
                  { label:"累計", val:`${((player.studyMinutesTotal||0)/60).toFixed(1)}h`, color:"#a78bfa" },
                ].map(({label,val,color})=>(
                  <div key={label} style={{ flex:1, background:"#080810", borderRadius:4, padding:"6px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, color, fontWeight:700 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(player.materials||{}).length > 0 && (
              <div style={{ background:"#0d0d1a", border:"1px solid #2a2a3a", borderRadius:8, padding:10 }}>
                <div style={{ fontSize:8, color:"#fb923c", marginBottom:6, letterSpacing:2 }}>所持素材</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {Object.entries(player.materials).map(([name,cnt])=>(
                    <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#fb923c" }}>{name}×{cnt}</div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onEnterDungeon} style={{ width:"100%", padding:"18px 0", background:"linear-gradient(135deg,#0a1a0a,#122212)", border:"2px solid #4ade80", borderRadius:8, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:4, boxShadow:"0 0 24px #4ade8022" }}>
              <div style={{ fontSize:10, letterSpacing:5, color:"#4ade80" }}>ENTER DUNGEON</div>
              <div style={{ fontSize:22, color:"#fff", fontWeight:900 }}>ダンジョンへ</div>
              <div style={{ fontSize:8, color:"#4ade8066", letterSpacing:2 }}>B{player.floor||1}F · マップ{Math.floor(player.floorMapping||0)}%</div>
            </button>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setSubTab("book")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #60a5fa44", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                <span style={{ fontSize:18 }}>📖</span>
                <span style={{ fontSize:9, color:"#60a5fa" }}>図鑑</span>
              </button>
              <button onClick={() => setSubTab("quest")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #fbbf2444", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                <span style={{ fontSize:18 }}>🎯</span>
                <span style={{ fontSize:9, color:"#fbbf24" }}>クエスト</span>
              </button>
            </div>
          </div>
        )}

        {/* 図鑑 */}
        {tab === "home" && subTab === "book" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:"#4a4a6a", cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ flex:1, overflow:"hidden" }}>
              <MonsterBookTab />
            </div>
          </div>
        )}

        {/* クエスト */}
        {tab === "home" && subTab === "quest" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:"#4a4a6a", cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center", color:"#2a2a2a", fontSize:10 }}>
                🎯 クエストシステム<br/>
                <span style={{ fontSize:8 }}>近日実装予定</span>
              </div>
            </div>
          </div>
        )}
        {/* DEBUGクリエイティブ */}
        {tab === "home" && subTab === "debug" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:"#4a4a6a", cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ fontSize:8, color:"#a78bfa", padding:"4px 12px", letterSpacing:2 }}>DEBUG - 全アイテム取得</div>
            <div style={{ flex:1, overflowY:"auto", padding:10 }}>
              <DebugItemTab />
            </div>
          </div>
        )}
        {DEBUG && (
                <button onClick={() => setSubTab("debug")} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #a78bfa44", borderRadius:6, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <span style={{ fontSize:18 }}>🔧</span>
                  <span style={{ fontSize:9, color:"#a78bfa" }}>DEBUG</span>
                </button>
              )}

        {tab === "character" && <CharacterPage />}
        {tab === "shop"      && <ShopTab />}
        {tab === "skill"     && <SkillTreeTab />}
        {tab === "forge"     && <ForgeTab />}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}