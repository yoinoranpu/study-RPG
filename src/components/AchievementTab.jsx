import usePlayerStore from "../store/usePlayerStore";
import { ACHIEVEMENT_DEFS } from "../systems/achievements";
import RewardRow from "./RewardRow";

const DIM = "#7a7a9a";
const FAINT = "#5c5c82";
const CATEGORY_COLOR = { "進行度":"#60a5fa", "継続":"#4ade80", "戦闘":"#f87171", "収集":"#a78bfa", "経済":"#fbbf24", "遊び心":"#fb923c" };

export default function AchievementTab() {
  const player = usePlayerStore();
  const { gold, totalExp, achievements, updatePlayer } = player;
  const claimed = achievements?.claimed || {};

  const categories = [...new Set(ACHIEVEMENT_DEFS.map(a => a.category))];
  const totalDone = ACHIEVEMENT_DEFS.filter(a => a.get(player) >= a.target).length;

  // 達成済み・未受取を一番上に、次に進行中、受取済みは一番下（同ランク内は元の並び順を維持）
  const rank = (ach) => {
    const done = ach.get(player) >= ach.target;
    if (done && !claimed[ach.id]) return 0;
    if (!done) return 1;
    return 2;
  };
  const sortByRank = (list) => list.map((ach, i) => ({ ach, i })).sort((a, b) => rank(a.ach) - rank(b.ach) || a.i - b.i).map(x => x.ach);

  function claim(ach) {
    const progress = ach.get(player);
    if (progress < ach.target) return;
    if (claimed[ach.id]) return;
    updatePlayer({
      gold: gold + ach.reward.gold,
      totalExp: totalExp + ach.reward.exp,
      achievements: { claimed: { ...claimed, [ach.id]: true } },
    });
  }

  function AchievementRow({ ach }) {
    const progress = Math.min(ach.target, ach.get(player));
    const done = progress >= ach.target;
    const isClaimed = !!claimed[ach.id];
    const revealed = !ach.hidden || done;
    const color = isClaimed ? "#4a4a6a" : done ? "#4ade80" : CATEGORY_COLOR[ach.category];

    if (!revealed) {
      return (
        <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderLeft:"3px solid #3a3a55", borderRadius:6, padding:"10px 12px", marginBottom:8, opacity:0.6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🔒</span>
            <span style={{ fontSize:11, color:FAINT }}>？？？</span>
          </div>
        </div>
      );
    }

    const rewardChips = [
      { text:`${ach.reward.gold}G`, color:"#fbbf24" },
      { text:`${ach.reward.exp}EXP`, color:"#86efac" },
    ];

    return (
      <RewardRow label={ach.label} desc={ach.desc} progress={progress} target={ach.target}
        claimed={isClaimed} done={done} color={color} rewardChips={rewardChips}
        onClaim={()=>claim(ach)} />
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:2 }}>🏆 ACHIEVEMENTS</div>
        <div style={{ fontSize:10, color:DIM, marginTop:2 }}>
          達成: {totalDone}/{ACHIEVEMENT_DEFS.length}
          <div style={{ display:"inline-block", width:80, height:4, background:"#1a1a2a", borderRadius:2, overflow:"hidden", marginLeft:8, verticalAlign:"middle" }}>
            <div style={{ height:"100%", width:`${(totalDone/ACHIEVEMENT_DEFS.length)*100}%`, background:"#fbbf24", borderRadius:2 }} />
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        {categories.map(cat => (
          <div key={cat}>
            <div style={{ fontSize:10, color:CATEGORY_COLOR[cat], letterSpacing:2, margin:"10px 0 6px", fontWeight:700 }}>{cat}</div>
            {sortByRank(ACHIEVEMENT_DEFS.filter(a => a.category === cat)).map(ach => <AchievementRow key={ach.id} ach={ach} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
