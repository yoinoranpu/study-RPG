import { useState, useEffect, useRef } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { calcPlayerStats } from "../systems/playerStats";
import { RARITY_COLOR, RARITY_LABEL, INNATE, getItemStats, getSellPrice } from "../data/items";
import { SKILL_BOOKS, getBookSellPrice, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL } from "../data/skills";
import { TRIBE_MAT } from "../systems/events";
import CharacterLayoutEditor from "../components/CharacterLayoutEditor";
import { CHARACTER_LAYOUT_DEFAULT } from "../data/characterLayout";

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
  const [charLayout, setCharLayout] = useState(CHARACTER_LAYOUT_DEFAULT);
  const [showCharLayoutEditor, setShowCharLayoutEditor] = useState(false);
  const DEBUG = import.meta.env.DEV;
  const player = usePlayerStore();
  const { updatePlayer, itemBox, skillBooks, activeSkillSlots, passiveSkillSlots, skillMode } = usePlayerStore();
  const stats = calcPlayerStats(player);
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

  // アイテム/装備/消耗品スロット共通の詳細パネル。アイコンを大きめにしつつ
  // maxHeightで縦の圧迫を抑え、はみ出す分は中身だけスクロールさせる。
  function ItemDetailFrame({ item, subtitle, onClose, footer, children }) {
    const rc = RARITY_COLOR[item.rarity] || "#888";
    return (
      <div className="rpg-panel" style={{ position:"absolute", bottom:8, left:8, right:8, borderRadius:6, padding:"10px 12px", zIndex:10, maxHeight:"58%", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexShrink:0 }}>
          <div style={{ width:60, height:60, position:"relative", flexShrink:0 }}>
            <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", background:rc, opacity:0.5, filter:"blur(7px)" }} />
            <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
            <div style={{ position:"absolute", inset:"18%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.image ? <img src={item.image} alt="" style={{ width:"82%", height:"82%", objectFit:"contain", filter:item.tint||"none" }} /> : <span style={{ fontSize:26 }}>{item.icon}</span>}
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#e8e0d0", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {item.name}{item.upgradeLevel>0 && <span style={{ color:"#fbbf24" }}> +{item.upgradeLevel}</span>}
            </div>
            <div style={{ fontSize:12, color:rc, letterSpacing:1 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:DIM, fontSize:18, cursor:"pointer", flexShrink:0, padding:4 }}>×</button>
        </div>
        <div style={{ overflowY:"auto", flex:1, minHeight:0 }}>
          {children}
        </div>
        {footer && <div style={{ display:"flex", gap:8, marginTop:8, flexShrink:0 }}>{footer}</div>}
      </div>
    );
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
        style={{ touchAction:"none", cursor:"grab", userSelect:"none", WebkitUserSelect:"none", WebkitTouchCallout:"none", display:"flex", alignItems:"center", gap:8, padding:"7px 9px", background:equipped?`${color}30`:"rgba(15,10,5,0.6)", borderLeft:`3px solid ${rc}`, borderRadius:5, marginBottom:4 }}>
        {book.image ? <img src={book.image} alt="" style={{ width:22, height:22, objectFit:"contain", flexShrink:0 }} /> : <span style={{ fontSize:19 }}>{book.icon}</span>}
        <div style={{ flex:1, minWidth:0 }}>
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

  // アクティブ/パッシブ書スロット共通の枠付きセル(item_slot_frame.pngを流用)
  function BookSlotCell({ i, uid, dz, setSlot }) {
    const owned = uid ? bookByUid(uid) : null;
    const book = owned ? SKILL_BOOKS[owned.id] : null;
    const rc = owned ? BOOK_RARITY_COLOR[owned.rarity] : "#3a3a55";
    const isHover = dropTarget === dz;
    const glowColor = isHover ? "#4ade80" : book ? rc : null;
    const selKey = `bslot_${dz}`;
    const isSel = sel === selKey;
    return (
      <div data-drop={dz} onClick={() => book && setSel(isSel?null:selKey)}
        className={`slot-cell${isSel?" slot-selected":""}`}
        style={{ position:"relative", aspectRatio:"1", cursor:book?"pointer":"default" }}>
        {glowColor && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:glowColor, opacity:isHover?0.6:0.4, filter:"blur(6px)" }} />}
        <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
        <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {book ? (book.image ? <img src={book.image} alt="" style={{ width:"78%", height:"78%", objectFit:"contain" }} /> : <span style={{ fontSize:20 }}>{book.icon}</span>) : <span style={{ fontSize:9, color:FAINT }}>{dz.startsWith("active")?"S":"P"}{i+1}</span>}
        </div>
        {book && (
          <button onClick={(e)=>{ e.stopPropagation(); setSlot(i,null); }} style={{ position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:"50%", background:"#1a0a0a", border:"1px solid #f87171", color:"#f87171", fontSize:9, lineHeight:"14px", padding:0, cursor:"pointer", zIndex:1 }}>×</button>
        )}
        {book && (
          <div style={{ position:"absolute", bottom:"6%", left:"10%", right:"10%", fontSize:8, color:rc, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", background:"rgba(0,0,0,0.65)", borderRadius:2, zIndex:1 }}>{book.name}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace", overflow:"hidden", position:"relative" }}>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0, background:"linear-gradient(180deg, rgba(8,5,2,0.5), rgba(8,5,2,0.65)), url(/assets/images/tab_bar_bg.jpg)", backgroundSize:"cover", backgroundPosition:"center" }}>
        {[{id:"equip",img:"/assets/images/tab_icon_equip.png",label:"装備"},{id:"skill",img:"/assets/images/tab_icon_skill.png",label:"スキル"}].map(t=>{
          const isSel = tab===t.id;
          return (
            <button key={t.id} onClick={()=>{setTab(t.id);setSel(null);}} className="rpg-heading" style={{ flex:1, padding:"6px 0", background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <img src={t.img} alt="" className={`slot-cell${isSel?" slot-selected":""}`} style={{ width:22, height:22, objectFit:"contain", opacity:isSel?1:0.65 }} />
              <span style={{ color:isSel?"#e0b555":DIM, fontSize:10 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {DEBUG && tab === "equip" && (
        <button onClick={() => setShowCharLayoutEditor(true)} style={{ position:"fixed", bottom:16, right:16, zIndex:50, padding:"8px 12px", background:"#1a0a1a", border:"1px solid #a78bfa44", borderRadius:6, cursor:"pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace" }}>
          DEBUG: 配置エディタ
        </button>
      )}

      {tab === "equip" && (
        <>
          <div style={{ position:"relative", flexShrink:0, height:charLayout.roomHeight, overflow:"hidden" }}>
            <img src="/assets/images/character_room.jpg" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:`center ${charLayout.roomPanY}%`, display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"rgba(10,6,3,0.4)" }} />
            <div className="rpg-heading" style={{ position:"absolute", top:8, left:12, fontSize:10, color:"#f0d9a0", letterSpacing:2, textShadow:"0 2px 4px rgba(0,0,0,0.9)" }}>⚔ CHARACTER</div>

            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:isMobile?"column":"row", gap:charLayout.panelGap, padding:`${charLayout.contentPaddingTop}px 10px 10px` }}>
              <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:8, minWidth:isMobile?"auto":168 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {EQUIP_SLOTS.map(({key,label,icon,drop})=>{
                    const eq = player[key];
                    const rc = eq ? RARITY_COLOR[eq.rarity]||"#888" : "#333350";
                    const isHover = dropTarget === drop;
                    const isSel = sel === `slot_${key}`;
                    const glowColor = isHover ? "#4ade80" : eq ? rc : null;
                    const itemPos = charLayout.equipItemPos?.[key] || { x:0, y:0 };
                    return (
                      <div key={key} data-drop={drop} onClick={() => eq && setSel(sel===`slot_${key}`?null:`slot_${key}`)} title={label}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, position:"relative", left:itemPos.x, top:itemPos.y }}>
                        <div className={`slot-cell${isSel?" slot-selected":""}`} style={{ width:charLayout.equipSlotSize, height:charLayout.equipSlotSize, position:"relative", cursor:eq?"pointer":"default" }}>
                          {glowColor && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:glowColor, opacity:0.6, filter:"blur(8px)" }} />}
                          <img src="/assets/images/equip_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                          <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                            {eq ? (eq.image ? <img src={eq.image} alt="" style={{ width:"88%", height:"88%", objectFit:"contain", filter:eq.tint||"none" }} /> : eq.icon) : <span style={{ fontSize:12, color:FAINT }}>{icon}</span>}
                          </div>
                          {eq?.upgradeLevel > 0 && <div style={{ position:"absolute", top:-2, right:0, fontSize:10, color:"#fbbf24", fontWeight:700, textShadow:"0 1px 2px #000" }}>+{eq.upgradeLevel}</div>}
                        </div>
                        <div style={{ fontSize:9, color:eq?rc:FAINT, maxWidth:charLayout.equipSlotSize, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center" }}>
                          {eq ? eq.name : label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  {(player.specialSlots||[null,null,null]).map((slot,i)=>{
                    const isHover = dropTarget === "special";
                    const isSel = sel === `cslot_${i}`;
                    const glowColor = isHover ? "#4ade80" : slot ? "#fbbf24" : null;
                    const itemPos = charLayout.specialItemPos?.[i] || { x:0, y:0 };
                    return (
                      <div key={i} data-drop="special" onClick={() => slot && setSel(sel===`cslot_${i}`?null:`cslot_${i}`)}
                        className={`slot-cell${isSel?" slot-selected":""}`}
                        style={{ width:charLayout.specialSlotSize, height:charLayout.specialSlotSize, position:"relative", left:itemPos.x, top:itemPos.y, cursor:slot?"pointer":"default" }}>
                        {glowColor && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:glowColor, opacity:0.5, filter:"blur(6px)" }} />}
                        <img src="/assets/images/equip_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                        <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                          {slot ? (slot.image ? <img src={slot.image} alt="" style={{ width:"85%", height:"85%", objectFit:"contain", filter:slot.tint||"none" }} /> : slot.icon) : <span style={{ fontSize:9, color:DIM }}>S{i+1}</span>}
                        </div>
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

              <div style={{ flex:1, display:"flex", justifyContent:"flex-end" }}>
              <div style={{ width:isMobile?"auto":charLayout.statsPanelWidth, maxWidth:charLayout.statsPanelWidth+30, display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, alignContent:"start", justifyItems:"end" }}>
                {[
                  {label:"ATK",  jp:"攻撃", val:stats.atk,        color:"#f87171"},
                  {label:"MAG",  jp:"魔力", val:stats.mag,        color:"#a78bfa"},
                  {label:"DEF",  jp:"防御", val:stats.def,        color:"#60a5fa"},
                  {label:"MDEF", jp:"魔防", val:stats.mdef,       color:"#38bdf8"},
                  {label:"EVA",  jp:"回避", val:`${stats.eva}%`,  color:"#34d399"},
                  {label:"CRIT", jp:"会心", val:`${stats.crit}%`, color:"#fbbf24"},
                ].map(({label,jp,val,color})=>{
                  const itemPos = charLayout.statItemPos?.[label] || { x:0, y:0 };
                  return (
                    <div key={label} style={{ width:"100%", aspectRatio:"1183/549", position:"relative", left:itemPos.x, top:itemPos.y }}>
                      <img src="/assets/images/stat_plate_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                      <div style={{ position:"absolute", inset:"26% 13%", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:"clamp(8px,2.6vw,13px)", color:LABEL, fontWeight:700 }}>{jp}</span>
                        <span style={{ fontSize:"clamp(9px,2.9vw,15px)", color, fontWeight:700 }}>{val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"8px 10px", background:"linear-gradient(rgba(8,5,2,0.45),rgba(8,5,2,0.45)), url(/assets/images/item_box_bg.jpg)", backgroundSize:"cover", backgroundPosition:"center" }}>
            <div style={{ fontSize:10, color:"#d8cdb8", letterSpacing:2, marginBottom:6, textShadow:"0 1px 3px rgba(0,0,0,0.9)" }}>ITEM BOX {(itemBox||[]).length}/30 <span style={{ color:"#a89a80" }}>（ドラッグでも装備可）</span></div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?4:6},1fr)`, gap:4 }}>
              {(itemBox||[]).map(it=>{
                const rc = RARITY_COLOR[it.rarity]||"#888";
                const isSel = sel===it.uid;
                const isEq = equippedUids.has(it.uid);
                return (
                  <div key={it.uid}
                    onPointerDown={(e) => beginDrag(e, { kind:"item", itemType:it.type, item:it, icon:it.icon, name:it.name })}
                    onClick={()=>setSel(isSel?null:it.uid)}
                    className={`slot-cell${isSel?" slot-selected":""}`}
                    style={{ touchAction:"none", cursor:"grab", userSelect:"none", WebkitUserSelect:"none", WebkitTouchCallout:"none", aspectRatio:"1", position:"relative", opacity:isEq?0.5:1 }}>
                    <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:rc, opacity:0.4, filter:"blur(6px)" }} />
                    <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                    <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {it.image ? (
                        <img src={it.image} alt="" style={{ width:"78%", height:"78%", objectFit:"contain", filter:it.tint||"none" }} />
                      ) : (
                        <div style={{ fontSize:18, lineHeight:1 }}>{it.icon}</div>
                      )}
                    </div>
                    {it.upgradeLevel>0 && <div style={{ position:"absolute", top:1, right:3, fontSize:9, color:"#fbbf24", fontWeight:700, textShadow:"0 1px 2px #000", zIndex:1 }}>+{it.upgradeLevel}</div>}
                    {isEq && <div style={{ position:"absolute", bottom:"11%", left:"14%", right:"14%", fontSize:8, color:"#4ade80", textAlign:"center", background:"rgba(0,0,0,0.8)", borderRadius:2, zIndex:1 }}>装備中</div>}
                    <div style={{ position:"absolute", bottom:isEq?"20%":"9%", left:"20%", right:"20%", height:3, background:rc, borderRadius:1, zIndex:1 }} />
                  </div>
                );
              })}
              {Array.from({length:Math.max(0,30-(itemBox||[]).length)}).map((_,i)=>(
                <div key={`e${i}`} style={{ aspectRatio:"1", position:"relative", opacity:0.5 }}>
                  <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                </div>
              ))}
            </div>
          </div>

          {sel && !sel.startsWith("slot_") && !sel.startsWith("cslot_") && selItem && (
            <ItemDetailFrame item={selItem} subtitle={RARITY_LABEL[selItem.rarity]||""} onClose={()=>setSel(null)}
              footer={<>
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
              </>}>
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
            </ItemDetailFrame>
          )}

          {sel && sel.startsWith("slot_") && (()=>{
            const key = sel.replace("slot_","");
            const eq = player[key];
            if (!eq) return null;
            return (
              <ItemDetailFrame item={eq} subtitle={RARITY_LABEL[eq.rarity]||""} onClose={()=>setSel(null)}
                footer={<button onClick={()=>unequip(key)} style={{ flex:1, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>外す</button>}>
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
              </ItemDetailFrame>
            );
          })()}

          {sel && sel.startsWith("cslot_") && (()=>{
            const i = parseInt(sel.replace("cslot_",""));
            const slot = (player.specialSlots||[])[i];
            if (!slot) return null;
            return (
              <ItemDetailFrame item={slot} subtitle={`消耗品スロット ${i+1}`} onClose={()=>setSel(null)}
                footer={<button onClick={()=>{
                  const slots=[...(player.specialSlots||[null,null,null])];
                  slots[i]=null;
                  updatePlayer({ specialSlots:slots });
                  setSel(null);
                }} style={{ flex:1, padding:"8px 0", background:"#1a0a0a", border:"1px solid #f87171", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:10, fontFamily:"monospace" }}>スロットから外す</button>}>
                <div style={{ fontSize:10, color:DIM }}>{slot.desc}</div>
              </ItemDetailFrame>
            );
          })()}
        </>
      )}

      {tab === "skill" && (
        <div style={{ flex:1, overflowY:"auto", padding:12, background:"linear-gradient(rgba(8,5,2,0.55),rgba(8,5,2,0.72)), url(/assets/images/skill_room_bg.jpg)", backgroundSize:"cover", backgroundPosition:"center" }}>
          {/* アクティブ */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, color:"#fb9a9a", letterSpacing:2, marginBottom:8, paddingBottom:6, borderBottom:"1px solid rgba(251,154,154,0.3)", textShadow:"0 1px 3px rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span>アクティブ書（最大4・ドラッグでもセット可）</span>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={() => updatePlayer({ skillMode:"order" })}
                  style={{ padding:"3px 8px", background:(skillMode||"order")==="order"?"#1a0a0a":"transparent", border:`1px solid ${(skillMode||"order")==="order"?"#f87171":"#3a3a55"}`, borderRadius:3, cursor:"pointer", color:(skillMode||"order")==="order"?"#f87171":DIM, fontSize:10, fontFamily:"monospace" }}>🔢 順番</button>
                <button onClick={() => updatePlayer({ skillMode:"random" })}
                  style={{ padding:"3px 8px", background:skillMode==="random"?"#1a0a0a":"transparent", border:`1px solid ${skillMode==="random"?"#f87171":"#3a3a55"}`, borderRadius:3, cursor:"pointer", color:skillMode==="random"?"#f87171":DIM, fontSize:10, fontFamily:"monospace" }}>🎲 ランダム</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:10 }}>
              {actSlots.map((uid,i)=> <BookSlotCell key={i} i={i} uid={uid} dz={`active-${i}`} setSlot={setActiveSlot} />)}
            </div>
            {ownedActive.length === 0
              ? <div style={{ fontSize:10, color:FAINT, textAlign:"center", padding:8 }}>アクティブ書を持っていない</div>
              : ownedActive.map(owned => <BookRow key={owned.uid} owned={owned} slots={actSlots} setSlot={setActiveSlot} color="#f87171" />)}
          </div>

          {/* パッシブ */}
          <div>
            <div style={{ fontSize:10, color:"#c9b6fb", letterSpacing:2, marginBottom:8, paddingBottom:6, borderBottom:"1px solid rgba(201,182,251,0.3)", textShadow:"0 1px 3px rgba(0,0,0,0.9)" }}>パッシブ書（最大6・ドラッグでもセット可）</div>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(6,1fr)", gap:8, marginBottom:10 }}>
              {pasSlots.map((uid,i)=> <BookSlotCell key={i} i={i} uid={uid} dz={`passive-${i}`} setSlot={setPassiveSlot} />)}
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

      {showCharLayoutEditor && (
        <CharacterLayoutEditor
          layout={charLayout}
          onChangeField={(path, value) => setCharLayout(prev => ({ ...prev, [path]: value }))}
          onChangeItem={(group, key, axis, value) => setCharLayout(prev => {
            if (group === "specialItemPos") {
              const arr = [...prev.specialItemPos];
              arr[key] = { ...arr[key], [axis]: value };
              return { ...prev, specialItemPos: arr };
            }
            return { ...prev, [group]: { ...prev[group], [key]: { ...(prev[group]?.[key]||{x:0,y:0}), [axis]: value } } };
          })}
          onReset={() => setCharLayout(CHARACTER_LAYOUT_DEFAULT)}
          onClose={() => setShowCharLayoutEditor(false)}
        />
      )}
    </div>
  );
}
