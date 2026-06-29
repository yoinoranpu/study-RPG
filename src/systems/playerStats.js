import { getItemStats } from "../data/items";

export const calcPlayerStats = (player) => {
  // 基本値は固定（レベルで変わらない）
  let atk=10, mag=10, def=10, mdef=10, hp=100, eva=5, crit=5;

  // 装備が主役
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

  // レベルは微量のボーナスだけ（装備の1/10程度）
  const lv = player.totalExp ? Math.floor(Math.sqrt(player.totalExp / 15)) + 1 : 1;
  hp   += lv * 2;   // Lv20でHP+40（装備の方が圧倒的に大きい）
  def  += Math.floor(lv * 0.3); // Lv20でDEF+6

  // スキルパッシブ反映
  const learned = new Set(player.learnedSkills || []);
  if (learned.has("s004")) crit += 5;
  if (learned.has("s005")) def  += 10;
  if (learned.has("s008")) {} // 吸血（戦闘中のみ）

  return { atk, mag, def, mdef, hp, maxHp: hp, eva, crit };
};