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
import AchievementTab from "../components/AchievementTab";
import DebugItemTab from "../components/DebugItemTab";
import GuildLayoutEditor from "../components/GuildLayoutEditor";
import { DUNGEONS, isDungeonUnlocked, getGlobalUnlockDepth } from "../systems/dungeons";
import { resetQuestsIfNeeded, QUEST_DEFS } from "../systems/quests";
import { ACHIEVEMENT_DEFS } from "../systems/achievements";
import { GUILD_LAYOUT_DEFAULT } from "../data/guildLayout";

const DIM = "#7a7a9a";

export default function TownPage({ onEnterDungeon }) {
  const [tab, setTab] = useState("home");
  const [subTab, setSubTab] = useState("home");
  const [bookTab, setBookTab] = useState("monster");
  const [showSettings, setShowSettings] = useState(false);
  const [stampingDungeonId, setStampingDungeonId] = useState(null);
  const [guildLayout, setGuildLayout] = useState(GUILD_LAYOUT_DEFAULT);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const w = window.innerWidth;
  const [isMobile, setIsMobile] = useState(w < 768);
  const [isTablet, setIsTablet] = useState(w >= 768 && w < 1024);
  const player = usePlayerStore();
  const { updatePlayer } = usePlayerStore();
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const DEBUG = import.meta.env.DEV;

  // 報酬を受け取れるクエスト/実績の数（掲示板シーンのバッジ表示用）
  const q = player.quests || {};
  const claimableQuestCount = [
    ...QUEST_DEFS.daily.map(quest => ({ quest, claimedKey:"claimedDaily" })),
    ...QUEST_DEFS.weekly.map(quest => ({ quest, claimedKey:"claimedWeekly" })),
  ].filter(({ quest, claimedKey }) => quest.get(q, player) >= quest.target && !q[claimedKey]?.[quest.id]).length;

  const claimedAchievements = player.achievements?.claimed || {};
  const claimableAchievementCount = ACHIEVEMENT_DEFS.filter(a => a.get(player) >= a.target && !claimedAchievements[a.id]).length;

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        <div className="rpg-heading" style={{ fontSize:10, letterSpacing:5, color:"#c9963d", marginBottom:2, opacity:0.8 }}>STUDY DUNGEON</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="rpg-heading" style={{ fontSize:18, color:"#fff" }}>街</div>
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:isMobile?"8px 2px":"7px 2px", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?0:1 }}>
            <span style={{ fontSize:isMobile?14:13 }}>{t.icon}</span>
            {!isMobile && <span style={{ fontSize:10, color:tab===t.id?"#a78bfa":DIM }}>{t.label}</span>}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div style={{ flex:1, overflowY:"auto", padding: ["character","shop","forge"].includes(tab) ? 0 : 14 }}>

        {/* ホーム */}
        {tab === "home" && subTab === "home" && (
          <div style={{ position:"relative", margin:"-14px", overflow:"hidden" }}>
            {/* 背景：画像は横幅いっぱいに自然なアスペクト比で表示（モバイルでは高さ制限） */}
            <div style={{ position:"absolute", inset:0, background:"#08080f" }} />
            <div style={{ position:"absolute", top:0, left:0, right:0, maxHeight:isMobile?"120px":isTablet?"160px":"auto", overflow:"hidden" }}>
              <img src="/assets/images/town-banner.png" alt="" style={{ width:"100%", height:"auto", display:"block" }} />
              <div style={{
                position:"absolute", inset:0,
                backgroundImage:"linear-gradient(180deg, rgba(5,5,8,0.05) 0%, rgba(5,5,8,0.1) 40%, rgba(5,5,8,0.85) 75%, #08080f 92%, #08080f 100%)",
              }} />
            </div>

            <div style={{ position:"relative", zIndex:1, padding:isMobile?"100px 10px 10px":"150px 14px 14px", display:"flex", flexDirection:"column", gap:isMobile?6:10 }}>
            <div className="rpg-panel" style={{ padding:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:28 }}>🧙</span>
                <div style={{ flex:1 }}>
                  <div className="rpg-heading" style={{ fontSize:14, color:"#e8e0d0" }}>Lv {lv}</div>
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

            {/* ギルドの詰め所：壁に掲示板+クエスト掲示板、床に本+トロフィー */}
            <div style={{ position:"relative", width:"100%", aspectRatio:"1408/768" }}>
              <img src="/assets/images/guild_wall.png" alt="" style={{ width:"100%", height:"100%", display:"block" }} />

              {/* 掲示板：貼り紙3枚がダンジョン1/2/3。押すと「受注」印が押されてからダンジョンへ */}
              <div style={{ position:"absolute", left:`${guildLayout.board.left}%`, top:`${guildLayout.board.top}%`, width:`${guildLayout.board.width}%`, aspectRatio:"1074/597" }}>
                <img src="/assets/images/guild_board.png" alt="" style={{ width:"100%", height:"100%", display:"block" }} />
                {DUNGEONS.map((d, idx) => {
                  const ds = player.dungeons?.[d.id] || { floor:1, maxFloor:1, floorMapping:0, cleared:false };
                  const unlocked = isDungeonUnlocked(player.dungeons, d.id);
                  const stamping = stampingDungeonId === d.id;
                  const seal = ["/assets/images/dungeon_seal_1.png", "/assets/images/dungeon_seal_2.png", "/assets/images/dungeon_seal_3.png"][idx];
                  const pos = [
                    { left:"10.9%", top:"26.0%", width:"22.3%", height:"52.7%" },
                    { left:"38.5%", top:"25.5%", width:"22.1%", height:"52.1%" },
                    { left:"65.7%", top:"26.0%", width:"22.4%", height:"52.7%" },
                  ][idx];
                  return (
                    <button key={d.id} disabled={!unlocked || !!stampingDungeonId}
                      onClick={() => {
                        if (!unlocked || stampingDungeonId) return;
                        setStampingDungeonId(d.id);
                        setTimeout(() => {
                          updatePlayer({ currentDungeonId: d.id });
                          onEnterDungeon();
                        }, 700);
                      }}
                      className="guild-prop-btn"
                      style={{ position:"absolute", ...pos, background:"transparent", border:"none", padding:"4% 4% 8%", cursor: unlocked?"pointer":"default", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", overflow:"visible" }}>
                      {unlocked ? (
                        <div style={{ position:"relative", width:"38%" }}>
                          <img src={seal} alt="" style={{ width:"100%", height:"auto", display:"block", opacity:0.92 }} />
                          {ds.cleared && (
                            <span style={{ position:"absolute", bottom:"-10%", right:"-14%", fontSize:"clamp(11px,3vw,16px)" }}>🏆</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize:"clamp(13px,3.6vw,20px)" }}>🔒</span>
                      )}
                      <div className="rpg-heading" style={{ fontSize:"clamp(9px,2.2vw,13px)", fontWeight:900, color: unlocked?"#241608":"#8a7f6c", marginTop:4, whiteSpace:"nowrap", textShadow: unlocked?"0 1px 0 rgba(255,255,255,0.35)":"none" }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize:"clamp(7px,1.7vw,10px)", fontWeight:700, color: unlocked?"#4a3520":"#8a7f6c", marginTop:3, lineHeight:1.3, whiteSpace:"nowrap" }}>
                        {unlocked ? `B${ds.floor}F・マップ${Math.floor(ds.floorMapping||0)}%` : "未解放"}
                      </div>
                      {stamping && (
                        <img src="/assets/images/stamp_juchu.png" alt="受注" className="stamp-pop" style={{ position:"absolute", width:"75%", top:"50%", left:"50%", marginTop:"-37.5%", marginLeft:"-37.5%", pointerEvents:"none" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* クエスト掲示板：掲示板の横 */}
              <button onClick={() => setSubTab("quest")} className="guild-prop-btn" style={{ position:"absolute", left:`${guildLayout.questBoard.left}%`, top:`${guildLayout.questBoard.top}%`, width:`${guildLayout.questBoard.width}%`, background:"transparent", border:"none", padding:0, cursor:"pointer" }}>
                <div style={{ position:"relative" }}>
                  <img src="/assets/images/guild_quest_board.png" alt="" style={{ width:"100%", aspectRatio:"450/742", display:"block" }} />
                  {claimableQuestCount > 0 && (
                    <span style={{ position:"absolute", top:"-8%", right:"-8%", minWidth:"20%", aspectRatio:"1/1", borderRadius:"50%", background:"#ef4444", color:"#fff", fontSize:"clamp(9px,2.2vw,13px)", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 6px rgba(0,0,0,0.6)" }}>
                      {claimableQuestCount}
                    </span>
                  )}
                </div>
                <div className="rpg-heading" style={{ fontSize:"clamp(8px,2vw,11px)", color:"#e8dcc0", marginTop:4, textShadow:"0 1px 3px #000" }}>クエスト</div>
              </button>

              {/* 床：本(図鑑)とトロフィー(実績) */}
              <button onClick={() => setSubTab("book")} className="guild-prop-btn" style={{ position:"absolute", left:`${guildLayout.book.left}%`, bottom:`${guildLayout.book.bottom}%`, width:`${guildLayout.book.width}%`, background:"transparent", border:"none", padding:0, cursor:"pointer" }}>
                <img src="/assets/images/guild_book.png" alt="" style={{ width:"100%", height:"auto", display:"block" }} />
                <div className="rpg-heading" style={{ fontSize:"clamp(8px,2vw,11px)", color:"#e8dcc0", marginTop:4, textShadow:"0 1px 3px #000" }}>図鑑</div>
              </button>
              <button onClick={() => setSubTab("achievement")} className="guild-prop-btn" style={{ position:"absolute", right:`${guildLayout.trophy.right}%`, bottom:`${guildLayout.trophy.bottom}%`, width:`${guildLayout.trophy.width}%`, background:"transparent", border:"none", padding:0, cursor:"pointer" }}>
                <div style={{ position:"relative" }}>
                  <img src="/assets/images/guild_trophy.png" alt="" style={{ width:"100%", height:"auto", display:"block" }} />
                  {claimableAchievementCount > 0 && (
                    <span style={{ position:"absolute", top:"-8%", right:"-8%", minWidth:"22%", aspectRatio:"1/1", borderRadius:"50%", background:"#ef4444", color:"#fff", fontSize:"clamp(9px,2.2vw,13px)", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 6px rgba(0,0,0,0.6)" }}>
                      {claimableAchievementCount}
                    </span>
                  )}
                </div>
                <div className="rpg-heading" style={{ fontSize:"clamp(8px,2vw,11px)", color:"#e8dcc0", marginTop:4, textShadow:"0 1px 3px #000" }}>実績</div>
              </button>
            </div>
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

        {/* 実績 */}
        {tab === "home" && subTab === "achievement" && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
            <button onClick={() => setSubTab("home")} style={{ padding:"6px 12px", background:"transparent", border:"none", color:DIM, cursor:"pointer", fontSize:10, textAlign:"left", fontFamily:"monospace" }}>← 戻る</button>
            <div style={{ flex:1, overflow:"hidden" }}>
              <AchievementTab />
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
        {DEBUG && tab === "home" && subTab === "home" && (
          <button onClick={() => setShowLayoutEditor(true)} style={{ position:"fixed", bottom:16, right:16, zIndex:50, padding:"8px 12px", background:"#1a0a1a", border:"1px solid #a78bfa44", borderRadius:6, cursor:"pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace" }}>
            DEBUG: 配置エディタ
          </button>
        )}

        {tab === "character" && <CharacterPage />}
        {tab === "shop"      && <ShopTab />}
        {tab === "forge"     && <ForgeTab />}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
      {showLayoutEditor && (
        <GuildLayoutEditor
          layout={guildLayout}
          onChange={(key, field, value) => setGuildLayout(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))}
          onReset={() => setGuildLayout(GUILD_LAYOUT_DEFAULT)}
          onClose={() => setShowLayoutEditor(false)}
        />
      )}
    </div>
  );
}