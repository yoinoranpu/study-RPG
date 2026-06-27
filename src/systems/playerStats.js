import { getItemStats } from "../data/items";

export const calcPlayerStats = (player) => {
  let atk=10, mag=10, def=10, mdef=10, hp=100, eva=5, crit=5;

  // 装備反映
  [player.equippedWeapon, player.equippedArmor, 
   player.equippedAcc1, player.equippedAcc2].forEach(eq => {
    if (!eq) return;
    const s = getItemStats(eq);
    atk  += s.atk  || 0;
    mag  += s.mag  || 0;
    def  += s.def  || 0;
    mdef += s.mdef || 0;
    hp   += s.hp   || 0;
    eva  += s.eva  || 0;
    crit += s.crit || 0;
  });

  // スキル反映（パッシブ）
  const learned = new Set(player.learnedSkills || []);
  if (learned.has("s004")) crit += 5;  // 急所狙い
  if (learned.has("s005")) def  += 10; // 鉄壁
  if (learned.has("s008")) {} // 吸血（戦闘中のみ）

  return { atk, mag, def, mdef, hp, maxHp: hp, eva, crit };
};