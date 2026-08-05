import { useState } from "react";
import { generateShopStock, getShopPrice, makeItem, RARITY_COLOR, RARITY_LABEL, INNATE } from "../data/items";
import { getGlobalUnlockDepth } from "../systems/dungeons";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 30;
const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

export default function ShopTab() {
  const [sub, setSub] = useState("weapon");
  const [msg, setMsg] = useState("");
  const { gold, itemBox, dungeons, updatePlayer } = usePlayerStore();

  const today = new Date().toDateString();

  const [soldOut, setSoldOut] = useState(() => {
    const saved = localStorage.getItem(`shop_soldout_${today}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [fixedStock] = useState(() => {
    const rawStock = generateShopStock(today, getGlobalUnlockDepth(dungeons));
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
    setSoldOut(s => {
      const next = new Set([...s, `${sub}_${index}`]);
      localStorage.setItem(`shop_soldout_${today}`, JSON.stringify([...next]));
      return next;
    });
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
        <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:2 }}>SHOP — 日替わり在庫</div>
        <div style={{ fontSize:10, color:DIM, marginTop:2 }}>
          所持G: {(gold||0).toLocaleString()} / BOX: {(itemBox||[]).length}/{ITEM_BOX_MAX}
        </div>
        {msg && <div style={{ fontSize:10, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex:1, padding:"7px 2px", background:sub===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${sub===t.id?"#fbbf24":"transparent"}`, cursor:"pointer", color:sub===t.id?"#fbbf24":DIM, fontSize:10, fontFamily:"monospace" }}>
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
            <div key={`${sub}_${i}`} style={{ background:isSold?"#0d0d15":`${rc}14`, borderLeft:`3px solid ${isSold?"#333":rc}`, border:`1px solid ${isSold?"#1a1a1a":rc+"66"}`, borderRadius:6, padding:"12px 14px", marginBottom:8, opacity:isSold?0.4:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{tmpl.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>{tmpl.name}</span>
                    <span style={{ fontSize:10, color:rc }}>{RARITY_LABEL[tmpl.rarity]}</span>
                    {isSold && <span style={{ fontSize:10, color:DIM }}>SOLD</span>}
                  </div>
                </div>
              </div>

              {/* 基礎ステータス */}
              {[(tmpl.atk||0),(tmpl.mag||0),(tmpl.def||0),(tmpl.mdef||0),(tmpl.hp||0)].some(v=>v>0) && (
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:10, color:DIM, marginBottom:2 }}>基礎ステータス</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {(tmpl.atk||0)>0  && <span style={{ fontSize:10, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>ATK {tmpl.atk}</span>}
                    {(tmpl.mag||0)>0  && <span style={{ fontSize:10, color:"#a78bfa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MAG {tmpl.mag}</span>}
                    {(tmpl.def||0)>0  && <span style={{ fontSize:10, color:"#60a5fa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>DEF {tmpl.def}</span>}
                    {(tmpl.mdef||0)>0 && <span style={{ fontSize:10, color:"#38bdf8", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MDEF {tmpl.mdef}</span>}
                    {(tmpl.hp||0)>0   && <span style={{ fontSize:10, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>HP {tmpl.hp}</span>}
                    {(tmpl.crit||0)>0 && <span style={{ fontSize:10, color:"#fbbf24", background:"#080810", padding:"2px 5px", borderRadius:3 }}>CRIT {tmpl.crit}%</span>}
                    {(tmpl.eva||0)>0  && <span style={{ fontSize:10, color:"#34d399", background:"#080810", padding:"2px 5px", borderRadius:3 }}>EVA {tmpl.eva}%</span>}
                  </div>
                </div>
              )}

              {/* 固有能力 */}
              {innate && innate.key !== "none" && (
                <div style={{ marginBottom:4, padding:"3px 8px", background:"#0a0800", border:"1px solid #fb923c33", borderRadius:4 }}>
                  <div style={{ fontSize:10, color:DIM, marginBottom:1 }}>固有能力</div>
                  <div style={{ fontSize:10, color:"#fb923c" }}>◆ {innate.label}</div>
                </div>
              )}

              {/* ランダム能力 */}
              {(tmpl.abilities||[]).length > 0 && (
                <div style={{ marginBottom:4, padding:"3px 8px", background:"#0a000a", border:"1px solid #a78bfa33", borderRadius:4 }}>
                  <div style={{ fontSize:10, color:DIM, marginBottom:1 }}>ランダム能力</div>
                  {tmpl.abilities.map((ab,j) => (
                    <div key={j} style={{ fontSize:10, color:"#a78bfa" }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                  ))}
                </div>
              )}

              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, marginTop:6 }}>
                <span style={{ fontSize:13, color:isSold?FAINT:"#fbbf24", fontWeight:700 }}>{price.toLocaleString()}G</span>
                <button onClick={() => buy(tmpl, i)} disabled={!canBuy} style={{ padding:"6px 16px", background:canBuy?"#1a1000":"#0a0a0a", border:`1px solid ${canBuy?"#fbbf24":"#3a3a3a"}`, borderRadius:4, cursor:canBuy?"pointer":"default", color:canBuy?"#fbbf24":FAINT, fontSize:10, fontFamily:"monospace" }}>
                  {isSold ? "SOLD" : (itemBox||[]).length >= ITEM_BOX_MAX ? "BOX満杯" : gold < price ? "G不足" : "購入"}
                </button>
              </div>
            </div>
          );
        })}
        {allItems.length === 0 && (
          <div style={{ textAlign:"center", color:FAINT, fontSize:10, padding:30 }}>
            在庫なし（探索を進めると解放）
          </div>
        )}
      </div>
    </div>
  );
}