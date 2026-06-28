import { useState } from "react";
import { generateShopStock, getShopPrice, makeItem, RARITY_COLOR, RARITY_LABEL } from "../data/items";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 20;

export default function ShopTab() {
  const [sub, setSub] = useState("weapon");
  const [msg, setMsg] = useState("");
  const { gold, itemBox, updatePlayer } = usePlayerStore();

  const today = new Date().toDateString();
  const stock = generateShopStock(today);
  const items = stock[sub] || [];

  function buy(tmpl) {
    const price = getShopPrice(tmpl);
    if (gold < price) { setMsg("Gが不足しています！"); return; }
    if ((itemBox || []).length >= ITEM_BOX_MAX) { setMsg("アイテムボックスが満杯！"); return; }
    const newItem = makeItem(tmpl);
    updatePlayer({ gold: gold - price, itemBox: [...(itemBox || []), newItem] });
    setMsg(`${tmpl.name}を購入した！`);
    setTimeout(() => setMsg(""), 3000);
  }

  const tabs = [
  { id:"weapon",    label:"⚔武器"   },
  { id:"armor",     label:"🛡防具"   },
  { id:"accessory", label:"💍アクセ" },
  { id:"consumable",label:"🧪消耗品" },
  { id:"special",   label:"✨特殊"   },
];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:8, color:"#fbbf24", letterSpacing:2 }}>SHOP — 日替わり在庫</div>
        <div style={{ fontSize:8, color:"#4a4a6a", marginTop:2 }}>所持G: {gold.toLocaleString()} / BOX: {(itemBox||[]).length}/{ITEM_BOX_MAX}</div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex:1, padding:"7px 2px", background: sub===t.id ? "#12122a" : "transparent", border:"none", borderBottom:`2px solid ${sub===t.id ? "#fbbf24" : "transparent"}`, cursor:"pointer", color: sub===t.id ? "#fbbf24" : "#4a4a6a", fontSize:9, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:12 }}>
        {items.map(tmpl => {
          const price = getShopPrice(tmpl);
          const canBuy = gold >= price && (itemBox||[]).length < ITEM_BOX_MAX;
          const rc = RARITY_COLOR[tmpl.rarity] || "#888";
          return (
            <div key={tmpl.id} style={{ background:"#0d0d15", border:`1px solid ${rc}44`, borderRadius:6, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:22 }}>{tmpl.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>{tmpl.name}</span>
                    <span style={{ fontSize:9, color:rc }}>{RARITY_LABEL[tmpl.rarity]}</span>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    {tmpl.atk  > 0 && <span style={{ fontSize:9, color:"#f87171" }}>ATK+{tmpl.atk}</span>}
                    {tmpl.mag  > 0 && <span style={{ fontSize:9, color:"#a78bfa" }}>MAG+{tmpl.mag}</span>}
                    {tmpl.def  > 0 && <span style={{ fontSize:9, color:"#60a5fa" }}>DEF+{tmpl.def}</span>}
                    {tmpl.mdef > 0 && <span style={{ fontSize:9, color:"#38bdf8" }}>MDEF+{tmpl.mdef}</span>}
                    {tmpl.hp   > 0 && <span style={{ fontSize:9, color:"#f87171" }}>HP+{tmpl.hp}</span>}
                    {tmpl.eva  > 0 && <span style={{ fontSize:9, color:"#34d399" }}>回避+{tmpl.eva}%</span>}
                    {tmpl.crit > 0 && <span style={{ fontSize:9, color:"#fbbf24" }}>クリ+{tmpl.crit}%</span>}
                    {tmpl.sp1  && <span style={{ fontSize:9, color:"#fb923c" }}>{tmpl.sp1}</span>}
                  </div>
                  <div style={{ fontSize:8, color:"#4a4a6a" }}>{tmpl.desc}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, marginTop:8 }}>
                <span style={{ fontSize:13, color:"#fbbf24", fontWeight:700 }}>{price.toLocaleString()} G</span>
                <button onClick={() => buy(tmpl)} disabled={!canBuy} style={{ padding:"6px 16px", background: canBuy ? "#1a1000" : "#0a0a0a", border:`1px solid ${canBuy ? "#fbbf24" : "#333"}`, borderRadius:4, cursor: canBuy ? "pointer" : "default", color: canBuy ? "#fbbf24" : "#333", fontSize:10, fontFamily:"monospace" }}>
                  {(itemBox||[]).length >= ITEM_BOX_MAX ? "BOX満杯" : canBuy ? "購入" : "G不足"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}