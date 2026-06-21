import { useState, useEffect, useRef, useCallback } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcExp, calcGold, calcFloorProgress, MAPPING_PER_SET, expToLevel } from "../systems/timer";

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
  const [logs, setLogs] = useState([{ id: 0, text: "ダンジョンに到着した…", color: "#86efac" }]);

  const logId = useRef(1);
  const sessionExp = useRef(0);
  const sessionGold = useRef(0);
  const floorRef = useRef(player.floor || 1);
  const mappingRef = useRef(player.floorMapping || 0);

  const addLog = useCallback((text, color = "#666") => {
    setLogs(l => [...l, { id: logId.current++, text, color }]);
  }, []);

  const addMapping = useCallback((amount) => {
    setMapping(m => {
      const result = calcFloorProgress(mappingRef.current, amount);
      mappingRef.current = result.mapping;
      if (result.newFloor) {
        floorRef.current += 1;
        setFloor(floorRef.current);
        addLog(`B${floorRef.current}Fに到達！`, "#60a5fa");
      }
      return result.mapping;
    });
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
          updatePlayer({
            totalExp: player.totalExp + sessionExp.current,
            gold: player.gold + sessionGold.current,
          });
          addMapping(MAPPING_PER_SET);
          addLog(`${workMin}分完了！ +${exp}EXP +${gold}G`, "#fbbf24");
          if (currentSet >= totalSets) {
            setIsRunning(false);
            addLog("全セット完了！街へ帰還する…", "#4ade80");
            setTimeout(() => {
              updatePlayer({
                floor: floorRef.current,
                maxFloor: Math.max(player.maxFloor, floorRef.current),
                floorMapping: mappingRef.current,
                timerWork: workMin,
                timerBreak: breakMin,
                timerSets: totalSets,
              });
              onBack();
            }, 2000);
            return 0;
          }
          setPhase("break");
          setCurrentSet(c => c + 1);
          const t = breakMin * 60;
          setTotalSec(t);
          addLog("休憩タイム…", "#a78bfa");
          return t;
        } else {
          setPhase("work");
          const t = workMin * 60;
          setTotalSec(t);
          addLog(`セット${currentSet + 1}開始！`, "#86efac");
          return t;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, phase, workMin, breakMin, currentSet, totalSets, addLog, addMapping]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = totalSec > 0 ? seconds / totalSec : 0;
  const accent = phase === "break" ? "#a78bfa" : "#4ade80";
  const lv = expToLevel(player.totalExp);

  return (
    <div style={{ height: "100vh", background: "#000", fontFamily: "monospace", position: "relative", display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.8)", borderBottom: "1px solid #1a1a2a", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #333", borderRadius: 4, color: "#666", padding: "4px 10px", cursor: "pointer", fontSize: 10 }}>← 街へ</button>
        <div style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 2 }}>DUNGEON B{floor}F</div>
        <div style={{ flex: 1 }} />
        <div style={{ color: "#86efac", fontSize: 10 }}>Lv{lv}</div>
        <div style={{ color: "#fbbf24", fontSize: 10 }}>G {player.gold}</div>
      </div>

      {/* メインエリア */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 16 }}>
        {/* 円形タイマー */}
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={80} cy={80} r={70} fill="none" stroke="#1a1a1a" strokeWidth={8} />
            <circle cx={80} cy={80} r={70} fill="none" stroke={accent} strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 70 * pct} ${2 * Math.PI * 70}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.5s linear", filter: `drop-shadow(0 0 6px ${accent})` }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 10, color: accent, marginTop: 4 }}>
              {phase === "break" ? "休憩中" : `SET ${currentSet}/${totalSets}`}
            </div>
          </div>
        </div>

        {/* マッピング */}
        <div style={{ width: "100%", maxWidth: 300 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#4a4a6a", marginBottom: 4 }}>
            <span>マッピング</span><span>{Math.floor(mapping)}%</span>
          </div>
          <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${mapping}%`, background: "#60a5fa", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setIsRunning(r => !r)} style={{ padding: "12px 32px", background: isRunning ? "#2a0a0a" : "#0a2a0a", border: `2px solid ${isRunning ? "#f87171" : "#4ade80"}`, borderRadius: 6, cursor: "pointer", color: isRunning ? "#f87171" : "#4ade80", fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>
            {isRunning ? "STOP" : "START"}
          </button>
        </div>

        {/* ログ */}
        <div style={{ width: "100%", maxWidth: 300, maxHeight: 120, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
          {logs.slice(-4).map((log, i) => (
            <div key={log.id} style={{ fontSize: 11, color: log.color, opacity: 0.4 + (i / 4) * 0.6, padding: "2px 8px", background: "rgba(0,0,0,0.5)", borderLeft: `2px solid ${log.color}44`, borderRadius: "0 2px 2px 0" }}>
              {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}