import { getItemStats } from "../data/items";
import { calcStatBonus } from "../data/skills";

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

  // スキル（ステータス強化系）反映
  const statBonus = calcStatBonus(player.learnedSkills || []);
  atk  += statBonus.atk;
  mag  += statBonus.mag;
  def  += statBonus.def;
  mdef += statBonus.mdef;
  hp   += statBonus.hp;
  eva  += statBonus.eva;
  crit += statBonus.crit;

  // レベルボーナス（微量）
  const lv = player.totalExp ? Math.floor(Math.sqrt(player.totalExp / 15)) + 1 : 1;
  hp  += lv * 2;
  def += Math.floor(lv * 0.3);

  return { atk, mag, def, mdef, hp, maxHp: hp, eva, crit };
};