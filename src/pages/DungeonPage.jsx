import { useState, useEffect, useRef, useCallback } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcExp, calcGold, calcFloorProgress, MAPPING_PER_SET, expToLevel } from "../systems/timer";
import { rollEventType, rollNpcEvent, rollChest } from "../systems/events";
import { pickMonsters } from "../systems/monsters";
import { simulateBattle } from "../systems/battle";
import TimerSettings from "../components/TimerSettings";
import { calcPlayerStats } from "../systems/playerStats";
import DungeonCanvas from "../components/DungeonCanvas";

const EVENT_INTERVAL = 15000; // 15秒ごと（デモ用）
const BASE_MAX_EVENTS = 4;

export default function DungeonPage({ onBack }) {
  const player = usePlayerStore();
  const { updatePlayer } = usePlayerStore();

  const [workMin, setWorkMin] = useState(player.timerWork);
  const [breakMin, setBreakMin] = useState(player.timerBreak);
  const [totalSets, setTotalSets] = useState(player.timerSets);
  const [phase, setPhase] = useState("work");
  const [currentSet, setCurrentSet] = useState(1);
  const [seconds, setSeconds] = useState(player.timerWork * 60);
  const [totalSec, setTotalSec] = useState(player.timerWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mapping, setMapping] = useState(player.floorMapping || 0);
  const [floor, setFloor] = useState(player.floor || 1);
  const [hp, setHp] = useState(player.hp || 100);
  const [eventCount, setEventCount] = useState(0);
  const [logs, setLogs] = useState([{ id: 0, text: "ダンジョンに到着した…", color: "#86efac" }]);
  const [battlePopup, setBattlePopup] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const logId = useRef(1);
  const sessionExp = useRef(0);
  const sessionGold = useRef(0);
  const sessionMats = useRef({});
  const sessionChests = useRef([]);
  const defeatedList = useRef([]);
  const floorRef = useRef(player.floor || 1);
  const mappingRef = useRef(player.floorMapping || 0);
  const hpRef = useRef(player.hp || 100);

  const addLog = useCallback((text, color = "#666") => {
    setLogs(l => [...l, { id: logId.current++, text, color }]);
  }, []);

  const addMapping = useCallback((amount) => {
    const result = calcFloorProgress(mappingRef.current, amount);
    mappingRef.current = result.mapping;
    if (result.newFloor) {
      floorRef.current += 1;
      setFloor(floorRef.current);
      addLog(`🗺 B${floorRef.current}Fに到達！`, "#60a5fa");
    }
    setMapping(result.mapping);
  }, [addLog]);

  // タイマー
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (s > 1) return s - 1;
        if (phase === "work") {
          const exp = calcExp(workMin);
          const gold = calcGold(workMin);
          sessionExp.current += exp;
          sessionGold.current += gold;
          addMapping(MAPPING_PER_SET);
          addLog(`✨ ${workMin}分完了！ +${exp}EXP +${gold}G`, "#fbbf24");
          if (currentSet >= totalSets) {
            setIsRunning(false);
            setShowResult(true);
            return 0;
          }
          setPhase("break");
          setCurrentSet(c => c + 1);
          setEventCount(0);
          const t = breakMin * 60;
          setTotalSec(t);
          addLog("🔥 キャンプ休憩…", "#a78bfa");
          return t;
        } else {
          setPhase("work");
          const t = workMin * 60;
          setTotalSec(t);
          addLog(`⚔ セット${currentSet + 1}開始！`, "#86efac");
          return t;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, phase, workMin, breakMin, currentSet, totalSets, addLog, addMapping]);

  // イベント判定
  useEffect(() => {
    if (!isRunning || phase !== "work") return;
    const id = setInterval(() => {
      setEventCount(count => {
        if (count >= BASE_MAX_EVENTS) return count;
        if (Math.random() >= 0.70) return count;

        const evType = rollEventType();

        if (evType === "battle") {
          const monsters = pickMonsters(floorRef.current);
          const names = monsters.map(m => m.displayName).join("と");
          addLog(`⚔ ${names}が現れた！`, "#f87171");
          const baseStats = calcPlayerStats(player);
const currentPlayerStats = {
  ...baseStats,
  hp: hpRef.current,
  maxHp: baseStats.maxHp,
};
const result = simulateBattle(currentPlayerStats, monsters);
          hpRef.current = Math.max(1, result.playerHpAfter);
          setHp(hpRef.current);
          result.logs.slice(-3).forEach(l => addLog(l.text, l.color));
          if (result.won) {
            sessionExp.current += result.totalExp;
            sessionGold.current += result.totalGold;
            result.materials.forEach(mat => {
              sessionMats.current[mat] = (sessionMats.current[mat] || 0) + 1;
            });
            monsters.forEach(m => defeatedList.current.push(m));
            if (Math.random() < 0.25) sessionChests.current.push(rollChest());
            addMapping(2);
          }
          setBattlePopup({
            monsters, won: result.won,
            exp: result.totalExp, gold: result.totalGold,
            materials: result.materials,
            dangerStar: Math.max(...monsters.map(m => m.dangerStar)),
          });
          setTimeout(() => setBattlePopup(null), 8000);

        } else if (evType === "chest") {
          const chest = rollChest();
          sessionChests.current.push(chest);
          const gold = Math.floor(Math.random() * 50 + 20);
          sessionGold.current += gold;
          addLog(`📦 宝箱発見！（${chest.label}）+${gold}G`, "#fbbf24");

        } else if (evType === "trap") {
          const dmg = Math.floor(Math.random() * 15 + 5);
          hpRef.current = Math.max(1, hpRef.current - dmg);
          setHp(hpRef.current);
          addLog(`⚠ 罠発動！${dmg}ダメージ！`, "#fb923c");

        } else {
          const ev = rollNpcEvent();
          addLog(`${ev.icon} ${ev.text}`, ev.color);
          if (ev.effect === "heal") { hpRef.current = player.maxHp || 100; setHp(hpRef.current); }
          if (ev.effect === "map") addMapping(5);
        }

        return count + 1;
      });
    }, EVENT_INTERVAL);
    return () => clearInterval(id);
  }, [isRunning, phase, addLog, addMapping]);

  // リザルト確定
  const handleResultClose = () => {
  const newMats = { ...(player.materials || {}) };
  Object.entries(sessionMats.current).forEach(([k, v]) => {
    newMats[k] = (newMats[k] || 0) + v;
  });
  
  const studiedMinutes = workMin * currentSet;
  
  updatePlayer({
    totalExp: player.totalExp + sessionExp.current,
    gold: player.gold + sessionGold.current,
    floor: floorRef.current,
    maxFloor: Math.max(player.maxFloor || 1, floorRef.current),
    floorMapping: mappingRef.current,
    hp: hpRef.current,
    materials: newMats,
    timerWork: workMin,
    timerBreak: breakMin,
    timerSets: totalSets,
    studyMinutesTotal: (player.studyMinutesTotal || 0) + studiedMinutes,
    studyMinutesToday: (player.studyMinutesToday || 0) + studiedMinutes,
    studyMinutesWeek:  (player.studyMinutesWeek  || 0) + studiedMinutes,
  });
  setShowResult(false);
  onBack();
};

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = totalSec > 0 ? seconds / totalSec : 0;
  const accent = phase === "break" ? "#a78bfa" : "#4ade80";
  const lv = expToLevel(player.totalExp);
  const maxHp = player.maxHp || 100;

  // リザルト画面
  if (showResult) return (
    <div style={{ height:"100vh", background:"#06060f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"monospace", padding:20 }}>
      <div style={{ fontSize:9, letterSpacing:6, color:"#60a5fa" }}>EXPLORATION RESULT</div>
      <div style={{ fontSize:24, fontWeight:900, color:"#fff", letterSpacing:2 }}>探索終了</div>
      <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:"20px 28px", width:"100%", maxWidth:320 }}>
        {[
          { label:"獲得EXP",  val:`+${sessionExp.current}`,  color:"#86efac" },
          { label:"獲得G",    val:`+${sessionGold.current}`, color:"#fbbf24" },
          { label:"到達階層", val:`B${floorRef.current}F`,   color:"#60a5fa" },
          { label:"マップ率", val:`${Math.floor(mappingRef.current)}%`, color:"#60a5fa" },
          { label:"倒した敵", val:`${defeatedList.current.length}体`,   color:"#f87171" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ color:"#4a4a6a", fontSize:11 }}>{label}</span>
            <span style={{ color, fontSize:13, fontWeight:700 }}>{val}</span>
          </div>
        ))}
      </div>
      {Object.keys(sessionMats.current).length > 0 && (
        <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:"10px 16px", width:"100%", maxWidth:320 }}>
          <div style={{ fontSize:8, color:"#fb923c", marginBottom:6, letterSpacing:2 }}>獲得素材</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(sessionMats.current).map(([name, cnt]) => (
              <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#fb923c" }}>
                {name}×{cnt}
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={handleResultClose} style={{ padding:"12px 32px", background:"#0a2a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:12, letterSpacing:3, fontWeight:700 }}>
        街へ帰還 →
      </button>
    </div>
  );

  return (
    <div style={{ height:"100vh", background:"#000", fontFamily:"monospace", display:"flex", flexDirection:"column", position:"relative" }}>
        <DungeonCanvas isRunning={isRunning} isBreak={phase === "break"} />
      {/* ヘッダー */}
      <div style={{ padding:"10px 16px", background:"rgba(0,0,0,0.9)", borderBottom:"1px solid #1a1a2a", display:"flex", alignItems:"center", gap:12, position:"relative", zIndex:1 }}>
        <button onClick={onBack} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:"4px 10px", cursor:"pointer", fontSize:10 }}>← 街へ</button><button onClick={() => setShowSettings(true)} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:"4px 10px", cursor:"pointer", fontSize:10 }}>⚙</button>
        <div style={{ color:"#60a5fa", fontSize:12, letterSpacing:2 }}>B{floor}F</div>
        <div style={{ flex:1 }} />
        <div style={{ color:"#86efac", fontSize:10 }}>Lv{lv}</div>
        <div style={{ color:"#fbbf24", fontSize:10 }}>G {player.gold + sessionGold.current}</div>
        {/* HP バー */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ color:"#f87171", fontSize:10 }}>♥</span>
          <div style={{ width:50, height:5, background:"#1a0a0a", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(hp/maxHp)*100}%`, background: hp/maxHp > 0.5 ? "#4ade80" : hp/maxHp > 0.25 ? "#fbbf24" : "#f87171", borderRadius:3, transition:"width 0.5s" }} />
          </div>
          <span style={{ color:"#555", fontSize:8 }}>{hp}</span>
        </div>
      </div>

      {/* メイン */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:16, position:"relative", zIndex:1 }}>
        {/* 円形タイマー */}
        <div style={{ position:"relative", width:180, height:180 }}>
          <svg width={180} height={180} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={90} cy={90} r={78} fill="none" stroke="#1a1a1a" strokeWidth={8} />
            <circle cx={90} cy={90} r={78} fill="none" stroke={accent} strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 78 * pct} ${2 * Math.PI * 78}`}
              strokeLinecap="round"
              style={{ transition:"stroke-dasharray 0.5s linear", filter:`drop-shadow(0 0 6px ${accent})` }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:2 }}>
              {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
            </div>
            <div style={{ fontSize:10, color:accent, marginTop:4 }}>
              {phase === "break" ? "🔥 休憩中" : `SET ${currentSet}/${totalSets}`}
            </div>
          </div>
        </div>

        {/* イベント枠 */}
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({ length: BASE_MAX_EVENTS }).map((_, i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:3, background: i < eventCount ? "#fbbf24" : "#1a1a1a", border:`1px solid ${i < eventCount ? "#fbbf2488" : "#333"}`, boxShadow: i < eventCount ? "0 0 4px #fbbf2488" : "none", transition:"all 0.3s" }} />
          ))}
          <span style={{ fontSize:8, color:"#4a4a6a", marginLeft:4 }}>EVENTS {eventCount}/{BASE_MAX_EVENTS}</span>
        </div>

        {/* マッピング */}
        <div style={{ width:"100%", maxWidth:280 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#4a4a6a", marginBottom:4 }}>
            <span>マッピング B{floor}F</span><span>{Math.floor(mapping)}%</span>
          </div>
          <div style={{ height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${mapping}%`, background:"#60a5fa", borderRadius:3, transition:"width 0.5s" }} />
          </div>
        </div>

        {/* START/STOP */}
        <button onClick={() => setIsRunning(r => !r)} style={{ padding:"14px 40px", background: isRunning ? "#2a0a0a" : "#0a2a0a", border:`2px solid ${isRunning ? "#f87171" : "#4ade80"}`, borderRadius:8, cursor:"pointer", color: isRunning ? "#f87171" : "#4ade80", fontSize:16, letterSpacing:4, fontWeight:900 }}>
          {isRunning ? "STOP" : "START"}
        </button>

        {/* ログ */}
        <div style={{ width:"100%", maxWidth:320, maxHeight:100, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:2 }}>
          {logs.slice(-4).map((log, i) => (
            <div key={log.id} style={{ fontSize:11, color:log.color, opacity:0.4+(i/4)*0.6, padding:"2px 8px", background:"rgba(0,0,0,0.6)", borderLeft:`2px solid ${log.color}44`, borderRadius:"0 2px 2px 0" }}>
              {log.text}
            </div>
          ))}
        </div>
      </div>

      {/* 戦闘ポップアップ */}
      {battlePopup && (
        <div style={{ position:"absolute", bottom:20, left:16, right:16, background:"rgba(0,0,0,0.95)", border:"1px solid #2a2a3a", borderRadius:8, padding:"12px 14px", fontFamily:"monospace" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:9, color: battlePopup.won ? "#4ade80" : "#f87171", letterSpacing:2 }}>
              {battlePopup.won ? "⚔ 撃破！" : "💨 逃走"}
            </span>
            <span style={{ fontSize:8, color:"#fbbf24" }}>{"★".repeat(Math.min(battlePopup.dangerStar, 10))}</span>
          </div>
          {battlePopup.monsters.map((m, i) => (
            <div key={i} style={{ fontSize:10, color: m.rarity?.color || "#888", marginBottom:2 }}>{m.displayName}</div>
          ))}
          <div style={{ display:"flex", gap:10, marginTop:6, paddingTop:6, borderTop:"1px solid #1a1a2a", flexWrap:"wrap" }}>
            <span style={{ color:"#86efac", fontSize:10 }}>+{battlePopup.exp}EXP</span>
            <span style={{ color:"#fbbf24", fontSize:10 }}>+{battlePopup.gold}G</span>
            {battlePopup.materials.length > 0 && (
              <span style={{ color:"#fb923c", fontSize:10 }}>
                📦{[...new Set(battlePopup.materials)].map(m => `${m}×${battlePopup.materials.filter(x => x === m).length}`).join(" ")}
              </span>
            )}
          </div>
        </div>
      )}
      {showSettings && (
 　　　　<TimerSettings
    　　　workMin={workMin}
    　　　breakMin={breakMin}
    　　　sets={totalSets}
    　　　onApply={(w, b, s) => {
      　　　setWorkMin(w);
      　　　setBreakMin(b);
      　　　setTotalSets(s);
      　　　if (!isRunning) {
        　　　setSeconds(w * 60);
        　　　setTotalSec(w * 60);
      　　}
    　　}}
    　　onClose={() => setShowSettings(false)}
  　　/>
　　)}
    </div>
  );
}