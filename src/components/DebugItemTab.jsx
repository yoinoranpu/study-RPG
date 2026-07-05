import { useState } from "react";
import { ALL_ITEMS, makeItem, RARITY_COLOR, RARITY_LABEL } from "../data/items";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 30;

export default function DebugItemTab() {
  const [sub, setSub] = useState("weapon");
  const [msg, setMsg] = useState("");
  const { itemBox, updatePlayer } = usePlayerStore();

  const tabs = [
    { id:"weapon",     label:"⚔武器"   },
    { id:"armor",      label:"🛡防具"   },
    { id:"accessory",  label:"💍アクセ" },
    { id:"consumable", label:"🧪消耗品" },
    { id:"special",    label:"✨特殊"   },
  ];

  const items = ALL_ITEMS.filter(it => it.type === sub || 
    (sub === "consumable" && it.type === "consumable") ||
    (sub === "special" && (it.type === "special" || it.effect?.startsWith("boss_key")))
  );

  function give(tmpl) {
    if ((itemBox||[]).length >= ITEM_BOX_MAX) { setMsg("BOX満杯！"); setTimeout(()=>setMsg(""),2000); return; }
    const newItem = makeItem(tmpl);
    updatePlayer({ itemBox: [...(itemBox||[]), newItem] });
    setMsg(`${tmpl.name}を取得！`);
    setTimeout(() => setMsg(""), 2000);
  }

  function giveAll() {
    const current = itemBox||[];
    const toAdd = items.slice(0, ITEM_BOX_MAX - current.length);
    const newItems = toAdd.map(makeItem);
    updatePlayer({ itemBox: [...current, ...newItems] });
    setMsg(`${newItems.length}個取得！`);
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div style={{ fontFamily:"monospace" }}>
      {msg && <div style={{ fontSize:9, color:"#4ade80", marginBottom:6 }}>{msg}</div>}

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", marginBottom:8 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex:1, padding:"5px 2px", background:sub===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${sub===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:sub===t.id?"#a78bfa":"#4a4a6a", fontSize:8, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      <button onClick={giveAll} style={{ width:"100%", padding:"6px 0", background:"#0a0a1a", border:"1px solid #a78bfa44", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:9, fontFamily:"monospace", marginBottom:8 }}>
        全部取得
      </button>

      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {ALL_ITEMS.filter(it => it.type === sub || (sub==="special" && it.effect?.startsWith("boss_key"))).map(tmpl => {
          const rc = RARITY_COLOR[tmpl.rarity] || "#888";
          return (
            <div key={tmpl.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"#0d0d15", border:`1px solid ${rc}33`, borderRadius:4 }}>
              <span style={{ fontSize:16 }}>{tmpl.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:"#e8e0d0" }}>{tmpl.name}</div>
                <div style={{ fontSize:7, color:rc }}>{RARITY_LABEL[tmpl.rarity]}</div>
              </div>
              <button onClick={() => give(tmpl)} style={{ padding:"3px 10px", background:"#0a0a1a", border:`1px solid ${rc}66`, borderRadius:3, cursor:"pointer", color:rc, fontSize:8, fontFamily:"monospace" }}>
                取得
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}