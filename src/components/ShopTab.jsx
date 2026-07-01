import { useState } from "react";
import { generateShopStock, getShopPrice, makeItem, RARITY_COLOR, RARITY_LABEL, INNATE } from "../data/items";
import usePlayerStore from "../store/usePlayerStore";
import ItemDetail from "./ItemDetail";

const ITEM_BOX_MAX = 30;

export default function ShopTab() {
  const [sub, setSub] = useState("weapon");
  const [msg, setMsg] = useState("");
  const [soldOut, setSoldOut] = useState(new Set());
  const { gold, itemBox, maxFloor, updatePlayer } = usePlayerStore();

  const today = new Date().toDateString();
  const [fixedStock] = useState(() => {
    const rawStock = generateShopStock(today, maxFloor || 0);
    return Object.fromEntries(
      Object.entries(rawStock).map(([k, items]) => [k, items.map(makeItem)])
    );
  });
  const allItems = fixedStock[sub] || [];

  function buy(tmpl, index) {
    const price = getShopPrice(tmpl);
    if (gold < price) { setMsg("Gが不足！"); setTimeout(()=>setMsg(""),3000); return; }
    if ((itemBox||[]).length >= ITEM_BOX_MAX) { setMsg("BOXが満杯！"); setTimeout(()=>setMsg(""),3000); return; }
    const newItem = makeItem(tmpl);
    updatePlayer({ gold: gold - price, itemBox: [...(itemBox||[]), newItem] });
    setSoldOut(s => new Set([...s, `${sub}_${index}`]));
    setMsg(`${tmpl.name}を購入！`);
    setTimeout(() => setMsg(""), 3000);
  }

  const tabs = [
    { id:"weapon",     label:"⚔武器"   },
    { id:"armor",      label:"🛡防具"   },
    { id:"accessory",  label:"💍アクセ" },
    { id:"consumable", label:"🧪消耗品" },
    { id:"special",    label:"✨特殊"   },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:8, color:"#fbbf24", letterSpacing:2 }}>SHOP — 日替わり在庫</div>
        <div style={{ fontSize:8, color:"#4a4a6a", marginTop:2 }}>
          所持G: {(gold||0).toLocaleString()} / BOX: {(itemBox||[]).length}/{ITEM_BOX_MAX}
        </div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex:1, padding:"7px 2px", background:sub===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${sub===t.id?"#fbbf24":"transparent"}`, cursor:"pointer", color:sub===t.id?"#fbbf24":"#4a4a6a", fontSize:9, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:12 }}>
        {allItems.map((tmpl, i) => {
          const isSold = soldOut.has(`${sub}_${i}`);
          const price = getShopPrice(tmpl);
          const canBuy = !isSold && gold >= price && (itemBox||[]).length < ITEM_BOX_MAX;
          const rc = RARITY_COLOR[tmpl.rarity] || "#888";
          const innate = INNATE[tmpl.innate];
          return (
            <div key={`${sub}_${i}`} style={{ background:"#0d0d15", border:`1px solid ${isSold?"#1a1a1a":rc+"44"}`, borderRadius:6, padding:"12px 14px", marginBottom:8, opacity:isSold?0.4:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{tmpl.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>{tmpl.name}</span>
                    <span style={{ fontSize:8, color:rc }}>{RARITY_LABEL[tmpl.rarity]}</span>
                    {isSold && <span style={{ fontSize:8, color:"#555" }}>SOLD</span>}
                  </div>
                </div>
              </div>

              {/* 基礎ステータス */}
              {[(tmpl.baseAtk||0),(tmpl.baseMag||0),(tmpl.baseDef||0),(tmpl.baseMdef||0),(tmpl.baseHp||0)].some(v=>v>0) && (
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:2 }}>基礎ステータス</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {(tmpl.atk||0)>0  && <span style={{ fontSize:9, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>ATK {tmpl.atk}</span>}
                    {(tmpl.mag||0)>0  && <span style={{ fontSize:9, color:"#a78bfa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MAG {tmpl.mag}</span>}
                    {(tmpl.def||0)>0  && <span style={{ fontSize:9, color:"#60a5fa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>DEF {tmpl.def}</span>}
                    {(tmpl.mdef||0)>0 && <span style={{ fontSize:9, color:"#38bdf8", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MDEF {tmpl.mdef}</span>}
                    {(tmpl.hp||0)>0   && <span style={{ fontSize:9, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>HP {tmpl.hp}</span>}
                    {(tmpl.crit||0)>0 && <span style={{ fontSize:9, color:"#fbbf24", background:"#080810", padding:"2px 5px", borderRadius:3 }}>CRIT {tmpl.crit}%</span>}
                    {(tmpl.eva||0)>0  && <span style={{ fontSize:9, color:"#34d399", background:"#080810", padding:"2px 5px", borderRadius:3 }}>EVA {tmpl.eva}%</span>}
                  </div>
                </div>
              )}

              {/* 固有能力 */}
              {innate && innate.key !== "none" && (
                <div style={{ marginBottom:4, padding:"3px 8px", background:"#0a0800", border:"1px solid #fb923c33", borderRadius:4 }}>
                  <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:1 }}>固有能力</div>
                  <div style={{ fontSize:9, color:"#fb923c" }}>◆ {innate.label}</div>
                </div>
              )}

              {/* ランダム能力 */}
              {(tmpl.abilities||[]).length > 0 && (
                <div style={{ padding:"3px 8px", background:"#0a000a", border:"1px solid #a78bfa33", borderRadius:4, marginBottom:4 }}>
                  <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:1 }}>ランダム能力</div>
                  {tmpl.abilities.map((ab,j) => (
                    <div key={j} style={{ fontSize:9, color:"#a78bfa" }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, marginTop:6 }}>
                <span style={{ fontSize:13, color:isSold?"#333":"#fbbf24", fontWeight:700 }}>{price.toLocaleString()}G</span>
                <button onClick={() => buy(tmpl, i)} disabled={!canBuy} style={{ padding:"6px 16px", background:canBuy?"#1a1000":"#0a0a0a", border:`1px solid ${canBuy?"#fbbf24":"#333"}`, borderRadius:4, cursor:canBuy?"pointer":"default", color:canBuy?"#fbbf24":"#333", fontSize:10, fontFamily:"monospace" }}>
                  {isSold ? "SOLD" : (itemBox||[]).length >= ITEM_BOX_MAX ? "BOX満杯" : gold < price ? "G不足" : "購入"}
                </button>
              </div>
            </div>
          );
        })}
        {allItems.length === 0 && (
          <div style={{ textAlign:"center", color:"#2a2a2a", fontSize:10, padding:30 }}>
            在庫なし（階層を進めると解放）
          </div>
        )}
      </div>
    </div>
  );
}