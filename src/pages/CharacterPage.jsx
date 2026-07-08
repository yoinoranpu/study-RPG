import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcPlayerStats } from "../systems/playerStats";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import { RARITY_COLOR, RARITY_LABEL, INNATE, getItemStats, getSellPrice } from "../data/items";
import { SKILLS, SKILL_LIST } from "../data/skills";

const activeSkills  = SKILL_LIST.filter(s => s.type === "active");
const passiveSkills = SKILL_LIST.filter(s => s.type === "passive");


const EQUIP_SLOTS = [
  { key:"equippedWeapon", label:"武器",    icon:"⚔" },
  { key:"equippedArmor",  label:"防具",    icon:"🛡" },
  { key:"equippedAcc1",   label:"アクセ1", icon:"💍" },
  { key:"equippedAcc2",   label:"アクセ2", icon:"💍" },
];

export default function CharacterPage() {
  const [tab, setTab] = useState("equip");
  const [sel, setSel] = useState(null);
  const player = usePlayerStore();
  const { updatePlayer, itemBox, learnedSkills, activeSkillSlots, passiveSkillSlots, skillMode } = usePlayerStore();
  const stats = calcPlayerStats(player);
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const learned = new Set(learnedSkills || []);
  const equippedUids = new Set(EQUIP_SLOTS.map(s => player[s.key]?.uid).filter(Boolean));
  const selItem = sel ? (itemBox||[]).find(it => it.uid === sel) : null;

  function unequip(key) {
    const eq = player[key];
    if (!eq) return;
    updatePlayer({ 
      [key]: null,
      itemBox: [...(itemBox||[]), eq]
    });
    setSel(null);
  }
  function equipItem(it) {
    // 既に装備中かチェック
    const alreadyEquipped = [
      player.equippedWeapon, player.equippedArmor,
      player.equippedAcc1, player.equippedAcc2,
      ...(player.specialSlots||[])
    ].some(eq => eq?.uid === it.uid);
    
    if (alreadyEquipped) return;

    // アイテムボックスから削除
    const newItemBox = (itemBox||[]).filter(x => x.uid !== it.uid);

    if (it.type === "weapon") {
      // 既存の武器をアイテムボックスに戻す
      const old = player.equippedWeapon;
      updatePlayer({ 
        equippedWeapon: it, 
        itemBox: old ? [...newItemBox, old] : newItemBox 
      });
    } else if (it.type === "armor") {
      const old = player.equippedArmor;
      updatePlayer({ 
        equippedArmor: it, 
        itemBox: old ? [...newItemBox, old] : newItemBox 
      });
    } else if (it.type === "accessory") {
      if (!player.equippedAcc1) {
        updatePlayer({ equippedAcc1: it, itemBox: newItemBox });
      } else if (!player.equippedAcc2) {
        updatePlayer({ equippedAcc2: it, itemBox: newItemBox });
      } else {
        // 両方埋まってたらAcc1と交換
        const old = player.equippedAcc1;
        updatePlayer({ equippedAcc1: it, itemBox: [...newItemBox, old] });
      }
    } else if (["consumable","special"].includes(it.type)) {
      const slots = [...(player.specialSlots||[null,null,null])];
      const empty = slots.findIndex(s => !s);
      if (empty >= 0) {
        slots[empty] = it;
        updatePlayer({ specialSlots: slots, itemBox: newItemBox });
      }
    }
    setSel(null);
  }
  function setActiveSlot(i, id) {
    const s = [...(activeSkillSlots||[null,null,null,null])]; s[i]=id; updatePlayer({ activeSkillSlots: s });
  }
  function setPassiveSlot(i, id) {
    const s = [...(passiveSkillSlots||[null,null,null,null,null,null])]; s[i]=id; updatePlayer({ passiveSkillSlots: s });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace", overflow:"hidden", position:"relative" }}>

      {/* タブ */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {[{id:"equip",label:"⚔ 装備"},{id:"skill",label:"✨ スキル"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSel(null);}} style={{ flex:1, padding:"8px 0", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:tab===t.id?"#a78bfa":"#4a4a6a", fontSize:11, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "equip" && (
        <>
          {/* 上部固定：装備スロット＋ステータス */}
          <div style={{ display:"flex", gap:0, background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>

            {/* 左：装備スロット */}
            <div style={{ padding:"10px 10px", display:"flex", flexDirection:"column", gap:8, minWidth:110 }}>
              {/* Lv */}
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:8, color:"#86efac" }}>Lv{lv}</span>
                <div style={{ flex:1, height:3, background:"#0a1a0a", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:2 }} />
                </div>
              </div>
              {/* 装備スロット 2x2 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {EQUIP_SLOTS.map(({key,label,icon})=>{
                  const eq = player[key];
                  const rc = eq ? RARITY_COLOR[eq.rarity]||"#888" : "#1a1a2a";
                  return (
                    <div key={key}
                      onClick={() => eq && setSel(sel===`slot_${key}`?null:`slot_${key}`)}
                      title={label}
                      style={{ width:44, height:44, background:eq?"#0d0d18":"#04040a", border:`2px solid ${sel===`slot_${key}`?"#a78bfa":rc}`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:eq?"pointer":"default", position:"relative" }}>
                      {eq ? eq.icon : <span style={{ fontSize:10, color:"#2a2a2a" }}>{icon}</span>}
                      {eq?.upgradeLevel > 0 && <div style={{ position:"absolute", top:1, right:2, fontSize:6, color:"#fbbf24" }}>+{eq.upgradeLevel}</div>}
                    </div>
                  );
                })}
              </div>
              {/* 消耗品スロット */}
              <div style={{ display:"flex", gap:4 }}>
                {(player.specialSlots||[null,null,null]).map((slot,i)=>(
                  <div key={i}
                    onClick={() => slot && setSel(sel===`cslot_${i}`?null:`cslot_${i}`)}
                    style={{ width:30, height:30, background:slot?"#0d0d15":"#04040a", border:`1px solid ${sel===`cslot_${i}`?"#4ade80":slot?"#4ade8066":"#1a1a2a"}`, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:slot?"pointer":"default" }}>
                    {slot ? slot.icon : <span style={{ fontSize:7, color:"#2a2a2a" }}>S{i+1}</span>}
                  </div>
                ))}
              </div>
              {/* HPバー */}
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:7, color:"#f87171" }}>HP</span>
                <div style={{ flex:1, height:4, background:"#1a0a0a", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(player.hp/stats.maxHp)*100}%`, background: player.hp/stats.maxHp>0.5?"#4ade80":player.hp/stats.maxHp>0.25?"#fbbf24":"#f87171", borderRadius:2 }} />
                </div>
                <span style={{ fontSize:6, color:"#555" }}>{player.hp}/{stats.maxHp}</span>
              </div>
            </div>

            {/* 右：ステータス */}
            <div style={{ flex:1, padding:"10px 8px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:3, alignContent:"start" }}>
              {[
                {label:"ATK",  val:stats.atk,        color:"#f87171"},
                {label:"MAG",  val:stats.mag,        color:"#a78bfa"},
                {label:"DEF",  val:stats.def,        color:"#60a5fa"},
                {label:"MDEF", val:stats.mdef,       color:"#38bdf8"},
                {label:"EVA",  val:`${stats.eva}%`,  color:"#34d399"},
                {label:"CRIT", val:`${stats.crit}%`, color:"#fbbf24"},
              ].map(({label,val,color})=>(
                <div key={label} style={{ background:"#0d0d15", borderRadius:3, padding:"4px 6px", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:8, color:"#4a4a6a" }}>{label}</span>
                  <span style={{ fontSize:10, color, fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* アイテムボックス（スクロール可能） */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 10px" }}>
            <div style={{ fontSize:7, color:"#4a4a6a", letterSpacing:2, marginBottom:6 }}>
              ITEM BOX {(itemBox||[]).length}/30
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
              {(itemBox||[]).map(it=>{
                const rc = RARITY_COLOR[it.rarity]||"#888";
                const isSel = sel===it.uid;
                const isEq = equippedUids.has(it.uid);
                return (
                  <div key={it.uid} onClick={()=>setSel(isSel?null:it.uid)}
                    style={{ aspectRatio:"1", background:isSel?`${rc}33`:`${rc}18`, border:`2px solid ${isSel?rc:rc+"55"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:2, position:"relative", opacity:isEq?0.5:1 }}>
                    {/* 将来の画像差し替え用 - 今はアイコン表示 */}
                    <div style={{ fontSize:20, lineHeight:1 }}>{it.icon}</div>
                    {it.upgradeLevel>0 && (
                      <div style={{ position:"absolute", top:1, right:3, fontSize:7, color:"#fbbf24", fontWeight:700 }}>+{it.upgradeLevel}</div>
                    )}
                    {isEq && (
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, fontSize:5, color:"#4ade80", textAlign:"center", background:"rgba(0,0,0,0.7)", borderRadius:"0 0 4px 4px" }}>装備中</div>
                    )}
                    {/* レアリティインジケーター（下端） */}
                    <div style={{ position:"absolute", bottom:isEq?10:2, left:4, right:4, height:2, background:rc, borderRadius:1, opacity:0.8 }} />
                  </div>
                );
              })}
              {Array.from({length:Math.max(0,30-(itemBox||[]).length)}).map((_,i)=>(
                <div key={`e${i}`} style={{ aspectRatio:"1", background:"#04040a", border:"1px solid #0d0d0d", borderRadius:5 }} />
              ))}
            </div>
          </div>

          {/* 選択アイテム詳細（画面下に固定で浮かぶ） */}
          {sel && !sel.startsWith("slot_") && !sel.startsWith("cslot_") && selItem && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #2a2a3a", borderTop:"1px solid #3a3a5a", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:20 }}>{selItem.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>
                    {selItem.name}{selItem.upgradeLevel>0&&<span style={{ color:"#fbbf24" }}> +{selItem.upgradeLevel}</span>}
                  </div>
                  <div style={{ fontSize:7, color:RARITY_COLOR[selItem.rarity]||"#888" }}>{RARITY_LABEL[selItem.rarity]}</div>
                </div>
                <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:"#555", fontSize:16, cursor:"pointer" }}>×</button>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                {Object.entries(getItemStats(selItem)).filter(([,v])=>v>0).map(([k,v])=>(
                  <span key={k} style={{ fontSize:8, color:"#86efac", background:"#080810", padding:"1px 5px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                ))}
              </div>
              {selItem.innate && selItem.innate!=="none" && INNATE[selItem.innate] && (
                <div style={{ fontSize:8, color:"#fb923c", marginBottom:3 }}>◆ {INNATE[selItem.innate].label}</div>
              )}
              {(selItem.abilities||[]).map((ab,i)=>(
                <div key={i} style={{ fontSize:8, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {["weapon","armor","accessory","consumable","special"].includes(selItem.type) && (
                  <button onClick={()=>equipItem(selItem)} style={{ flex:2, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace" }}>
                    {["consumable","special"].includes(selItem.type) ? "スロットにセット" : "装備する"}
                  </button>
                )}
                <button onClick={()=>{ updatePlayer({ itemBox:(itemBox||[]).filter(x=>x.uid!==selItem.uid), gold:player.gold+getSellPrice(selItem) }); setSel(null); }}
                  style={{ flex:1, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>
                  売却 {getSellPrice(selItem)}G
                </button>
              </div>
            </div>
          )}

          {/* 装備スロットタップ時の詳細 */}
          {sel && sel.startsWith("slot_") && (()=>{
            const key = sel.replace("slot_","");
            const eq = player[key];
            if (!eq) return null;
            return (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #2a2a3a", borderTop:"1px solid #3a3a5a", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{eq.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>{eq.name}{eq.upgradeLevel>0&&<span style={{ color:"#fbbf24" }}> +{eq.upgradeLevel}</span>}</div>
                    <div style={{ fontSize:7, color:RARITY_COLOR[eq.rarity]||"#888" }}>{RARITY_LABEL[eq.rarity]}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:"#555", fontSize:16, cursor:"pointer" }}>×</button>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                  {Object.entries(getItemStats(eq)).filter(([,v])=>v>0).map(([k,v])=>(
                    <span key={k} style={{ fontSize:8, color:"#86efac", background:"#080810", padding:"1px 5px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                  ))}
                </div>
                {eq.innate && eq.innate!=="none" && INNATE[eq.innate] && (
                  <div style={{ fontSize:8, color:"#fb923c", marginBottom:3 }}>◆ {INNATE[eq.innate].label}</div>
                )}
                {(eq.abilities||[]).map((ab,i)=>(
                  <div key={i} style={{ fontSize:8, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                ))}
                <button onClick={()=>unequip(key)} style={{ width:"100%", marginTop:8, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>
                  外す
                </button>
              </div>
            );
          })()}

          {/* 消耗品スロットタップ時の詳細 */}
          {sel && sel.startsWith("cslot_") && (()=>{
            const i = parseInt(sel.replace("cslot_",""));
            const slot = (player.specialSlots||[])[i];
            if (!slot) return null;
            return (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #2a2a3a", borderTop:"1px solid #3a3a5a", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{slot.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>{slot.name}</div>
                    <div style={{ fontSize:8, color:"#4ade80" }}>消耗品スロット {i+1}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:"#555", fontSize:16, cursor:"pointer" }}>×</button>
                </div>
                <div style={{ fontSize:8, color:"#4a4a6a", marginBottom:8 }}>{slot.desc}</div>
                <button onClick={()=>{
                  const slots=[...(player.specialSlots||[null,null,null])];
                  slots[i]=null;
                  updatePlayer({ specialSlots:slots });
                  setSel(null);
                }} style={{ width:"100%", padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>
                  スロットから外す
                </button>
              </div>
            );
          })()}
        </>
      )}

      {tab === "skill" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>

          {/* アクティブスキル */}
          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ fontSize:8, color:"#f87171", letterSpacing:2, marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span>アクティブスキル（最大4）</span>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={() => updatePlayer({ skillMode:"order" })}
                  style={{ padding:"3px 8px", background:(skillMode||"order")==="order"?"#1a0a0a":"transparent", border:`1px solid ${(skillMode||"order")==="order"?"#f87171":"#2a2a3a"}`, borderRadius:3, cursor:"pointer", color:(skillMode||"order")==="order"?"#f87171":"#4a4a6a", fontSize:8, fontFamily:"monospace" }}>
                  🔢 順番
                </button>
                <button onClick={() => updatePlayer({ skillMode:"random" })}
                  style={{ padding:"3px 8px", background:skillMode==="random"?"#1a0a0a":"transparent", border:`1px solid ${skillMode==="random"?"#f87171":"#2a2a3a"}`, borderRadius:3, cursor:"pointer", color:skillMode==="random"?"#f87171":"#4a4a6a", fontSize:8, fontFamily:"monospace" }}>
                  🎲 ランダム
                </button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
              {(activeSkillSlots||[null,null,null,null]).map((id,i)=>{
                const sk = id ? SKILLS[id] : null;
                return (
                  <div key={i} style={{ background:"#080810", border:`1px solid ${sk?"#f87171":"#2a2a3a"}`, borderRadius:5, padding:"6px 8px", display:"flex", alignItems:"center", gap:6, minHeight:36 }}>
                    <span style={{ fontSize:9, color:"#3a3a5a" }}>S{i+1}</span>
                    {sk ? (
                      <><span style={{ fontSize:12 }}>{sk.icon}</span>
                      <div style={{ flex:1 }}><div style={{ fontSize:9, color:"#f87171" }}>{sk.name}</div></div>
                      <button onClick={()=>setActiveSlot(i,null)} style={{ fontSize:8, background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>×</button></>
                    ) : <div style={{ flex:1, fontSize:8, color:"#2a2a2a" }}>空き</div>}
                  </div>
                );
              })}
            </div>
            {activeSkills.filter(sk=>learned.has(sk.id)).map(sk=>{
              const equipped=(activeSkillSlots||[]).includes(sk.id);
              const empty=(activeSkillSlots||[]).findIndex(s=>!s);
              return (
                <div key={sk.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:equipped?"#1a0a0a":"#080810", border:`1px solid ${equipped?"#f87171":"#1a1a2a"}`, borderRadius:4, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{sk.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#e8e0d0" }}>{sk.name}</div>
                    <div style={{ fontSize:8, color:"#4a4a6a" }}>{sk.desc}</div>
                  </div>
                  {!equipped&&empty>=0&&<button onClick={()=>setActiveSlot(empty,sk.id)} style={{ padding:"3px 8px", background:"#1a0800", border:"1px solid #f87171", borderRadius:3, cursor:"pointer", color:"#f87171", fontSize:8, fontFamily:"monospace" }}>セット</button>}
                  {equipped&&<span style={{ fontSize:7, color:"#f87171", border:"1px solid #f8717144", padding:"1px 4px", borderRadius:2 }}>セット中</span>}
                </div>
              );
            })}
            {activeSkills.filter(sk=>learned.has(sk.id)).length===0&&(
              <div style={{ fontSize:9, color:"#2a2a2a", textAlign:"center", padding:8 }}>習得済みスキルなし</div>
            )}
          </div>

          {/* パッシブスキル */}
          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ fontSize:8, color:"#a78bfa", letterSpacing:2, marginBottom:8 }}>パッシブスキル（最大6）</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
              {(passiveSkillSlots||[null,null,null,null,null,null]).map((id,i)=>{
                const sk = id ? SKILLS[id] : null;
                return (
                  <div key={i} style={{ background:"#080810", border:`1px solid ${sk?"#a78bfa":"#2a2a3a"}`, borderRadius:4, padding:"4px 8px", fontSize:8, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#3a3a5a" }}>P{i+1}</span>
                    {sk?(
                      <><span>{sk.icon}</span>
                      <span style={{ color:"#a78bfa" }}>{sk.name}</span>
                      <button onClick={()=>setPassiveSlot(i,null)} style={{ fontSize:8, background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>×</button></>
                    ):<span style={{ color:"#2a2a2a" }}>空き</span>}
                  </div>
                );
              })}
            </div>
            {passiveSkills.filter(sk=>learned.has(sk.id)).map(sk=>{
              const equipped=(passiveSkillSlots||[]).includes(sk.id);
              const empty=(passiveSkillSlots||[]).findIndex(s=>!s);
              return (
                <div key={sk.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:equipped?"#0a0a1a":"#080810", border:`1px solid ${equipped?"#a78bfa":"#1a1a2a"}`, borderRadius:4, marginBottom:4 }}>
                  <span style={{ fontSize:14 }}>{sk.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#e8e0d0" }}>{sk.name}</div>
                    <div style={{ fontSize:8, color:"#4a4a6a" }}>{sk.desc}</div>
                  </div>
                  {!equipped&&empty>=0&&<button onClick={()=>setPassiveSlot(empty,sk.id)} style={{ padding:"3px 8px", background:"#0a0a1a", border:"1px solid #a78bfa", borderRadius:3, cursor:"pointer", color:"#a78bfa", fontSize:8, fontFamily:"monospace" }}>セット</button>}
                  {equipped&&<span style={{ fontSize:7, color:"#a78bfa", border:"1px solid #a78bfa44", padding:"1px 4px", borderRadius:2 }}>セット中</span>}
                </div>
              );
            })}
            {passiveSkills.filter(sk=>learned.has(sk.id)).length===0&&(
              <div style={{ fontSize:9, color:"#2a2a2a", textAlign:"center", padding:8 }}>習得済みスキルなし</div>
            )}
          </div>

          {/* 習得済みステータス強化スキル */}
          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:8, color:"#86efac", letterSpacing:2, marginBottom:8 }}>ステータス強化（習得で自動反映）</div>
            {SKILL_LIST.filter(sk=>sk.type==="stat"&&sk.id!=="start"&&learned.has(sk.id)).map(sk=>(
              <div key={sk.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 8px", background:"#080810", border:"1px solid #86efac22", borderRadius:4, marginBottom:4 }}>
                <span style={{ fontSize:12 }}>{sk.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:"#86efac" }}>{sk.name}</div>
                  <div style={{ fontSize:8, color:"#4a4a6a" }}>{sk.desc}</div>
                </div>
                <span style={{ fontSize:7, color:"#4ade80", border:"1px solid #4ade8044", padding:"1px 4px", borderRadius:2 }}>反映中</span>
              </div>
            ))}
            {SKILL_LIST.filter(sk=>sk.type==="stat"&&sk.id!=="start"&&learned.has(sk.id)).length===0&&(
              <div style={{ fontSize:9, color:"#2a2a2a", textAlign:"center", padding:8 }}>習得済みスキルなし</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}