import { useState } from "react";
import { MONSTER_BASE } from "../systems/monsters";
import { getMonsterPortraitSrc } from "../data/monsterPortraits";

// DEBUG専用: 図鑑アイコンの「顔クロップ」(object-position % + scale倍率)を
// モンスター1体ずつ目視調整するツール。CharacterLayoutEditor等と同じ思想。
export default function MonsterPortraitEditor({ portraits, onChange, onClose }) {
  const [selId, setSelId] = useState(MONSTER_BASE[0]?.id);
  const monster = MONSTER_BASE.find(m => m.id === selId);
  const crop = portraits[selId] || { x:50, y:15, zoom:2.2 };
  const portrait = getMonsterPortraitSrc(selId);

  const step = (axis, delta, min, max) => {
    const cur = crop[axis] ?? 0;
    onChange(selId, axis, Math.max(min, Math.min(max, Math.round((cur + delta) * 100) / 100)));
  };

  const handleCopy = () => {
    const text = `export const MONSTER_PORTRAIT_DEFAULT = ${JSON.stringify(portraits, null, 2)};\n`;
    navigator.clipboard?.writeText(text);
  };

  const FIELDS = [
    { axis:"x",    label:"横位置%", min:0,   max:100, step:2 },
    { axis:"y",    label:"縦位置%", min:0,   max:100, step:2 },
    { axis:"zoom", label:"拡大率",  min:1,   max:5,   step:0.1 },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.6)" }}>
      <div style={{ background:"rgba(13,13,21,0.98)", border:"1px solid #2a2a3a", borderRadius:10, padding:16, boxShadow:"0 8px 24px rgba(0,0,0,0.6)", width:340, maxWidth:"calc(100vw - 32px)", maxHeight:"calc(100vh - 32px)", overflowY:"auto", fontFamily:"monospace" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"#a78bfa", letterSpacing:1, flex:1 }}>DEBUG: 顔クロップエディタ</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#666", fontSize:18, cursor:"pointer" }}>×</button>
        </div>

        {/* プレビュー */}
        <div style={{ width:120, height:120, margin:"0 auto 12px", position:"relative", background:"#080810", borderRadius:8, overflow:"hidden", border:"1px solid #2a2a3a" }}>
          {portrait ? (
            <img src={portrait.src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:`${crop.x}% ${crop.y}%`, transform:`scale(${crop.zoom})`, filter:portrait.tint||"none" }} />
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"#5c5c82", fontSize:10 }}>素材なし</div>
          )}
        </div>

        {/* モンスター選択 */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12, maxHeight:120, overflowY:"auto" }}>
          {MONSTER_BASE.map(m => (
            <button key={m.id} onClick={() => setSelId(m.id)}
              style={{ padding:"4px 7px", background:selId===m.id?"#2a1a3a":"#1a1a1a", border:`1px solid ${selId===m.id?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color:selId===m.id?"#a78bfa":"#888", fontSize:9, fontFamily:"monospace" }}>
              {m.name}
            </button>
          ))}
        </div>

        {FIELDS.map(f => (
          <div key={f.axis} style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, color:"#7a7a9a", marginBottom:3 }}>{f.label}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <button onClick={() => step(f.axis, -f.step*5, f.min, f.max)} style={{ width:26, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:10 }}>-{Math.round(f.step*5*10)/10}</button>
              <button onClick={() => step(f.axis, -f.step, f.min, f.max)} style={{ width:22, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>−</button>
              <input type="number" step={f.step} value={crop[f.axis]}
                onChange={(e) => onChange(selId, f.axis, Math.max(f.min, Math.min(f.max, parseFloat(e.target.value) || 0)))}
                style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:700, color:"#fff", background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, padding:"4px 0", fontFamily:"monospace" }} />
              <button onClick={() => step(f.axis, f.step, f.min, f.max)} style={{ width:22, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>＋</button>
              <button onClick={() => step(f.axis, f.step*5, f.min, f.max)} style={{ width:26, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:10 }}>+{Math.round(f.step*5*10)/10}</button>
            </div>
          </div>
        ))}

        <button onClick={handleCopy} style={{ width:"100%", marginTop:6, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace", letterSpacing:1 }}>
          全モンスター分JSONをコピー
        </button>
        <div style={{ fontSize:9, color:"#4a4a6a", marginTop:6 }}>調整が終わったらコピーして monsterPortraits.js の MONSTER_PORTRAIT_DEFAULT に貼り戻してください</div>
      </div>
    </div>
  );
}
