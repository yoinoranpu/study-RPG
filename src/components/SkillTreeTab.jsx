export default function SkillTreeTab() {
  return (
    <div style={{
      color: "red",
      fontSize: "50px",
      background: "black"
    }}>
      TEST
    </div>
  );
}
import { useState, useRef } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { expToLevel } from "../systems/timer";

const RESPEC_COST = 2000;
const NR = 22;

const SKILL_TREE = [
  {id:"start",name:"冒険者",icon:"⭐",x:400,y:400,color:"#fbbf24",req:[],sp:0,desc:"すべての始まり",effect:"HP+10",reqLv:0},
  {id:"w_base",name:"戦士",icon:"⚔",x:400,y:280,color:"#f87171",req:["start"],sp:1,desc:"戦士の基礎",effect:"ATK+5",reqLv:0},
  {id:"w_slash",name:"斬りつける",icon:"🗡",x:320,y:220,color:"#f87171",req:["w_base"],sp:1,desc:"基本斬撃",effect:"ATK+4",reqLv:0},
  {id:"w_guard",name:"ガード",icon:"🛡",x:460,y:220,color:"#f87171",req:["w_base"],sp:1,desc:"防御構え",effect:"DEF+5",reqLv:0},
  {id:"w_bleed",name:"出血",icon:"🩸",x:260,y:170,color:"#ef4444",req:["w_slash"],sp:1,desc:"出血付与",effect:"継続ダメージ",reqLv:0},
  {id:"w_berserk",name:"狂戦士",icon:"🔥",x:200,y:120,color:"#b91c1c",req:["w_bleed"],sp:3,desc:"Lv30 血と怒りの化身",effect:"ATK+30",reqLv:30},
  {id:"w_knight",name:"騎士",icon:"🛡",x:520,y:170,color:"#ef4444",req:["w_guard"],sp:2,desc:"Lv10 守護の誓い",effect:"DEF+15",reqLv:10},
  {id:"w_holy",name:"聖騎士",icon:"✝",x:570,y:120,color:"#b91c1c",req:["w_knight"],sp:3,desc:"Lv30 光の加護",effect:"DEF+25 HP+50",reqLv:30},
  {id:"m_base",name:"魔法使い",icon:"✨",x:520,y:280,color:"#a78bfa",req:["start"],sp:1,desc:"魔法の素質",effect:"MAG+8",reqLv:0},
  {id:"m_fire",name:"ファイアボルト",icon:"🔥",x:590,y:220,color:"#a78bfa",req:["m_base"],sp:1,desc:"炎の矢",effect:"炎ATK+6",reqLv:0},
  {id:"m_mage",name:"魔術師",icon:"🧙",x:640,y:165,color:"#7c3aed",req:["m_fire"],sp:2,desc:"Lv10 一流魔法使い",effect:"MAG+15",reqLv:10},
  {id:"m_ifrit",name:"炎帝",icon:"🌋",x:670,y:115,color:"#6d28d9",req:["m_mage"],sp:3,desc:"Lv30 炎の支配者",effect:"炎ATK+40%",reqLv:30},
  {id:"m_summon",name:"召喚術",icon:"👁",x:600,y:300,color:"#8b5cf6",req:["m_base"],sp:1,desc:"使い魔基礎",effect:"召喚ATK+5%",reqLv:5},
  {id:"m_summoner",name:"召喚士",icon:"🌟",x:660,y:260,color:"#6d28d9",req:["m_summon"],sp:3,desc:"Lv25 使い魔の主",effect:"召喚ATK+30%",reqLv:25},
  {id:"t_base",name:"盗賊",icon:"🌑",x:520,y:430,color:"#34d399",req:["start"],sp:1,desc:"影に生きる者",effect:"回避+5%",reqLv:0},
  {id:"t_stealth",name:"隠密",icon:"👤",x:590,y:400,color:"#34d399",req:["t_base"],sp:1,desc:"闇に溶ける",effect:"回避+5%",reqLv:0},
  {id:"t_thief",name:"大泥棒",icon:"🎭",x:650,y:370,color:"#047857",req:["t_stealth"],sp:2,desc:"Lv25 伝説の盗人",effect:"G獲得+25%",reqLv:25},
  {id:"e_base",name:"探索家",icon:"🗺",x:400,y:520,color:"#60a5fa",req:["start"],sp:1,desc:"未知を切り拓く",effect:"マップ+10%",reqLv:0},
  {id:"e_obs",name:"観察眼",icon:"👁",x:400,y:590,color:"#60a5fa",req:["e_base"],sp:1,desc:"細部を見逃さない",effect:"宝箱+5%",reqLv:0},
  {id:"e_master",name:"ダンジョンマスター",icon:"👑",x:400,y:655,color:"#1e40af",req:["e_obs"],sp:3,desc:"Lv28 迷宮の支配者",effect:"レア宝箱+15%",reqLv:28},
  {id:"a_base",name:"錬金術師",icon:"⚗",x:280,y:520,color:"#fb923c",req:["start"],sp:1,desc:"素材を操る知恵者",effect:"ポーション効果+15%",reqLv:0},
  {id:"a_golem",name:"ゴーレムマスター",icon:"🤺",x:220,y:580,color:"#9a3412",req:["a_base"],sp:3,desc:"Lv30 鋼の守護者",effect:"DEF+30",reqLv:30},
  {id:"r_base",name:"アーチャー",icon:"🏹",x:280,y:280,color:"#86efac",req:["start"],sp:1,desc:"弓の道を歩む者",effect:"ATK+4",reqLv:0},
  {id:"r_hunter",name:"ハンター",icon:"🎣",x:220,y:220,color:"#16a34a",req:["r_base"],sp:2,desc:"Lv22 狩りの達人",effect:"状態異常+20%",reqLv:22},
  {id:"st_base",name:"勉学",icon:"📖",x:400,y:340,color:"#38bdf8",req:["start"],sp:1,desc:"学びの力",effect:"EXP+3%",reqLv:0},
  {id:"st_focus",name:"集中力",icon:"🧠",x:340,y:295,color:"#38bdf8",req:["st_base"],sp:1,desc:"深い集中",effect:"EXP+3%",reqLv:0},
  {id:"st_elite",name:"学習の極意",icon:"🎓",x:310,y:245,color:"#0369a1",req:["st_focus"],sp:3,desc:"Lv20 勉強の達人",effect:"EXP+10%",reqLv:20},
  {id:"s_atk1",name:"攻撃力+3",icon:"⬆",x:460,y:250,color:"#f87171",req:["w_base"],sp:1,desc:"攻撃力強化",effect:"ATK+3",reqLv:0},
  {id:"s_def1",name:"防御力+3",icon:"🔵",x:340,y:355,color:"#60a5fa",req:["start"],sp:1,desc:"防御力強化",effect:"DEF+3",reqLv:0},
  {id:"s_hp1",name:"HP+10",icon:"❤",x:460,y:355,color:"#f87171",req:["start"],sp:1,desc:"HP強化",effect:"HP+10",reqLv:0},
];

