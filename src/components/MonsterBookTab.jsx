import { MONSTER_BASE } from "../systems/monsters";
import usePlayerStore from "../store/usePlayerStore";

const TRIBE_COLOR = {
  "粘体":"#4ade80", "獣":"#fb923c", "ゴブリン":"#fbbf24",
  "不死":"#a78bfa", "悪魔":"#f87171", "植物":"#86efac", "竜":"#60a5fa"
};
const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

export default function MonsterBookTab() {
  const { monsterBook } = usePlayerStore();
  const book = monsterBook || {};

  const total = MONSTER_BASE.length;
  const found = MONSTER_BASE.filter(m => book[m.id]?.count > 0).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#60a5fa", letterSpacing:2 }}>MONSTER BOOK</div>
        <div style={{ fontSize:10, color:DIM, marginTop:2 }}>
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
            <div key={m.id} style={{ background:discovered?`${tc}1c`:"#0d0d15", borderLeft:`3px solid ${discovered?tc:"#3a3a55"}`, border:`1px solid ${discovered?tc+"66":"#2a2a40"}`, borderRadius:6, padding:"10px 12px", marginBottom:6, opacity:discovered?1:0.6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* アイコン・シルエット */}
                <div style={{ width:36, height:36, background:discovered?tc+"33":"#1a1a2a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, filter:discovered?"none":"grayscale(1) brightness(0.6)" }}>
                  {discovered ? "👾" : "❓"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:discovered?"#e8e0d0":FAINT }}>
                    {discovered ? m.name : "？？？"}
                  </div>
                  <div style={{ fontSize:10, color:discovered?tc:FAINT }}>
                    {discovered ? m.tribe : "未発見"}
                  </div>
                </div>
                {discovered && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#fbbf24", fontWeight:700 }}>×{entry.count}</div>
                    <div style={{ fontSize:10, color:"#fb923c" }}>{m.material||"素材なし"}</div>
                  </div>
                )}
              </div>
              {discovered && (
                <div style={{ display:"flex", gap:8, marginTop:6, paddingTop:6, borderTop:"1px solid #2a2a40" }}>
                  {[
                    { label:"HP",   val:m.hp   },
                    { label:"ATK",  val:m.atk  },
                    { label:"DEF",  val:m.def  },
                    { label:"EVA",  val:`${m.eva}%`  },
                    { label:"CRIT", val:`${m.crit}%` },
                  ].map(({label,val})=>(
                    <div key={label} style={{ flex:1, textAlign:"center" }}>
                      <div style={{ fontSize:10, color:DIM }}>{label}</div>
                      <div style={{ fontSize:10, color:"#86efac" }}>{val}</div>
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
