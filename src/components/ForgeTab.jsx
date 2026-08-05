import { useState } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { RARITY_COLOR, RARITY_LABEL, getItemStats, INNATE, SYNTHESIS_COST, getAbilitySlots } from "../data/items";
import { SKILL_BOOKS, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL, BOOK_SYNTHESIS_COST, nextBookRarity, makeBook, mergeBookDex } from "../data/skills";

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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {groups[r].map(it => {
              const rc = getColor(it);
              const isSel = selectedUid === it.uid;
              const maxed = isMaxed?.(it);
              return (
                <div key={it.uid} onClick={() => !maxed && onSelect(isSel ? null : it.uid)}
                  style={{ aspectRatio:"1", position:"relative", background:isSel?`${rc}55`:maxed?"#12121a":`${rc}30`, border:`2px solid ${isSel?rc:maxed?"#3a3a55":rc+"88"}`, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:maxed?"default":"pointer", padding:3, opacity:maxed?0.5:1, boxShadow:isSel?`0 0 10px ${rc}aa`:maxed?"none":`0 0 5px ${rc}44` }}>
                  {maxed && <div style={{ position:"absolute", top:2, right:3, fontSize:7, color:"#fbbf24", fontWeight:700 }}>MAX</div>}
                  <div style={{ fontSize:22, filter:maxed?"grayscale(0.6)":"none" }}>{getIcon(it)}</div>
                  <div style={{ fontSize:9, color:maxed?DIM:"#e8e0d0", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%", marginTop:2 }}>{getName(it).slice(0,7)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ForgeTab() {
  const [tab, setTab] = useState("upgrade");
  const [sel, setSel] = useState(null);
  const [matSel, setMatSel] = useState(null);
  const [msg, setMsg] = useState("");
  const { itemBox, gold, materials, updatePlayer, skillBooks, activeSkillSlots, passiveSkillSlots, skillBookDex } = usePlayerStore();

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

  const bookItem = (skillBooks||[]).find(b => b.uid === sel);
  const bookCandidates = bookItem
    ? (skillBooks||[]).filter(b => b.uid !== bookItem.uid && b.id === bookItem.id && b.rarity === bookItem.rarity)
    : [];
  const bookMatItem = (skillBooks||[]).find(b => b.uid === matSel);
  const nextBookR = bookItem ? nextBookRarity(bookItem.rarity) : null;
  const bookSynthCost = bookItem ? BOOK_SYNTHESIS_COST[bookItem.rarity] : null;

  function synthesizeBook() {
    if (!bookItem || !bookMatItem) { setMsg("ベースと素材を選択して！"); return; }
    if (!nextBookR) { setMsg("これ以上合成できません"); return; }
    if (gold < bookSynthCost) { setMsg("Gが不足！"); return; }
    const newBook = makeBook(bookItem.id, nextBookR);
    const newSkillBooks = (skillBooks||[])
      .filter(b => b.uid !== bookItem.uid && b.uid !== bookMatItem.uid)
      .concat(newBook);
    const replaceSlot = (uid) => uid === bookItem.uid ? newBook.uid : (uid === bookMatItem.uid ? null : uid);
    updatePlayer({
      skillBooks: newSkillBooks,
      activeSkillSlots: (activeSkillSlots||[]).map(replaceSlot),
      passiveSkillSlots: (passiveSkillSlots||[]).map(replaceSlot),
      skillBookDex: mergeBookDex(skillBookDex, [newBook]),
      gold: gold - bookSynthCost,
    });
    setSel(null); setMatSel(null);
    setMsg(`✨ ${SKILL_BOOKS[bookItem.id].name}が${BOOK_RARITY_LABEL[nextBookR]}になった！`);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#fb923c", letterSpacing:2 }}>🔨 FORGE</div>
        <div style={{ fontSize:10, color:DIM, marginTop:2 }}>所持G: {gold.toLocaleString()}</div>
        {msg && <div style={{ fontSize:10, color:"#4ade80", marginTop:3 }}>{msg}</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        {[{id:"upgrade",label:"⬆ 強化"},{id:"synth",label:"✨ 合成"},{id:"book",label:"📖 スキル書"}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSel(null); setMatSel(null); }}
            style={{ flex:1, padding:"8px 0", background:tab===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?"#fb923c":"transparent"}`, cursor:"pointer", color:tab===t.id?"#fb923c":DIM, fontSize:11, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>

        {/* 強化タブ */}
        {tab === "upgrade" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
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

            {upgradeItem && (
              <div style={{ background:"#0d0d15", border:"1px solid #3a3a55", borderRadius:8, padding:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:22 }}>{upgradeItem.icon}</span>
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
                  <div style={{ fontSize:10, color:"#fb923c", marginBottom:6 }}>◆ {INNATE[upgradeItem.innate].label}</div>
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
                        style={{ padding:"6px 14px", background:can?"#1a1000":"#0a0a0a", border:`1px solid ${can?"#fbbf24":"#3a3a3a"}`, borderRadius:4, cursor:can?"pointer":"default", color:can?"#fbbf24":FAINT, fontSize:10, fontFamily:"monospace" }}>
                        強化
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background:"#0d0d15", border:"1px solid #3a3a55", borderRadius:6, padding:10 }}>
              <div style={{ fontSize:10, color:"#fb923c", letterSpacing:2, marginBottom:6 }}>所持素材</div>
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
            <div style={{ fontSize:10, color:DIM }}>同じ種類・同じレアリティの装備2つで1段階上のレアリティに合成</div>

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
                  emptyText="合成できる素材がない（同じ種類・同じレアリティが必要）"
                />
              </div>
            )}

            {/* 選択アイテム詳細 */}
            {(baseItem || matItem) && (
              <div style={{ display:"flex", gap:8 }}>
                {baseItem && (
                  <div style={{ flex:1, background:"#0d0d15", border:`1px solid ${RARITY_COLOR[baseItem.rarity]||"#3a3a55"}`, borderRadius:6, padding:8 }}>
                    <div style={{ fontSize:9, color:"#a78bfa", marginBottom:4 }}>ベース</div>
                    <div style={{ fontSize:10, color:"#e8e0d0", marginBottom:4 }}>{baseItem.icon} {baseItem.name}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {Object.entries(getItemStats(baseItem)).filter(([,v])=>v>0).map(([k,v])=>(
                        <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"1px 4px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                      ))}
                    </div>
                    {(baseItem.abilities||[]).map((ab,i)=>(
                      <div key={i} style={{ fontSize:10, color:"#a78bfa", marginTop:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                    ))}
                  </div>
                )}
                {matItem && (
                  <div style={{ flex:1, background:"#0d0d15", border:`1px solid ${RARITY_COLOR[matItem.rarity]||"#3a3a55"}`, borderRadius:6, padding:8 }}>
                    <div style={{ fontSize:9, color:DIM, marginBottom:4 }}>素材</div>
                    <div style={{ fontSize:10, color:"#e8e0d0", marginBottom:4 }}>{matItem.icon} {matItem.name}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {Object.entries(getItemStats(matItem)).filter(([,v])=>v>0).map(([k,v])=>(
                        <span key={k} style={{ fontSize:10, color:"#86efac", background:"#080810", padding:"1px 4px", borderRadius:2 }}>{k.toUpperCase()} {v}</span>
                      ))}
                    </div>
                    {(matItem.abilities||[]).map((ab,i)=>(
                      <div key={i} style={{ fontSize:10, color:"#a78bfa", marginTop:2 }}>✦ {ab.label}{ab.value}{ab.suffix}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {baseItem && matItem && next && (
              <div style={{ background:"#0d0d15", border:`1px solid ${RARITY_COLOR[next]||"#3a3a55"}`, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, color:DIM, marginBottom:6 }}>合成プレビュー</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:10 }}>
                  <span style={{ color:RARITY_COLOR[baseItem.rarity] }}>{baseItem.name}</span>
                  <span style={{ color:DIM }}>+</span>
                  <span style={{ color:RARITY_COLOR[matItem.rarity] }}>{matItem.name}</span>
                  <span style={{ color:DIM }}>→</span>
                  <span style={{ color:RARITY_COLOR[next], fontWeight:700 }}>{baseItem.name} {RARITY_LABEL[next]}</span>
                </div>
                {(matItem.abilities||[]).length > 0 && (
                  <div style={{ fontSize:10, color:"#a78bfa", marginBottom:8 }}>
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

        {/* スキル書合成タブ */}
        {tab === "book" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:10, color:DIM }}>同じスキル書・同じレアリティ2冊で1段階上のレアリティに合成</div>

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

            {bookItem && bookMatItem && nextBookR && (
              <div style={{ background:"#0d0d15", border:`1px solid ${BOOK_RARITY_COLOR[nextBookR]||"#3a3a55"}`, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:10, color:DIM, marginBottom:6 }}>合成プレビュー</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:10 }}>
                  <span style={{ color:BOOK_RARITY_COLOR[bookItem.rarity] }}>{SKILL_BOOKS[bookItem.id].name}</span>
                  <span style={{ color:DIM }}>+</span>
                  <span style={{ color:BOOK_RARITY_COLOR[bookMatItem.rarity] }}>{SKILL_BOOKS[bookMatItem.id].name}</span>
                  <span style={{ color:DIM }}>→</span>
                  <span style={{ color:BOOK_RARITY_COLOR[nextBookR], fontWeight:700 }}>{SKILL_BOOKS[bookItem.id].name} {BOOK_RARITY_LABEL[nextBookR]}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:"#fbbf24" }}>コスト: {bookSynthCost?.toLocaleString()}G</span>
                  <button onClick={synthesizeBook} disabled={gold < (bookSynthCost||0)}
                    style={{ padding:"8px 20px", background:"#0a001a", border:`1px solid ${BOOK_RARITY_COLOR[nextBookR]}`, borderRadius:4, cursor:"pointer", color:BOOK_RARITY_COLOR[nextBookR], fontSize:11, fontFamily:"monospace", fontWeight:700 }}>
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
