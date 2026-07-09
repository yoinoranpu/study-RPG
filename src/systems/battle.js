import { SKILLS } from "../data/skills";
import { initStatusState, rankMul, changeRank, applyStatus, checkSkipTurn, tickStatuses, STATUS_DEFS } from "./status";

export const calcDamage = (atk, def) =>
  Math.max(1, Math.floor(atk * (100 / (100 + def))));

const getActiveSkills = (activeSkillSlots = []) =>
  activeSkillSlots.filter(Boolean).map(id => SKILLS[id]).filter(sk => sk?.active);

const SUMMON_TEMPLATES = {
  familiar: { name:"使い魔",     hp:15,  atkMul:0.4, statRef:"mag", position:"back",  speed:90, color:"#c084fc" },
  wolf:     { name:"オオカミ",   hp:50,  atkMul:0.6, statRef:"atk", position:"front", speed:70, color:"#a78bfa" },
  skeleton: { name:"スケルトン", hp:20,  atkMul:0.3, statRef:"atk", position:"front", speed:60, color:"#e8e0d0" },
  turret:   { name:"タレット",   hp:50,  atkMul:0.3, statRef:"atk", position:"front", speed:50, color:"#9ca3af" },
  golem:    { name:"ゴーレム",   hp:100, atkMul:0.5, statRef:"atk", position:"front", speed:40, color:"#a16207" },
};

