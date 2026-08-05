import { SKILL_BOOK_LIST, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL } from "../data/skills";
import usePlayerStore from "../store/usePlayerStore";

const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

export default function SkillBookTab() {
  const { skillBookDex } = usePlayerStore();
  const dex = skillBookDex || {};

  const total = SKILL_BOOK_LIST.length;
  const found = SKILL_BOOK_LIST.filter(b => dex[b.id]).length;

  const active  = SKILL_BOOK_LIST.filter(b => b.type === "active");
  const passive = SKILL_BOOK_LIST.filter(b => b.type === "passive");

  const Row = ({ book }) => {
    const entry = dex[book.id];
    const discovered = !!entry;
    const rc = discovered ? BOOK_RARITY_COLOR[entry.bestRarity] || "#888" : "#3a3a55";
    return (
      <div style={{ background:discovered?`${rc}22`:"#0d0d15", borderLeft:`3px solid ${discovered?rc:"#3a3a55"}`, border:`1px solid ${discovered?rc+"66":"#2a2a40"}`, borderRadius:6, padding:"10px 12px", marginBottom:6, opacity:discovered?1:0.6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, background:discovered?rc+"33":"#1a1a2a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, filter:discovered?"none":"grayscale(1) brightness(0.6)" }}>
            {discovered ? book.icon : "❓"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:discovered?"#e8e0d0":FAINT }}>
              {discovered ? book.name : "？？？"}
            </div>
            <div style={{ fontSize:10, color:discovered?DIM:FAINT }}>
              {discovered ? book.desc : "未発見"}
            </div>
          </div>
          {discovered && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:rc, fontWeight:700 }}>{BOOK_RARITY_LABEL[entry.bestRarity]}</div>
              <div style={{ fontSize:10, color:DIM }}>累計×{entry.count}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:2 }}>SKILL BOOK DEX</div>
        <div style={{ fontSize:10, color:DIM, marginTop:2 }}>
          発見: {found}/{total}
          <div style={{ display:"inline-block", width:80, height:4, background:"#1a1a2a", borderRadius:2, overflow:"hidden", marginLeft:8, verticalAlign:"middle" }}>
            <div style={{ height:"100%", width:`${(found/total)*100}%`, background:"#a78bfa", borderRadius:2 }} />
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        <div style={{ fontSize:10, color:"#f87171", letterSpacing:2, marginBottom:6, fontWeight:700 }}>アクティブ書</div>
        {active.map(b => <Row key={b.id} book={b} />)}
        <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:2, margin:"10px 0 6px", fontWeight:700 }}>パッシブ書</div>
        {passive.map(b => <Row key={b.id} book={b} />)}
      </div>
    </div>
  );
}
