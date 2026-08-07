import { useState, useEffect, useRef } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcPlayerStats } from "../systems/playerStats";
import { expToLevel, expForLevel, expUsedUpTo } from "../systems/timer";
import { RARITY_COLOR, RARITY_LABEL, INNATE, getItemStats, getSellPrice } from "../data/items";
import { SKILL_BOOKS, getBookSellPrice, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL } from "../data/skills";
import { TRIBE_MAT } from "../systems/events";

const INSTANT_USE_EFFECTS = ["skill_reset", "mat_pack"];

const EQUIP_SLOTS = [
  { key:"equippedWeapon", label:"武器",    icon:"⚔", drop:"weapon" },
  { key:"equippedArmor",  label:"防具",    icon:"🛡", drop:"armor" },
  { key:"equippedAcc1",   label:"アクセ1", icon:"💍", drop:"accessory" },
  { key:"equippedAcc2",   label:"アクセ2", icon:"💍", drop:"accessory" },
];

const DIM = "#7a7a9a";      // 補助ラベル（旧#4a4a6a相当）
const FAINT = "#5c5c82";    // プレースホルダー・空き表示（旧#2a2a2a/#3a3a5a相当）
const LABEL = "#9a9ac8";    // ステータス略号・スロット番号など小さい構造ラベル
const DRAG_THRESHOLD = 6;

function isValidDrop(payload, dz) {
  if (!payload || !dz) return false;
  if (payload.kind === "item") {
    if (payload.itemType === "weapon") return dz === "weapon";
    if (payload.itemType === "armor") return dz === "armor";
    if (payload.itemType === "accessory") return dz === "accessory";
    if (["consumable","special"].includes(payload.itemType)) return dz === "special";
    return false;
  }
  if (payload.kind === "book") {
    if (payload.bookType === "active") return dz.startsWith("active-");
    if (payload.bookType === "passive") return dz.startsWith("passive-");
  }
  return false;
}

