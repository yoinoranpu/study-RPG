import { MONSTER_BASE } from "../systems/monsters";
import usePlayerStore from "../store/usePlayerStore";

const TRIBE_COLOR = {
  "粘体":"#4ade80", "獣":"#fb923c", "ゴブリン":"#fbbf24",
  "不死":"#a78bfa", "悪魔":"#f87171", "植物":"#86efac", "竜":"#60a5fa"
};

export default function MonsterBookTab() {
  const { monsterBook } = usePlayerStore();
  const book = monsterBook || {};
  
  const total = MONSTER_BASE.length;
  const found = MONSTER_BASE.filter(m => book[m.id]?.count > 0).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:8, color:"#60a5fa", letterSpacing:2 }}>MONSTER BOOK</div>
        <div style={{ fontSize:8, color:"#4a4a6a", marginTop:2 }}>
          発見: {found}/{total}
          <div style={{ display:"inline-block", width:80, height:4, background:"#1a1a2a", borderRadius:2, overflow:"hidden", marginLeft:8, verticalAlign:"middle" }}>
            <div style={{ height:"100%", width:`${(found/total)*100}%`, background:"#60a5fa", borderRadius:2 }} />
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        {MONSTER_BASE.map(m => {
          const entry = book[m.id];
          const discovered = entry?.count > 0;
          const tc = TRIBE_COLOR[m.tribe] || "#888";
          return (
            <div key={m.id} style={{ background:"#0d0d15", border:`1px solid ${discovered?tc+"44":"#1a1a2a"}`, borderRadius:6, padding:"10px 12px", marginBottom:6, opacity:discovered?1:0.5 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* アイコン・シルエット */}
                <div style={{ width:36, height:36, background:discovered?tc+"22":"#1a1a2a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, filter:discovered?"none":"grayscale(1) brightness(0.3)" }}>
                  {discovered ? "👾" : "❓"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:discovered?"#e8e0d0":"#3a3a3a" }}>
                    {discovered ? m.name : "？？？"}
                  </div>
                  <div style={{ fontSize:8, color:discovered?tc:"#2a2a2a" }}>
                    {discovered ? m.tribe : "未発見"}
                  </div>
                </div>
                {discovered && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9, color:"#fbbf24" }}>×{entry.count}</div>
                    <div style={{ fontSize:7, color:"#fb923c" }}>{m.material||"素材なし"}</div>
                  </div>
                )}
              </div>
              {discovered && (
                <div style={{ display:"flex", gap:8, marginTop:6, paddingTop:6, borderTop:"1px solid #1a1a2a" }}>
                  {[
                    { label:"HP",   val:m.hp   },
                    { label:"ATK",  val:m.atk  },
                    { label:"DEF",  val:m.def  },
                    { label:"EVA",  val:`${m.eva}%`  },
                    { label:"CRIT", val:`${m.crit}%` },
                  ].map(({label,val})=>(
                    <div key={label} style={{ flex:1, textAlign:"center" }}>
                      <div style={{ fontSize:6, color:"#3a3a5a" }}>{label}</div>
                      <div style={{ fontSize:9, color:"#86efac" }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}