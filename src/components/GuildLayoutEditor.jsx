import { useState } from "react";

// DEBUG専用: TownPage「街」タブのギルドシーン(掲示板/クエスト掲示板/本/トロフィー)の
// 位置(%)をその場で調整できるツール。要素ごとに使うキーが違う
// (board/questBoardはleft基準、bookはleft基準、trophyはright基準)ため、FIELDSで定義する。

const ELEMENTS = [
  { key: "board", label: "掲示板", fields: ["left", "top", "width"] },
  { key: "questBoard", label: "クエスト板", fields: ["left", "top", "width"] },
  { key: "book", label: "本", fields: ["left", "bottom", "width"] },
  { key: "trophy", label: "トロフィー", fields: ["right", "bottom", "width"] },
];

const FIELD_LABEL = { left: "左", top: "上", right: "右", bottom: "下", width: "幅" };

export default function GuildLayoutEditor({ layout, onChange, onReset, onClose }) {
  const [selectedKey, setSelectedKey] = useState("board");
  const selected = ELEMENTS.find(e => e.key === selectedKey);

  const step = (field, delta) => {
    const cur = layout[selectedKey][field] ?? 0;
    onChange(selectedKey, field, Math.round((cur + delta) * 10) / 10);
  };

  const handleCopy = () => {
    const text = `export const GUILD_LAYOUT_DEFAULT = ${JSON.stringify(layout, null, 2)};\n`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace", padding:12 }}>
      <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:10, padding:16, width:"100%", maxWidth:360 }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:900, color:"#a78bfa", letterSpacing:2, flex:1 }}>DEBUG: ギルド配置エディタ</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#666", fontSize:18, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
          {ELEMENTS.map(el => (
            <button key={el.key} onClick={() => setSelectedKey(el.key)}
              style={{ padding:"6px 10px", background: selectedKey===el.key?"#2a1a3a":"#1a1a1a", border:`1px solid ${selectedKey===el.key?"#a78bfa":"#333"}`, borderRadius:4, cursor:"pointer", color: selectedKey===el.key?"#a78bfa":"#888", fontSize:10, fontFamily:"monospace" }}>
              {el.label}
            </button>
          ))}
        </div>

        {selected.fields.map(field => (
          <div key={field} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:32, fontSize:10, color:"#7a7a9a" }}>{FIELD_LABEL[field]}</div>
            <button onClick={() => step(field, -1)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:14 }}>−</button>
            <button onClick={() => step(field, -0.1)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#555", fontSize:10 }}>−.1</button>
            <input type="number" step="0.1" value={layout[selectedKey][field] ?? 0}
              onChange={(e) => onChange(selectedKey, field, parseFloat(e.target.value) || 0)}
              style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, color:"#fff", background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, padding:"4px 0", fontFamily:"monospace" }} />
            <button onClick={() => step(field, 0.1)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#555", fontSize:10 }}>+.1</button>
            <button onClick={() => step(field, 1)} style={{ width:28, height:28, background:"#080810", border:"1px solid #2a2a3a", borderRadius:4, cursor:"pointer", color:"#888", fontSize:14 }}>＋</button>
          </div>
        ))}

        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onReset} style={{ flex:1, padding:"10px 0", background:"transparent", border:"1px solid #f8717133", borderRadius:6, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace", opacity:0.7 }}>初期値に戻す</button>
          <button onClick={handleCopy} style={{ flex:2, padding:"10px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:11, fontFamily:"monospace", letterSpacing:1 }}>JSONをコピー</button>
        </div>
        <div style={{ fontSize:9, color:"#4a4a6a", marginTop:10, lineHeight:1.5 }}>
          背後の掲示板シーンにその場で反映されます。数値を決めたら「JSONをコピー」でコピーし、チャットで貼ってもらえれば恒久反映します。
        </div>
      </div>
    </div>
  );
}
