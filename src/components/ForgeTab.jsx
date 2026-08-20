import { useState, useEffect } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { RARITY_COLOR, RARITY_LABEL, getItemStats, INNATE, SYNTHESIS_COST, getAbilitySlots } from "../data/items";
import { SKILL_BOOKS, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL, BOOK_SYNTHESIS_COST, nextBookRarity, makeBook, mergeBookDex } from "../data/skills";
import { makeInitialStats } from "../systems/achievements";
import useFlashMessage from "../hooks/useFlashMessage";

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

const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

// ─── 選択グリッド共通部品：レアリティ別グループ化＋検索＋拡大カード ───
function ItemPicker({ items, selectedUid, matUid, onSelect, getRarity, getColor, getRarityLabel, getIcon, getImage, getName, emptyText, isMaxed }) {
  const groups = {};
  items.forEach(it => { const r = getRarity(it); (groups[r] = groups[r] || []).push(it); });
  const dual = matUid !== undefined; // 合成/スキル書タブ(ベース+素材の2択)かどうか

  return (
    <div>
      {items.length === 0 && <div style={{ fontSize:10, color:FAINT, padding:8, textAlign:"center" }}>{emptyText}</div>}
      {RARITY_ORDER.filter(r => groups[r]?.length).map(r => (
        <div key={r} style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, color:getColor({ rarity:r }), letterSpacing:1, marginBottom:4, fontWeight:700 }}>
            {getRarityLabel(r)} ({groups[r].length})
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {groups[r].map(it => {
              const rc = getColor(it);
              const isBase = selectedUid === it.uid;
              const isMat = matUid === it.uid;
              const isSel = isBase || isMat;
              const maxed = isMaxed?.(it);
              const img = getImage ? getImage(it) : it.image;
              return (
                <div key={it.uid} onClick={() => onSelect(it.uid)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", opacity:maxed&&!isSel?0.5:1 }}>
                  <div className={`slot-cell${isSel?" slot-selected":""}`} style={{ width:"100%", aspectRatio:"1", position:"relative" }}>
                    {!(maxed&&!isSel) && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:rc, opacity:0.4, filter:"blur(6px)" }} />}
                    <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                    <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {img ? (
                        <img src={img} alt="" style={{ width:"78%", height:"78%", objectFit:"contain", filter:`${it.tint||""} ${maxed&&!isSel?"grayscale(0.6)":""}`.trim()||"none" }} />
                      ) : (
                        <div style={{ fontSize:20, filter:maxed&&!isSel?"grayscale(0.6)":"none" }}>{getIcon(it)}</div>
                      )}
                    </div>
                    {dual && isSel && (
                      <div style={{ position:"absolute", top:1, left:1, fontSize:8, color:"#0a0a0a", fontWeight:700, background:isBase?"#fbbf24":"#4ade80", borderRadius:"50%", width:13, height:13, lineHeight:"13px", textAlign:"center", zIndex:1 }}>{isBase?"1":"2"}</div>
                    )}
                    {maxed && !isSel && <div style={{ position:"absolute", top:1, right:2, fontSize:7, color:"#fbbf24", fontWeight:700, background:"rgba(0,0,0,0.75)", borderRadius:2, padding:"1px 3px", zIndex:1 }}>MAX</div>}
                  </div>
                  <div style={{ fontSize:9, color:(maxed&&!isSel)?DIM:"#e8e0d0", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%" }}>{getName(it).slice(0,7)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 合成プレビュー共通部品：⬜+⬜=>⬜ を吹き出し内にコンパクト表示 ───
function SynthBox({ icon, image, tint, color, empty, size = 44, onClick }) {
  return (
    <div onClick={!empty ? onClick : undefined} style={{ width:size, height:size, position:"relative", flexShrink:0, cursor:!empty&&onClick?"pointer":"default" }}>
      {!empty && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:color, opacity:0.45, filter:"blur(6px)" }} />}
      <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:empty?0.5:1 }} />
      <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.42 }}>
        {!empty && (image ? <img src={image} alt="" style={{ width:"100%", height:"100%", objectFit:"contain", filter:tint||"none" }} /> : icon)}
      </div>
      {!empty && onClick && <div style={{ position:"absolute", top:-3, right:-3, width:14, height:14, borderRadius:"50%", background:"#1a0a0a", border:"1px solid #f87171", color:"#f87171", fontSize:9, lineHeight:"12px", textAlign:"center", zIndex:1 }}>×</div>}
    </div>
  );
}

// 店主の吹き出し内に収めるコンパクト版。外枠(.rpg-panel)は吹き出し自体が兼ねるので持たない。
function SynthPreview({ base, mat, next, cost, canAfford, onSynth, getIcon, getImage, getTint, getName, getColor, getRarityLabel, hint, onClickBase, onClickMat }) {
  const baseColor = base ? getColor(base) : "#3a3a55";
  const matColor  = mat  ? getColor(mat)  : "#3a3a55";
  const nextColor = next ? getColor({ rarity:next }) : "#3a3a55";
  const ready = base && mat && next;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <SynthBox icon={base && getIcon(base)} image={base && getImage?.(base)} tint={base && getTint?.(base)} color={baseColor} empty={!base} onClick={onClickBase} />
        <span style={{ fontSize:13, color:DIM, fontWeight:700 }}>+</span>
        <SynthBox icon={mat && getIcon(mat)} image={mat && getImage?.(mat)} tint={mat && getTint?.(mat)} color={matColor} empty={!mat} onClick={onClickMat} />
        <span style={{ fontSize:13, color:DIM, fontWeight:700 }}>⇒</span>
        <SynthBox icon={base && getIcon(base)} image={base && getImage?.(base)} tint={base && getTint?.(base)} color={nextColor} empty={!ready} />
        <div style={{ flex:1, minWidth:0, marginLeft:4 }}>
          <div style={{ fontSize:11, color:"#e8d8c0" }}>
            {base
              ? mat
                ? next
                  ? <span>{getName(base)} <span style={{ color:nextColor, fontWeight:700 }}>→ {getRarityLabel(next)}</span></span>
                  : "これ以上合成できません（最大レアリティ）"
                : "② 素材を選んでください"
              : hint}
          </div>
          {ready && <div style={{ fontSize:10, color:"#fbbf24", marginTop:2 }}>コスト: {cost?.toLocaleString()}G</div>}
        </div>
        {ready && (
          <button onClick={onSynth} disabled={!canAfford}
            style={{ padding:"8px 14px", minHeight:"44px", background:"#0a001a", border:`1px solid ${nextColor}`, borderRadius:4, cursor:canAfford?"pointer":"default", color:canAfford?nextColor:FAINT, fontSize:11, fontFamily:"monospace", fontWeight:700, flexShrink:0 }}>
            ✨ 合成
          </button>
        )}
      </div>
    </div>
  );
}

export default function ForgeTab() {
  const [tab, setTab] = useState("upgrade");
  const [sel, setSel] = useState(null);
  const [matSel, setMatSel] = useState(null);
  const [msg, flash] = useFlashMessage(3000);
  const w = window.innerWidth;
  const [isMobile, setIsMobile] = useState(w < 768);
  const [isTablet, setIsTablet] = useState(w >= 768 && w < 1024);
  const { itemBox, gold, materials, updatePlayer, skillBooks, activeSkillSlots, passiveSkillSlots, skillBookDex, stats } = usePlayerStore();

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const upgradeItem = itemBox.find(it => it.uid === sel);
  const matOpts = upgradeItem ? MAT_UP[upgradeItem.type] || [] : [];
  const cost = upgradeItem ? upgradeCost(upgradeItem.upgradeLevel) : 0;
  const forgeStone = itemBox.find(it => it.effect === "forge_up_2");

  function useForgeStone() {
    if (!upgradeItem || !forgeStone) return;
    const newLv = upgradeItem.upgradeLevel + 2;
    const updated = { ...upgradeItem, upgradeLevel: newLv };
    const prevStats = stats || makeInitialStats();
    updatePlayer({
      itemBox: itemBox.filter(x => x.uid !== forgeStone.uid).map(x => x.uid === upgradeItem.uid ? updated : x),
      stats: { ...prevStats, maxUpgradeLevelEver: Math.max(prevStats.maxUpgradeLevelEver||0, newLv) },
    });
    flash(`💠 ${forgeStone.name}を使って+${newLv}に強化！`);
  }

  function upgrade(mo) {
    if (!upgradeItem) return;
    if ((materials[mo.mat] || 0) < 1) { flash("素材が不足！"); return; }
    if (gold < cost) { flash("Gが不足！"); return; }
    const newLv = upgradeItem.upgradeLevel + 1;
    const newB = { ...upgradeItem.bonuses };
    newB[mo.stat] = (newB[mo.stat] || 0) + 1;
    const ms = MILESTONE[upgradeItem.type]?.[newLv];
    let msMsg = "";
    if (ms) { newB[ms.stat] = (newB[ms.stat] || 0) + ms.val; msMsg = ` ✨${ms.label}`; }
    const updated = { ...upgradeItem, upgradeLevel: newLv, bonuses: newB };
    const prevStats = stats || makeInitialStats();
    updatePlayer({
      itemBox: itemBox.map(x => x.uid === upgradeItem.uid ? updated : x),
      gold: gold - cost,
      materials: { ...materials, [mo.mat]: (materials[mo.mat] || 0) - 1 },
      stats: { ...prevStats, maxUpgradeLevelEver: Math.max(prevStats.maxUpgradeLevelEver||0, newLv) },
    });
    flash(`+${newLv}に強化！${msMsg}`);
  }

  const baseItem = itemBox.find(it => it.uid === sel);
  const matItem  = itemBox.find(it => it.uid === matSel);
  // 素材は「同じ種類・同じサブタイプ(剣は剣、弓は弓)・同じレアリティ」のみ許可
  // アクセサリーはsubtype自体が無いのでtype一致だけで従来通り（undefined同士は一致する）
  const synthCandidates = baseItem
    ? itemBox.filter(it => it.uid !== baseItem.uid && it.type === baseItem.type && it.subtype === baseItem.subtype && it.rarity === baseItem.rarity)
    : [];
  const next = baseItem ? nextRarity(baseItem.rarity) : null;
  const synthCost = baseItem ? SYNTHESIS_COST[baseItem.rarity] : null;

  // 装備一覧は常に1つのグリッドのまま：1回目のタップがベース、2回目のタップが素材。
  // 同じものを再タップで選択解除、ベースと噛み合わない装備をタップした場合はベースの選び直し扱いにする
  function pickSynth(uid) {
    if (sel === uid) { setSel(null); setMatSel(null); return; }
    if (matSel === uid) { setMatSel(null); return; }
    if (!sel) {
      const it = itemBox.find(i => i.uid === uid);
      if (it && !nextRarity(it.rarity)) { flash("これ以上合成できません"); return; }
      setSel(uid);
      return;
    }
    if (synthCandidates.some(c => c.uid === uid)) { setMatSel(uid); return; }
    const it = itemBox.find(i => i.uid === uid);
    if (it && !nextRarity(it.rarity)) { flash("これ以上合成できません"); return; }
    setSel(uid); setMatSel(null);
  }

  function synthesize() {
    if (!baseItem || !matItem) { flash("ベースと素材を選択して！"); return; }
    if (!next) { flash("これ以上合成できません"); return; }
    if (gold < synthCost.gold) { flash("Gが不足！"); return; }
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
    const prevStats = stats || makeInitialStats();
    updatePlayer({
      itemBox: itemBox.filter(x => x.uid !== matItem.uid).map(x => x.uid === baseItem.uid ? synthesized : x),
      gold: gold - synthCost.gold,
      stats: {
        ...prevStats,
        totalSynthesisCount: (prevStats.totalSynthesisCount||0) + 1,
        flags: {
          ...prevStats.flags,
          hasOwnedMythic: prevStats.flags?.hasOwnedMythic || next === "mythic",
          hasOwnedOrigin: prevStats.flags?.hasOwnedOrigin || next === "origin",
        },
      },
    });
    setSel(null); setMatSel(null);
    flash(`✨ ${synthesized.name}が${RARITY_LABEL[next]}になった！`, 4000);
  }

  const bookItem = (skillBooks||[]).find(b => b.uid === sel);
  // 素材は「同じ系統(tree)・同じアクティブ/パッシブ区分・同じレアリティ」なら同一IDでなくてもOK
  const bookCandidates = bookItem
    ? (skillBooks||[]).filter(b => {
        if (b.uid === bookItem.uid || b.rarity !== bookItem.rarity) return false;
        const bookDef = SKILL_BOOKS[b.id], baseDef = SKILL_BOOKS[bookItem.id];
        return bookDef && baseDef && bookDef.tree === baseDef.tree && bookDef.type === baseDef.type;
      })
    : [];
  const bookMatItem = (skillBooks||[]).find(b => b.uid === matSel);
  const nextBookR = bookItem ? nextBookRarity(bookItem.rarity) : null;
  const bookSynthCost = bookItem ? BOOK_SYNTHESIS_COST[bookItem.rarity] : null;

  function pickBook(uid) {
    if (sel === uid) { setSel(null); setMatSel(null); return; }
    if (matSel === uid) { setMatSel(null); return; }
    if (!sel) {
      const b = (skillBooks||[]).find(x => x.uid === uid);
      if (b && !nextBookRarity(b.rarity)) { flash("これ以上合成できません"); return; }
      setSel(uid);
      return;
    }
    if (bookCandidates.some(c => c.uid === uid)) { setMatSel(uid); return; }
    const b = (skillBooks||[]).find(x => x.uid === uid);
    if (b && !nextBookRarity(b.rarity)) { flash("これ以上合成できません"); return; }
    setSel(uid); setMatSel(null);
  }

  function synthesizeBook() {
    if (!bookItem || !bookMatItem) { flash("ベースと素材を選択して！"); return; }
    if (!nextBookR) { flash("これ以上合成できません"); return; }
    if (gold < bookSynthCost) { flash("Gが不足！"); return; }
    const newBook = makeBook(bookItem.id, nextBookR);
    const newSkillBooks = (skillBooks||[])
      .filter(b => b.uid !== bookItem.uid && b.uid !== bookMatItem.uid)
      .concat(newBook);
    const replaceSlot = (uid) => uid === bookItem.uid ? newBook.uid : (uid === bookMatItem.uid ? null : uid);
    const prevStats = stats || makeInitialStats();
    updatePlayer({
      skillBooks: newSkillBooks,
      activeSkillSlots: (activeSkillSlots||[]).map(replaceSlot),
      passiveSkillSlots: (passiveSkillSlots||[]).map(replaceSlot),
      skillBookDex: mergeBookDex(skillBookDex, [newBook]),
      gold: gold - bookSynthCost,
      stats: { ...prevStats, totalSynthesisCount: (prevStats.totalSynthesisCount||0) + 1 },
    });
    setSel(null); setMatSel(null);
    flash(`✨ ${SKILL_BOOKS[bookItem.id].name}が${BOOK_RARITY_LABEL[nextBookR]}になった！`, 4000);
  }

  const bubbleText = () => {
    if (tab === "upgrade") return upgradeItem ? `${upgradeItem.name}を鍛え直すか` : "武具を持ってきな、鍛え直してやろう";
    if (tab === "synth") return baseItem ? `${baseItem.name}を合成するか` : "同じ装備を2つ持っておいで";
    if (tab === "book") return bookItem ? `${SKILL_BOOKS[bookItem.id]?.name}を鍛えるか` : "スキル書も鍛えられるぞ";
    return "いらっしゃい！";
  };

  return (
    <div style={{ position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      {/* 背景：画像は横幅いっぱいに自然なアスペクト比で表示（モバイルでは高さ制限） */}
      <div style={{ position:"absolute", inset:0, background:"#08080f" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, maxHeight:isMobile?"100px":isTablet?"140px":"auto", overflow:"hidden" }}>
        <img src="/assets/images/forge-banner.png" alt="" style={{ width:"100%", height:"auto", display:"block" }} />
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(180deg, rgba(5,5,8,0.08) 0%, rgba(5,5,8,0.15) 45%, rgba(5,5,8,0.75) 68%, #08080f 88%, #08080f 100%)",
        }} />
      </div>

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%" }}>
        {/* ステージ：鍛冶屋(大)＋吹き出し */}
        <div style={{ flexShrink:0, display:"flex", alignItems:"flex-start", padding:"14px 10px 0" }}>
          <div style={{
            width:168, height:208, flexShrink:0,
            backgroundImage:`url("/assets/images/blacksmith.png")`,
            backgroundSize:"cover", backgroundPosition:"center 20%", backgroundRepeat:"no-repeat",
            WebkitMaskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
            maskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
          }} />
          <div style={{ position:"relative", flex:1, minWidth:0, marginLeft:2, marginBottom:16 }}>
            <div className="rpg-panel" style={{ borderRadius:6, padding:"12px 14px" }}>
              {tab === "upgrade" && upgradeItem ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <SynthBox icon={upgradeItem.icon} image={upgradeItem.image} tint={upgradeItem.tint} color={RARITY_COLOR[upgradeItem.rarity]||"#888"} empty={false} size={40} onClick={()=>setSel(null)} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#e8d8c0" }}>{upgradeItem.name} <span style={{ color:"#fbbf24" }}>+{upgradeItem.upgradeLevel}</span> <span style={{ fontSize:9, color:RARITY_COLOR[upgradeItem.rarity]||"#888" }}>{RARITY_LABEL[upgradeItem.rarity]}</span></div>
                      <div style={{ fontSize:10, color:DIM, marginTop:1 }}>強化コスト <span style={{ color:"#fbbf24", fontWeight:700 }}>{cost}G</span></div>
                    </div>
                  </div>

                  {/* 現在のステータス */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                    {Object.entries(getItemStats(upgradeItem)).filter(([,v])=>v>0).map(([k,v])=>(
                      <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"2px 6px", borderRadius:3 }}>{k.toUpperCase()} {v}</span>
                    ))}
                  </div>

                  {/* 固有能力・ランダム能力 */}
                  {upgradeItem.innate && upgradeItem.innate !== "none" && INNATE[upgradeItem.innate] && (
                    <div style={{ marginTop:6 }}>
                      <span style={{ fontSize:10, color:"#fb923c" }}>◆ {INNATE[upgradeItem.innate].label}</span>
                      <span style={{ fontSize:9, color:DIM, marginLeft:6 }}>{INNATE[upgradeItem.innate].desc}</span>
                    </div>
                  )}
                  {(upgradeItem.abilities||[]).map((ab,i)=>(
                    <div key={i} style={{ fontSize:10, color:"#a78bfa", marginTop:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                  ))}

                  {/* 節目ボーナス */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                    {Object.entries(MILESTONE[upgradeItem.type]||{}).map(([lv,b])=>(
                      <span key={lv} style={{ fontSize:9, color:upgradeItem.upgradeLevel>=(+lv)?"#fbbf24":FAINT, background:"#080810", padding:"2px 6px", borderRadius:3 }}>
                        +{lv} {b.label}{upgradeItem.upgradeLevel>=(+lv)&&" ✓"}
                      </span>
                    ))}
                  </div>

                  {/* 強化アクション */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid rgba(251,191,36,0.2)" }}>
                    {matOpts.map(mo => {
                      const have = materials?.[mo.mat] || 0;
                      const can = have >= 1 && gold >= cost;
                      return (
                        <button key={mo.mat} onClick={() => upgrade(mo)} disabled={!can}
                          style={{ padding:"5px 10px", minHeight:36, background:can?"#1a1000":"#0a0a0a", border:`1px solid ${can?"#fbbf24":"#3a3a3a"}`, borderRadius:4, cursor:can?"pointer":"default", color:can?"#fbbf24":FAINT, fontSize:10, fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1.4 }}>
                          <span>{mo.label}</span>
                          <span style={{ fontSize:9, color:have>=1?"#fb923c":FAINT }}>{mo.mat}×{have}</span>
                        </button>
                      );
                    })}
                    {forgeStone && (
                      <button onClick={useForgeStone}
                        style={{ padding:"5px 10px", minHeight:36, background:"#140a2a", border:"1px solid #a78bfa", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1.4 }}>
                        <span>💠 秘石で+2</span>
                        <span style={{ fontSize:9 }}>無料</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : tab === "synth" && baseItem ? (
                <SynthPreview
                  base={baseItem} mat={matItem} next={next}
                  cost={synthCost?.gold} canAfford={gold >= (synthCost?.gold||0)} onSynth={synthesize}
                  getIcon={it=>it.icon} getImage={it=>it.image} getTint={it=>it.tint} getName={it=>it.name} getColor={it=>RARITY_COLOR[it.rarity]||"#888"} getRarityLabel={r=>RARITY_LABEL[r]||r}
                  onClickBase={()=>{ setSel(null); setMatSel(null); }} onClickMat={()=>setMatSel(null)}
                  hint="合成元の装備をタップしてください"
                />
              ) : tab === "book" && bookItem ? (
                <SynthPreview
                  base={bookItem} mat={bookMatItem} next={nextBookR}
                  cost={bookSynthCost} canAfford={gold >= (bookSynthCost||0)} onSynth={synthesizeBook}
                  getIcon={b=>SKILL_BOOKS[b.id]?.icon} getImage={b=>SKILL_BOOKS[b.id]?.image} getName={b=>SKILL_BOOKS[b.id]?.name||""} getColor={b=>BOOK_RARITY_COLOR[b.rarity]||"#888"} getRarityLabel={r=>BOOK_RARITY_LABEL[r]||r}
                  onClickBase={()=>{ setSel(null); setMatSel(null); }} onClickMat={()=>setMatSel(null)}
                  hint="合成元のスキル書をタップしてください"
                />
              ) : (
                <div style={{ fontSize:13, color:"#e8d8c0" }}>{bubbleText()}</div>
              )}
              <div style={{ fontSize:11, color:DIM, marginTop:6 }}>所持G: {gold.toLocaleString()}</div>
              {msg && <div style={{ fontSize:11, color:"#4ade80", marginTop:4 }}>{msg}</div>}
            </div>
          </div>
        </div>

        <div style={{ display:"flex", borderTop:"1px solid #1a1a2a", borderBottom:"1px solid #1a1a2a", flexShrink:0, marginTop:14, background:"linear-gradient(180deg, rgba(8,5,2,0.5), rgba(8,5,2,0.65)), url(/assets/images/tab_bar_bg.jpg)", backgroundSize:"cover", backgroundPosition:"center" }}>
          {[{id:"upgrade",img:"/assets/images/tab_icon_upgrade.png",label:"強化"},{id:"synth",img:"/assets/images/tab_icon_synth.png",label:"合成"},{id:"book",img:"/assets/images/tab_icon_skillbook.png",label:"スキル書"}].map(t => {
            const isSel = tab===t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSel(null); setMatSel(null); }}
                style={{ flex:1, padding:"8px 4px", minHeight:"44px", background:"transparent", border:"none", cursor:"pointer", fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
                <img src={t.img} alt="" className={`slot-cell${isSel?" slot-selected":""}`} style={{ width:22, height:22, objectFit:"contain", opacity:isSel?1:0.65 }} />
                <span style={{ color:isSel?"#fb923c":DIM, fontSize:10 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:10, background:"linear-gradient(rgba(8,5,2,0.55),rgba(8,5,2,0.55)), url(/assets/images/forge_workshop_bg.jpg)", backgroundSize:"cover", backgroundPosition:"center" }}>

        {/* 強化タブ：詳細・強化アクションはすべて上の吹き出しに集約(合成/スキル書タブと統一) */}
        {tab === "upgrade" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <ItemPicker
              items={itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type))}
              selectedUid={sel}
              onSelect={(uid)=>setSel(prev=>prev===uid?null:uid)}
              getRarity={it=>it.rarity}
              getColor={it=>RARITY_COLOR[it.rarity]||"#888"}
              getRarityLabel={r=>RARITY_LABEL[r]||r}
              getIcon={it=>it.icon}
              getName={it=>it.name}
              emptyText="強化できる装備がない"
            />

            <div style={{ padding:"6px 2px", borderTop:"1px solid rgba(251,146,60,0.25)" }}>
              <div style={{ fontSize:10, color:"#fb923c", letterSpacing:2, marginBottom:6, marginTop:4 }}>所持素材</div>
              {Object.keys(materials||{}).length === 0
                ? <div style={{ fontSize:10, color:FAINT }}>素材なし</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.entries(materials).map(([name,cnt])=>(
                      <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"4px 8px", fontSize:10, color:"#fb923c" }}>{name}×{cnt}</div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* 合成タブ：1つのグリッドのまま。1回目のタップ=合成元、2回目のタップ=素材(同じものを再タップで解除、吹き出しのアイコンをタップでも解除できます) */}
        {tab === "synth" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ position:"sticky", top:-10, zIndex:2, background:"#080810"}}>
              <div style={{ fontSize:10, color:DIM, marginBottom:8 }}>同じ種類・同じ形状(剣は剣、弓は弓)・同じレアリティの装備2つで1段階上のレアリティに合成。1つ目のタップが合成元、2つ目が素材(プレビューは上の吹き出しに表示されます)</div>

              {(matItem?.abilities||[]).length > 0 && (
                <div style={{ fontSize:10, color:"#a78bfa", marginBottom:8 }}>
                  継承: {matItem.abilities[0]?.label}{matItem.abilities[0]?.value}{matItem.abilities[0]?.suffix}
                </div>
              )}
            </div>

            <ItemPicker
              items={itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type))}
              selectedUid={sel}
              matUid={matSel}
              onSelect={pickSynth}
              getRarity={it=>it.rarity}
              getColor={it=>RARITY_COLOR[it.rarity]||"#888"}
              getRarityLabel={r=>RARITY_LABEL[r]||r}
              getIcon={it=>it.icon}
              getImage={it=>it.image}
              getName={it=>it.name}
              isMaxed={it=>!nextRarity(it.rarity)}
              emptyText="合成できる装備がない"
            />
          </div>
        )}

        {/* スキル書合成タブ：合成タブと同じく1つのグリッドのまま1回目=ベース、2回目=素材 */}
        {tab === "book" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ position:"sticky", top:-10, zIndex:2, background:"#080810"}}>
              <div style={{ fontSize:10, color:DIM, marginBottom:8 }}>同じ系統(剣術/魔法など)・同じ区分(アクティブ/パッシブ)・同じレアリティの本2冊で1段階上のレアリティに合成。1つ目のタップがベース、2つ目が素材(プレビューは上の吹き出しに表示されます)</div>
            </div>

            <ItemPicker
              items={skillBooks||[]}
              selectedUid={sel}
              matUid={matSel}
              onSelect={pickBook}
              getRarity={b=>b.rarity}
              getColor={b=>BOOK_RARITY_COLOR[b.rarity]||"#888"}
              getRarityLabel={r=>BOOK_RARITY_LABEL[r]||r}
              getIcon={b=>SKILL_BOOKS[b.id]?.icon}
              getImage={b=>SKILL_BOOKS[b.id]?.image}
              getName={b=>SKILL_BOOKS[b.id]?.name||""}
              isMaxed={b=>!nextBookRarity(b.rarity)}
              emptyText="合成できるスキル書がない"
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
