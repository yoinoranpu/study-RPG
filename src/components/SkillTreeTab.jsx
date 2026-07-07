import { useState, useRef } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel } from "../systems/timer";
import { SKILLS, SKILL_LIST } from "../data/skills";

const RESPEC_COST = 2000;
const NR = 18; // ノード半径
const CENTER = { x:500, y:500 }; // SVGの中心
const R_STEP = 70; // 半径のステップ

// 角度と半径からXY座標を計算
const toXY = (angle, r) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER.x + Math.cos(rad) * r * R_STEP,
    y: CENTER.y + Math.sin(rad) * r * R_STEP,
  };
};

// 各スキルのXY座標を計算
const getPos = (sk) => {
  if (!sk.pos) return CENTER;
  if (sk.pos.x !== undefined) return { x: CENTER.x + sk.pos.x, y: CENTER.y + sk.pos.y };
  return toXY(sk.pos.angle, sk.pos.r);
};

const TYPE_COLOR = {
  stat:    "#86efac",
  passive: "#a78bfa",
  active:  "#f87171",
};

const TYPE_LABEL = {
  stat:    "ステータス",
  passive: "パッシブ",
  active:  "アクティブ",
};

// エッジ（接続線）を生成
const EDGES = SKILL_LIST.flatMap(sk =>
  (sk.req || []).map(r => ({ from: r, to: sk.id }))
);