export default function CharacterPage() {
  const w = window.innerWidth;
  const [isMobile, setIsMobile] = useState(w < 768);
  const [tab, setTab] = useState("equip");
  const [sel, setSel] = useState(null);
  const player = usePlayerStore();
  const { updatePlayer, itemBox, skillBooks, activeSkillSlots, passiveSkillSlots, skillMode } = usePlayerStore();
  const stats = calcPlayerStats(player);
  const lv = expToLevel(player.totalExp);
  const used = expUsedUpTo(lv);
  const need = expForLevel(lv);
  const lvPct = need > 0 ? Math.min(1, (player.totalExp - used) / need) : 1;
  const equippedUids = new Set(EQUIP_SLOTS.map(s => player[s.key]?.uid).filter(Boolean));
  const selItem = sel ? (itemBox||[]).find(it => it.uid === sel) : null;

  // スロットを常に4枠・6枠に補正
  const actSlots = [...(activeSkillSlots||[])];  while (actSlots.length < 4) actSlots.push(null);
  const pasSlots = [...(passiveSkillSlots||[])]; while (pasSlots.length < 6) pasSlots.push(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function unequip(key) {
    const eq = player[key];
    if (!eq) return;
    updatePlayer({ [key]: null, itemBox: [...(itemBox||[]), eq] });
    setSel(null);
  }

  function equipItem(it) {
    const alreadyEquipped = [
      player.equippedWeapon, player.equippedArmor,
      player.equippedAcc1, player.equippedAcc2,
      ...(player.specialSlots||[])
    ].some(eq => eq?.uid === it.uid);
    if (alreadyEquipped) return;

    const newItemBox = (itemBox||[]).filter(x => x.uid !== it.uid);

    if (it.type === "weapon") {
      const old = player.equippedWeapon;
      updatePlayer({ equippedWeapon: it, itemBox: old ? [...newItemBox, old] : newItemBox });
    } else if (it.type === "armor") {
      const old = player.equippedArmor;
      updatePlayer({ equippedArmor: it, itemBox: old ? [...newItemBox, old] : newItemBox });
    } else if (it.type === "accessory") {
      if (!player.equippedAcc1) {
        updatePlayer({ equippedAcc1: it, itemBox: newItemBox });
      } else if (!player.equippedAcc2) {
        updatePlayer({ equippedAcc2: it, itemBox: newItemBox });
      } else {
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

  // 即時使用アイテム(スキルリセット石・レア素材パック)：特殊スロットを介さずその場で消費
  function consumeItem(it) {
    const newItemBox = (itemBox||[]).filter(x => x.uid !== it.uid);
    if (it.effect === "skill_reset") {
      updatePlayer({
        itemBox: newItemBox,
        activeSkillSlots: [null,null,null,null],
        passiveSkillSlots: [null,null,null,null,null,null],
      });
    } else if (it.effect === "mat_pack") {
      const pool = Object.values(TRIBE_MAT);
      const newMats = { ...(player.materials||{}) };
      for (let i=0;i<5;i++) {
        const name = pool[Math.floor(Math.random()*pool.length)];
        newMats[name] = (newMats[name]||0) + 1;
      }
      updatePlayer({ itemBox: newItemBox, materials: newMats });
    }
    setSel(null);
  }

  function setActiveSlot(i, uid) {
    const s = [...actSlots];
    if (uid) for (let j=0;j<s.length;j++) if (s[j]===uid) s[j]=null;
    s[i]=uid;
    updatePlayer({ activeSkillSlots: s });
  }
  function setPassiveSlot(i, uid) {
    const s = [...pasSlots];
    if (uid) for (let j=0;j<s.length;j++) if (s[j]===uid) s[j]=null;
    s[i]=uid;
    updatePlayer({ passiveSkillSlots: s });
  }

  function sellBook(uid) {
    const owned = (skillBooks||[]).find(b => b.uid === uid);
    if (!owned) return;
    const price = getBookSellPrice(owned.rarity);
    updatePlayer({
      skillBooks: (skillBooks||[]).filter(b => b.uid !== uid),
      activeSkillSlots: actSlots.map(s => s === uid ? null : s),
      passiveSkillSlots: pasSlots.map(s => s === uid ? null : s),
      gold: player.gold + price,
    });
  }

  const books = skillBooks || [];
  const ownedActive  = books.filter(b => SKILL_BOOKS[b.id]?.type === "active");
  const ownedPassive = books.filter(b => SKILL_BOOKS[b.id]?.type === "passive");
  const bookByUid = (uid) => books.find(b => b.uid === uid);

  // ─── ドラッグ&ドロップ（Pointer Events。マウス・タッチ両対応、依存ライブラリなし）───
  const dragStartRef = useRef(null); // {x,y,payload} しきい値未達の候補
  const dragRef = useRef(null);      // 実際にドラッグ中のpayload
  const [dragVisual, setDragVisual] = useState(null); // {icon,name,x,y}
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    function onMove(e) {
      if (dragRef.current) {
        setDragVisual(v => v && { ...v, x:e.clientX, y:e.clientY });
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-drop]");
        const dz = el?.getAttribute("data-drop") || null;
        setDropTarget(isValidDrop(dragRef.current, dz) ? dz : null);
        return;
      }
      if (dragStartRef.current) {
        const { x, y, payload } = dragStartRef.current;
        if (Math.hypot(e.clientX - x, e.clientY - y) > DRAG_THRESHOLD) {
          dragRef.current = payload;
          setDragVisual({ icon: payload.icon, name: payload.name, x: e.clientX, y: e.clientY });
        }
      }
    }
    function onUp(e) {
      if (dragRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-drop]");
        const dz = el?.getAttribute("data-drop") || null;
        if (isValidDrop(dragRef.current, dz)) {
          const payload = dragRef.current;
          if (payload.kind === "item") equipItem(payload.item);
          else if (payload.kind === "book") {
            if (dz.startsWith("active-")) setActiveSlot(parseInt(dz.split("-")[1], 10), payload.uid);
            else if (dz.startsWith("passive-")) setPassiveSlot(parseInt(dz.split("-")[1], 10), payload.uid);
          }
        }
      }
      dragRef.current = null;
      dragStartRef.current = null;
      setDragVisual(null);
      setDropTarget(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemBox, actSlots.join(","), pasSlots.join(","), player.equippedWeapon, player.equippedArmor, player.equippedAcc1, player.equippedAcc2, player.specialSlots]);

  function beginDrag(e, payload) {
    dragStartRef.current = { x:e.clientX, y:e.clientY, payload };
  }

  function BookRow({ owned, slots, setSlot, color }) {
    const book = SKILL_BOOKS[owned.id];
    const rc = BOOK_RARITY_COLOR[owned.rarity] || "#888";
    const equipped = slots.includes(owned.uid);
    const empty = slots.findIndex(s => !s);
    const sellPrice = getBookSellPrice(owned.rarity);
    return (
      <div
        onPointerDown={(e) => beginDrag(e, { kind:"book", bookType:book.type, uid:owned.uid, icon:book.icon, name:book.name })}
        style={{ touchAction:"none", cursor:"grab", display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:equipped?`${color}2a`:`${rc}22`, borderLeft:`3px solid ${rc}`, border:`1px solid ${equipped?color:rc+"66"}`, borderRadius:4, marginBottom:4 }}>
        <span style={{ fontSize:16 }}>{book.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:"#e8e0d0" }}>
            {book.name} <span style={{ fontSize:9, color:rc }}>{BOOK_RARITY_LABEL[owned.rarity]}</span>
          </div>
          <div style={{ fontSize:10, color:DIM }}>{book.desc}</div>
        </div>
        {!equipped && empty>=0 && <button onClick={()=>setSlot(empty, owned.uid)} style={{ padding:"3px 8px", background:`${color}18`, border:`1px solid ${color}`, borderRadius:3, cursor:"pointer", color, fontSize:10, fontFamily:"monospace" }}>セット</button>}
        {equipped && <span style={{ fontSize:9, color, border:`1px solid ${color}44`, padding:"1px 4px", borderRadius:2 }}>セット中</span>}
        <button onClick={()=>sellBook(owned.uid)} title="売却" style={{ padding:"3px 8px", background:"#1a0a0a", border:"1px solid #f8717166", borderRadius:3, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>売却{sellPrice}G</button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace", overflow:"hidden", position:"relative" }}>

      <div style={{ position:"relative", flexShrink:0, height:90, overflow:"hidden", borderBottom:"1px solid #1a1a2a" }}>
        <img src="/assets/images/character-banner.png" alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", display:"block" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(180deg, rgba(8,8,16,0.15) 0%, rgba(8,8,16,0.55) 60%, #080810 100%)" }} />
        <div style={{ position:"absolute", left:12, right:12, bottom:6 }}>
          <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:2 }}>⚔ CHARACTER</div>
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {[{id:"equip",label:"⚔ 装備"},{id:"skill",label:"✨ スキル"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSel(null);}} style={{ flex:1, padding:"8px 0", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:tab===t.id?"#a78bfa":DIM, fontSize:11, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "equip" && (
        <>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:0, background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
            <div style={{ padding:"10px 10px", display:"flex", flexDirection:"column", gap:8, minWidth:isMobile?"auto":168 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:10, color:"#86efac", fontWeight:700 }}>Lv{lv}</span>
                <div style={{ flex:1, height:3, background:"#0a1a0a", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${lvPct*100}%`, background:"#4ade80", borderRadius:2 }} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {EQUIP_SLOTS.map(({key,label,icon,drop})=>{
                  const eq = player[key];
                  const rc = eq ? RARITY_COLOR[eq.rarity]||"#888" : "#333350";
                  const isHover = dropTarget === drop;
                  return (
                    <div key={key} data-drop={drop} onClick={() => eq && setSel(sel===`slot_${key}`?null:`slot_${key}`)} title={label}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                      <div style={{ width:60, height:60, background:isHover?"#1a2a1a":eq?`${rc}22`:"#0a0a14", border:`2px solid ${isHover?"#4ade80":sel===`slot_${key}`?"#a78bfa":rc}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, cursor:eq?"pointer":"default", position:"relative", boxShadow:eq?`0 0 8px ${rc}66`:"none" }}>
                        {eq ? (eq.image ? <img src={eq.image} alt="" style={{ width:"75%", height:"75%", objectFit:"contain" }} /> : eq.icon) : <span style={{ fontSize:13, color:FAINT }}>{icon}</span>}
                        {eq?.upgradeLevel > 0 && <div style={{ position:"absolute", top:1, right:2, fontSize:10, color:"#fbbf24", fontWeight:700 }}>+{eq.upgradeLevel}</div>}
                      </div>
                      <div style={{ fontSize:9, color:eq?rc:FAINT, maxWidth:60, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center" }}>
                        {eq ? eq.name : label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {(player.specialSlots||[null,null,null]).map((slot,i)=>{
                  const isHover = dropTarget === "special";
                  return (
                    <div key={i} data-drop="special" onClick={() => slot && setSel(sel===`cslot_${i}`?null:`cslot_${i}`)}
                      style={{ width:44, height:44, background:isHover?"#1a2a1a":slot?"#0d0d15":"#0a0a14", border:`1px solid ${isHover?"#4ade80":sel===`cslot_${i}`?"#4ade80":slot?"#4ade8066":"#333350"}`, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, cursor:slot?"pointer":"default" }}>
                      {slot ? (slot.image ? <img src={slot.image} alt="" style={{ width:"70%", height:"70%", objectFit:"contain" }} /> : slot.icon) : <span style={{ fontSize:10, color:DIM }}>S{i+1}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:10, color:"#f87171", fontWeight:700 }}>HP</span>
                <div style={{ flex:1, height:4, background:"#1a0a0a", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(player.hp/stats.maxHp)*100}%`, background: player.hp/stats.maxHp>0.5?"#4ade80":player.hp/stats.maxHp>0.25?"#fbbf24":"#f87171", borderRadius:2 }} />
                </div>
                <span style={{ fontSize:10, color:DIM }}>{player.hp}/{stats.maxHp}</span>
              </div>
            </div>

            <div style={{ flex:1, padding:"10px 8px 10px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, alignContent:"start", justifyItems:"end" }}>
              {[
                {label:"ATK",  val:stats.atk,        color:"#f87171"},
                {label:"MAG",  val:stats.mag,        color:"#a78bfa"},
                {label:"DEF",  val:stats.def,        color:"#60a5fa"},
                {label:"MDEF", val:stats.mdef,       color:"#38bdf8"},
                {label:"EVA",  val:`${stats.eva}%`,  color:"#34d399"},
                {label:"CRIT", val:`${stats.crit}%`, color:"#fbbf24"},
              ].map(({label,val,color})=>(
                <div key={label} style={{ width:"100%", background:"#0d0d15", borderRadius:3, padding:"5px 8px", display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontSize:10, color:LABEL, fontWeight:700 }}>{label}</span>
                  <span style={{ fontSize:11, color, fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"8px 10px" }}>
            <div style={{ fontSize:10, color:DIM, letterSpacing:2, marginBottom:6 }}>ITEM BOX {(itemBox||[]).length}/30 <span style={{ color:"#4a4a6a" }}>（ドラッグでも装備可）</span></div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?4:6},1fr)`, gap:4 }}>
              {(itemBox||[]).map(it=>{
                const rc = RARITY_COLOR[it.rarity]||"#888";
                const isSel = sel===it.uid;
                const isEq = equippedUids.has(it.uid);
                return (
                  <div key={it.uid}
                    onPointerDown={(e) => beginDrag(e, { kind:"item", itemType:it.type, item:it, icon:it.icon, name:it.name })}
                    onClick={()=>setSel(isSel?null:it.uid)}
                    style={{ touchAction:"none", cursor:"grab", aspectRatio:"1", background:isSel?`${rc}55`:`${rc}30`, border:`2px solid ${isSel?rc:rc+"88"}`, borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:2, position:"relative", opacity:isEq?0.5:1, boxShadow:isSel?`0 0 8px ${rc}88`:"none" }}>
                    {it.image ? (
                      <img src={it.image} alt="" style={{ width:"75%", height:"75%", objectFit:"contain" }} />
                    ) : (
                      <div style={{ fontSize:20, lineHeight:1 }}>{it.icon}</div>
                    )}
                    {it.upgradeLevel>0 && <div style={{ position:"absolute", top:1, right:3, fontSize:9, color:"#fbbf24", fontWeight:700 }}>+{it.upgradeLevel}</div>}
                    {isEq && <div style={{ position:"absolute", bottom:0, left:0, right:0, fontSize:8, color:"#4ade80", textAlign:"center", background:"rgba(0,0,0,0.75)", borderRadius:"0 0 4px 4px" }}>装備中</div>}
                    <div style={{ position:"absolute", bottom:isEq?9:2, left:3, right:3, height:3, background:rc, borderRadius:1 }} />
                  </div>
                );
              })}
              {Array.from({length:Math.max(0,30-(itemBox||[]).length)}).map((_,i)=>(
                <div key={`e${i}`} style={{ aspectRatio:"1", background:"#0a0a12", border:"1px dashed #262640", borderRadius:5 }} />
              ))}
            </div>
          </div>

          {sel && !sel.startsWith("slot_") && !sel.startsWith("cslot_") && selItem && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #3a3a55", borderTop:"1px solid #4a4a70", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                {selItem.image ? <img src={selItem.image} alt="" style={{ width:24, height:24, objectFit:"contain" }} /> : <span style={{ fontSize:20 }}>{selItem.icon}</span>}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>{selItem.name}{selItem.upgradeLevel>0&&<span style={{ color:"#fbbf24" }}> +{selItem.upgradeLevel}</span>}</div>
                  <div style={{ fontSize:10, color:RARITY_COLOR[selItem.rarity]||"#888" }}>{RARITY_LABEL[selItem.rarity]}</div>
                </div>
                <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:DIM, fontSize:16, cursor:"pointer" }}>×</button>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                {Object.entries(getItemStats(selItem)).filter(([,v])=>v>0).map(([k,v])=>(
                  <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"1px 5px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                ))}
              </div>
              {selItem.innate && selItem.innate!=="none" && INNATE[selItem.innate] && (
                <div style={{ marginBottom:4 }}>
                  <div style={{ fontSize:10, color:"#fb923c" }}>◆ {INNATE[selItem.innate].label}</div>
                  <div style={{ fontSize:9, color:DIM }}>{INNATE[selItem.innate].desc}</div>
                </div>
              )}
              {selItem.desc && (
                <div style={{ fontSize:9, color:DIM, marginBottom:4 }}>{selItem.desc}</div>
              )}
              {(selItem.abilities||[]).map((ab,i)=>(
                <div key={i} style={{ fontSize:10, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {INSTANT_USE_EFFECTS.includes(selItem.effect) ? (
                  <button onClick={()=>consumeItem(selItem)} style={{ flex:2, padding:"8px 0", background:"#0a1a0a", border:"1px solid #4ade80", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:10, fontFamily:"monospace" }}>
                    使う
                  </button>
                ) : ["weapon","armor","accessory","consumable","special"].includes(selItem.type) && (
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

          {sel && sel.startsWith("slot_") && (()=>{
            const key = sel.replace("slot_","");
            const eq = player[key];
            if (!eq) return null;
            return (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #3a3a55", borderTop:"1px solid #4a4a70", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  {eq.image ? <img src={eq.image} alt="" style={{ width:24, height:24, objectFit:"contain" }} /> : <span style={{ fontSize:20 }}>{eq.icon}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>{eq.name}{eq.upgradeLevel>0&&<span style={{ color:"#fbbf24" }}> +{eq.upgradeLevel}</span>}</div>
                    <div style={{ fontSize:10, color:RARITY_COLOR[eq.rarity]||"#888" }}>{RARITY_LABEL[eq.rarity]}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:DIM, fontSize:16, cursor:"pointer" }}>×</button>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                  {Object.entries(getItemStats(eq)).filter(([,v])=>v>0).map(([k,v])=>(
                    <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"1px 5px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                  ))}
                </div>
                {eq.innate && eq.innate!=="none" && INNATE[eq.innate] && (
                  <div style={{ marginBottom:4 }}>
                    <div style={{ fontSize:10, color:"#fb923c" }}>◆ {INNATE[eq.innate].label}</div>
                    <div style={{ fontSize:9, color:DIM }}>{INNATE[eq.innate].desc}</div>
                  </div>
                )}
                {(eq.abilities||[]).map((ab,i)=>(
                  <div key={i} style={{ fontSize:10, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                ))}
                <button onClick={()=>unequip(key)} style={{ width:"100%", marginTop:8, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>外す</button>
              </div>
            );
          })()}

          {sel && sel.startsWith("cslot_") && (()=>{
            const i = parseInt(sel.replace("cslot_",""));
            const slot = (player.specialSlots||[])[i];
            if (!slot) return null;
            return (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,6,15,0.97)", border:"1px solid #3a3a55", borderTop:"1px solid #4a4a70", borderRadius:"8px 8px 0 0", padding:"10px 12px", zIndex:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  {slot.image ? <img src={slot.image} alt="" style={{ width:24, height:24, objectFit:"contain" }} /> : <span style={{ fontSize:20 }}>{slot.icon}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#e8e0d0" }}>{slot.name}</div>
                    <div style={{ fontSize:10, color:"#4ade80" }}>消耗品スロット {i+1}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{ background:"transparent", border:"none", color:DIM, fontSize:16, cursor:"pointer" }}>×</button>
                </div>
                <div style={{ fontSize:10, color:DIM, marginBottom:8 }}>{slot.desc}</div>
                <button onClick={()=>{
                  const slots=[...(player.specialSlots||[null,null,null])];
                  slots[i]=null;
                  updatePlayer({ specialSlots:slots });
                  setSel(null);
                }} style={{ width:"100%", padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>スロットから外す</button>
              </div>
            );
          })()}
        </>
      )}

      {tab === "skill" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          {/* アクティブ */}
          <div style={{ background:"#0d0d15", border:"1px solid #3a3a55", borderRadius:8, padding:12, marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#f87171", letterSpacing:2, marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span>アクティブ書（最大4・ドラッグでもセット可）</span>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={() => updatePlayer({ skillMode:"order" })}
                  style={{ padding:"3px 8px", background:(skillMode||"order")==="order"?"#1a0a0a":"transparent", border:`1px solid ${(skillMode||"order")==="order"?"#f87171":"#3a3a55"}`, borderRadius:3, cursor:"pointer", color:(skillMode||"order")==="order"?"#f87171":DIM, fontSize:10, fontFamily:"monospace" }}>🔢 順番</button>
                <button onClick={() => updatePlayer({ skillMode:"random" })}
                  style={{ padding:"3px 8px", background:skillMode==="random"?"#1a0a0a":"transparent", border:`1px solid ${skillMode==="random"?"#f87171":"#3a3a55"}`, borderRadius:3, cursor:"pointer", color:skillMode==="random"?"#f87171":DIM, fontSize:10, fontFamily:"monospace" }}>🎲 ランダム</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
              {actSlots.map((uid,i)=>{
                const owned = uid ? bookByUid(uid) : null;
                const book = owned ? SKILL_BOOKS[owned.id] : null;
                const rc = owned ? BOOK_RARITY_COLOR[owned.rarity] : "#3a3a55";
                const dz = `active-${i}`;
                const isHover = dropTarget === dz;
                return (
                  <div key={i} data-drop={dz} style={{ background:isHover?"#1a2a1a":book?`${rc}22`:"#0a0a14", border:`1px solid ${isHover?"#4ade80":book?rc:"#3a3a55"}`, borderRadius:5, padding:"6px 8px", display:"flex", alignItems:"center", gap:6, minHeight:36 }}>
                    <span style={{ fontSize:10, color:LABEL, fontWeight:700 }}>S{i+1}</span>
                    {book ? (<>
                      <span style={{ fontSize:12 }}>{book.icon}</span>
                      <div style={{ flex:1 }}><div style={{ fontSize:10, color:rc }}>{book.name}</div></div>
                      <button onClick={()=>setActiveSlot(i,null)} style={{ fontSize:10, background:"transparent", border:"none", color:DIM, cursor:"pointer" }}>×</button>
                    </>) : <div style={{ flex:1, fontSize:10, color:DIM }}>空き</div>}
                  </div>
                );
              })}
            </div>
            {ownedActive.length === 0
              ? <div style={{ fontSize:10, color:FAINT, textAlign:"center", padding:8 }}>アクティブ書を持っていない</div>
              : ownedActive.map(owned => <BookRow key={owned.uid} owned={owned} slots={actSlots} setSlot={setActiveSlot} color="#f87171" />)}
          </div>

          {/* パッシブ */}
          <div style={{ background:"#0d0d15", border:"1px solid #3a3a55", borderRadius:8, padding:12 }}>
            <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:2, marginBottom:8 }}>パッシブ書（最大6・ドラッグでもセット可）</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
              {pasSlots.map((uid,i)=>{
                const owned = uid ? bookByUid(uid) : null;
                const book = owned ? SKILL_BOOKS[owned.id] : null;
                const rc = owned ? BOOK_RARITY_COLOR[owned.rarity] : "#3a3a55";
                const dz = `passive-${i}`;
                const isHover = dropTarget === dz;
                return (
                  <div key={i} data-drop={dz} style={{ background:isHover?"#1a2a1a":book?`${rc}22`:"#0a0a14", border:`1px solid ${isHover?"#4ade80":book?rc:"#3a3a55"}`, borderRadius:4, padding:"4px 8px", fontSize:10, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:LABEL, fontWeight:700 }}>P{i+1}</span>
                    {book ? (<>
                      <span>{book.icon}</span>
                      <span style={{ color:rc }}>{book.name}</span>
                      <button onClick={()=>setPassiveSlot(i,null)} style={{ fontSize:10, background:"transparent", border:"none", color:DIM, cursor:"pointer" }}>×</button>
                    </>) : <span style={{ color:DIM }}>空き</span>}
                  </div>
                );
              })}
            </div>
            {ownedPassive.length === 0
              ? <div style={{ fontSize:10, color:FAINT, textAlign:"center", padding:8 }}>パッシブ書を持っていない</div>
              : ownedPassive.map(owned => <BookRow key={owned.uid} owned={owned} slots={pasSlots} setSlot={setPassiveSlot} color="#a78bfa" />)}
          </div>
        </div>
      )}

      {dragVisual && (
        <div style={{ position:"fixed", left:dragVisual.x-22, top:dragVisual.y-22, width:44, height:44, background:"rgba(18,18,32,0.95)", border:"2px solid #a78bfa", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, pointerEvents:"none", zIndex:1000, boxShadow:"0 4px 16px rgba(0,0,0,0.6)" }}>
          {dragVisual.icon}
        </div>
      )}
    </div>
  );
}
