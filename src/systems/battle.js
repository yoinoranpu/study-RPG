export const calcDamage = (atk, def) =>
  Math.max(1, Math.floor(atk * (100 / (100 + def))));

export const simulateBattle = (player, monsters) => {
  const logs = [];
  const turns = [];
  const monHps = monsters.map(m => m.hp);
  let playerHp = player.hp;
  let totalExp = 0, totalGold = 0;
  const materials = [];
  const drops = [];

  const addLog = (text, color = "#a0a0a0") => logs.push({ text, color });

  if (playerHp <= 0 || monHps.every(h => h <= 0)) {
    turns.push({ actor:"player", target:0, type:"skip" });
    return {
      logs, turns, playerHpAfter: Math.max(1, playerHp),
      totalExp, totalGold, materials, drops,
      won: monHps.every(h => h <= 0),
      monsters: monsters.map((m, i) => ({ ...m, hpLeft: monHps[i] })),
    };
  }

  const playerFirst = Math.random() < 0.70;
  if (!playerFirst) addLog("⚡ 不意打ち！敵先制！", "#fb923c");
  else addLog("✅ 先手！", "#4ade80");

  const doPlayerAttack = () => {
    monsters.forEach((mon, i) => {
      if (monHps[i] <= 0) return;
      if (Math.random() * 100 < mon.eva) {
        addLog(`  ${mon.displayName} 回避！`, "#34d399");
        turns.push({ actor:"player", target:i, type:"miss" });
        return;
      }
      const isCrit = Math.random() * 100 < player.crit;
      let dmg = calcDamage(player.atk, mon.def);
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      if (player.vampiric) {
        playerHp = Math.min(player.maxHp, playerHp + Math.floor(dmg * player.vampiric / 100));
      }
      monHps[i] = Math.max(0, monHps[i] - dmg);
      addLog(`  ${mon.displayName}に${dmg}ダメ(残${monHps[i]})`, isCrit ? "#fbbf24" : "#86efac");
      turns.push({ actor:"player", target:i, type:"attack", dmg, isCrit, hpLeft:monHps[i] });

      if (monHps[i] <= 0) {
        addLog(`  ⚔ ${mon.displayName}撃破！`, "#4ade80");
        totalExp  += mon.expGain;
        totalGold += mon.goldGain;
        if (Math.random() < 0.60) materials.push(mon.material);
        if (mon.id === "moss_slime" && Math.random() < 0.60) materials.push(mon.material);
        if (Math.random() < 0.03) drops.push(`${mon.displayName}のドロップ品`);
        turns.push({ actor:"player", target:i, type:"defeat" });
      }
    });
  };

  const doEnemyAttack = () => {
    monsters.forEach((mon, i) => {
      if (monHps[i] <= 0) return;
      let rv = Math.random() * 100, ac = 0;
      const action = mon.actions.find(a => { ac += a.pct; return rv < ac; }) || mon.actions[0];
      if (action.type === "skip") {
        addLog(`  ${mon.displayName}:${action.label}`, "#3a3a3a");
        turns.push({ actor:"monster", source:i, type:"skip" });
        return;
      }
      if (action.type === "def") {
        addLog(`  ${mon.displayName}:${action.label}`, "#60a5fa");
        turns.push({ actor:"monster", source:i, type:"defend" });
        return;
      }
      if (Math.random() * 100 < player.eva) {
        addLog("  ✨ 回避！", "#34d399");
        turns.push({ actor:"monster", source:i, type:"miss" });
        return;
      }
      const isCrit = Math.random() * 100 < mon.crit;
      const atkS = action.type === "matk" ? mon.mag : mon.atk;
      const defS = action.type === "matk" ? player.mdef : player.def;
      let dmg = calcDamage(atkS, defS);
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      playerHp = Math.max(0, playerHp - dmg);
      addLog(
        `  ${mon.displayName}の${action.label}！${dmg}ダメ(自HP${playerHp})`,
        action.type === "matk" ? "#a78bfa" : "#f87171"
      );
      turns.push({ actor:"monster", source:i, type:"attack", dmg, isCrit, label:action.label, hpLeft:playerHp });
    });
  };

  for (let turn = 0; turn < 20 && playerHp > 0 && monHps.some(h => h > 0); turn++) {
    if (turn === 0 && !playerFirst) {
      doEnemyAttack();
      if (monHps.every(h => h <= 0) || playerHp <= 0) break;
      doPlayerAttack();
    } else {
      doPlayerAttack();
      if (monHps.every(h => h <= 0) || playerHp <= 0) break;
      doEnemyAttack();
    }
  }

  const won = monHps.every(h => h <= 0);
  if (!won && playerHp <= 0) addLog("💀 撤退…", "#f87171");

  if (turns.length === 0) {
    turns.push({ actor:"player", target:0, type:"skip" });
  }

  return {
    logs, turns, playerHpAfter: playerHp,
    totalExp, totalGold,
    materials, drops, won,
    monsters: monsters.map((m, i) => ({ ...m, hpLeft: monHps[i] })),
  };
};