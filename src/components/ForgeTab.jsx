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
function ItemPicker({ items, selectedUid, onSelect, getRarity, getColor, getRarityLabel, getIcon, getName, emptyText, isMaxed }) {
  const [query, setQuery] = useState("");
  const filtered = query ? items.filter(it => getName(it).toLowerCase().includes(query.toLowerCase())) : items;
  const groups = {};
  filtered.forEach(it => { const r = getRarity(it); (groups[r] = groups[r] || []).push(it); });

  return (
    <div>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 名前で検索..."
        style={{ width:"100%", boxSizing:"border-box", padding:"6px 10px", marginBottom:8, background:"#080810", border:"1px solid #3a3a55", borderRadius:5, color:"#e8e0d0", fontSize:10, fontFamily:"monospace" }} />
      {items.length === 0 && <div style={{ fontSize:10, color:FAINT, padding:8, textAlign:"center" }}>{emptyText}</div>}
      {items.length > 0 && filtered.length === 0 && <div style={{ fontSize:10, color:FAINT, padding:8, textAlign:"center" }}>該当なし</div>}
      {RARITY_ORDER.filter(r => groups[r]?.length).map(r => (
        <div key={r} style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, color:getColor({ rarity:r }), letterSpacing:1, marginBottom:4, fontWeight:700 }}>
            {getRarityLabel(r)} ({groups[r].length})
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {groups[r].map(it => {
              const rc = getColor(it);
              const isSel = selectedUid === it.uid;
              const maxed = isMaxed?.(it);
              return (
                <div key={it.uid} onClick={() => !maxed && onSelect(isSel ? null : it.uid)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:maxed?"default":"pointer", opacity:maxed?0.5:1 }}>
                  <div className={`slot-cell${isSel?" slot-selected":""}`} style={{ width:"100%", aspectRatio:"1", position:"relative" }}>
                    {!maxed && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:rc, opacity:0.4, filter:"blur(6px)" }} />}
                    <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                    <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {it.image ? (
                        <img src={it.image} alt="" style={{ width:"78%", height:"78%", objectFit:"contain", filter:`${it.tint||""} ${maxed?"grayscale(0.6)":""}`.trim()||"none" }} />
                      ) : (
                        <div style={{ fontSize:20, filter:maxed?"grayscale(0.6)":"none" }}>{getIcon(it)}</div>
                      )}
                    </div>
                    {maxed && <div style={{ position:"absolute", top:1, right:2, fontSize:7, color:"#fbbf24", fontWeight:700, background:"rgba(0,0,0,0.75)", borderRadius:2, padding:"1px 3px", zIndex:1 }}>MAX</div>}
                  </div>
                  <div style={{ fontSize:9, color:maxed?DIM:"#e8e0d0", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%" }}>{getName(it).slice(0,7)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 合成プレビュー共通部品：⬜+⬜=>⬜ を常に上部に表示 ───
function SynthBox({ icon, color, empty }) {
  return (
    <div style={{ width:52, height:52, position:"relative", flexShrink:0 }}>
      {!empty && <div style={{ position:"absolute", inset:"10%", borderRadius:"50%", background:color, opacity:0.45, filter:"blur(6px)" }} />}
      <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:empty?0.5:1 }} />
      <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
        {!empty && icon}
      </div>
    </div>
  );
}

function SynthPreview({ base, mat, next, cost, canAfford, onSynth, getIcon, getName, getColor, getRarityLabel, hint }) {
  const baseColor = base ? getColor(base) : "#3a3a55";
  const matColor  = mat  ? getColor(mat)  : "#3a3a55";
  const nextColor = next ? getColor({ rarity:next }) : "#3a3a55";
  const ready = base && mat && next;
  return (
    <div className="rpg-panel" style={{ borderRadius:6, padding:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        <SynthBox icon={base && getIcon(base)} color={baseColor} empty={!base} />
        <span style={{ fontSize:16, color:DIM, fontWeight:700 }}>+</span>
        <SynthBox icon={mat && getIcon(mat)} color={matColor} empty={!mat} />
        <span style={{ fontSize:16, color:DIM, fontWeight:700 }}>⇒</span>
        <SynthBox icon={base && getIcon(base)} color={nextColor} empty={!ready} />
      </div>
      <div style={{ textAlign:"center", fontSize:10, color:DIM, marginTop:8 }}>
        {base
          ? mat
            ? next
              ? <span>{getName(base)} <span style={{ color:nextColor, fontWeight:700 }}>→ {getRarityLabel(next)}</span></span>
              : "これ以上合成できません（最大レアリティ）"
            : "② 素材を選んでください"
          : hint}
      </div>
      {ready && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
          <span style={{ fontSize:10, color:"#fbbf24" }}>コスト: {cost?.toLocaleString()}G</span>
          <button onClick={onSynth} disabled={!canAfford}
            style={{ padding:"8px 20px", background:"#0a001a", border:`1px solid ${nextColor}`, borderRadius:4, cursor:canAfford?"pointer":"default", color:canAfford?nextColor:FAINT, fontSize:11, fontFamily:"monospace", fontWeight:700 }}>
            ✨ 合成
          </button>
        </div>
      )}
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
        <div style={{ flexShrink:0, display:"flex", alignItems:"flex-end", padding:"14px 10px 0" }}>
          <div style={{
            width:168, height:208, flexShrink:0, marginBottom:-2,
            backgroundImage:`url("/assets/images/blacksmith.png")`,
            backgroundSize:"cover", backgroundPosition:"center 20%", backgroundRepeat:"no-repeat",
            WebkitMaskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
            maskImage:"linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
          }} />
          <div style={{ position:"relative", flex:1, minWidth:0, marginLeft:2, marginBottom:16 }}>
            <div className="rpg-panel" style={{ borderRadius:6, padding:"12px 14px" }}>
              <div style={{ fontSize:13, color:"#e8d8c0" }}>{bubbleText()}</div>
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

        {/* 強化タブ */}
        {tab === "upgrade" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {upgradeItem && (
              <div style={{ position:"sticky", top:-10, zIndex:2, background:"#080810"}}>
              <div className="rpg-panel" style={{ borderRadius:6, padding:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ width:44, height:44, position:"relative", flexShrink:0 }}>
                    <div style={{ position:"absolute", inset:"8%", borderRadius:"50%", background:RARITY_COLOR[upgradeItem.rarity]||"#888", opacity:0.45, filter:"blur(5px)" }} />
                    <img src="/assets/images/item_slot_frame.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                    <div style={{ position:"absolute", inset:"19%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {upgradeItem.image ? <img src={upgradeItem.image} alt="" style={{ width:"78%", height:"78%", objectFit:"contain", filter:upgradeItem.tint||"none" }} /> : <span style={{ fontSize:18 }}>{upgradeItem.icon}</span>}
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e8e0d0" }}>
                      {upgradeItem.name} <span style={{ color:"#fbbf24" }}>+{upgradeItem.upgradeLevel}</span>
                    </div>
                    <div style={{ fontSize:10, color:RARITY_COLOR[upgradeItem.rarity]||"#888" }}>{RARITY_LABEL[upgradeItem.rarity]}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:DIM }}>強化コスト</div>
                    <div style={{ fontSize:14, color:"#fbbf24", fontWeight:700 }}>{cost}G</div>
                  </div>
                </div>

                {/* 現在のステータス */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {Object.entries(getItemStats(upgradeItem)).filter(([,v])=>v>0).map(([k,v])=>(
                    <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"2px 6px", borderRadius:3 }}>{k.toUpperCase()} {v}</span>
                  ))}
                </div>

                {/* 固有能力 */}
                {upgradeItem.innate && upgradeItem.innate !== "none" && INNATE[upgradeItem.innate] && (
                  <div style={{ marginBottom:6 }}>
                    <div style={{ fontSize:10, color:"#fb923c" }}>◆ {INNATE[upgradeItem.innate].label}</div>
                    <div style={{ fontSize:9, color:DIM }}>{INNATE[upgradeItem.innate].desc}</div>
                  </div>
                )}

                {/* ランダム能力 */}
                {(upgradeItem.abilities||[]).map((ab,i)=>(
                  <div key={i} style={{ fontSize:10, color:"#a78bfa", marginBottom:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                ))}

                {/* 節目ボーナス */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10, padding:"6px 8px", background:"#080810", borderRadius:4 }}>
                  {Object.entries(MILESTONE[upgradeItem.type]||{}).map(([lv,b])=>(
                    <span key={lv} style={{ fontSize:10, color:upgradeItem.upgradeLevel>=(+lv)?"#fbbf24":FAINT }}>
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
                        <div style={{ fontSize:10, color:DIM }}>{mo.label}</div>
                      </div>
                      <div style={{ fontSize:10, color:have>=1?"#fb923c":FAINT }}>×{have}</div>
                      <button onClick={() => upgrade(mo)} disabled={!can}
                        style={{ padding:"6px 14px", minHeight:"44px", minWidth:"44px", background:can?"#1a1000":"#0a0a0a", border:`1px solid ${can?"#fbbf24":"#3a3a3a"}`, borderRadius:4, cursor:can?"pointer":"default", color:can?"#fbbf24":FAINT, fontSize:10, fontFamily:"monospace", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        強化
                      </button>
                    </div>
                  );
                })}

                {forgeStone && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#0a0818", border:"1px solid #a78bfa66", borderRadius:5, marginTop:6 }}>
                    {forgeStone.image ? <img src={forgeStone.image} alt="" style={{ width:22, height:22, objectFit:"contain" }} /> : <span style={{ fontSize:18 }}>{forgeStone.icon}</span>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:"#e8e0d0" }}>{forgeStone.name}</div>
                      <div style={{ fontSize:9, color:DIM }}>所持中の秘石で無料で+2強化できます</div>
                    </div>
                    <button onClick={useForgeStone}
                      style={{ padding:"6px 14px", background:"#140a2a", border:"1px solid #a78bfa", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:10, fontFamily:"monospace" }}>
                      💠 +2強化
                    </button>
                  </div>
                )}
              </div>
              </div>
            )}

            <ItemPicker
              items={itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type))}
              selectedUid={sel}
              onSelect={setSel}
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

        {/* 合成タブ */}
        {tab === "synth" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ position:"sticky", top:-10, zIndex:2, background:"#080810"}}>
              <div style={{ fontSize:10, color:DIM, marginBottom:8 }}>同じ種類・同じ形状(剣は剣、弓は弓)・同じレアリティの装備2つで1段階上のレアリティに合成</div>

              <SynthPreview
                base={baseItem} mat={matItem} next={next}
                cost={synthCost?.gold} canAfford={gold >= (synthCost?.gold||0)} onSynth={synthesize}
                getIcon={it=>it.icon} getName={it=>it.name} getColor={it=>RARITY_COLOR[it.rarity]||"#888"} getRarityLabel={r=>RARITY_LABEL[r]||r}
                hint="① ベース装備を選んでください"
              />

              {(matItem?.abilities||[]).length > 0 && (
                <div style={{ fontSize:10, color:"#a78bfa", marginTop:8 }}>
                  継承: {matItem.abilities[0]?.label}{matItem.abilities[0]?.value}{matItem.abilities[0]?.suffix}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize:10, color:"#a78bfa", marginBottom:6 }}>① ベース装備を選択</div>
              <ItemPicker
                items={itemBox.filter(it=>["weapon","armor","accessory"].includes(it.type))}
                selectedUid={sel}
                onSelect={(uid)=>{ setSel(uid); setMatSel(null); }}
                getRarity={it=>it.rarity}
                getColor={it=>RARITY_COLOR[it.rarity]||"#888"}
                getRarityLabel={r=>RARITY_LABEL[r]||r}
                getIcon={it=>it.icon}
                getName={it=>it.name}
                isMaxed={it=>!nextRarity(it.rarity)}
                emptyText="合成できる装備がない"
              />
            </div>

            {baseItem && (
              <div>
                <div style={{ fontSize:10, color:"#a78bfa", marginBottom:6 }}>② 素材装備を選択</div>
                <ItemPicker
                  items={synthCandidates}
                  selectedUid={matSel}
                  onSelect={setMatSel}
                  getRarity={it=>it.rarity}
                  getColor={it=>RARITY_COLOR[it.rarity]||"#888"}
                  getRarityLabel={r=>RARITY_LABEL[r]||r}
                  getIcon={it=>it.icon}
                  getName={it=>it.name}
                  emptyText="合成できる素材がない（同じ種類・同じ形状・同じレアリティが必要）"
                />
              </div>
            )}
          </div>
        )}

        {/* スキル書合成タブ */}
        {tab === "book" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ position:"sticky", top:-10, zIndex:2, background:"#080810"}}>
              <div style={{ fontSize:10, color:DIM, marginBottom:8 }}>同じ系統(剣術/魔法など)・同じ区分(アクティブ/パッシブ)・同じレアリティの本2冊で1段階上のレアリティに合成</div>

              <SynthPreview
                base={bookItem} mat={bookMatItem} next={nextBookR}
                cost={bookSynthCost} canAfford={gold >= (bookSynthCost||0)} onSynth={synthesizeBook}
                getIcon={b=>SKILL_BOOKS[b.id]?.icon} getName={b=>SKILL_BOOKS[b.id]?.name||""} getColor={b=>BOOK_RARITY_COLOR[b.rarity]||"#888"} getRarityLabel={r=>BOOK_RARITY_LABEL[r]||r}
                hint="① ベースのスキル書を選んでください"
              />
            </div>

            <div>
              <div style={{ fontSize:10, color:"#a78bfa", marginBottom:6 }}>① ベースのスキル書を選択</div>
              <ItemPicker
                items={skillBooks||[]}
                selectedUid={sel}
                onSelect={(uid)=>{ setSel(uid); setMatSel(null); }}
                getRarity={b=>b.rarity}
                getColor={b=>BOOK_RARITY_COLOR[b.rarity]||"#888"}
                getRarityLabel={r=>BOOK_RARITY_LABEL[r]||r}
                getIcon={b=>SKILL_BOOKS[b.id]?.icon}
                getName={b=>SKILL_BOOKS[b.id]?.name||""}
                isMaxed={b=>!nextBookRarity(b.rarity)}
                emptyText="合成できるスキル書がない"
              />
            </div>

            {bookItem && (
              <div>
                <div style={{ fontSize:10, color:"#a78bfa", marginBottom:6 }}>② 素材のスキル書を選択</div>
                <ItemPicker
                  items={bookCandidates}
                  selectedUid={matSel}
                  onSelect={setMatSel}
                  getRarity={b=>b.rarity}
                  getColor={b=>BOOK_RARITY_COLOR[b.rarity]||"#888"}
                  getRarityLabel={r=>BOOK_RARITY_LABEL[r]||r}
                  getIcon={b=>SKILL_BOOKS[b.id]?.icon}
                  getName={b=>SKILL_BOOKS[b.id]?.name||""}
                  emptyText="合成できる素材がない（同じ書・同じレアリティが必要）"
                />
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
