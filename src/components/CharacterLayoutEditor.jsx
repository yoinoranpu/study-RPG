import { useState } from "react";

// DEBUG専用: CharacterPageの装備サマリー欄をその場で調整できるツール。GuildLayoutEditor.jsxと
// 同じ思想。「全体」タブはサイズ・余白、「個別配置」タブは装備枠/特殊枠/ステータス1つ1つの
// 位置(通常位置からのズレ、px)を調整できる。画面全体を暗くすると背後の変化が見えづらいため、
// 右下に浮かぶ小さいパネルにしている。

const GLOBAL_FIELDS = [
  { path:"roomHeight",        label:"部屋の高さ",       min:120, max:400, step:2 },
  { path:"roomPanY",          label:"部屋の見せ方(縦)", min:0,   max:100, step:1 },
  { path:"equipSlotSize",     label:"装備枠サイズ",     min:40,  max:110, step:1 },
  { path:"specialSlotSize",   label:"特殊枠サイズ",     min:28,  max:80,  step:1 },
  { path:"statsPanelWidth",   label:"ステータス欄の幅", min:90,  max:320, step:2 },
  { path:"contentPaddingTop", label:"全体を下げる量",   min:0,   max:80,  step:1 },
  { path:"panelGap",          label:"パネル同士の間隔", min:0,   max:40,  step:1 },
];

const ITEMS = [
  { key:"equippedWeapon", label:"武器",       group:"equipItemPos" },
  { key:"equippedArmor",  label:"防具",       group:"equipItemPos" },
  { key:"equippedAcc1",   label:"アクセ1",    group:"equipItemPos" },
  { key:"equippedAcc2",   label:"アクセ2",    group:"equipItemPos" },
  { key:0, label:"特殊1", group:"specialItemPos" },
  { key:1, label:"特殊2", group:"specialItemPos" },
  { key:2, label:"特殊3", group:"specialItemPos" },
  { key:"ATK",  label:"ATK",  group:"statItemPos" },
  { key:"MAG",  label:"MAG",  group:"statItemPos" },
  { key:"DEF",  label:"DEF",  group:"statItemPos" },
  { key:"MDEF", label:"MDEF", group:"statItemPos" },
  { key:"EVA",  label:"EVA",  group:"statItemPos" },
  { key:"CRIT", label:"CRIT", group:"statItemPos" },
];

function getItemPos(layout, item) {
  const g = layout[item.group];
  if (item.group === "specialItemPos") return g?.[item.key] || { x:0, y:0 };
  return g?.[item.key] || { x:0, y:0 };
}

