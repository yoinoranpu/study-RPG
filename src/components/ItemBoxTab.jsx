import { useState } from "react";
import { getSellPrice, getItemStats, RARITY_COLOR, RARITY_LABEL } from "../data/items";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 20;
const TYPE_COLOR = { weapon:"#f87171", armor:"#60a5fa", accessory:"#fbbf24" };
const TYPE_LABEL = { weapon:"武器", armor:"防具", accessory:"アクセ" };

export default function ItemBoxTab() {
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const { itemBox, gold, equippedWeapon, equippedArmor, equippedAcc1, equippedAcc2, updatePlayer } = usePlayerStore();

  const item = sel ? (itemBox || []).find(it => it.uid === sel) : null;

  function equip(it) {
    let key = "equippedWeapon";
    if (it.type === "armor") key = "equippedArmor";
    else if (it.type === "accessory") {
      key = !equippedAcc1 ? "equippedAcc1" : "equippedAcc2";
    }
    updatePlayer({ [key]: it });
    setMsg(`${it.name}を装備した！`);
    setTimeout(() => setMsg(""), 3000);
  }

  function sell(it) {
    const price = getSellPrice(it);
    updatePlayer({
      itemBox: (itemBox || []).filter(x => x.uid !== it.uid),
      gold: gold + price,
    });
    setSel(null);
    setMsg(`${it.name}を${price}Gで売却！`);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:8, color:"#4a4a6a", letterSpacing:2 }}>ITEM BOX {(itemBox||[]).length}/{ITEM_BOX_MAX}</div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        {/* グリッド */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, marginBottom:12 }}>
          {(itemBox || []).map(it => {
            const tc = TYPE_COLOR[it.type] || "#888";
            return (
              <div key={it.uid} onClick={() => setSel(sel === it.uid ? null : it.uid)} style={{ aspectRatio:"1", background: sel===it.uid ? "#12122a" : "#080810", border:`2px solid ${sel===it.uid ? tc : tc+"44"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:1, padding:2, position:"relative" }}>
                <div style={{ fontSize:16 }}>{it.icon}</div>
                {it.upgradeLevel > 0 && <div style={{ position:"absolute", top:2, right:3, fontSize:7, color:"#fbbf24" }}>+{it.upgradeLevel}</div>}
                <div style={{ fontSize:5, color:tc, textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingLeft:2, paddingRight:2 }}>{it.name.slice(0,5)}</div>
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, ITEM_BOX_MAX - (itemBox||[]).length) }).map((_, i) => (
            <div key={`e${i}`} style={{ aspectRatio:"1", background:"#04040a", border:"1px solid #111", borderRadius:6 }} />
          ))}
        </div>

        {/* 選択アイテム詳細 */}
        {item && (
          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:24 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#e8e0d0" }}>
                  {item.name} {item.upgradeLevel > 0 && <span style={{ color:"#fbbf24" }}>+{item.upgradeLevel}</span>}
                </div>
                <div style={{ fontSize:8, color: RARITY_COLOR[item.rarity] || "#888" }}>
                  {TYPE_LABEL[item.type]} {RARITY_LABEL[item.rarity]}
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 }}>
              {Object.entries(getItemStats(item)).filter(([,v]) => v > 0).map(([k, v]) => (
                <div key={k} style={{ background:"#080810", borderRadius:3, padding:"4px 8px", fontSize:9, color:"#a0a0a0" }}>
                  {k.toUpperCase()} <span style={{ color:"#86efac" }}>+{v}</span>
                </div>
              ))}
              {item.sp1 && <div style={{ background:"#080810", borderRadius:3, padding:"4px 8px", fontSize:9, color:"#fb923c", gridColumn:"span 2" }}>{item.sp1}</div>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => equip(item)} style={{ flex:2, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace" }}>装備する</button>
              <button onClick={() => sell(item)} style={{ flex:1, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>売却 {getSellPrice(item)}G</button>
            </div>
          </div>
        )}

        {/* 装備中 */}
        <div style={{ background:"#080810", border:"1px solid #1a1a2a", borderRadius:6, padding:10 }}>
          <div style={{ fontSize:8, color:"#4a4a6a", letterSpacing:2, marginBottom:8 }}>装備中</div>
          {[
            { key:"equippedWeapon", label:"武器",  val:equippedWeapon },
            { key:"equippedArmor",  label:"防具",  val:equippedArmor  },
            { key:"equippedAcc1",   label:"アクセ1", val:equippedAcc1 },
            { key:"equippedAcc2",   label:"アクセ2", val:equippedAcc2 },
          ].map(({ label, val }) => (
            <div key={label} style={{ display:"flex", gap:8, marginBottom:4, fontSize:9 }}>
              <span style={{ color:"#4a4a6a", width:40 }}>{label}</span>
              <span style={{ color: val ? "#e8e0d0" : "#2a2a2a" }}>
                {val ? `${val.icon}${val.name}${val.upgradeLevel > 0 ? ` +${val.upgradeLevel}` : ""}` : "なし"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}