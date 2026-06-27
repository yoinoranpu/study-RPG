import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import ShopTab from "../components/ShopTab";
import ItemBoxTab from "../components/ItemBoxTab";
import SkillTreeTab from "../components/SkillTreeTab";
import SettingsPage from "./SettingsPage";
import CharacterPage from "./CharacterPage";

export default function TownPage({ onEnterDungeon }) {
　const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState("home");
  const player = usePlayerStore();
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;

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
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"7px 2px", background: tab===t.id ? "#12122a" : "transparent", border:"none", borderBottom:`2px solid ${tab===t.id ? "#a78bfa" : "transparent"}`, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>
            <span style={{ fontSize:6, color: tab===t.id ? "#a78bfa" : "#4a4a6a" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        {tab === "character" && <CharacterPage />}

        {/* ホーム */}
        {tab === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#0d0d1a", border:"1px solid #2a2a3a", borderRadius:8, padding:14 }}>
              <div style={{ fontSize:8, letterSpacing:3, color:"#a78bfa", marginBottom:10, opacity:0.7 }}>PLAYER STATUS</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { label:"レベル",   val:`Lv ${lv}`,                          color:"#86efac" },
                  { label:"所持金",   val:`${player.gold.toLocaleString()} G`,  color:"#fbbf24" },
                  { label:"最深部",   val:`B${player.maxFloor || 1}F`,          color:"#a78bfa" },
                  { label:"累計学習", val:`${player.studyMinutesTotal || 0}分`, color:"#38bdf8" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:"#080810", borderRadius:6, padding:"8px 10px" }}>
                    <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:12, color, fontWeight:700 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 素材 */}
            {Object.keys(player.materials || {}).length > 0 && (
              <div style={{ background:"#0d0d1a", border:"1px solid #2a2a3a", borderRadius:8, padding:12 }}>
                <div style={{ fontSize:8, color:"#fb923c", marginBottom:8, letterSpacing:2 }}>所持素材</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(player.materials).map(([name, cnt]) => (
                    <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:4, padding:"4px 10px", fontSize:9, color:"#fb923c" }}>
                      {name}×{cnt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ダンジョンへ */}
            <button onClick={onEnterDungeon} style={{ width:"100%", padding:"18px 0", background:"linear-gradient(135deg,#0a1a0a,#122212)", border:"2px solid #4ade80", borderRadius:8, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:4, boxShadow:"0 0 24px #4ade8022" }}>
              <div style={{ fontSize:10, letterSpacing:5, color:"#4ade80" }}>ENTER DUNGEON</div>
              <div style={{ fontSize:22, color:"#fff", fontWeight:900 }}>ダンジョンへ</div>
              <div style={{ fontSize:8, color:"#4ade8066", letterSpacing:2 }}>
                B{player.floor || 1}F · マップ{Math.floor(player.floorMapping || 0)}%
              </div>
            </button>
          </div>
        )}

        {/* ショップ（仮） */}
        {tab === "shop" && <ShopTab />}

        {/* アイテム（仮） */}
        {tab === "items" && <ItemBoxTab />}

        {/* スキル（仮） */}
        {tab === "skill" && <SkillTreeTab />}
    

        {/* 記録 */}
        {tab === "record" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:8, letterSpacing:3, color:"#38bdf8", marginBottom:6, opacity:0.7 }}>STUDY RECORD</div>
            {[
              { label:"今日の勉強時間",  val:`${player.studyMinutesToday || 0}分`,  color:"#86efac" },
              { label:"今週の勉強時間",  val:`${player.studyMinutesWeek  || 0}分`,  color:"#60a5fa" },
              { label:"累計勉強時間",    val:`${player.studyMinutesTotal || 0}分`,  color:"#a78bfa" },
              { label:"累計(時間)",      val:`${((player.studyMinutesTotal||0)/60).toFixed(1)}h`, color:"#a78bfa" },
              { label:"最深到達階層",    val:`B${player.maxFloor || 1}F`,           color:"#fbbf24" },
              { label:"現在レベル",      val:`Lv ${lv}`,                            color:"#4ade80" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, color:"#4a4a6a" }}>{label}</span>
                <span style={{ fontSize:13, color, fontWeight:700 }}>{val}</span>
              </div>
            ))}
          </div>
        )}

      </div>
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}