export default function CharacterLayoutEditor({ layout, onChangeField, onChangeItem, onReset, onClose }) {
  const [mode, setMode] = useState("global"); // "global" | "item"
  const [selGlobal, setSelGlobal] = useState(GLOBAL_FIELDS[0].path);
  const [selItemIdx, setSelItemIdx] = useState(0);

  const gField = GLOBAL_FIELDS.find(f => f.path === selGlobal);
  const item = ITEMS[selItemIdx];
  const itemPos = getItemPos(layout, item);

  const stepGlobal = (delta) => {
    const cur = layout[selGlobal] ?? 0;
    onChangeField(selGlobal, Math.max(gField.min, Math.min(gField.max, cur + delta)));
  };
  const stepItem = (axis, delta) => {
    const cur = itemPos[axis] ?? 0;
    onChangeItem(item.group, item.key, axis, cur + delta);
  };

  const handleCopy = () => {
    const text = `export const CHARACTER_LAYOUT_DEFAULT = ${JSON.stringify(layout, null, 2)};\n`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={{ position:"fixed", bottom:16, right:16, zIndex:300, fontFamily:"monospace", width:290, maxWidth:"calc(100vw - 32px)" }}>
      <div style={{ background:"rgba(13,13,21,0.96)", border:"1px solid #2a2a3a", borderRadius:10, padding:14, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"#a78bfa", letterSpacing:1, flex:1 }}>DEBUG: キャラ配置エディタ</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#666", fontSize:18, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          <button onClick={() => setMode("global")} style={{ flex:1, padding:"6px 0", background:mode==="global"?"#2a1a3a":"#1a1a1a", border:`1px solid ${mode==="global"?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color:mode==="global"?"#a78bfa":"#888", fontSize:10, fontFamily:"monospace" }}>全体</button>
          <button onClick={() => setMode("item")} style={{ flex:1, padding:"6px 0", background:mode==="item"?"#2a1a3a":"#1a1a1a", border:`1px solid ${mode==="item"?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color:mode==="item"?"#a78bfa":"#888", fontSize:10, fontFamily:"monospace" }}>個別配置</button>
        </div>

        {mode === "global" ? (
          <>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
              {GLOBAL_FIELDS.map(f => (
                <button key={f.path} onClick={() => setSelGlobal(f.path)}
                  style={{ padding:"5px 8px", background: selGlobal===f.path?"#2a1a3a":"#1a1a1a", border:`1px solid ${selGlobal===f.path?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color: selGlobal===f.path?"#a78bfa":"#888", fontSize:9, fontFamily:"monospace" }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <button onClick={() => stepGlobal(-gField.step*5)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:11 }}>-{gField.step*5}</button>
              <button onClick={() => stepGlobal(-gField.step)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>−</button>
              <input type="number" step={gField.step} value={layout[selGlobal] ?? 0}
                onChange={(e) => onChangeField(selGlobal, Math.max(gField.min, Math.min(gField.max, parseFloat(e.target.value) || 0)))}
                style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:"#fff", background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, padding:"4px 0", fontFamily:"monospace" }} />
              <button onClick={() => stepGlobal(gField.step)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>＋</button>
              <button onClick={() => stepGlobal(gField.step*5)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:11 }}>+{gField.step*5}</button>
            </div>
            <div style={{ fontSize:9, color:"#4a4a6a", marginBottom:10 }}>範囲: {gField.min}〜{gField.max}</div>
          </>
        ) : (
          <>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
              {ITEMS.map((it, idx) => (
                <button key={`${it.group}-${it.key}`} onClick={() => setSelItemIdx(idx)}
                  style={{ padding:"5px 8px", background: selItemIdx===idx?"#2a1a3a":"#1a1a1a", border:`1px solid ${selItemIdx===idx?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color: selItemIdx===idx?"#a78bfa":"#888", fontSize:9, fontFamily:"monospace" }}>
                  {it.label}
                </button>
              ))}
            </div>
            {["x","y"].map(axis => (
              <div key={axis} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <div style={{ width:14, fontSize:10, color:"#7a7a9a" }}>{axis}</div>
                <button onClick={() => stepItem(axis,-5)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:12 }}>−5</button>
                <button onClick={() => stepItem(axis,-1)} style={{ width:22, height:22, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:12 }}>−</button>
                <input type="number" value={itemPos[axis] ?? 0}
                  onChange={(e) => onChangeItem(item.group, item.key, axis, parseFloat(e.target.value) || 0)}
                  style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:700, color:"#fff", background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, padding:"3px 0", fontFamily:"monospace" }} />
                <button onClick={() => stepItem(axis,1)} style={{ width:22, height:22, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:12 }}>＋</button>
                <button onClick={() => stepItem(axis,5)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:12 }}>+5</button>
              </div>
            ))}
            <div style={{ fontSize:9, color:"#4a4a6a", marginBottom:10 }}>通常位置からのズレ(px)。0,0で元の位置</div>
          </>
        )}

        <div style={{ display:"flex", gap:6 }}>
          <button onClick={onReset} style={{ flex:1, padding:"8px 0", background:"transparent", border:"1px solid #f8717133", borderRadius:6, cursor:"pointer", color:"#f87171", fontSize:9, fontFamily:"monospace", opacity:0.7 }}>初期値に戻す</button>
          <button onClick={handleCopy} style={{ flex:2, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace", letterSpacing:1 }}>JSONをコピー</button>
        </div>
      </div>
    </div>
  );
}
