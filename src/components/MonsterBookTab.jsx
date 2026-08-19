import { useState } from "react";
import { MONSTER_BASE } from "../systems/monsters";
import usePlayerStore from "../store/usePlayerStore";
import { MONSTER_PORTRAIT_DEFAULT } from "../data/monsterPortraits";
import { useMonsterPortraitStyle } from "./MonsterPortrait";
import MonsterPortraitEditor from "./MonsterPortraitEditor";

const TRIBE_COLOR = {
  "粘体":"#4ade80", "獣":"#fb923c", "ゴブリン":"#fbbf24",
  "不死":"#a78bfa", "悪魔":"#f87171", "植物":"#86efac", "竜":"#60a5fa"
};
const DIM = "#7a7a9a";
const FAINT = "#5c5c82";
const DEBUG = import.meta.env.DEV;
const ICON_BOX = 52;
const ICON_INNER = 32; // ICON_BOXにitem_slot_frame.pngのinset:19%を適用した内側サイズの近似値

function MonsterRow({ m, entry, crop }) {
  const discovered = entry?.count > 0;
  const tc = TRIBE_COLOR[m.tribe] || "#888";
  const { style } = useMonsterPortraitStyle(m.id, crop, ICON_INNER);
  return (
    <div style={{ background:discovered?`${tc}1c`:"rgba(15,10,5,0.5)", borderLeft:`3px solid ${discovered?tc:"#3a3a55"}`, borderRadius:6, padding:"10px 12px", marginBottom:6, opacity:discovered?1:0.6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* アイコン・顔クロップ */}
        <div style={{ width:ICON_BOX, height:ICON_BOX, position:"relative", flexShrink:0 }}>
          {discovered && <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", background:tc, opacity:0.45, filter:"blur(5px)" }} />}
          <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1, filter:discovered?"none":"grayscale(1) brightness(0.6)" }} />
          <div style={{ position:"absolute", inset:"19%", overflow:"hidden" }}>
            {discovered && style ? (
              <div style={{ width:"100%", height:"100%", ...style }} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>❓</div>
            )}
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
}

export default function MonsterBookTab() {
  const { monsterBook } = usePlayerStore();
  const book = monsterBook || {};
  const [portraits, setPortraits] = useState(MONSTER_PORTRAIT_DEFAULT);
  const [showPortraitEditor, setShowPortraitEditor] = useState(false);

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
        {MONSTER_BASE.map(m => (
          <MonsterRow key={m.id} m={m} entry={book[m.id]} crop={portraits[m.id] || { x:50, y:15, zoom:2.2 }} />
        ))}
      </div>

      {DEBUG && (
        <button onClick={() => setShowPortraitEditor(true)} style={{ position:"fixed", bottom:16, right:16, zIndex:50, padding:"8px 12px", background:"#1a0a1a", border:"1px solid #a78bfa44", borderRadius:6, cursor:"pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace" }}>
          DEBUG: 顔クロップエディタ
        </button>
      )}
      {showPortraitEditor && (
        <MonsterPortraitEditor
          portraits={portraits}
          onChange={(id, axis, value) => setPortraits(prev => ({ ...prev, [id]: { ...(prev[id]||{x:50,y:15,zoom:2.2}), [axis]:value } }))}
          onClose={() => setShowPortraitEditor(false)}
        />
      )}
    </div>
  );
}
