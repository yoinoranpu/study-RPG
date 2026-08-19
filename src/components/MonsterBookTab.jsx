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
      <div style={{ position:"relative", flexShrink:0, height:90, overflow:"hidden", borderBottom:"1px solid #1a1a2a" }}>
        <img src="/assets/images/bestiary-banner.png" alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", display:"block" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(180deg, rgba(8,8,16,0.15) 0%, rgba(8,8,16,0.55) 60%, #080810 100%)" }} />
        <div style={{ position:"absolute", left:12, right:12, bottom:6 }}>
          <div style={{ fontSize:10, color:"#60a5fa", letterSpacing:2 }}>MONSTER BOOK</div>
          <div style={{ fontSize:10, color:DIM, marginTop:2 }}>
            発見: {found}/{total}
            <div style={{ display:"inline-block", width:80, height:4, background:"#1a1a2a", borderRadius:2, overflow:"hidden", marginLeft:8, verticalAlign:"middle" }}>
              <div style={{ height:"100%", width:`${(found/total)*100}%`, background:"#60a5fa", borderRadius:2 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        {MONSTER_BASE.map(m => {
          const entry = book[m.id];
          const discovered = entry?.count > 0;
          const tc = TRIBE_COLOR[m.tribe] || "#888";
          return (
            <div key={m.id} style={{ background:discovered?`${tc}1c`:"rgba(15,10,5,0.5)", borderLeft:`3px solid ${discovered?tc:"#3a3a55"}`, borderRadius:6, padding:"10px 12px", marginBottom:6, opacity:discovered?1:0.6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {/* アイコン・シルエット */}
                <div style={{ width:40, height:40, position:"relative", flexShrink:0 }}>
                  {discovered && <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", background:tc, opacity:0.45, filter:"blur(5px)" }} />}
                  <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", filter:discovered?"none":"grayscale(1) brightness(0.6)" }} />
                  <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                    {discovered ? "👾" : "❓"}
                  </div>
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
                <div style={{ display:"flex", gap:8, marginTop:6, paddingTop:6, borderTop:"1px solid rgba(201,150,61,0.2)" }}>
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
