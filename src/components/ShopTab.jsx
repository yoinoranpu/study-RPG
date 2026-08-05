import { useState, useEffect } from "react";
import { generateShopStock, getShopPrice, makeItem, RARITY_COLOR, RARITY_LABEL, INNATE, SPECIAL_DB } from "../data/items";
import { getGlobalUnlockDepth } from "../systems/dungeons";
import { makeInitialStats } from "../systems/achievements";
import usePlayerStore from "../store/usePlayerStore";
import useFlashMessage from "../hooks/useFlashMessage";

const ITEM_BOX_MAX = 30;
const DIM = "#7a7a9a";
const FAINT = "#5c5c82";
const BUBBLE_BG = "rgba(18,13,9,0.95)";
const BUBBLE_BORDER = "#fbbf2466";

export default function ShopTab() {
  const [sub, setSub] = useState("weapon");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [msg, flash] = useFlashMessage(3000);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { gold, itemBox, dungeons, keyRescueDungeonId, keyRescueClaimed, stats, updatePlayer } = usePlayerStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const spendGold = (amount) => {
    const prevStats = stats || makeInitialStats();
    return { ...prevStats, totalGoldSpent: (prevStats.totalGoldSpent||0) + amount };
  };

  const rescueKeyTmpl = (keyRescueDungeonId != null && !keyRescueClaimed)
    ? SPECIAL_DB.find(it => it.effect === `dungeon_key_${keyRescueDungeonId}`)
    : null;

  function buyRescueKey() {
    if (!rescueKeyTmpl) return;
    const price = getShopPrice(rescueKeyTmpl);
    if (gold < price) { flash("Gが不足！"); return; }
    if ((itemBox||[]).length >= ITEM_BOX_MAX) { flash("BOXが満杯！"); return; }
    updatePlayer({ gold: gold - price, itemBox: [...(itemBox||[]), makeItem(rescueKeyTmpl)], keyRescueClaimed: true, stats: spendGold(price) });
    flash(`${rescueKeyTmpl.name}を購入！`);
  }

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
  const selectedItem = allItems[selectedIdx] || null;
  const selectedIsSold = selectedItem ? soldOut.has(`${sub}_${selectedIdx}`) : false;
  const selectedPrice = selectedItem ? getShopPrice(selectedItem) : 0;
  const selectedCanBuy = selectedItem && !selectedIsSold && gold >= selectedPrice && (itemBox||[]).length < ITEM_BOX_MAX;
  const selectedInnate = selectedItem ? INNATE[selectedItem.innate] : null;

  function buy(tmpl, index) {
    const price = getShopPrice(tmpl);
    if (gold < price) { flash("Gが不足！"); return; }
    if ((itemBox||[]).length >= ITEM_BOX_MAX) { flash("BOXが満杯！"); return; }
    const newItem = makeItem(tmpl);
    updatePlayer({ gold: gold - price, itemBox: [...(itemBox||[]), newItem], stats: spendGold(price) });
    setSoldOut(s => {
      const next = new Set([...s, `${sub}_${index}`]);
      localStorage.setItem(`shop_soldout_${today}`, JSON.stringify([...next]));
      return next;
    });
    flash(`${tmpl.name}を購入！`);
  }

  const tabs = [
    { id:"weapon",     label:"⚔武器"   },
    { id:"armor",      label:"🛡防具"   },
    { id:"accessory",  label:"💍アクセ" },
    { id:"consumable", label:"🧪消耗品" },
    { id:"special",    label:"✨特殊"   },
  ];

  return (
    <div style={{ position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* 背景：画像は横幅いっぱいに自然なアスペクト比で表示（モバイルでは高さ制限） */}
      <div style={{ position:"absolute", inset:0, background:"#08080f" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, maxHeight:isMobile?"100px":"auto", overflow:"hidden" }}>
        <img src="/assets/images/shop-banner.png" alt="" style={{ width:"100%", height:"auto", display:"block" }} />
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(180deg, rgba(5,5,8,0.08) 0%, rgba(5,5,8,0.15) 45%, rgba(5,5,8,0.75) 68%, #08080f 88%, #08080f 100%)",
        }} />
      </div>

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%" }}>
        {/* ① ステージ：店主(大)＋吹き出し */}
        <div style={{ flexShrink:0, display:"flex", alignItems:"flex-end", padding:"14px 10px 0" }}>
          <div style={{
            width:168, height:208, flexShrink:0, marginBottom:-2,
            backgroundImage:`url("/assets/images/shopkeeper.png")`,
            backgroundSize:"cover", backgroundPosition:"center 20%", backgroundRepeat:"no-repeat",
            WebkitMaskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
            maskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
          }} />
          <div style={{ position:"relative", flex:1, minWidth:0, marginLeft:-8, marginBottom:16 }}>
            <div style={{ position:"absolute", left:-6, bottom:24, width:14, height:14, background:BUBBLE_BG, transform:"rotate(45deg)" }} />
            <div style={{ position:"relative", background:BUBBLE_BG, border:`2px solid ${BUBBLE_BORDER}`, borderRadius:14, padding:"10px 12px", boxShadow:"0 6px 16px rgba(0,0,0,0.5)" }}>
              {selectedItem ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:18 }}>{selectedItem.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>{selectedItem.name}</span>
                    <span style={{ fontSize:10, color:RARITY_COLOR[selectedItem.rarity]||"#888" }}>{RARITY_LABEL[selectedItem.rarity]}</span>
                    {selectedIsSold && <span style={{ fontSize:10, color:DIM }}>SOLD</span>}
                  </div>

                  {[(selectedItem.atk||0),(selectedItem.mag||0),(selectedItem.def||0),(selectedItem.mdef||0),(selectedItem.hp||0)].some(v=>v>0) && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                      {(selectedItem.atk||0)>0  && <span style={{ fontSize:10, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>ATK {selectedItem.atk}</span>}
                      {(selectedItem.mag||0)>0  && <span style={{ fontSize:10, color:"#a78bfa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MAG {selectedItem.mag}</span>}
                      {(selectedItem.def||0)>0  && <span style={{ fontSize:10, color:"#60a5fa", background:"#080810", padding:"2px 5px", borderRadius:3 }}>DEF {selectedItem.def}</span>}
                      {(selectedItem.mdef||0)>0 && <span style={{ fontSize:10, color:"#38bdf8", background:"#080810", padding:"2px 5px", borderRadius:3 }}>MDEF {selectedItem.mdef}</span>}
                      {(selectedItem.hp||0)>0   && <span style={{ fontSize:10, color:"#f87171", background:"#080810", padding:"2px 5px", borderRadius:3 }}>HP {selectedItem.hp}</span>}
                      {(selectedItem.crit||0)>0 && <span style={{ fontSize:10, color:"#fbbf24", background:"#080810", padding:"2px 5px", borderRadius:3 }}>CRIT {selectedItem.crit}%</span>}
                      {(selectedItem.eva||0)>0  && <span style={{ fontSize:10, color:"#34d399", background:"#080810", padding:"2px 5px", borderRadius:3 }}>EVA {selectedItem.eva}%</span>}
                    </div>
                  )}

                  {selectedInnate && selectedInnate.key !== "none" && (
                    <div style={{ marginTop:6, padding:"3px 8px", background:"#0a0800", border:"1px solid #fb923c33", borderRadius:4 }}>
                      <div style={{ fontSize:10, color:"#fb923c" }}>◆ {selectedInnate.label}</div>
                      <div style={{ fontSize:9, color:DIM, marginTop:1 }}>{selectedInnate.desc}</div>
                    </div>
                  )}

                  {selectedItem.desc && (
                    <div style={{ fontSize:9, color:DIM, marginTop:6 }}>{selectedItem.desc}</div>
                  )}

                  {(selectedItem.abilities||[]).length > 0 && (
                    <div style={{ marginTop:6, padding:"3px 8px", background:"#0a000a", border:"1px solid #a78bfa33", borderRadius:4 }}>
                      {selectedItem.abilities.map((ab,j) => (
                        <div key={j} style={{ fontSize:10, color:"#a78bfa" }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    <span style={{ fontSize:13, color:selectedIsSold?FAINT:"#fbbf24", fontWeight:700 }}>{selectedPrice.toLocaleString()}G</span>
                    <button onClick={() => buy(selectedItem, selectedIdx)} disabled={!selectedCanBuy}
                      style={{ padding:"6px 16px", background:selectedCanBuy?"#1a1000":"#0a0a0a", border:`1px solid ${selectedCanBuy?"#fbbf24":"#3a3a3a"}`, borderRadius:4, cursor:selectedCanBuy?"pointer":"default", color:selectedCanBuy?"#fbbf24":FAINT, fontSize:10, fontFamily:"monospace" }}>
                      {selectedIsSold ? "SOLD" : (itemBox||[]).length >= ITEM_BOX_MAX ? "BOX満杯" : gold < selectedPrice ? "G不足" : "購入"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize:11, color:"#d8c8a8" }}>いらっしゃい！在庫なしみたいだ、また今度来ておくれ</div>
              )}
              {msg && <div style={{ fontSize:10, color:"#4ade80", marginTop:6 }}>{msg}</div>}
            </div>
          </div>
        </div>

        {/* ② カテゴリタブ */}
        <div style={{ display:"flex", background:"rgba(8,8,16,0.75)", borderTop:"1px solid #1a1a2a", borderBottom:"1px solid #1a1a2a", flexShrink:0, marginTop:14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setSub(t.id); setSelectedIdx(0); }}
              style={{ flex:1, padding:"11px 4px", background:sub===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${sub===t.id?"#fbbf24":"transparent"}`, cursor:"pointer", color:sub===t.id?"#fbbf24":DIM, fontSize:12, fontFamily:"monospace" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ③ 商品グリッド（大きめタイル、スクロール） */}
        <div style={{ flex:1, overflowY:"auto", padding:10 }}>
          {sub === "special" && rescueKeyTmpl && (() => {
            const price = getShopPrice(rescueKeyTmpl);
            const canBuy = gold >= price && (itemBox||[]).length < ITEM_BOX_MAX;
            return (
              <div style={{ background:"rgba(13,26,21,0.92)", borderLeft:"3px solid #4ade80", border:"1px solid #4ade8066", borderRadius:6, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ fontSize:10, color:"#4ade80", letterSpacing:1, marginBottom:6 }}>💡 初回限定サポート</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{rescueKeyTmpl.icon}</span>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>{rescueKeyTmpl.name}</span>
                    <div style={{ fontSize:10, color:DIM }}>{rescueKeyTmpl.desc}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10 }}>
                  <span style={{ fontSize:13, color:"#fbbf24", fontWeight:700 }}>{price.toLocaleString()}G</span>
                  <button onClick={buyRescueKey} disabled={!canBuy} style={{ padding:"6px 16px", background:canBuy?"#0a2a0a":"#0a0a0a", border:`1px solid ${canBuy?"#4ade80":"#3a3a3a"}`, borderRadius:4, cursor:canBuy?"pointer":"default", color:canBuy?"#4ade80":FAINT, fontSize:10, fontFamily:"monospace" }}>
                    {(itemBox||[]).length >= ITEM_BOX_MAX ? "BOX満杯" : gold < price ? "G不足" : "購入"}
                  </button>
                </div>
              </div>
            );
          })()}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
            {allItems.map((tmpl, i) => {
              const isSold = soldOut.has(`${sub}_${i}`);
              const price = getShopPrice(tmpl);
              const rc = RARITY_COLOR[tmpl.rarity] || "#888";
              const isSelected = i === selectedIdx;
              return (
                <div key={`${sub}_${i}`} onClick={() => setSelectedIdx(i)}
                  style={{
                    aspectRatio:"1", position:"relative", cursor:"pointer",
                    background:isSold?"rgba(10,10,14,0.85)":isSelected?`${rc}33`:"rgba(12,12,20,0.94)",
                    border:`2px solid ${isSelected?rc:isSold?"#3a3a55":rc}`,
                    borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    padding:4, opacity:isSold?0.45:1,
                    boxShadow:isSelected?`0 0 10px ${rc}aa`:`0 0 4px ${rc}55`,
                  }}>
                  {isSold && <div style={{ position:"absolute", top:3, right:4, fontSize:7, color:DIM, fontWeight:700 }}>SOLD</div>}
                  <div style={{ fontSize:26 }}>{tmpl.icon}</div>
                  <div style={{ fontSize:9, color:"#e8e0d0", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", marginTop:2 }}>{tmpl.name.slice(0,6)}</div>
                  <div style={{ fontSize:8, color:rc, letterSpacing:1, minHeight:10, marginTop:1 }}>{RARITY_LABEL[tmpl.rarity]}</div>
                  <div style={{ fontSize:9, color:isSold?FAINT:"#fbbf24", fontWeight:700 }}>{price.toLocaleString()}G</div>
                </div>
              );
            })}
          </div>

          {allItems.length === 0 && !(sub === "special" && rescueKeyTmpl) && (
            <div style={{ textAlign:"center", color:FAINT, fontSize:10, padding:30 }}>
              在庫なし（探索を進めると解放）
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
