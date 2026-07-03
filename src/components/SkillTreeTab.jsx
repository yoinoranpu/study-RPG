import { useState, useRef } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel } from "../systems/timer";
import { SKILLS, SKILL_LIST, SKILL_POSITIONS } from "../data/skills";

const RESPEC_COST = 2000;
const NR = 22;

const EDGES = SKILL_LIST.flatMap(sk =>
  sk.req.map(r => ({ from:r, to:sk.id }))
);

const TYPE_COLOR = {
  stat:    "#86efac",
  passive: "#a78bfa",
  active:  "#f87171",
};

const TYPE_LABEL = {
  stat:    "ステータス強化",
  passive: "パッシブ",
  active:  "アクティブ",
};

export default function SkillTreeTab() {
  const { totalExp, gold, learnedSkills, spUsed, updatePlayer } = usePlayerStore();
  const [offset, setOffset] = useState({ x:-50, y:-50 });
  const [scale, setScale]   = useState(0.75);
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
    if (spFree < (sk.sp || 1)) return false;
    return sk.req.every(r => learned.has(r));
  }

  function learnSkill(sk) {
    if (!canLearn(sk)) return;
    updatePlayer({
      learnedSkills: [...(learnedSkills || ["start"]), sk.id],
      spUsed: (spUsed || 0) + (sk.sp || 1),
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
  function onWheel(e) { e.preventDefault(); setScale(s => Math.max(0.3, Math.min(2.5, s - e.deltaY*0.001))); }
  function onNodeClick(sk) { if (isDragged.current) return; setSel(t => t===sk.id?null:sk.id); }

  const selSkill = sel ? SKILLS[sel] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* ヘッダー */}
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1e1e2e", flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:9, color:"#a78bfa", letterSpacing:2 }}>SKILL TREE</span>
        <span style={{ fontSize:11, color:"#fbbf24" }}>SP <b>{spFree}</b>/{spEarned}</span>
        <div style={{ display:"flex", gap:8, marginLeft:4 }}>
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
              const a = SKILL_POSITIONS[from], b = SKILL_POSITIONS[to];
              if (!a || !b) return null;
              const active = learned.has(from) && learned.has(to);
              const partial = learned.has(from) && !learned.has(to);
              const toSk = SKILLS[to];
              const color = TYPE_COLOR[toSk?.type] || "#888";
              return (
                <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={active ? color : partial ? color+"55" : "#1a1a2a"}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={partial ? "5 4" : "none"}
                  style={{ filter:active?`drop-shadow(0 0 3px ${color}66)`:"none" }} />
              );
            })}

            {/* ノード */}
            {SKILL_LIST.map(sk => {
              const pos = SKILL_POSITIONS[sk.id];
              if (!pos) return null;
              const isL = learned.has(sk.id);
              const learnable = canLearn(sk);
              const isSel = sel === sk.id;
              const locked = !isL && !learnable;
              const color = TYPE_COLOR[sk.type] || "#888";
              const nc = isL ? color : learnable ? color+"99" : "#2a2a3a";

              return (
                <g key={sk.id} onClick={() => onNodeClick(sk)} style={{ cursor:"pointer" }}>
                  {isSel && <circle cx={pos.x} cy={pos.y} r={NR+6} fill="none" stroke={color} strokeWidth={1.5} style={{ filter:`drop-shadow(0 0 8px ${color})` }} />}
                  <circle cx={pos.x} cy={pos.y} r={NR}
                    fill={isL?"#0d0d18":locked?"#050508":"#09090f"}
                    stroke={nc} strokeWidth={isL?2:1.5}
                    style={{ filter:isL?`drop-shadow(0 0 6px ${color}88)`:isSel?`drop-shadow(0 0 6px ${color})`:"" }} />
                  <text x={pos.x} y={pos.y-4} textAnchor="middle" dominantBaseline="middle"
                    fontSize={locked?12:14} opacity={locked?0.2:1}
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {locked?"🔒":sk.icon}
                  </text>
                  <text x={pos.x} y={pos.y+13} textAnchor="middle" fontSize={6}
                    fill={isL?color:locked?"#2a2a2a":color+"99"}
                    fontFamily="monospace"
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {sk.name}
                  </text>
                  {isL && sk.id !== "start" && (
                    <text x={pos.x+NR-3} y={pos.y-NR+8} textAnchor="middle" fontSize={9} fill="#4ade80" style={{ pointerEvents:"none" }}>✓</text>
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
                <span style={{ fontSize:12, fontWeight:700, color:learned.has(selSkill.id)?TYPE_COLOR[selSkill.type]:"#e8e0d0" }}>
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
              <div style={{ fontSize:10, color:"#fbbf24" }}>SP {selSkill.sp}</div>
              {selSkill.type==="passive" && <div style={{ fontSize:7, color:"#a78bfa", marginTop:2 }}>キャラタブでセット</div>}
              {selSkill.type==="active"  && <div style={{ fontSize:7, color:"#f87171", marginTop:2 }}>将来実装</div>}
            </div>
          </div>

          {!learned.has(selSkill.id) && (
            <button onClick={() => learnSkill(selSkill)} disabled={!canLearn(selSkill)}
              style={{ width:"100%", padding:"7px 0", background:canLearn(selSkill)?"#0a1a0a":"#0a0a0a", border:`1px solid ${canLearn(selSkill)?TYPE_COLOR[selSkill.type]:"#2a2a2a"}`, borderRadius:4, cursor:canLearn(selSkill)?"pointer":"default", color:canLearn(selSkill)?TYPE_COLOR[selSkill.type]:"#3a3a3a", fontSize:10, letterSpacing:2, fontFamily:"monospace" }}>
              {spFree < (selSkill.sp||1) ? `SP不足（必要${selSkill.sp}）`
                : !selSkill.req.every(r=>learned.has(r)) ? "前提未取得"
                : `SP${selSkill.sp}消費して習得`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}