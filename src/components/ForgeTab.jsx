import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { getItemStats, getSellPrice, RARITY_COLOR, RARITY_LABEL } from "../data/items";

const MILESTONE = {
  weapon:    { 5:{stat:"crit",val:1,label:"クリ率+1%"}, 10:{stat:"atk",val:5,label:"ATK+5"}, 15:{stat:"crit",val:2,label:"クリ率+2%"}, 20:{stat:"atk",val:10,label:"ATK+10"} },
  armor:     { 5:{stat:"hp",val:10,label:"HP+10"}, 10:{stat:"def",val:5,label:"DEF+5"}, 15:{stat:"eva",val:2,label:"回避+2%"}, 20:{stat:"mdef",val:10,label:"MDEF+10"} },
  accessory: { 5:{stat:"eva",val:1,label:"回避+1%"}, 10:{stat:"crit",val:1,label:"クリ率+1%"}, 15:{stat:"gold",val:5,label:"G獲得+5%"}, 20:{stat:"exp",val:3,label:"EXP+3%"} },
};

const MAT_UP = {
  weapon:    [{mat:"狼の牙",stat:"atk",label:"ATK強化"},{mat:"竜鱗",stat:"crit",label:"クリ強化"},{mat:"魔石",stat:"mag",label:"MAG強化"}],
  armor:     [{mat:"粗鉄片",stat:"def",label:"物理DEF強化"},{mat:"亡者の骨",stat:"hp",label:"HP強化"},{mat:"生命の葉",stat:"eva",label:"回避強化"},{mat:"スライムゼリー",stat:"mdef",label:"MDEF強化"}],
  accessory: [{mat:"竜鱗",stat:"crit",label:"クリ強化"},{mat:"生命の葉",stat:"eva",label:"回避強化"},{mat:"魔石",stat:"mag",label:"MAG強化"}],
};

const upgradeCost = (lv) => lv <= 0 ? 100 : Math.floor(100 * lv * (1 + lv * 0.1));