export default function SkillTreeTab() {
  const { totalExp, gold, learnedSkills, spUsed, updatePlayer } = usePlayerStore();
  const [offset, setOffset] = useState({ x:0, y:0 });
  const [scale, setScale]   = useState(0.55);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [sel, setSel] = useState(null);
  const isDragged = useRef(false);

  const lv = expToLevel(totalExp);
  const spEarned = lv - 1;
  const spFree = spEarned - (spUsed || 0);
  const learned = new Set(learnedSkills || ["start"]);

  function canLearn(sk) {
    if (learned.has(sk.id)) return false;
    if (spFree < 1) return false;
    return (sk.req || []).every(r => learned.has(r));
  }

  function learnSkill(sk) {
    if (!canLearn(sk)) return;
    updatePlayer({
      learnedSkills: [...(learnedSkills || ["start"]), sk.id],
      spUsed: (spUsed || 0) + 1,
    });
  }

  function respec() {
    if (gold < RESPEC_COST) return;
    if (!window.confirm(`${RESPEC_COST}G消費してリセット？`)) return;
    updatePlayer({ gold: gold - RESPEC_COST, learnedSkills: ["start"], spUsed: 0 });
    setSel(null);
  }

  const getXY = (e) => e.touches
    ? { x:e.touches[0].clientX, y:e.touches[0].clientY }
    : { x:e.clientX, y:e.clientY };

  function onPD(e) { setDragging(true); setDragStart(getXY(e)); isDragged.current = false; }
  function onPM(e) {
    if (!dragging) return;
    const c = getXY(e);
    const dx = c.x - dragStart.x, dy = c.y - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragged.current = true;
    setOffset(o => ({ x:o.x+dx, y:o.y+dy }));
    setDragStart(c);
  }
  function onPU() { setDragging(false); }
  function onWheel(e) {
    e.preventDefault();
    setScale(s => Math.max(0.25, Math.min(2.0, s - e.deltaY * 0.001)));
  }
  function onNodeClick(sk) {
    if (isDragged.current) return;
    setSel(t => t === sk.id ? null : sk.id);
  }

  const selSkill = sel ? SKILLS[sel] : null;

  // スキルのXY座標をキャッシュ
  const posCache = {};
  SKILL_LIST.forEach(sk => { posCache[sk.id] = getPos(sk); });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* ヘッダー */}
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1e1e2e", flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:9, color:"#a78bfa", letterSpacing:2 }}>SKILL TREE</span>
        <span style={{ fontSize:11, color:"#fbbf24" }}>SP <b>{spFree}</b>/{spEarned}</span>
        <div style={{ display:"flex", gap:6, marginLeft:4 }}>
          {Object.entries(TYPE_COLOR).map(([type,color])=>(
            <span key={type} style={{ fontSize:7, color, border:`1px solid ${color}44`, padding:"1px 5px", borderRadius:2 }}>
              {TYPE_LABEL[type]}
            </span>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <button onClick={respec} style={{ padding:"4px 10px", background:"#1a0a0a", border:"1px solid #f8717144", borderRadius:3, cursor:"pointer", color:"#f87171", fontSize:8, fontFamily:"monospace" }}>
          振り直し {RESPEC_COST}G
        </button>
      </div>

      {/* キャンバス */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#03030a", cursor:dragging?"grabbing":"grab" }}
        onMouseDown={onPD} onMouseMove={onPM} onMouseUp={onPU} onMouseLeave={onPU}
        onTouchStart={onPD} onTouchMove={onPM} onTouchEnd={onPU}
        onWheel={onWheel}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", userSelect:"none" }}>
          <defs>
            <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
              <circle cx={20} cy={20} r={1} fill="#111122" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>

            {/* エッジ */}
            {EDGES.map(({ from, to }) => {
              const a = posCache[from], b = posCache[to];
              if (!a || !b) return null;
              const active = learned.has(from) && learned.has(to);
              const partial = learned.has(from) && !learned.has(to);
              const toSk = SKILLS[to];
              const color = TYPE_COLOR[toSk?.type] || "#888";
              return (
                <line key={`${from}-${to}`}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={active ? color : partial ? color+"55" : "#1a1a2a"}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray={partial ? "5 4" : "none"}
                  style={{ filter:active?`drop-shadow(0 0 3px ${color}66)`:"none" }}
                />
              );
            })}

            {/* ノード */}
            {SKILL_LIST.map(sk => {
              const pos = posCache[sk.id];
              if (!pos) return null;
              const isL = learned.has(sk.id);
              const learnable = canLearn(sk);
              const isSel = sel === sk.id;
              const locked = !isL && !learnable;
              const color = sk.color || TYPE_COLOR[sk.type] || "#888";

              return (
                <g key={sk.id} onClick={() => onNodeClick(sk)} style={{ cursor:"pointer" }}>
                  {isSel && (
                    <circle cx={pos.x} cy={pos.y} r={NR+6}
                      fill="none" stroke={color} strokeWidth={1.5}
                      style={{ filter:`drop-shadow(0 0 8px ${color})` }} />
                  )}
                  <circle cx={pos.x} cy={pos.y} r={NR}
                    fill={isL ? `${color}22` : locked ? "#050508" : "#09090f"}
                    stroke={isL ? color : learnable ? color+"88" : "#2a2a3a"}
                    strokeWidth={isL ? 2 : 1.5}
                    style={{ filter:isL ? `drop-shadow(0 0 5px ${color}88)` : "" }}
                  />
                  <text x={pos.x} y={pos.y-2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={locked ? 10 : 12} opacity={locked ? 0.2 : 1}
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {locked ? "🔒" : sk.icon}
                  </text>
                  <text x={pos.x} y={pos.y+11} textAnchor="middle" fontSize={5.5}
                    fill={isL ? color : locked ? "#2a2a2a" : color+"88"}
                    fontFamily="monospace"
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {sk.name.slice(0, 6)}
                  </text>
                  {isL && sk.id !== "start" && (
                    <text x={pos.x+NR-4} y={pos.y-NR+6} textAnchor="middle"
                      fontSize={9} fill="#4ade80"
                      style={{ pointerEvents:"none" }}>✓</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div style={{ position:"absolute", bottom:8, left:0, right:0, textAlign:"center", fontSize:8, color:"#1a1a2a", pointerEvents:"none", letterSpacing:2 }}>
          ドラッグ移動・ホイールズーム
        </div>
      </div>

      {/* 詳細パネル */}
      {selSkill && (
        <div style={{ padding:"10px 14px", background:"#07070e", borderTop:"1px solid #1a1a2a", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:20 }}>{selSkill.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, fontWeight:700, color:learned.has(selSkill.id)?selSkill.color||"#e8e0d0":"#e8e0d0" }}>
                  {selSkill.name}
                </span>
                <span style={{ fontSize:7, color:TYPE_COLOR[selSkill.type], border:`1px solid ${TYPE_COLOR[selSkill.type]}44`, padding:"1px 4px", borderRadius:2 }}>
                  {TYPE_LABEL[selSkill.type]}
                </span>
                {learned.has(selSkill.id) && (
                  <span style={{ fontSize:7, color:"#4ade80", border:"1px solid #4ade8044", padding:"1px 4px", borderRadius:2 }}>習得済み</span>
                )}
              </div>
              <div style={{ fontSize:9, color:"#4a4a6a", marginTop:2 }}>{selSkill.desc}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#fbbf24" }}>SP 1</div>
              {selSkill.type==="passive" && <div style={{ fontSize:7, color:"#a78bfa", marginTop:2 }}>キャラタブでセット</div>}
              {selSkill.type==="active"  && <div style={{ fontSize:7, color:"#f87171", marginTop:2 }}>キャラタブでセット</div>}
            </div>
          </div>

          {!learned.has(selSkill.id) && (
            <button onClick={() => learnSkill(selSkill)}
              disabled={!canLearn(selSkill)}
              style={{ width:"100%", padding:"7px 0", background:canLearn(selSkill)?"#0a1a0a":"#0a0a0a", border:`1px solid ${canLearn(selSkill)?selSkill.color||TYPE_COLOR[selSkill.type]:"#2a2a2a"}`, borderRadius:4, cursor:canLearn(selSkill)?"pointer":"default", color:canLearn(selSkill)?selSkill.color||TYPE_COLOR[selSkill.type]:"#3a3a3a", fontSize:10, letterSpacing:2, fontFamily:"monospace" }}>
              {spFree < 1 ? "SP不足"
                : !(selSkill.req||[]).every(r=>learned.has(r)) ? "前提未取得"
                : "SP1消費して習得"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}