import { useState } from "react";
import { ALL_ITEMS, makeItem, RARITY_COLOR, RARITY_LABEL } from "../data/items";
import { SKILL_BOOKS, SKILL_BOOK_LIST, makeBook, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL, BOOK_RARITY_ORDER } from "../data/skills";
import usePlayerStore from "../store/usePlayerStore";

const ITEM_BOX_MAX = 30;

export default function DebugItemTab() {
  const [sub, setSub] = useState("weapon");
  const [bookRarity, setBookRarity] = useState("common");
  const [msg, setMsg] = useState("");
  const { itemBox, skillBooks, updatePlayer } = usePlayerStore();

  const tabs = [
    { id:"weapon",     label:"⚔武器"   },
    { id:"armor",      label:"🛡防具"   },
    { id:"accessory",  label:"💍アクセ" },
    { id:"consumable", label:"🧪消耗品" },
    { id:"special",    label:"✨特殊"   },
    { id:"book",       label:"📖スキル書" },
  ];

  function flash(text) { setMsg(text); setTimeout(()=>setMsg(""),2000); }

  function give(tmpl) {
    if ((itemBox||[]).length >= ITEM_BOX_MAX) { flash("BOX満杯！"); return; }
    updatePlayer({ itemBox: [...(itemBox||[]), makeItem(tmpl)] });
    flash(`${tmpl.name}を取得！`);
  }

  function giveAll() {
    const current = itemBox||[];
    const items = ALL_ITEMS.filter(it => it.type === sub || (sub==="special" && it.effect?.startsWith("boss_key")));
    const toAdd = items.slice(0, ITEM_BOX_MAX - current.length);
    updatePlayer({ itemBox: [...current, ...toAdd.map(makeItem)] });
    flash(`${toAdd.length}個取得！`);
  }

  function giveBook(bookId) {
    const book = makeBook(bookId, bookRarity);
    if (!book) return;
    updatePlayer({ skillBooks: [...(skillBooks||[]), book] });
    flash(`${SKILL_BOOKS[bookId].name}(${BOOK_RARITY_LABEL[bookRarity]})を取得！`);
  }

  function giveAllBooks() {
    const newBooks = SKILL_BOOK_LIST.map(b => makeBook(b.id, bookRarity)).filter(Boolean);
    updatePlayer({ skillBooks: [...(skillBooks||[]), ...newBooks] });
    flash(`スキル書${newBooks.length}冊取得！`);
  }

  function clearBooks() {
    updatePlayer({ skillBooks: [], activeSkillSlots:[null,null,null,null], passiveSkillSlots:[null,null,null,null,null,null] });
    flash("スキル書を全消去");
  }

  return (
    <div style={{ fontFamily:"monospace" }}>
      {msg && <div style={{ fontSize:9, color:"#4ade80", marginBottom:6 }}>{msg}</div>}

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2a", marginBottom:8, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ flex:1, padding:"5px 2px", background:sub===t.id?"#12122a":"transparent", border:"none", borderBottom:`2px solid ${sub===t.id?"#a78bfa":"transparent"}`, cursor:"pointer", color:sub===t.id?"#a78bfa":"#4a4a6a", fontSize:8, fontFamily:"monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === "book" ? (
        <>
          {/* レアリティ選択 */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
            {BOOK_RARITY_ORDER.map(r => (
              <button key={r} onClick={() => setBookRarity(r)} style={{ padding:"3px 6px", background:bookRarity===r?`${BOOK_RARITY_COLOR[r]}22`:"transparent", border:`1px solid ${bookRarity===r?BOOK_RARITY_COLOR[r]:"#2a2a3a"}`, borderRadius:3, cursor:"pointer", color:bookRarity===r?BOOK_RARITY_COLOR[r]:"#4a4a6a", fontSize:7, fontFamily:"monospace" }}>
                {BOOK_RARITY_LABEL[r]}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:8 }}>
            <button onClick={giveAllBooks} style={{ flex:1, padding:"6px 0", background:"#0a0a1a", border:"1px solid #a78bfa44", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:9, fontFamily:"monospace" }}>
              全種取得（{BOOK_RARITY_LABEL[bookRarity]}）
            </button>
            <button onClick={clearBooks} style={{ padding:"6px 12px", background:"#1a0a0a", border:"1px solid #f8717144", borderRadius:4, cursor:"pointer", color:"#f87171", fontSize:9, fontFamily:"monospace" }}>
              全消去
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {SKILL_BOOK_LIST.map(book => {
              const rc = BOOK_RARITY_COLOR[bookRarity];
              return (
                <div key={book.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"#0d0d15", border:`1px solid ${rc}33`, borderRadius:4 }}>
                  <span style={{ fontSize:16 }}>{book.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, color:"#e8e0d0" }}>{book.name} <span style={{ fontSize:6, color: book.type==="active"?"#f87171":"#a78bfa" }}>{book.type==="active"?"ACT":"PAS"}</span></div>
                    <div style={{ fontSize:7, color:"#4a4a6a" }}>{book.desc}</div>
                  </div>
                  <button onClick={() => giveBook(book.id)} style={{ padding:"3px 10px", background:"#0a0a1a", border:`1px solid ${rc}66`, borderRadius:3, cursor:"pointer", color:rc, fontSize:8, fontFamily:"monospace" }}>
                    取得
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button onClick={giveAll} style={{ width:"100%", padding:"6px 0", background:"#0a0a1a", border:"1px solid #a78bfa44", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:9, fontFamily:"monospace", marginBottom:8 }}>
            全部取得
          </button>

          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {ALL_ITEMS.filter(it => it.type === sub || (sub==="special" && it.effect?.startsWith("boss_key"))).map(tmpl => {
              const rc = RARITY_COLOR[tmpl.rarity] || "#888";
              return (
                <div key={tmpl.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"#0d0d15", border:`1px solid ${rc}33`, borderRadius:4 }}>
                  <span style={{ fontSize:16 }}>{tmpl.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, color:"#e8e0d0" }}>{tmpl.name}</div>
                    <div style={{ fontSize:7, color:rc }}>{RARITY_LABEL[tmpl.rarity]}</div>
                  </div>
                  <button onClick={() => give(tmpl)} style={{ padding:"3px 10px", background:"#0a0a1a", border:`1px solid ${rc}66`, borderRadius:3, cursor:"pointer", color:rc, fontSize:8, fontFamily:"monospace" }}>
                    取得
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}