export default function ForgeTab() {
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const { itemBox, gold, materials, updatePlayer } = usePlayerStore();

  const item = sel ? itemBox.find(it => it.uid === sel) : null;
  const matOpts = item ? MAT_UP[item.type] || [] : [];
  const cost = item ? upgradeCost(item.upgradeLevel) : 0;

  function upgrade(mo) {
    if (!item) return;
    if ((materials[mo.mat] || 0) < 1) { setMsg("素材が不足してる！"); return; }
    if (gold < cost) { setMsg("Gが不足してる！"); return; }

    const newLv = item.upgradeLevel + 1;
    const newB = { ...item.bonuses };
    newB[mo.stat] = (newB[mo.stat] || 0) + 1;

    // 節目ボーナス
    const ms = MILESTONE[item.type]?.[newLv];
    let msMsg = "";
    if (ms) {
      newB[ms.stat] = (newB[ms.stat] || 0) + ms.val;
      msMsg = ` ✨${ms.label}`;
    }

    const updatedItem = { ...item, upgradeLevel: newLv, bonuses: newB };
    const newBox = itemBox.map(x => x.uid === item.uid ? updatedItem : x);
    const newMats = { ...materials, [mo.mat]: (materials[mo.mat] || 0) - 1 };

    updatePlayer({ itemBox: newBox, gold: gold - cost, materials: newMats });
    setMsg(`+${newLv}に強化！${msMsg}`);
  }

  const TYPE_COLOR = { weapon:"#f87171", armor:"#60a5fa", accessory:"#fbbf24" };
  const TYPE_LABEL = { weapon:"武器", armor:"防具", accessory:"アクセ" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* ヘッダー */}
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:9, color:"#fb923c", letterSpacing:2 }}>🔨 FORGE — 装備強化</div>
        <div style={{ fontSize:8, color:"#4a4a6a", marginTop:2 }}>所持G: {gold.toLocaleString()} / 素材: {Object.values(materials||{}).reduce((a,b)=>a+b,0)}個</div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:10 }}>
        {/* アイテム選択グリッド */}
        <div>
          <div style={{ fontSize:7, color:"#4a4a6a", letterSpacing:2, marginBottom:6 }}>強化する装備を選択</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
            {itemBox.map(it => {
              const tc = TYPE_COLOR[it.type] || "#888";
              const isSel = sel === it.uid;
              return (
                <div key={it.uid} onClick={() => setSel(isSel ? null : it.uid)}
                  style={{ aspectRatio:"1", background:isSel?"#12122a":"#080810", border:`2px solid ${isSel?tc:tc+"33"}`, borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:1, position:"relative" }}>
                  <div style={{ fontSize:13 }}>{it.icon}</div>
                  {it.upgradeLevel > 0 && <div style={{ position:"absolute", top:1, right:2, fontSize:7, color:"#fbbf24" }}>+{it.upgradeLevel}</div>}
                  <div style={{ fontSize:4, color:tc, textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingLeft:1, paddingRight:1 }}>{it.name.slice(0,4)}</div>
                </div>
              );
            })}
            {itemBox.length === 0 && <div style={{ fontSize:9, color:"#2a2a2a", gridColumn:"span 7", textAlign:"center", padding:12 }}>アイテムなし</div>}
          </div>
        </div>

        {/* 選択アイテム詳細 */}
        {item && (
          <div style={{ background:"#0d0d15", border:`1px solid ${TYPE_COLOR[item.type]||"#2a2a3a"}`, borderRadius:8, padding:12 }}>
            {/* アイテム情報 */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>
                  {item.name} {item.upgradeLevel > 0 && <span style={{ color:"#fbbf24" }}>+{item.upgradeLevel}</span>}
                </div>
                <div style={{ fontSize:8, color:RARITY_COLOR[item.rarity]||"#888" }}>
                  {TYPE_LABEL[item.type]} {RARITY_LABEL[item.rarity]}
                </div>
              </div>
              <div style={{ textAlign:"right", fontSize:10, color:"#fbbf24" }}>
                強化コスト<br/>
                <span style={{ fontSize:14, fontWeight:700 }}>{cost}G</span>
              </div>
            </div>

            {/* 現在のステータス */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              {Object.entries(getItemStats(item)).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{ background:"#080810", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#a0a0a0" }}>
                  {k.toUpperCase()} <span style={{ color:"#86efac" }}>+{v}</span>
                </div>
              ))}
              {item.sp1 && <div style={{ background:"#080810", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#fb923c" }}>{item.sp1}</div>}
            </div>

            {/* 節目ボーナス */}
            <div style={{ marginBottom:10, padding:"6px 8px", background:"#080810", borderRadius:4 }}>
              <div style={{ fontSize:7, color:"#4a4a6a", marginBottom:4, letterSpacing:2 }}>節目ボーナス</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(MILESTONE[item.type]||{}).map(([lv,b])=>(
                  <div key={lv} style={{ fontSize:8, color:item.upgradeLevel>=(+lv)?"#fbbf24":"#2a2a3a" }}>
                    +{lv} {b.label} {item.upgradeLevel>=(+lv)&&"✓"}
                  </div>
                ))}
              </div>
            </div>

            {/* 素材選択・強化ボタン */}
            <div style={{ fontSize:8, color:"#4a4a6a", marginBottom:6, letterSpacing:2 }}>素材を選んで強化</div>
            {matOpts.map(mo => {
              const have = materials?.[mo.mat] || 0;
              const canUpgrade = have >= 1 && gold >= cost;
              return (
                <div key={mo.mat} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#080810", border:`1px solid ${canUpgrade?"#2a2a3a":"#111"}`, borderRadius:5, marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#e8e0d0" }}>{mo.mat}</div>
                    <div style={{ fontSize:8, color:"#4a4a6a" }}>{mo.label}</div>
                  </div>
                  <div style={{ fontSize:9, color:have>=1?"#fb923c":"#3a3a3a" }}>×{have}</div>
                  <button onClick={() => upgrade(mo)} disabled={!canUpgrade}
                    style={{ padding:"6px 14px", background:canUpgrade?"#1a1000":"#0a0a0a", border:`1px solid ${canUpgrade?"#fbbf24":"#2a2a2a"}`, borderRadius:4, cursor:canUpgrade?"pointer":"default", color:canUpgrade?"#fbbf24":"#333", fontSize:10, fontFamily:"monospace", fontWeight:700 }}>
                    強化
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 所持素材一覧 */}
        <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:10 }}>
          <div style={{ fontSize:8, color:"#fb923c", letterSpacing:2, marginBottom:8 }}>所持素材</div>
          {Object.keys(materials||{}).length === 0
            ? <div style={{ fontSize:9, color:"#2a2a2a" }}>素材なし（ダンジョンで入手）</div>
            : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(materials).map(([name,cnt])=>(
                  <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"4px 8px", fontSize:9, color:"#fb923c" }}>{name}×{cnt}</div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}