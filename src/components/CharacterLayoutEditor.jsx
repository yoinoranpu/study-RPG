import { useState } from "react";

// DEBUG専用: CharacterPageの装備サマリー欄(部屋の高さ・見せ方・装備枠/特殊枠のサイズ・
// ステータス欄の幅・余白/間隔)をその場で調整できるツール。GuildLayoutEditor.jsxと同じ思想。
// 画面全体を暗くすると背後の変化が見えづらいため、右下に浮かぶ小さいパネルにしている。

const FIELDS = [
  { key:"roomHeight",        label:"部屋の高さ",         min:120, max:400, step:2 },
  { key:"roomPanY",          label:"部屋の見せ方(縦)",   min:0,   max:100, step:1 },
  { key:"equipSlotSize",     label:"装備枠サイズ",       min:40,  max:110, step:1 },
  { key:"specialSlotSize",   label:"特殊枠サイズ",       min:28,  max:80,  step:1 },
  { key:"statsPanelWidth",   label:"ステータス欄の幅",   min:90,  max:320, step:2 },
  { key:"contentPaddingTop", label:"全体を下げる量",     min:0,   max:80,  step:1 },
  { key:"panelGap",          label:"パネル同士の間隔",   min:0,   max:40,  step:1 },
];

export default function CharacterLayoutEditor({ layout, onChange, onReset, onClose }) {
  const [selectedKey, setSelectedKey] = useState(FIELDS[0].key);
  const field = FIELDS.find(f => f.key === selectedKey);

  const step = (delta) => {
    const cur = layout[selectedKey] ?? 0;
    const next = Math.max(field.min, Math.min(field.max, cur + delta));
    onChange(selectedKey, next);
  };

  const handleCopy = () => {
    const text = `export const CHARACTER_LAYOUT_DEFAULT = ${JSON.stringify(layout, null, 2)};\n`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={{ position:"fixed", bottom:16, right:16, zIndex:300, fontFamily:"monospace", width:280, maxWidth:"calc(100vw - 32px)" }}>
      <div style={{ background:"rgba(13,13,21,0.96)", border:"1px solid #2a2a3a", borderRadius:10, padding:14, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"#a78bfa", letterSpacing:1, flex:1 }}>DEBUG: キャラ配置エディタ</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#666", fontSize:18, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {FIELDS.map(f => (
            <button key={f.key} onClick={() => setSelectedKey(f.key)}
              style={{ padding:"5px 8px", background: selectedKey===f.key?"#2a1a3a":"#1a1a1a", border:`1px solid ${selectedKey===f.key?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color: selectedKey===f.key?"#a78bfa":"#888", fontSize:9, fontFamily:"monospace" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
          <button onClick={() => step(-field.step*5)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:11 }}>-{field.step*5}</button>
          <button onClick={() => step(-field.step)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>−</button>
          <input type="number" step={field.step} value={layout[selectedKey] ?? 0}
            onChange={(e) => onChange(selectedKey, Math.max(field.min, Math.min(field.max, parseFloat(e.target.value) || 0)))}
            style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:"#fff", background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, padding:"4px 0", fontFamily:"monospace" }} />
          <button onClick={() => step(field.step)} style={{ width:24, height:24, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:13 }}>＋</button>
          <button onClick={() => step(field.step*5)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:11 }}>+{field.step*5}</button>
        </div>
        <div style={{ fontSize:9, color:"#4a4a6a", marginBottom:10 }}>範囲: {field.min}〜{field.max}</div>

        <div style={{ display:"flex", gap:6 }}>
          <button onClick={onReset} style={{ flex:1, padding:"8px 0", background:"transparent", border:"1px solid #f8717133", borderRadius:6, cursor:"pointer", color:"#f87171", fontSize:9, fontFamily:"monospace", opacity:0.7 }}>初期値に戻す</button>
          <button onClick={handleCopy} style={{ flex:2, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace", letterSpacing:1 }}>JSONをコピー</button>
        </div>
      </div>
    </div>
  );
}
