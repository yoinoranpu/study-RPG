const DIM = "#7a7a9a";
const FAINT = "#5c5c82";

export default function RewardRow({ label, desc, progress, target, claimed, done, color, rewardChips, onClaim }) {
  const pct = Math.min(100, (progress / target) * 100);

  return (
    <div style={{ background:"#0d0d15", border:`1px solid ${claimed?"#2a2a3a":color+"66"}`, borderLeft:`3px solid ${color}`, borderRadius:6, padding:"10px 12px", marginBottom:8, opacity:claimed?0.6:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: desc ? 4 : 6 }}>
        <span style={{ fontSize:11, color:"#e8e0d0", fontWeight:700 }}>{label}</span>
        <span style={{ fontSize:10, color:DIM }}>{progress}/{target}</span>
      </div>
      {desc && <div style={{ fontSize:9, color:DIM, marginBottom:8 }}>{desc}</div>}
      <div style={{ height:5, background:"#080810", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:8, fontSize:10 }}>
          {rewardChips.map((c, i) => <span key={i} style={{ color:c.color }}>{c.text}</span>)}
        </div>
        {claimed ? (
          <span style={{ fontSize:9, color:DIM }}>受取済み</span>
        ) : (
          <button onClick={onClaim} disabled={!done}
            style={{ padding:"5px 14px", background:done?"#0a1a0a":"#0a0a0a", border:`1px solid ${done?"#4ade80":"#3a3a3a"}`, borderRadius:4, cursor:done?"pointer":"default", color:done?"#4ade80":FAINT, fontSize:10, fontFamily:"monospace" }}>
            受け取る
          </button>
        )}
      </div>
    </div>
  );
}