const NODE_MAP = Object.fromEntries(SKILL_TREE.map(s => [s.id, s]));
const EDGES = SKILL_TREE.flatMap(s => s.req.map(r => ({ from: r, to: s.id })));

export default function SkillTreeTab() {
  const { totalExp, gold, learnedSkills, spUsed, updatePlayer } = usePlayerStore();
  const [offset, setOffset] = useState({ x: -100, y: -100 });
  const [scale, setScale] = useState(0.75);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [sel, setSel] = useState(null);
  const isDragged = useRef(false);

  const lv = expToLevel(totalExp);
  const spEarned = lv - 1;
  const spFree = spEarned - (spUsed || 0);
  const learned = new Set(learnedSkills || ["start"]);

  function canLearn(node) {
    if (learned.has(node.id)) return false;
    if (node.reqLv && lv < node.reqLv) return false;
    if (spFree < (node.sp || 1)) return false;
    return node.req.every(r => learned.has(r));
  }

  function learnNode(node) {
    if (!canLearn(node)) return;
    updatePlayer({
      learnedSkills: [...(learnedSkills || ["start"]), node.id],
      spUsed: (spUsed || 0) + (node.sp || 1),
    });
  }

  function respec() {
    if (gold < RESPEC_COST) return;
    if (!window.confirm(`${RESPEC_COST}G消費してリセット？`)) return;
    updatePlayer({ gold: gold - RESPEC_COST, learnedSkills: ["start"], spUsed: 0 });
    setSel(null);
  }

  const getXY = (e) => e.touches
    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
    : { x: e.clientX, y: e.clientY };

  function onPD(e) { setDragging(true); setDragStart(getXY(e)); isDragged.current = false; }
  function onPM(e) {
    if (!dragging) return;
    const c = getXY(e);
    const dx = c.x - dragStart.x, dy = c.y - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragged.current = true;
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    setDragStart(c);
  }
  function onPU() { setDragging(false); }
  function onWheel(e) { e.preventDefault(); setScale(s => Math.max(0.3, Math.min(2.5, s - e.deltaY * 0.001))); }
  function onNodeClick(node) { if (isDragged.current) return; setSel(t => t === node.id ? null : node.id); }

  const selNode = sel ? NODE_MAP[sel] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* ヘッダー */}
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1e1e2e", flexShrink:0, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:9, color:"#a78bfa", letterSpacing:2 }}>SKILL TREE</span>
        <span style={{ fontSize:11, color:"#fbbf24" }}>SP <b>{spFree}</b>/{spEarned}</span>
        <span style={{ fontSize:9, color:"#3a3a5a" }}>取得{learned.size - 1}/{SKILL_TREE.length - 1}</span>
        <div style={{ flex:1 }} />
        <button onClick={respec} style={{ padding:"4px 10px", background:"#1a0a0a", border:"1px solid #f8717144", borderRadius:3, cursor:"pointer", color:"#f87171", fontSize:8, fontFamily:"monospace" }}>
          振り直し {RESPEC_COST}G
        </button>
      </div>

      {/* キャンバス */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#03030a", cursor: dragging ? "grabbing" : "grab" }}
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
            {EDGES.map(({ from, to }) => {
              const a = NODE_MAP[from], b = NODE_MAP[to];
              if (!a || !b) return null;
              const active = learned.has(from) && learned.has(to);
              const partial = learned.has(from) && !learned.has(to);
              return (
                <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={active ? b.color : partial ? b.color + "55" : "#1a1a2a"}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={partial ? "5 4" : "none"}
                  style={{ filter: active ? `drop-shadow(0 0 3px ${b.color}66)` : "none" }} />
              );
            })}
            {SKILL_TREE.map(node => {
              const isL = learned.has(node.id);
              const learnable = canLearn(node);
              const isSel = sel === node.id;
              const locked = !isL && !learnable;
              const nc = isL ? node.color : learnable ? node.color + "99" : "#2a2a3a";
              return (
                <g key={node.id} onClick={() => onNodeClick(node)} style={{ cursor:"pointer" }}>
                  {isSel && <circle cx={node.x} cy={node.y} r={NR + 6} fill="none" stroke={node.color} strokeWidth={1.5} style={{ filter:`drop-shadow(0 0 8px ${node.color})` }} />}
                  <circle cx={node.x} cy={node.y} r={NR}
                    fill={isL ? "#0d0d18" : locked ? "#050508" : "#09090f"}
                    stroke={nc} strokeWidth={isL ? 2 : 1.5}
                    style={{ filter: isL ? `drop-shadow(0 0 6px ${node.color}88)` : isSel ? `drop-shadow(0 0 6px ${node.color})` : "" }} />
                  <text x={node.x} y={node.y - 4} textAnchor="middle" dominantBaseline="middle"
                    fontSize={locked ? 12 : 14} opacity={locked ? 0.2 : 1}
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {locked ? "🔒" : node.icon}
                  </text>
                  <text x={node.x} y={node.y + 13} textAnchor="middle" fontSize={6}
                    fill={isL ? node.color : locked ? "#2a2a2a" : node.color + "99"}
                    fontFamily="monospace"
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {node.name}
                  </text>
                  {isL && node.id !== "start" && (
                    <text x={node.x + NR - 3} y={node.y - NR + 8} textAnchor="middle" fontSize={9} fill="#4ade80" style={{ pointerEvents:"none" }}>✓</text>
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
      {selNode && (
        <div style={{ padding:"10px 14px", background:"#07070e", borderTop:"1px solid #1a1a2a", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:20 }}>{selNode.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color: learned.has(selNode.id) ? selNode.color : "#e8e0d0" }}>
                {selNode.name}
                {learned.has(selNode.id) && <span style={{ fontSize:8, color:"#4ade80", border:"1px solid #4ade8044", padding:"1px 4px", borderRadius:2, marginLeft:6 }}>LEARNED</span>}
              </div>
              <div style={{ fontSize:9, color:"#4a4a6a", marginTop:1 }}>{selNode.desc}</div>
            </div>
            <div style={{ textAlign:"right", fontSize:10 }}>
              <div style={{ color:selNode.color }}>{selNode.effect}</div>
              <div style={{ fontSize:8, color:"#fbbf24", marginTop:2 }}>SP:{selNode.sp || 0}</div>
              {selNode.reqLv > 0 && <div style={{ fontSize:8, color:"#fb923c" }}>Lv{selNode.reqLv}必要</div>}
            </div>
          </div>
          {!learned.has(selNode.id) && (
            <button onClick={() => learnNode(selNode)} disabled={!canLearn(selNode)}
              style={{ width:"100%", padding:"7px 0", background: canLearn(selNode) ? "#0a1a0a" : "#0a0a0a", border:`1px solid ${canLearn(selNode) ? selNode.color : "#2a2a2a"}`, borderRadius:4, cursor: canLearn(selNode) ? "pointer" : "default", color: canLearn(selNode) ? selNode.color : "#3a3a3a", fontSize:10, letterSpacing:2, fontFamily:"monospace" }}>
              {spFree < (selNode.sp || 1) ? `SP不足(必要${selNode.sp})` : selNode.reqLv && lv < selNode.reqLv ? `Lv${selNode.reqLv}必要` : !selNode.req.every(r => learned.has(r)) ? "前提未取得" : `SP${selNode.sp || 1}消費して取得`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}