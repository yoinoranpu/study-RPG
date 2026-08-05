import usePlayerStore from "../store/usePlayerStore";
import { QUEST_DEFS } from "../systems/quests";
import { openChest, CHEST_TYPES } from "../data/chest_table";
import { getGlobalUnlockDepth } from "../systems/dungeons";
import { mergeBookDex } from "../data/skills";
import RewardRow from "./RewardRow";

const ITEM_BOX_MAX = 30;

export default function QuestTab() {
  const player = usePlayerStore();
  const { quests, gold, totalExp, itemBox, skillBooks, skillBookDex, dungeons, currentDungeonId, updatePlayer } = player;
  const q = quests || {};

  function claim(scope, quest) {
    const claimedKey = scope === "daily" ? "claimedDaily" : "claimedWeekly";
    const progress = quest.get(q, player);
    if (progress < quest.target) return;
    if (q[claimedKey]?.[quest.id]) return;

    let extraGold = 0;
    let newItemBox = itemBox;
    let newSkillBooks = skillBooks;
    let newSkillBookDex = skillBookDex;

    if (quest.reward.chestRarity) {
      const result = openChest(quest.reward.chestRarity, getGlobalUnlockDepth(dungeons), currentDungeonId);
      if (result.type === "gold") {
        extraGold = result.gold;
      } else if (result.type === "item" && (itemBox||[]).length < ITEM_BOX_MAX) {
        newItemBox = [...(itemBox||[]), result.item];
      } else if (result.type === "skillbook") {
        newSkillBooks = [...(skillBooks||[]), result.book];
        newSkillBookDex = mergeBookDex(skillBookDex, [result.book]);
      }
    }

    updatePlayer({
      gold: gold + quest.reward.gold + extraGold,
      totalExp: totalExp + quest.reward.exp,
      itemBox: newItemBox,
      skillBooks: newSkillBooks,
      skillBookDex: newSkillBookDex,
      quests: { ...q, [claimedKey]: { ...(q[claimedKey]||{}), [quest.id]: true } },
    });
  }

  function QuestRow({ scope, quest }) {
    const claimedKey = scope === "daily" ? "claimedDaily" : "claimedWeekly";
    const progress = Math.min(quest.target, quest.get(q, player));
    const done = progress >= quest.target;
    const claimed = !!q[claimedKey]?.[quest.id];
    const color = claimed ? "#4a4a6a" : done ? "#4ade80" : "#60a5fa";
    const chestType = quest.reward.chestRarity ? CHEST_TYPES[quest.reward.chestRarity] : null;
    const rewardChips = [
      { text:`${quest.reward.gold}G`, color:"#fbbf24" },
      { text:`${quest.reward.exp}EXP`, color:"#86efac" },
      ...(chestType ? [{ text:`${chestType.icon}${chestType.label}`, color:chestType.color }] : []),
    ];

    return (
      <RewardRow label={quest.label} progress={progress} target={quest.target}
        claimed={claimed} done={done} color={color} rewardChips={rewardChips}
        onClaim={()=>claim(scope, quest)} />
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"monospace" }}>
      <div style={{ padding:"8px 12px", background:"#080810", borderBottom:"1px solid #1a1a2a", flexShrink:0 }}>
        <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:2 }}>🎯 QUEST</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:10 }}>
        <div style={{ fontSize:10, color:"#60a5fa", letterSpacing:2, marginBottom:6, fontWeight:700 }}>デイリー</div>
        {QUEST_DEFS.daily.map(quest => <QuestRow key={quest.id} scope="daily" quest={quest} />)}

        <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:2, margin:"10px 0 6px", fontWeight:700 }}>ウィークリー</div>
        {QUEST_DEFS.weekly.map(quest => <QuestRow key={quest.id} scope="weekly" quest={quest} />)}
      </div>
    </div>
  );
}
