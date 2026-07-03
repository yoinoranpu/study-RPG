import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { RARITY_COLOR, RARITY_LABEL, getItemStats, INNATE, SYNTHESIS_COST, getAbilitySlots } from "../data/items";

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
const RARITY_ORDER = ["common","uncommon","rare","epic","legendary","mythic","origin"];
const nextRarity = (r) => RARITY_ORDER[RARITY_ORDER.indexOf(r) + 1] || null;

export default function ForgeTab() {
  const [tab, setTab] = useState("upgrade");
  const [sel, setSel] = useState(null);
  const [matSel, setMatSel] = useState(null);
  const [msg, setMsg] = useState("");
  const { itemBox, gold, materials, updatePlayer } = usePlayerStore();

  const upgradeItem = itemBox.find(it => it.uid === sel);
  const matOpts = upgradeItem ? MAT_UP[upgradeItem.type] || [] : [];
  const cost = upgradeItem ? upgradeCost(upgradeItem.upgradeLevel) : 0;

  function upgrade(mo) {
    if (!upgradeItem) return;
    if ((materials[mo.mat] || 0) < 1) { setMsg("素材が不足！"); return; }
    if (gold < cost) { setMsg("Gが不足！"); return; }
    const newLv = upgradeItem.upgradeLevel + 1;
    const newB = { ...upgradeItem.bonuses };
    newB[mo.stat] = (newB[mo.stat] || 0) + 1;
    const ms = MILESTONE[upgradeItem.type]?.[newLv];
    let msMsg = "";
    if (ms) { newB[ms.stat] = (newB[ms.stat] || 0) + ms.val; msMsg = ` ✨${ms.label}`; }
    const updated = { ...upgradeItem, upgradeLevel: newLv, bonuses: newB };
    updatePlayer({
      itemBox: itemBox.map(x => x.uid === upgradeItem.uid ? updated : x),
      gold: gold - cost,
      materials: { ...materials, [mo.mat]: (materials[mo.mat] || 0) - 1 },
    });
    setMsg(`+${newLv}に強化！${msMsg}`);
    setTimeout(() => setMsg(""), 3000);
  }

  const baseItem = itemBox.find(it => it.uid === sel);
  const matItem  = itemBox.find(it => it.uid === matSel);
  const synthCandidates = baseItem
    ? itemBox.filter(it => it.uid !== baseItem.uid && it.type === baseItem.type && it.rarity === baseItem.rarity)
    : [];
  const next = baseItem ? nextRarity(baseItem.rarity) : null;
  const synthCost = baseItem ? SYNTHESIS_COST[baseItem.rarity] : null;

  function synthesize() {
    if (!baseItem || !matItem) { setMsg("ベースと素材を選択して！"); return; }
    if (!next) { setMsg("これ以上合成できません"); return; }
    if (gold < synthCost.gold) { setMsg("Gが不足！"); return; }
    const matAbility = matItem.abilities?.[0] || null;
    const newSlots = getAbilitySlots(next);
    const synthesized = {
      ...baseItem,
      rarity: next,
      atk:  baseItem.atk  ? Math.ceil(baseItem.atk  * 1.3) : 0,
      mag:  baseItem.mag  ? Math.ceil(baseItem.mag  * 1.3) : 0,
      def:  baseItem.def  ? Math.ceil(baseItem.def  * 1.3) : 0,
      mdef: baseItem.mdef ? Math.ceil(baseItem.mdef * 1.3) : 0,
      hp:   baseItem.hp   ? Math.ceil(baseItem.hp   * 1.3) : 0,
      crit: baseItem.crit ? Math.ceil(baseItem.crit * 1.3) : 0,
      eva:  baseItem.eva  ? Math.ceil(baseItem.eva  * 1.3) : 0,
    };
    const newAbilities = (baseItem.abilities||[]).map(ab => ({ ...ab, value: Math.ceil(ab.value * 1.3) }));
    if (matAbility) {
      const existIdx = newAbilities.findIndex(a => a.key === matAbility.key);
      if (existIdx >= 0) {
        if (matAbility.value > newAbilities[existIdx].value) newAbilities[existIdx] = { ...matAbility, value: Math.ceil(matAbility.value * 1.3) };
      } else if (newAbilities.length < newSlots) {
        newAbilities.push({ ...matAbility, value: Math.ceil(matAbility.value * 1.3) });
      }
    }
    synthesized.abilities = newAbilities.slice(0, newSlots);
    updatePlayer({
      itemBox: itemBox.filter(x => x.uid !== matItem.uid).map(x => x.uid === baseItem.uid ? synthesized : x),
      gold: gold - synthCost.gold,
    });
    setSel(null); setMatSel(null);
    setMsg(`✨ ${synthesized.name}が${RARITY_LABEL[next]}になった！`);
    setTimeout(() => setMsg(""), 4000);
  }

  const TYPE_COLOR = { weapon:"#f87171", armor:"#60a5fa", accessory:"#fbbf24" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:9, color:"#fb923c", letterSpacing:2 }}>🔨 FORGE</div>
        <div style={{ fontSize:8, color:"#4a4a6a", marginTop:2 }}>所持G: {gold.toLocaleString()}</div>
        {msg && <div style={{ fontSize:9, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {[{id:"upgrade",label:"⬆ 強化"},{id:"synth",label:"✨ 合成"}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSel(null); setMatSel(null); }}
            style={{ flex:1, padding:"8px 0", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#fb923c":"transparent"}`, cursor:"pointer", color:tab===t.id?"#fb923c":"#4a4a6a", fontSize:11, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>

        {/* 強化タブ */}
        {tab === "upgrade" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
              {itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type)).map(it => {
                const tc = TYPE_COLOR[it.type] || "#888";
                const isSel = sel === it.uid;
                return (
                  <div key={it.uid} onClick={() => setSel(isSel?null:it.uid)}
                    style={{ aspectRatio:"1", background:isSel?"#12122a":"#080810", border:`2px solid ${isSel?tc:tc+"33"}`, borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:1, position:"relative" }}>
                    <div style={{ fontSize:13 }}>{it.icon}</div>
                    {it.upgradeLevel > 0 && <div style={{ position:"absolute", top:1, right:2, fontSize:7, color:"#fbbf24" }}>+{it.upgradeLevel}</div>}
                    <div style={{ fontSize:4, color:tc, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", paddingLeft:1 }}>{it.name.slice(0,4)}</div>
                  </div>
                );
              })}
            </div>

            {upgradeItem && (
              <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:22 }}>{upgradeItem.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>
                      {upgradeItem.name} <span style={{ color:"#fbbf24" }}>+{upgradeItem.upgradeLevel}</span>
                    </div>
                    <div style={{ fontSize:8, color:RARITY_COLOR[upgradeItem.rarity]||"#888" }}>{RARITY_LABEL[upgradeItem.rarity]}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9, color:"#4a4a6a" }}>強化コスト</div>
                    <div style={{ fontSize:14, color:"#fbbf24", fontWeight:700 }}>{cost}G</div>
                  </div>
                </div>

                {/* 現在のステータス */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {Object.entries(getItemStats(upgradeItem)).filter(([,v])=>v>0).map(([k,v])=>(
                    <span key={k} style={{ fontSize:9, color:"#86efac", background:"#080810", padding:"2px 6px", borderRadius:3 }}>{k.toUpperCase()} {v}</span>
                  ))}
                </div>

                {/* 固有能力 */}
                {upgradeItem.innate && upgradeItem.innate !== "none" && INNATE[upgradeItem.innate] && (
                  <div style={{ fontSize:9, color:"#fb923c", marginBottom:6 }}>◆ {INNATE[upgradeItem.innate].label}</div>
                )}

                {/* ランダム能力 */}
                {(upgradeItem.abilities||[]).map((ab,i)=>(
                  <div key={i} style={{ fontSize:9, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                ))}

                {/* 節目ボーナス */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10, padding:"6px 8px", background:"#080810", borderRadius:4 }}>
                  {Object.entries(MILESTONE[upgradeItem.type]||{}).map(([lv,b])=>(
                    <span key={lv} style={{ fontSize:8, color:upgradeItem.upgradeLevel>=(+lv)?"#fbbf24":"#2a2a3a" }}>
                      +{lv} {b.label}{upgradeItem.upgradeLevel>=(+lv)&&" ✓"}
                    </span>
                  ))}
                </div>

                {matOpts.map(mo => {
                  const have = materials?.[mo.mat] || 0;
                  const can = have >= 1 && gold >= cost;
                  return (
                    <div key={mo.mat} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#080810", borderRadius:5, marginBottom:6 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"#e8e0d0" }}>{mo.mat}</div>
                        <div style={{ fontSize:8, color:"#4a4a6a" }}>{mo.label}</div>
                      </div>
                      <div style={{ fontSize:9, color:have>=1?"#fb923c":"#3a3a3a" }}>×{have}</div>
                      <button onClick={() => upgrade(mo)} disabled={!can}
                        style={{ padding:"6px 14px", background:can?"#1a1000":"#0a0a0a", border:`1px solid ${can?"#fbbf24":"#2a2a2a"}`, borderRadius:4, cursor:can?"pointer":"default", color:can?"#fbbf24":"#333", fontSize:10, fontFamily:"monospace" }}>
                        強化
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:10 }}>
              <div style={{ fontSize:8, color:"#fb923c", letterSpacing:2, marginBottom:6 }}>所持素材</div>
              {Object.keys(materials||{}).length === 0
                ? <div style={{ fontSize:9, color:"#2a2a2a" }}>素材なし</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.entries(materials).map(([name,cnt])=>(
                      <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"4px 8px", fontSize:9, color:"#fb923c" }}>{name}×{cnt}</div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* 合成タブ */}
        {tab === "synth" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:8, color:"#4a4a6a" }}>同じ種類・同じレアリティの装備2つで1段階上のレアリティに合成</div>

            <div>
              <div style={{ fontSize:8, color:"#a78bfa", marginBottom:6 }}>① ベース装備を選択</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                {itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type) && nextRarity(it.rarity)).map(it => {
                  const rc = RARITY_COLOR[it.rarity] || "#888";
                  const isSel = sel === it.uid;
                  return (
                    <div key={it.uid} onClick={() => { setSel(isSel?null:it.uid); setMatSel(null); }}
                      style={{ aspectRatio:"1", background:isSel?"#12122a":"#080810", border:`2px solid ${isSel?rc:rc+"33"}`, borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:1 }}>
                      <div style={{ fontSize:13 }}>{it.icon}</div>
                      <div style={{ fontSize:4, color:rc, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", paddingLeft:1 }}>{it.name.slice(0,4)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {baseItem && (
              <div>
                <div style={{ fontSize:8, color:"#a78bfa", marginBottom:6 }}>② 素材装備を選択</div>
                {synthCandidates.length === 0
                  ? <div style={{ fontSize:9, color:"#2a2a2a", padding:8 }}>合成できる素材がない</div>
                  : <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                      {synthCandidates.map(it => {
                        const rc = RARITY_COLOR[it.rarity] || "#888";
                        const isSel = matSel === it.uid;
                        return (
                          <div key={it.uid} onClick={() => setMatSel(isSel?null:it.uid)}
                            style={{ aspectRatio:"1", background:isSel?"#1a0a2a":"#080810", border:`2px solid ${isSel?"#a78bfa":rc+"33"}`, borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:1 }}>
                            <div style={{ fontSize:13 }}>{it.icon}</div>
                            <div style={{ fontSize:4, color:rc, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", paddingLeft:1 }}>{it.name.slice(0,4)}</div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            )}

            {/* 選択アイテム詳細 */}
            {(baseItem || matItem) && (
              <div style={{ display:"flex", gap:8 }}>
                {baseItem && (
                  <div style={{ flex:1, background:"#0d0d15", border:`1px solid ${RARITY_COLOR[baseItem.rarity]||"#2a2a3a"}`, borderRadius:6, padding:8 }}>
                    <div style={{ fontSize:7, color:"#a78bfa", marginBottom:4 }}>ベース</div>
                    <div style={{ fontSize:10, color:"#e8e0d0", marginBottom:4 }}>{baseItem.icon} {baseItem.name}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {Object.entries(getItemStats(baseItem)).filter(([,v])=>v>0).map(([k,v])=>(
                        <span key={k} style={{ fontSize:8, color:"#86efac", background:"#080810", padding:"1px 4px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                      ))}
                    </div>
                    {(baseItem.abilities||[]).map((ab,i)=>(
                      <div key={i} style={{ fontSize:8, color:"#a78bfa", marginTop:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                    ))}
                  </div>
                )}
                {matItem && (
                  <div style={{ flex:1, background:"#0d0d15", border:`1px solid ${RARITY_COLOR[matItem.rarity]||"#2a2a3a"}`, borderRadius:6, padding:8 }}>
                    <div style={{ fontSize:7, color:"#4a4a6a", marginBottom:4 }}>素材</div>
                    <div style={{ fontSize:10, color:"#e8e0d0", marginBottom:4 }}>{matItem.icon} {matItem.name}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {Object.entries(getItemStats(matItem)).filter(([,v])=>v>0).map(([k,v])=>(
                        <span key={k} style={{ fontSize:8, color:"#86efac", background:"#080810", padding:"1px 4px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                      ))}
                    </div>
                    {(matItem.abilities||[]).map((ab,i)=>(
                      <div key={i} style={{ fontSize:8, color:"#a78bfa", marginTop:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {baseItem && matItem && next && (
              <div style={{ background:"#0d0d15", border:`1px solid ${RARITY_COLOR[next]||"#2a2a3a"}`, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:8, color:"#4a4a6a", marginBottom:6 }}>合成プレビュー</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:9 }}>
                  <span style={{ color:RARITY_COLOR[baseItem.rarity] }}>{baseItem.name}</span>
                  <span style={{ color:"#4a4a6a" }}>+</span>
                  <span style={{ color:RARITY_COLOR[matItem.rarity] }}>{matItem.name}</span>
                  <span style={{ color:"#4a4a6a" }}>→</span>
                  <span style={{ color:RARITY_COLOR[next], fontWeight:700 }}>{baseItem.name} {RARITY_LABEL[next]}</span>
                </div>
                {(matItem.abilities||[]).length > 0 && (
                  <div style={{ fontSize:8, color:"#a78bfa", marginBottom:8 }}>
                    継承: {matItem.abilities[0]?.label}{matItem.abilities[0]?.value}{matItem.abilities[0]?.suffix}
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:"#fbbf24" }}>コスト: {synthCost?.gold?.toLocaleString()}G</span>
                  <button onClick={synthesize} disabled={gold < (synthCost?.gold||0)}
                    style={{ padding:"8px 20px", background:"#0a001a", border:`1px solid ${RARITY_COLOR[next]}`, borderRadius:4, cursor:"pointer", color:RARITY_COLOR[next], fontSize:11, fontFamily:"monospace", fontWeight:700 }}>
                    ✨ 合成
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}