export const simulateBattle = (player, monsters, options = {}) => {
  const logs = [];
  const turns = [];
  const materials = [];
  const drops = [];
  let totalExp = 0, totalGold = 0;

  // ─── スケール値 ───
  // session: ダンジョン探索中ずっと累積（帰還でリセット）
  const sessionScale = { atk: 0, mag: 0, ...(options.sessionScale || {}) };
  // battle: この戦闘だけ
  let battleAtk = 0;
  let battleEva = 0;
  let battleCrit = 0;

  const activeSkills = getActiveSkills(player.activeSkillSlots || []);
  const skillMode = player.skillMode || "order";
  let skillIndex = 0;

  const learned = new Set(player.learnedSkills || []);
  let deathSaveUsed = false;
  let defBuff = 0;
  let critBuff = 0;

  const addLog = (text, color = "#a0a0a0") => logs.push({ text, color });
  const pushTurn = (t) => turns.push(t);

  const playerEntity = {
    uid:"player", side:"player", name:"あなた",
    hp: player.hp, maxHp: player.maxHp,
    atk: player.atk, mag: player.mag, def: player.def, mdef: player.mdef,
    eva: player.eva, crit: player.crit, critDmg: player.critDmg || 150,
    speed: 100 + player.eva,
    position:"front",
    ...initStatusState(),
  };

  const enemies = monsters.map((m, i) => ({
    uid:`enemy${i}`, side:"enemy", idx:i,
    name:m.displayName,
    hp:m.hp, maxHp:m.maxHp,
    atk:m.atk, mag:m.mag, def:m.def, mdef:m.mdef,
    eva:m.eva, crit:m.crit,
    speed: m.speed || 50,
    actions:m.actions,
    expGain:m.expGain, goldGain:m.goldGain, material:m.material,
    isBoss:m.isBoss, rarity:m.rarity, displayName:m.displayName,
    ...initStatusState(),
  }));

  const allies = [];

  // ─── 実効ステータス（スケール + ランク補正）───
  const eAtk = (e) => {
    const bonus = e.side === "player" ? (sessionScale.atk + battleAtk) : 0;
    return Math.floor((e.atk + bonus) * rankMul(e.ranks?.atk));
  };
  const eMag = (e) => {
    const bonus = e.side === "player" ? sessionScale.mag : 0;
    return Math.floor((e.mag + bonus) * rankMul(e.ranks?.mag));
  };
  const eDef  = (e) => Math.floor((e.def + (e.side==="player" ? defBuff : 0)) * rankMul(e.ranks?.def));
  const eMdef = (e) => Math.floor(e.mdef * rankMul(e.ranks?.mdef));
  const eSpd  = (e) => Math.floor(e.speed * rankMul(e.ranks?.spd));
  const eEva = (e) => {
    const bonus = e.side === "player" ? battleEva : 0;
    return Math.floor((e.eva + bonus) * rankMul(e.ranks?.eva));
  };
  const eCrit = (e) => e.side === "player" ? (e.crit + battleCrit + critBuff) : e.crit;

  if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) {
    pushTurn({ actor:"player", target:0, type:"skip", logText:"戦闘不能…", logColor:"#f87171" });
    return {
      logs, turns, playerHpAfter: Math.max(1, playerEntity.hp),
      totalExp, totalGold, materials, drops,
      won: enemies.every(e => e.hp <= 0),
      monsters: monsters.map((m, i) => ({ ...m, hpLeft: enemies[i].hp })),
      sessionScaleAfter: sessionScale,
    };
  }

  const hasShadow = learned.has("th_shadow");
  if (hasShadow) {
    playerEntity.speed += 9999;
    pushTurn({ actor:"player", target:-1, type:"info", logText:"🌑 影移動！先手を取った！", logColor:"#a78bfa" });
  }

  // 開始時にスケール表示（累積があれば）
  if (sessionScale.atk > 0 || sessionScale.mag > 0) {
    const parts = [];
    if (sessionScale.atk > 0) parts.push(`ATK+${sessionScale.atk}`);
    if (sessionScale.mag > 0) parts.push(`MAG+${sessionScale.mag}`);
    pushTurn({ actor:"player", target:-1, type:"info", logText:`📈 累積ボーナス ${parts.join(" ")}`, logColor:"#f59e0b" });
  }

  const aliveEnemies = () => enemies.filter(e => e.hp > 0);
  const aliveAllies  = () => allies.filter(a => a.hp > 0);
  const aliveFrontAllies = () => allies.filter(a => a.hp > 0 && a.position === "front");

  const pickEnemyTarget = () => {
    const alive = aliveEnemies();
    if (alive.length === 0) return null;
    return alive.reduce((lo, e) => e.hp < lo.hp ? e : lo, alive[0]);
  };

  const pickPlayerSideTarget = () => {
    const front = aliveFrontAllies();
    if (front.length > 0) return front[Math.floor(Math.random() * front.length)];
    return playerEntity.hp > 0 ? playerEntity : (aliveAllies()[0] || null);
  };

  const pickSkill = () => {
    if (activeSkills.length === 0) return null;
    if (skillMode === "random") return activeSkills[Math.floor(Math.random() * activeSkills.length)];
    const sk = activeSkills[skillIndex % activeSkills.length];
    skillIndex++;
    return sk;
  };

  // ─── スケールトリガー ───
  const onPlayerAttack = () => {
    if (learned.has("sw_kenshin")) sessionScale.atk += 2;   // 研鑽
  };
  const onPlayerCast = () => {
    if (learned.has("mg_accumulate")) sessionScale.mag += 3; // 魔力蓄積
  };
  const onPlayerCrit = () => {
    if (learned.has("bw_hawkeye")) battleEva += 5;           // 鷹の目覚醒
  };
  const onTurnPassed = () => {
    if (learned.has("bw_snipeeye")) battleCrit += 5;         // 狙撃眼
  };
  const onPlayerHurt = () => {
    if (learned.has("df_wound")) battleAtk += 4;             // 傷の怒り
  };
  const onEnemyKilled = () => {
    if (learned.has("sw_musou")) sessionScale.atk += 5;      // 無双
  };
  const onPoisonTick = () => {
    if (learned.has("th_toxicscale")) sessionScale.atk += 3; // 毒蓄積
  };
  const onSummonHit = () => {
    if (learned.has("ex_tactician")) { sessionScale.atk += 1; sessionScale.mag += 1; }
    if (learned.has("ex_commander")) { sessionScale.atk += 2; sessionScale.mag += 2; }
  };

  const tryApplyStatus = (target, a, sourceMag) => {
    const map = [
      ["poison", a.poison], ["burn", a.burn],
      ["paralyze", a.paralyze], ["freeze", a.freeze], ["stun", a.stun],
    ];
    map.forEach(([type, chance]) => {
      if (!chance || Math.random() >= chance) return;
      const applied = applyStatus(target, type, sourceMag);
      const def = STATUS_DEFS[type];
      if (applied) {
        pushTurn({ actor:"player", target:target.idx ?? -1, type:"status", statusType:type,
          logText:`${def.icon} ${target.name}は${def.name}状態！`, logColor:def.color });
      }
    });
  };

  const dealToEnemy = (enemy, dmg, isCrit, label, byWho="player") => {
    if (!enemy || enemy.hp <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - dmg);
    const prefix = byWho === "player" ? "" : `${byWho}の`;
    pushTurn({ actor:"player", target:enemy.idx, type:"attack", dmg, isCrit, label, hpLeft:enemy.hp,
      logText:`${prefix}${label ? label+"！" : "攻撃！"}${enemy.name}に${dmg}ダメージ`, logColor:isCrit?"#fbbf24":"#86efac" });
    if (enemy.hp <= 0) {
      totalExp += enemy.expGain; totalGold += enemy.goldGain;
      if (Math.random() < 0.60) materials.push(enemy.material);
      pushTurn({ actor:"player", target:enemy.idx, type:"defeat", logText:`⚔ ${enemy.name}撃破！`, logColor:"#4ade80" });
      onEnemyKilled();
    }
  };

  const playerAct = () => {
    const skipReason = checkSkipTurn(playerEntity);
    if (skipReason) {
      const def = STATUS_DEFS[skipReason];
      pushTurn({ actor:"player", target:-1, type:"skip", logText:`${def.icon} ${def.name}で動けない！`, logColor:def.color });
      return;
    }

    const myAtk = eAtk(playerEntity);
    const myMag = eMag(playerEntity);
    const myCrit = eCrit(playerEntity);
    critBuff = 0;

    if (learned.has("th_assassin")) {
      const t = aliveEnemies().find(e => !e.isBoss && e.hp <= e.maxHp * 0.20);
      if (t) {
        const killDmg = t.hp;
        t.hp = 0;
        pushTurn({ actor:"player", target:t.idx, type:"attack", dmg:killDmg, isCrit:true, label:"暗殺", hpLeft:0, logText:`☠ 暗殺！${t.name}を仕留めた！`, logColor:"#8b5cf6" });
        pushTurn({ actor:"player", target:t.idx, type:"defeat", logText:`⚔ ${t.name}撃破！`, logColor:"#4ade80" });
        totalExp += t.expGain; totalGold += t.goldGain;
        if (Math.random() < 0.60) materials.push(t.material);
        onEnemyKilled();
        return;
      }
    }

    const skill = pickSkill();
    const target = pickEnemyTarget();
    if (!target) return;

    if (skill?.active) {
      const a = skill.active;

      if (a.type === "summon") {
        const tmpl = SUMMON_TEMPLATES[a.summonType];
        if (tmpl) {
          const count = a.count || 1;
          for (let c = 0; c < count; c++) {
            allies.push({
              uid:`ally_${a.summonType}_${allies.length}`, side:"ally",
              name:tmpl.name, color:tmpl.color,
              hp:tmpl.hp, maxHp:tmpl.hp,
              atkMul:tmpl.atkMul, statRef:tmpl.statRef,
              position:tmpl.position, speed:tmpl.speed,
              summonType:a.summonType,
              ...initStatusState(),
            });
          }
          const snapshot = allies.filter(al=>al.hp>0).map(al=>({ summonType:al.summonType, position:al.position, hp:al.hp, maxHp:al.maxHp }));
          pushTurn({ actor:"player", target:-1, type:"summon", summonType:a.summonType, summonSnapshot:snapshot, logText:`${tmpl.name}を召喚！`, logColor:tmpl.color });
        }
        return;
      }

      if (a.type === "trap") {
        tryApplyStatus(target, a, myMag);
        pushTurn({ actor:"player", target:-1, type:"buff", label:skill.name, logText:`⚠ ${skill.name}を仕掛けた！`, logColor:"#fb923c" });
        return;
      }

      if (a.type === "attack" || a.type === "magic") {
        const isMagic = a.type === "magic";
        if (isMagic) onPlayerCast(); else onPlayerAttack();
        const baseStat = isMagic ? myMag : myAtk;
        const isCrit = Math.random() * 100 < myCrit;
        if (isCrit) onPlayerCrit();
        if (a.target === "all") {
          aliveEnemies().forEach(e => {
            let dmg = calcDamage(Math.floor(baseStat * a.dmgMul), isMagic ? eMdef(e) : eDef(e));
            if (isCrit) dmg = Math.floor(dmg * playerEntity.critDmg / 100);
            dealToEnemy(e, dmg, isCrit, skill.name);
            if (e.hp > 0) tryApplyStatus(e, a, myMag);
          });
        } else {
          if (Math.random()*100 < eEva(target)) {
            pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" });
            return;
          }
          let dmg = calcDamage(Math.floor(baseStat * a.dmgMul), isMagic ? eMdef(target) : eDef(target));
          if (isCrit) dmg = Math.floor(dmg * playerEntity.critDmg / 100);
          dealToEnemy(target, dmg, isCrit, skill.name);
          if (target.hp > 0) tryApplyStatus(target, a, myMag);
        }
        return;
      }

      if (a.type === "multiAttack") {
        onPlayerAttack();
        for (let h = 0; h < a.hits; h++) {
          if (target.hp <= 0) break;
          if (Math.random()*100 < eEva(target)) { pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" }); continue; }
          const isCrit = Math.random()*100 < myCrit;
          if (isCrit) onPlayerCrit();
          let dmg = calcDamage(Math.floor(myAtk * a.dmgMul), eDef(target));
          if (isCrit) dmg = Math.floor(dmg * playerEntity.critDmg/100);
          dealToEnemy(target, dmg, isCrit, `${skill.name}(${h+1})`);
        }
        return;
      }

      if (a.type === "fixedDmg") {
        onPlayerAttack();
        const dmg = a.base + Math.floor(myAtk * 0.3);
        dealToEnemy(target, dmg, false, skill.name);
        return;
      }

      if (a.type === "buff") {
        if (a.stat === "def") { defBuff = Math.floor(playerEntity.def * a.mul); pushTurn({ actor:"player", target:-1, type:"buff", label:skill.name, logText:`🛡 ${skill.name}！DEF+${defBuff}`, logColor:"#60a5fa" }); }
        else if (a.stat === "crit") { critBuff = a.val; pushTurn({ actor:"player", target:-1, type:"buff", label:skill.name, logText:`🎯 ${skill.name}！次の攻撃クリ率+${a.val}%`, logColor:"#fbbf24" }); }
        return;
      }
    }

    onPlayerAttack();
    if (Math.random()*100 < eEva(target)) {
      pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" });
      return;
    }
    const isCrit = Math.random()*100 < myCrit;
    if (isCrit) onPlayerCrit();
    let dmg = calcDamage(myAtk, eDef(target));
    if (isCrit) dmg = Math.floor(dmg * playerEntity.critDmg/100);
    dealToEnemy(target, dmg, isCrit);
  };

  const allyAct = (ally) => {
    if (checkSkipTurn(ally)) return;
    const target = pickEnemyTarget();
    if (!target) return;
    const baseStat = ally.statRef === "mag" ? eMag(playerEntity) : eAtk(playerEntity);
    if (Math.random()*100 < eEva(target)) {
      pushTurn({ actor:"ally", target:target.idx, type:"miss", logText:`${ally.name}の攻撃は回避された`, logColor:"#34d399" });
      return;
    }
    const dmg = calcDamage(Math.floor(baseStat * ally.atkMul), eDef(target));
    onSummonHit();
    dealToEnemy(target, dmg, false, null, ally.name);
  };

  const enemyAct = (enemy) => {
    const skipReason = checkSkipTurn(enemy);
    if (skipReason) {
      const def = STATUS_DEFS[skipReason];
      pushTurn({ actor:"monster", source:enemy.idx, type:"skip", logText:`${def.icon} ${enemy.name}は${def.name}で動けない！`, logColor:def.color });
      return;
    }

    let rv = Math.random()*100, ac = 0;
    const action = enemy.actions.find(a => { ac += a.pct; return rv < ac; }) || enemy.actions[0];
    if (action.type === "skip") { pushTurn({ actor:"monster", source:enemy.idx, type:"skip", logText:`${enemy.name}:${action.label}`, logColor:"#3a3a3a" }); return; }
    if (action.type === "def")  { pushTurn({ actor:"monster", source:enemy.idx, type:"defend", logText:`${enemy.name}:${action.label}`, logColor:"#60a5fa" }); return; }

    const victim = pickPlayerSideTarget();
    if (!victim) return;

    if (victim.side === "ally") {
      const atkS = action.type === "matk" ? eMag(enemy) : eAtk(enemy);
      const dmg = calcDamage(atkS, 0);
      victim.hp = Math.max(0, victim.hp - dmg);
      pushTurn({ actor:"monster", source:enemy.idx, type:"attackAlly", allyUid:victim.uid, dmg, logText:`${enemy.name}の${action.label}！${victim.name}に${dmg}ダメージ`, logColor:"#f87171" });
      if (victim.hp <= 0) {
        const snapshot = allies.filter(al=>al.hp>0).map(al=>({ summonType:al.summonType, position:al.position, hp:al.hp, maxHp:al.maxHp }));
        pushTurn({ actor:"monster", source:enemy.idx, type:"allyDown", allyUid:victim.uid, summonSnapshot:snapshot, logText:`💥 ${victim.name}が倒れた…`, logColor:"#666" });
      }
      return;
    }

    if (Math.random()*100 < eEva(playerEntity)) { pushTurn({ actor:"monster", source:enemy.idx, type:"miss", logText:"✨ 攻撃を回避した！", logColor:"#34d399" }); return; }
    const isCrit = Math.random()*100 < enemy.crit;
    const isMagic = action.type === "matk";
    const atkS = isMagic ? eMag(enemy) : eAtk(enemy);
    const defS = isMagic ? eMdef(playerEntity) : eDef(playerEntity);
    let dmg = calcDamage(atkS, defS);
    if (isCrit) dmg = Math.floor(dmg * 1.5);
    playerEntity.hp = Math.max(0, playerEntity.hp - dmg);
    onPlayerHurt();

    if (playerEntity.hp <= 0 && learned.has("df_undying") && !deathSaveUsed) {
      deathSaveUsed = true;
      playerEntity.hp = Math.max(1, Math.floor(playerEntity.maxHp * 0.10));
      pushTurn({ actor:"monster", source:enemy.idx, type:"attack", dmg, isCrit, label:action.label, hpLeft:playerEntity.hp, logText:`${enemy.name}の${action.label}！${dmg}ダメージ`, logColor:isMagic?"#a78bfa":"#f87171" });
      pushTurn({ actor:"player", target:-1, type:"info", logText:`💫 不屈！HP${playerEntity.hp}で耐えた！`, logColor:"#fb923c" });
      return;
    }

    pushTurn({ actor:"monster", source:enemy.idx, type:"attack", dmg, isCrit, label:action.label, hpLeft:playerEntity.hp, logText:`${enemy.name}の${action.label}！${dmg}ダメージ`, logColor:isMagic?"#a78bfa":"#f87171" });

    if (action.status) tryApplyStatus(playerEntity, action.status, eMag(enemy));

    const hasCounter = (player.activeSkillSlots||[]).some(id => SKILLS[id]?.active?.type === "counter");
    if (hasCounter && playerEntity.hp > 0 && enemy.hp > 0) {
      dealToEnemy(enemy, Math.floor(dmg * 1.5), false, "カウンター");
    }
  };

  const processStatusTick = (entity) => {
    const results = tickStatuses(entity);
    results.forEach(r => {
      if (entity.hp <= 0) return;
      entity.hp = Math.max(0, entity.hp - r.dmg);
      const def = STATUS_DEFS[r.type];
      const stackTxt = r.stacks ? `×${r.stacks}` : "";

      if (entity.side === "enemy") {
        pushTurn({ actor:"player", target:entity.idx, type:"statusDmg", statusType:r.type, dmg:r.dmg, hpLeft:entity.hp,
          logText:`${def.icon} ${entity.name}は${def.name}${stackTxt}で${r.dmg}ダメージ`, logColor:def.color });
        if (r.type === "poison") onPoisonTick();
        if (entity.hp <= 0) {
          totalExp += entity.expGain; totalGold += entity.goldGain;
          if (Math.random() < 0.60) materials.push(entity.material);
          pushTurn({ actor:"player", target:entity.idx, type:"defeat", logText:`⚔ ${entity.name}を${def.name}で倒した！`, logColor:"#4ade80" });
          onEnemyKilled();
        }
      } else if (entity.side === "player") {
        if (entity.hp <= 0 && learned.has("df_undying") && !deathSaveUsed) {
          deathSaveUsed = true;
          entity.hp = Math.max(1, Math.floor(entity.maxHp * 0.10));
        }
        pushTurn({ actor:"monster", source:-1, type:"statusDmg", statusType:r.type, dmg:r.dmg, hpLeft:entity.hp,
          logText:`${def.icon} ${def.name}${stackTxt}で${r.dmg}ダメージ`, logColor:def.color });
      } else {
        pushTurn({ actor:"monster", source:-1, type:"statusDmg", statusType:r.type, dmg:r.dmg,
          logText:`${def.icon} ${entity.name}は${def.name}で${r.dmg}ダメージ`, logColor:def.color });
      }
    });
  };

  for (let round = 0; round < 30; round++) {
    if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) break;

    const order = [
      playerEntity,
      ...allies.filter(a => a.hp > 0),
      ...enemies.filter(e => e.hp > 0),
    ].sort((a, b) => eSpd(b) - eSpd(a));

    for (const ent of order) {
      if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) break;
      if (ent.hp <= 0) continue;
      if (ent.side === "player") playerAct();
      else if (ent.side === "ally") allyAct(ent);
      else if (ent.side === "enemy") enemyAct(ent);
    }

    if (playerEntity.hp > 0) processStatusTick(playerEntity);
    enemies.filter(e => e.hp > 0).forEach(processStatusTick);
    allies.filter(a => a.hp > 0).forEach(processStatusTick);

    onTurnPassed();  // 狙撃眼
  }

  const won = enemies.every(e => e.hp <= 0);
  if (!won && playerEntity.hp <= 0) pushTurn({ actor:"player", target:-1, type:"info", logText:"💀 撤退…", logColor:"#f87171" });
  if (turns.length === 0) pushTurn({ actor:"player", target:0, type:"skip", logText:"様子を見ている…", logColor:"#3a3a3a" });

  return {
    logs, turns, playerHpAfter: playerEntity.hp,
    totalExp, totalGold, materials, drops, won,
    monsters: monsters.map((m, i) => ({ ...m, hpLeft: enemies[i].hp })),
    sessionScaleAfter: sessionScale,
  };
};