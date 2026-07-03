import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcPlayerStats } from "../systems/playerStats";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import { RARITY_COLOR, RARITY_LABEL, INNATE, getItemStats, getSellPrice as getPrice } from "../data/items";

const SKILL_DATA = [
  {id:"s001",name:"居合斬り",type:"active",icon:"⚡",effect:"ATK×1.5倍物理ダメ"},
  {id:"s002",name:"毒霧",    type:"active",icon:"☠", effect:"全体ATK×0.5+毒"},
  {id:"s003",name:"狼召喚",  type:"active",icon:"🐺",effect:"毎ターンATK×0.5"},
  {id:"s004",name:"急所狙い",type:"passive",icon:"🎯",effect:"クリ率+5%"},
  {id:"s005",name:"鉄壁",    type:"passive",icon:"🛡",effect:"DEF+10"},
  {id:"s006",name:"探索眼",  type:"passive",icon:"🔍",effect:"宝箱+5%"},
  {id:"s007",name:"火炎球",  type:"active",icon:"🔥",effect:"MAG×1.8倍魔法ダメ"},
  {id:"s008",name:"吸血",    type:"passive",icon:"🩸",effect:"与ダメ5%回復"},
  {id:"s009",name:"幸運の導き",type:"passive",icon:"🍀",effect:"レア+3%"},
  {id:"s010",name:"狂戦士",  type:"passive",icon:"😈",effect:"低HP時ATK+30%"},
];

const EQUIP_SLOTS = [
  { key:"equippedWeapon", label:"武器",    icon:"⚔" },
  { key:"equippedArmor",  label:"防具",    icon:"🛡" },
  { key:"equippedAcc1",   label:"アクセ1", icon:"💍" },
  { key:"equippedAcc2",   label:"アクセ2", icon:"💍" },
];

