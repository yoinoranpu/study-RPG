import { useState } from "react";
import { getSellPrice, getItemStats, RARITY_COLOR, RARITY_LABEL, INNATE } from "../data/items";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 30;
const TYPE_COLOR = { weapon:"#f87171", armor:"#60a5fa", accessory:"#fbbf24", consumable:"#4ade80", special:"#a78bfa" };
const TYPE_LABEL = { weapon:"武器", armor:"防具", accessory:"アクセ", consumable:"消耗品", special:"特殊" };

export default function ItemBoxTab() {
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const { itemBox, gold, equippedWeapon, equippedArmor, equippedAcc1, equippedAcc2, specialSlots, updatePlayer } = usePlayerStore();

  const item = sel ? (itemBox||[]).find(it => it.uid === sel) : null;
  const equippedUids = new Set([equippedWeapon?.uid, equippedArmor?.uid, equippedAcc1?.uid, equippedAcc2?.uid].filter(Boolean));

  function equip(it) {
    if (it.type === "weapon") updatePlayer({ equippedWeapon: it });
    else if (it.type === "armor") updatePlayer({ equippedArmor: it });
    else if (it.type === "accessory") {
      if (!equippedAcc1) updatePlayer({ equippedAcc1: it });
      else updatePlayer({ equippedAcc2: it });
    }
    setMsg(`${it.name}を装備！`);
    setTimeout(() => setMsg(""), 3000);
  }

  function sell(it) {
    const price = getSellPrice(it);
    updatePlayer({
      itemBox: (itemBox||[]).filter(x => x.uid !== it.uid),
      gold: gold + price,
    });
    setSel(null);
    setMsg(`${it.name}を${price}Gで売却！`);
    setTimeout(() => setMsg(""), 3000);
  }

  function setConsumableSlot(slotIndex) {
    if (!item || !["consumable","special"].includes(item.type)) return;
    const newSlots = [...(specialSlots||[null,null,null])];
    newSlots[slotIndex] = item;
    updatePlayer({ specialSlots: newSlots });
    setSel(null);
    setMsg(`${item.name}をスロット${slotIndex+1}にセット！`);
    setTimeout(() => setMsg(""), 3000);
  }

  function clearConsumableSlot(slotIndex) {
    const newSlots = [...(specialSlots||[null,null,null])];
    newSlots[slotIndex] = null;
    updatePlayer({ specialSlots: newSlots });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:8, color:"#4a4a6a", letterSpacing:2 }}>ITEM BOX {(itemBox||[]).length}/{ITEM_BOX_MAX}</div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        {/* グリッド */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, marginBottom:10 }}>
          {(itemBox||[]).map(it => {
            const rc = RARITY_COLOR[it.rarity] || "#888";
            const isSel = sel === it.uid;
            const isEq = equippedUids.has(it.uid);
            return (
              <div key={it.uid} onClick={() => setSel(isSel ? null : it.uid)}
                style={{ aspectRatio:"1", background:isSel?"#12122a":"#080810", border:`2px solid ${isSel?rc:rc+"33"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:2, position:"relative", opacity:isEq?0.5:1 }}>
                <div style={{ fontSize:14 }}>{it.icon}</div>
                {it.upgradeLevel > 0 && <div style={{ position:"absolute", top:1, right:2, fontSize:6, color:"#fbbf24" }}>+{it.upgradeLevel}</div>}
                {isEq && <div style={{ position:"absolute", bottom:1, left:0, right:0, fontSize:5, color:"#4ade80", textAlign:"center" }}>装備中</div>}
                <div style={{ fontSize:4, color:rc, textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingLeft:1, paddingRight:1 }}>{it.name.slice(0,5)}</div>
              </div>
            );
          })}
          {Array.from({ length:Math.max(0, ITEM_BOX_MAX-(itemBox||[]).length) }).map((_,i) => (
            <div key={`e${i}`} style={{ aspectRatio:"1", background:"#04040a", border:"1px solid #111", borderRadius:6 }} />
          ))}
        </div>

        {/* 選択アイテム詳細 */}
        {item && (
          <div style={{ background:"#0d0d15", border:`1px solid ${RARITY_COLOR[item.rarity]||"#2a2a3a"}`, borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>
                  {item.name}{item.upgradeLevel > 0 && <span style={{ color:"#fbbf24" }}> +{item.upgradeLevel}</span>}
                </div>
                <div style={{ fontSize:8, color:RARITY_COLOR[item.rarity]||"#888" }}>
                  {TYPE_LABEL[item.type]} {RARITY_LABEL[item.rarity]}
                </div>
              </div>
            </div>

            {/* 基礎ステータス */}
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:7, color:"#4a4a6a", marginBottom:3 }}>基礎ステータス</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(getItemStats(item)).filter(([k,v])=>v>0 && !["crit_rate","eva"].includes(k)).map(([k,v])=>(
                  <span key={k} style={{ fontSize:9, color:"#86efac", background:"#080810", padding:"2px 6px", borderRadius:3 }}>
                    {k.toUpperCase()}+{v}
                  </span>
                ))}
              </div>
            </div>

            {/* 固有能力 */}
            {item.innate && item.innate !== "none" && INNATE[item.innate] && (
              <div style={{ marginBottom:6, padding:"4px 8px", background:"#0a0800", border:"1px solid #fb923c33", borderRadius:4 }}>
                <div style={{ fontSize:7, color:"#4a4a6a", marginBottom:2 }}>固有能力</div>
                <div style={{ fontSize:9, color:"#fb923c" }}>◆ {INNATE[item.innate].label}</div>
                <div style={{ fontSize:7, color:"#4a4a6a" }}>{INNATE[item.innate].desc}</div>
              </div>
            )}

            {/* ランダム能力 */}
            {(item.abilities||[]).length > 0 && (
              <div style={{ marginBottom:8, padding:"4px 8px", background:"#0a000a", border:"1px solid #a78bfa33", borderRadius:4 }}>
                <div style={{ fontSize:7, color:"#4a4a6a", marginBottom:2 }}>ランダム能力</div>
                {item.abilities.map((ab,i) => (
                  <div key={i} style={{ fontSize:9, color:"#a78bfa" }}>
                    ✦ {ab.label}{ab.value}{ab.suffix}
                  </div>
                ))}
              </div>
            )}

            {/* アクション */}
            <div style={{ display:"flex", gap:8 }}>
              {["weapon","armor","accessory"].includes(item.type) && (
                <button onClick={() => equip(item)} style={{ flex:2, padding:"7px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace" }}>
                  装備する
                </button>
              )}
              {["consumable","special"].includes(item.type) && (
                <div style={{ flex:2, display:"flex", gap:4 }}>
                  {[0,1,2].map(i => (
                    <button key={i} onClick={() => setConsumableSlot(i)} style={{ flex:1, padding:"7px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:9, fontFamily:"monospace" }}>
                      S{i+1}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => sell(item)} style={{ flex:1, padding:"7px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>
                売却 {getSellPrice(item)}G
              </button>
            </div>
          </div>
        )}

        {/* 装備中 */}
        <div style={{ background:"#080810", border:"1px solid #1a1a2a", borderRadius:6, padding:10, marginBottom:8 }}>
          <div style={{ fontSize:8, color:"#4a4a6a", letterSpacing:2, marginBottom:8 }}>装備中</div>
          {[
            { label:"武器",   val:equippedWeapon },
            { label:"防具",   val:equippedArmor  },
            { label:"アクセ1",val:equippedAcc1   },
            { label:"アクセ2",val:equippedAcc2   },
          ].map(({ label, val }) => (
            <div key={label} style={{ display:"flex", gap:8, marginBottom:4, fontSize:9 }}>
              <span style={{ color:"#4a4a6a", width:44 }}>{label}</span>
              <span style={{ color:val?RARITY_COLOR[val.rarity]||"#e8e0d0":"#2a2a2a" }}>
                {val ? `${val.icon}${val.name}${val.upgradeLevel>0?` +${val.upgradeLevel}`:""}` : "なし"}
              </span>
            </div>
          ))}
        </div>

        {/* 消耗品スロット */}
        <div style={{ background:"#080810", border:"1px solid #1a1a2a", borderRadius:6, padding:10 }}>
          <div style={{ fontSize:8, color:"#4ade80", letterSpacing:2, marginBottom:8 }}>消耗品スロット</div>
          <div style={{ display:"flex", gap:6 }}>
            {(specialSlots||[null,null,null]).map((slot, i) => (
              <div key={i} onClick={() => slot && clearConsumableSlot(i)}
                style={{ flex:1, minHeight:56, background:slot?"#0d0d15":"#04040a", border:`1px solid ${slot?"#4ade8066":"#1a1a2a"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:slot?"pointer":"default", padding:4 }}>
                {slot ? (
                  <>
                    <span style={{ fontSize:20 }}>{slot.icon}</span>
                    <span style={{ fontSize:6, color:"#4ade80", textAlign:"center", marginTop:2 }}>{slot.name.slice(0,6)}</span>
                    <span style={{ fontSize:5, color:"#2a2a3a" }}>タップで解除</span>
                  </>
                ) : (
                  <span style={{ fontSize:9, color:"#2a2a2a" }}>S{i+1}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize:7, color:"#2a2a3a", marginTop:6 }}>消耗品を選択→S1〜S3でセット</div>
        </div>
      </div>
    </div>
  );
}