import { useState } from "react";
export default function TimerSettings({ workMin, breakMin, sets, onApply, onClose }) {
  const [tw, setTw] = useState(workMin);
  const [tb, setTb] = useState(breakMin);
  const [ts, setTs] = useState(sets);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, fontFamily:"monospace" }}>
      <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:10, padding:"24px 28px", width:"100%", maxWidth:300 }}>
        <div style={{ fontSize:10, letterSpacing:4, color:"#a78bfa", marginBottom:20, textAlign:"center" }}>TIMER SETTINGS</div>

        {[
          { label:"作業時間（分）", val:tw, set:setTw, min:1, max:120 },
          { label:"休憩時間（分）", val:tb, set:setTb, min:1, max:60  },
          { label:"セット数",       val:ts, set:setTs, min:1, max:8   },
        ].map(({ label, val, set, min, max }) => (
          <div key={label} style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:"#4a4a6a", marginBottom:8, letterSpacing:1 }}>{label}</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={() => set(v => Math.max(min, v - 1))} style={{ width:36, height:36, background:"#080810", border:"1px solid #2a2a3a", borderRadius:6, cursor:"pointer", color:"#888", fontSize:18 }}>−</button>
              <div style={{ flex:1, textAlign:"center", fontSize:20, fontWeight:700, color:"#fff" }}>{val}</div>
              <button onClick={() => set(v => Math.min(max, v + 1))} style={{ width:36, height:36, background:"#080810", border:"1px solid #2a2a3a", borderRadius:6, cursor:"pointer", color:"#888", fontSize:18 }}>+</button>
            </div>
          </div>
        ))}

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", background:"#1a1a1a", border:"1px solid #333", borderRadius:6, cursor:"pointer", color:"#666", fontSize:11, fontFamily:"monospace" }}>キャンセル</button>
          <button onClick={() => { onApply(tw, tb, ts); onClose(); }} style={{ flex:2, padding:"10px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:11, fontFamily:"monospace", letterSpacing:2 }}>APPLY</button>
        </div>
      </div>
    </div>
  );
}