function ItemCard({ item, showUnequip, onUnequip }) {
  if (!item) return null;
  const rc = RARITY_COLOR[item.rarity] || "#888";
  const innate = INNATE[item.innate];
  const stats = getItemStats(item);
  return (
    <div style={{ background:"#0d0d15", border:`1px solid ${rc}44`, borderRadius:6, padding:"8px 10px", marginBottom:4 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ fontSize:18 }}>{item.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>
            {item.name}{item.upgradeLevel>0&&<span style={{ color:"#fbbf24" }}> +{item.upgradeLevel}</span>}
          </div>
          <div style={{ fontSize:7, color:rc }}>{RARITY_LABEL[item.rarity]}</div>
        </div>
        {showUnequip && (
          <button onClick={onUnequip} style={{ fontSize:8, padding:"2px 8px", background:"#1a0a0a", border:"1px solid #f8717144", borderRadius:3, color:"#f87171", cursor:"pointer" }}>外す</button>
        )}
      </div>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:2 }}>
        {Object.entries(stats).filter(([,v])=>v>0).map(([k,v])=>(
          <span key={k} style={{ fontSize:8, color:"#86efac", background:"#080810", padding:"1px 5px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
        ))}
      </div>
      {innate && innate.key!=="none" && (
        <div style={{ fontSize:8, color:"#fb923c" }}>◆ {innate.label}</div>
      )}
      {(item.abilities||[]).map((ab,i)=>(
        <div key={i} style={{ fontSize:8, color:"#a78bfa" }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
      ))}
    </div>
  );
}

export default function CharacterPage() {
  const [tab, setTab] = useState("equip");
  const [sel, setSel] = useState(null);
  const player = usePlayerStore();
  const { updatePlayer, itemBox, learnedSkills, activeSkillSlots, passiveSkillSlots } = usePlayerStore();
  const stats = calcPlayerStats(player);
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const learned = new Set(learnedSkills || []);
  const activeSkills = SKILL_DATA.filter(s => s.type === "active");
  const passiveSkills = SKILL_DATA.filter(s => s.type === "passive");
  const equippedUids = new Set(EQUIP_SLOTS.map(s => player[s.key]?.uid).filter(Boolean));
  const selItem = sel ? (itemBox||[]).find(it => it.uid === sel) : null;

  function unequip(key) { updatePlayer({ [key]: null }); }
  function equipItem(it) {
    if (it.type === "weapon") updatePlayer({ equippedWeapon: it });
    else if (it.type === "armor") updatePlayer({ equippedArmor: it });
    else if (it.type === "accessory") {
      if (!player.equippedAcc1) updatePlayer({ equippedAcc1: it });
      else updatePlayer({ equippedAcc2: it });
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace", overflow:"hidden" }}>

      {/* タブ */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {[{id:"equip",label:"⚔ 装備"},{id:"skill",label:"✨ スキル"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"8px 0", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:tab===t.id?"#a78bfa":"#4a4a6a", fontSize:11, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "equip" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* 上部：主人公・ステータス */}
          <div style={{ display:"flex", gap:8, padding:"10px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:120 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:26 }}>🧙</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>冒険者</div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:9, color:"#86efac" }}>Lv{lv}</span>
                    <div style={{ width:40, height:3, background:"#0a1a0a", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:2 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {EQUIP_SLOTS.map(({key,icon})=>{
                  const eq = player[key];
                  const rc = eq ? RARITY_COLOR[eq.rarity]||"#888" : "#1a1a2a";
                  return (
                    <div key={key} style={{ width:26, height:26, background:eq?"#0d0d18":"#04040a", border:`2px solid ${rc}`, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>
                      {eq ? eq.icon : <span style={{ fontSize:8, color:"#2a2a2a" }}>{icon}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:7, color:"#f87171" }}>HP</span>
                <div style={{ flex:1, height:4, background:"#1a0a0a", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(player.hp/stats.maxHp)*100}%`, background:"#4ade80", borderRadius:2 }} />
                </div>
                <span style={{ fontSize:6, color:"#555" }}>{player.hp}/{stats.maxHp}</span>
              </div>
            </div>
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:3 }}>
              {[
                {label:"ATK",  val:stats.atk,        color:"#f87171"},
                {label:"MAG",  val:stats.mag,        color:"#a78bfa"},
                {label:"DEF",  val:stats.def,        color:"#60a5fa"},
                {label:"MDEF", val:stats.mdef,       color:"#38bdf8"},
                {label:"EVA",  val:`${stats.eva}%`,  color:"#34d399"},
                {label:"CRIT", val:`${stats.crit}%`, color:"#fbbf24"},
              ].map(({label,val,color})=>(
                <div key={label} style={{ background:"#0d0d15", borderRadius:3, padding:"3px 6px", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:7, color:"#4a4a6a" }}>{label}</span>
                  <span style={{ fontSize:9, color, fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* スクロールエリア */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 12px" }}>

            {/* 装備中 */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:7, color:"#4a4a6a", letterSpacing:2, marginBottom:4 }}>装備中</div>
              {EQUIP_SLOTS.map(({key,label})=>{
                const eq = player[key];
                return eq
                  ? <ItemCard key={key} item={eq} showUnequip onUnequip={()=>unequip(key)} />
                  : <div key={key} style={{ fontSize:9, color:"#2a2a2a", padding:"4px 8px", marginBottom:4 }}>{label}: なし</div>;
              })}
            </div>

            {/* 消耗品スロット */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:7, color:"#4ade80", letterSpacing:2, marginBottom:4 }}>消耗品スロット</div>
              <div style={{ display:"flex", gap:6 }}>
                {(player.specialSlots||[null,null,null]).map((slot, i) => (
                  <div key={i} style={{ flex:1, minHeight:52, background:slot?"#0d0d15":"#04040a", border:`1px solid ${slot?"#4ade8066":"#1a1a2a"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:4 }}>
                    {slot
                      ? <><span style={{ fontSize:18 }}>{slot.icon}</span><span style={{ fontSize:6, color:"#4ade80", textAlign:"center", marginTop:2 }}>{slot.name.slice(0,6)}</span></>
                      : <span style={{ fontSize:9, color:"#2a2a2a" }}>S{i+1}</span>
                    }
                  </div>
                ))}
              </div>
              <div style={{ fontSize:7, color:"#2a2a3a", marginTop:4 }}>アイテムタブでセット可能</div>
            </div>

            {/* アイテムボックス */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:7, color:"#4a4a6a", letterSpacing:2, marginBottom:6 }}>アイテムボックス（タップで詳細）</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:8 }}>
                {(itemBox||[]).filter(it=>!equippedUids.has(it.uid)).map(it=>{
                  const rc = RARITY_COLOR[it.rarity]||"#888";
                  const isSel = sel===it.uid;
                  return (
                    <div key={it.uid} onClick={()=>setSel(isSel?null:it.uid)}
                      style={{ aspectRatio:"1", background:isSel?"#12122a":"#080810", border:`2px solid ${isSel?rc:rc+"33"}`, borderRadius:5, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", padding:1 }}>
                      <div style={{ fontSize:13 }}>{it.icon}</div>
                      <div style={{ fontSize:4, color:rc, textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingLeft:1 }}>{it.name.slice(0,4)}</div>
                    </div>
                  );
                })}
              </div>

              {/* 選択アイテム詳細 */}
              {selItem && (
                <div style={{ background:"#0d0d15", border:`1px solid ${RARITY_COLOR[selItem.rarity]||"#2a2a3a"}`, borderRadius:6, padding:10 }}>
                  <ItemCard item={selItem} />
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <button onClick={()=>equipItem(selItem)} style={{ flex:2, padding:"7px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace" }}>装備する</button>
                    <button onClick={()=>{ updatePlayer({ itemBox:(itemBox||[]).filter(x=>x.uid!==selItem.uid), gold:player.gold+getPrice(selItem) }); setSel(null); }} style={{ flex:1, padding:"7px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>売却</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* スキルタブ */}
      {tab === "skill" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ fontSize:8, color:"#f87171", letterSpacing:2, marginBottom:8 }}>アクティブスキル（最大4）</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
              {(activeSkillSlots||[null,null,null,null]).map((id,i)=>{
                const sk=id?SKILL_DATA.find(s=>s.id===id):null;
                return (
                  <div key={i} style={{ background:"#080810", border:`1px solid ${sk?"#f87171":"#2a2a3a"}`, borderRadius:5, padding:"6px 8px", display:"flex", alignItems:"center", gap:6, minHeight:36 }}>
                    <span style={{ fontSize:9, color:"#3a3a5a" }}>S{i+1}</span>
                    {sk?(<><span style={{ fontSize:12 }}>{sk.icon}</span><div style={{ flex:1 }}><div style={{ fontSize:9, color:"#f87171" }}>{sk.name}</div></div><button onClick={()=>setActiveSlot(i,null)} style={{ fontSize:8, background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>×</button></>):<div style={{ flex:1, fontSize:8, color:"#2a2a2a" }}>空き</div>}
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
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:"#e8e0d0" }}>{sk.name}</div><div style={{ fontSize:8, color:"#4a4a6a" }}>{sk.effect}</div></div>
                  {!equipped&&empty>=0&&<button onClick={()=>setActiveSlot(empty,sk.id)} style={{ padding:"3px 8px", background:"#1a0800", border:"1px solid #f87171", borderRadius:3, cursor:"pointer", color:"#f87171", fontSize:8, fontFamily:"monospace" }}>装備</button>}
                  {equipped&&<span style={{ fontSize:7, color:"#f87171", border:"1px solid #f8717144", padding:"1px 4px", borderRadius:2 }}>装備中</span>}
                </div>
              );
            })}
            {activeSkills.filter(sk=>learned.has(sk.id)).length===0&&<div style={{ fontSize:9, color:"#2a2a2a", textAlign:"center", padding:8 }}>習得済みスキルなし</div>}
          </div>

          <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:8, color:"#a78bfa", letterSpacing:2, marginBottom:8 }}>パッシブスキル（最大6）</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
              {(passiveSkillSlots||[null,null,null,null,null,null]).map((id,i)=>{
                const sk=id?SKILL_DATA.find(s=>s.id===id):null;
                return (
                  <div key={i} style={{ background:"#080810", border:`1px solid ${sk?"#a78bfa":"#2a2a3a"}`, borderRadius:4, padding:"4px 8px", fontSize:8, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#3a3a5a" }}>P{i+1}</span>
                    {sk?(<><span>{sk.icon}</span><span style={{ color:"#a78bfa" }}>{sk.name}</span><button onClick={()=>setPassiveSlot(i,null)} style={{ fontSize:8, background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>×</button></>):<span style={{ color:"#2a2a2a" }}>空き</span>}
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
                  <div style={{ flex:1 }}><div style={{ fontSize:10, color:"#e8e0d0" }}>{sk.name}</div><div style={{ fontSize:8, color:"#4a4a6a" }}>{sk.effect}</div></div>
                  {!equipped&&empty>=0&&<button onClick={()=>setPassiveSlot(empty,sk.id)} style={{ padding:"3px 8px", background:"#0a0a1a", border:"1px solid #a78bfa", borderRadius:3, cursor:"pointer", color:"#a78bfa", fontSize:8, fontFamily:"monospace" }}>装備</button>}
                  {equipped&&<span style={{ fontSize:7, color:"#a78bfa", border:"1px solid #a78bfa44", padding:"1px 4px", borderRadius:2 }}>装備中</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}