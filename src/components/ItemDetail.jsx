import { RARITY_COLOR, RARITY_LABEL, INNATE, getItemStats } from "../data/items";

const TYPE_LABEL = { weapon:"武器", armor:"防具", accessory:"アクセ", consumable:"消耗品", special:"特殊" };

export default function ItemDetail({ item, compact = false }) {
  if (!item) return null;
  const rc = RARITY_COLOR[item.rarity] || "#888";
  const innate = INNATE[item.innate];

  // 基礎ステータス（abilities除いた値）
  const baseStats = {
    atk:  item.atk  || 0,
    mag:  item.mag  || 0,
    def:  item.def  || 0,
    mdef: item.mdef || 0,
    hp:   item.hp   || 0,
    crit: item.crit || 0,
    eva:  item.eva  || 0,
  };
  // 強化ボーナス
  Object.entries(item.bonuses || {}).forEach(([k,v]) => {
    if (baseStats[k] !== undefined) baseStats[k] += v;
  });

  const STAT_META = {
    atk:  { label:"ATK",  color:"#f87171" },
    mag:  { label:"MAG",  color:"#a78bfa" },
    def:  { label:"DEF",  color:"#60a5fa" },
    mdef: { label:"MDEF", color:"#38bdf8" },
    hp:   { label:"HP",   color:"#f87171" },
    crit: { label:"CRIT", color:"#fbbf24", suffix:"%" },
    eva:  { label:"EVA",  color:"#34d399", suffix:"%" },
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:compact?4:8 }}>
        <span style={{ fontSize:compact?18:22 }}>{item.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:compact?11:13, fontWeight:700, color:"#e8e0d0" }}>
            {item.name}
            {item.upgradeLevel > 0 && <span style={{ color:"#fbbf24" }}> +{item.upgradeLevel}</span>}
          </div>
          <div style={{ fontSize:7, color:rc }}>
            {TYPE_LABEL[item.type]} {RARITY_LABEL[item.rarity]}
          </div>
        </div>
      </div>

      {/* 基礎ステータス */}
      {Object.entries(baseStats).some(([,v]) => v > 0) && (
        <div style={{ marginBottom:compact?4:6 }}>
          {!compact && <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:3, letterSpacing:1 }}>基礎ステータス</div>}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(baseStats).filter(([,v]) => v > 0).map(([k,v]) => {
              const m = STAT_META[k];
              return (
                <span key={k} style={{ fontSize:9, color:m.color, background:"#080810", padding:"2px 6px", borderRadius:3 }}>
                  {m.label} {v}{m.suffix||""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 固有能力 */}
      {innate && innate.key !== "none" && (
        <div style={{ marginBottom:compact?4:6, padding:"3px 8px", background:"#0a0800", border:"1px solid #fb923c33", borderRadius:4 }}>
          {!compact && <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:2 }}>固有能力</div>}
          <div style={{ fontSize:9, color:"#fb923c" }}>◆ {innate.label}</div>
          {!compact && <div style={{ fontSize:7, color:"#4a4a6a" }}>{innate.desc}</div>}
        </div>
      )}

      {/* ランダム能力 */}
      {(item.abilities||[]).length > 0 && (
        <div style={{ padding:"3px 8px", background:"#0a000a", border:"1px solid #a78bfa33", borderRadius:4 }}>
          {!compact && <div style={{ fontSize:7, color:"#3a3a5a", marginBottom:2 }}>ランダム能力</div>}
          {item.abilities.map((ab,i) => (
            <div key={i} style={{ fontSize:9, color:"#a78bfa" }}>
              ✦ {ab.label}{ab.value}{ab.suffix}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}