import { SKILLS } from "../data/skills";

export const calcDamage = (atk, def) =>
  Math.max(1, Math.floor(atk * (100 / (100 + def))));

const getActiveSkills = (activeSkillSlots = []) =>
  activeSkillSlots.filter(Boolean).map(id => SKILLS[id]).filter(sk => sk?.active);

// 召喚物のテンプレート
const SUMMON_TEMPLATES = {
  familiar: { name:"使い魔",     icon:"👻", hp:15,  atkMul:0.4, statRef:"mag", position:"back",  speed:90, color:"#c084fc" },
  wolf:     { name:"オオカミ",   icon:"🐺", hp:50,  atkMul:0.6, statRef:"atk", position:"front", speed:70, color:"#a78bfa" },
  skeleton: { name:"スケルトン", icon:"💀", hp:20,  atkMul:0.3, statRef:"atk", position:"front", speed:60, color:"#e8e0d0" },
  turret:   { name:"タレット",   icon:"🔫", hp:50,  atkMul:0.3, statRef:"atk", position:"front", speed:50, color:"#9ca3af" },
  golem:    { name:"ゴーレム",   icon:"🗿", hp:100, atkMul:0.5, statRef:"atk", position:"front", speed:40, color:"#a16207" },
};

export const simulateBattle = (player, monsters, options = {}) => {
  const logs = [];
  const turns = [];
  const materials = [];
  const drops = [];
  let totalExp = 0, totalGold = 0;

  const activeSkills = getActiveSkills(player.activeSkillSlots || []);
  const skillMode = player.skillMode || "order";
  let skillIndex = 0;

  const learned = new Set(player.learnedSkills || []);
  let deathSaveUsed = false;
  let atkScale = 0;
  let defBuff = 0;
  let critBuff = 0;

  const addLog = (text, color = "#a0a0a0") => logs.push({ text, color });
  const pushTurn = (t) => turns.push(t);

  // ─── エンティティ生成 ───
  // プレイヤー
  const playerEntity = {
    uid:"player", side:"player", name:"あなた", icon:"🧙",
    hp: player.hp, maxHp: player.maxHp,
    atk: player.atk, mag: player.mag, def: player.def, mdef: player.mdef,
    eva: player.eva, crit: player.crit, critDmg: player.critDmg || 150,
    speed: 100 + player.eva,
    position:"front",
  };

  // 敵
  const enemies = monsters.map((m, i) => ({
    uid:`enemy${i}`, side:"enemy", idx:i,
    name:m.displayName, icon:"", 
    hp:m.hp, maxHp:m.maxHp,
    atk:m.atk, mag:m.mag, def:m.def, mdef:m.mdef,
    eva:m.eva, crit:m.crit,
    speed: m.speed || 50,
    actions:m.actions,
    expGain:m.expGain, goldGain:m.goldGain, material:m.material,
    isBoss:m.isBoss, rarity:m.rarity, displayName:m.displayName,
    ref:m,
  }));

  // 召喚物リスト（戦闘中に追加される）
  const allies = [];

  if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) {
    pushTurn({ actor:"player", target:0, type:"skip", logText:"戦闘不能…", logColor:"#f87171" });
    return {
      logs, turns, playerHpAfter: Math.max(1, playerEntity.hp),
      totalExp, totalGold, materials, drops,
      won: enemies.every(e => e.hp <= 0),
      monsters: monsters.map((m, i) => ({ ...m, hpLeft: enemies[i].hp })),
    };
  }

  // 影移動（先制）
  const hasShadow = learned.has("th_shadow");
  if (hasShadow) {
    playerEntity.speed += 9999;
    pushTurn({ actor:"player", target:-1, type:"info", logText:"🌑 影移動！先手を取った！", logColor:"#a78bfa" });
  }

  // ─── ターゲット選択 ───
  const aliveEnemies = () => enemies.filter(e => e.hp > 0);
  const aliveAllies  = () => allies.filter(a => a.hp > 0);
  const aliveFrontAllies = () => allies.filter(a => a.hp > 0 && a.position === "front");

  const pickEnemyTarget = () => {
    const alive = aliveEnemies();
    if (alive.length === 0) return null;
    return alive.reduce((lo, e) => e.hp < lo.hp ? e : lo, alive[0]);
  };

  // 敵がプレイヤー側の誰を狙うか
  const pickPlayerSideTarget = () => {
    const front = aliveFrontAllies();
    if (front.length > 0) return front[Math.floor(Math.random() * front.length)];
    // 前衛がいなければプレイヤー優先、後衛召喚物も候補
    return playerEntity.hp > 0 ? playerEntity : (aliveAllies()[0] || null);
  };

  const pickSkill = () => {
    if (activeSkills.length === 0) return null;
    if (skillMode === "random") return activeSkills[Math.floor(Math.random() * activeSkills.length)];
    const sk = activeSkills[skillIndex % activeSkills.length];
    skillIndex++;
    return sk;
  };

  // ─── ダメージ適用（敵へ）───
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
      if (learned.has("sw_musou")) atkScale += 5;
    }
  };

  // ─── プレイヤーの行動 ───
  const playerAct = () => {
    const effAtk = playerEntity.atk + atkScale;
    const effCrit = playerEntity.crit + critBuff;
    critBuff = 0;

    // 暗殺
    if (learned.has("th_assassin")) {
      const t = aliveEnemies().find(e => !e.isBoss && e.hp <= e.maxHp * 0.20);
      if (t) {
        const killDmg = t.hp;
        t.hp = 0;
        pushTurn({ actor:"player", target:t.idx, type:"attack", dmg:killDmg, isCrit:true, label:"暗殺", hpLeft:0, logText:`☠ 暗殺！${t.name}を仕留めた！`, logColor:"#8b5cf6" });
        pushTurn({ actor:"player", target:t.idx, type:"defeat", logText:`⚔ ${t.name}撃破！`, logColor:"#4ade80" });
        totalExp += t.expGain; totalGold += t.goldGain;
        if (Math.random() < 0.60) materials.push(t.material);
        return;
      }
    }

    const skill = pickSkill();
    const target = pickEnemyTarget();
    if (!target) return;

    if (skill?.active) {
      const a = skill.active;

      // 召喚
      if (a.type === "summon") {
        const tmpl = SUMMON_TEMPLATES[a.summonType];
        if (tmpl) {
          const count = a.count || 1;
          for (let c = 0; c < count; c++) {
            allies.push({
              uid:`ally_${a.summonType}_${allies.length}`, side:"ally",
              name:tmpl.name, icon:tmpl.icon, color:tmpl.color,
              hp:tmpl.hp, maxHp:tmpl.hp,
              atkMul:tmpl.atkMul, statRef:tmpl.statRef,
              position:tmpl.position, speed:tmpl.speed,
              summonType:a.summonType,
            });
          }
          const snapshot = allies.filter(al=>al.hp>0).map(al=>({ summonType:al.summonType, position:al.position, hp:al.hp, maxHp:al.maxHp }));
          pushTurn({ actor:"player", target:-1, type:"summon", summonType:a.summonType, summonSnapshot:snapshot, logText:`${tmpl.icon} ${tmpl.name}を召喚！`, logColor:tmpl.color });
        }
        return;
      }

      if (a.type === "attack" || a.type === "magic") {
        const baseStat = a.type === "magic" ? playerEntity.mag : effAtk;
        const isCrit = Math.random() * 100 < effCrit;
        if (a.target === "all") {
          aliveEnemies().forEach(e => {
            let dmg = calcDamage(Math.floor(baseStat * a.dmgMul), a.type==="magic"?e.mdef:e.def);
            if (isCrit) dmg = Math.floor(dmg * effCritDmg(playerEntity) / 100);
            dealToEnemy(e, dmg, isCrit, skill.name);
          });
        } else {
          if (Math.random()*100 < target.eva) {
            pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" });
            return;
          }
          let dmg = calcDamage(Math.floor(baseStat * a.dmgMul), a.type==="magic"?target.mdef:target.def);
          if (isCrit) dmg = Math.floor(dmg * effCritDmg(playerEntity) / 100);
          dealToEnemy(target, dmg, isCrit, skill.name);
        }
        return;
      }

      if (a.type === "multiAttack") {
        for (let h = 0; h < a.hits; h++) {
          if (target.hp <= 0) break;
          if (Math.random()*100 < target.eva) { pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" }); continue; }
          const isCrit = Math.random()*100 < effCrit;
          let dmg = calcDamage(Math.floor(effAtk * a.dmgMul), target.def);
          if (isCrit) dmg = Math.floor(dmg * effCritDmg(playerEntity)/100);
          dealToEnemy(target, dmg, isCrit, `${skill.name}(${h+1})`);
        }
        return;
      }

      if (a.type === "fixedDmg") {
        const dmg = a.base + Math.floor(effAtk * 0.3);
        dealToEnemy(target, dmg, false, skill.name);
        return;
      }

      if (a.type === "buff") {
        if (a.stat === "def") { defBuff = Math.floor(playerEntity.def * a.mul); pushTurn({ actor:"player", target:-1, type:"buff", label:skill.name, logText:`🛡 ${skill.name}！DEF+${defBuff}`, logColor:"#60a5fa" }); }
        else if (a.stat === "crit") { critBuff = a.val; pushTurn({ actor:"player", target:-1, type:"buff", label:skill.name, logText:`🎯 ${skill.name}！次の攻撃クリ率+${a.val}%`, logColor:"#fbbf24" }); }
        return;
      }
    }

    // 通常攻撃
    if (Math.random()*100 < target.eva) {
      pushTurn({ actor:"player", target:target.idx, type:"miss", logText:`${target.name}は回避！`, logColor:"#34d399" });
      return;
    }
    const isCrit = Math.random()*100 < effCrit;
    let dmg = calcDamage(effAtk, target.def);
    if (isCrit) dmg = Math.floor(dmg * effCritDmg(playerEntity)/100);
    dealToEnemy(target, dmg, isCrit);
  };

  const effCritDmg = (e) => e.critDmg || 150;

  // ─── 召喚物の行動 ───
  const allyAct = (ally) => {
    const target = pickEnemyTarget();
    if (!target) return;
    const baseStat = ally.statRef === "mag" ? playerEntity.mag : (playerEntity.atk + atkScale);
    let dmg = calcDamage(Math.floor(baseStat * ally.atkMul), target.def);
    if (Math.random()*100 < target.eva) {
      pushTurn({ actor:"ally", target:target.idx, type:"miss", logText:`${ally.name}の攻撃は回避された`, logColor:"#34d399" });
      return;
    }
    // 戦術家・指揮官
    if (learned.has("ex_tactician")) atkScale += 1;
    if (learned.has("ex_commander")) atkScale += 2;
    dealToEnemy(target, dmg, false, null, ally.name);
  };

  // ─── 敵の行動 ───
  const enemyAct = (enemy) => {
    let rv = Math.random()*100, ac = 0;
    const action = enemy.actions.find(a => { ac += a.pct; return rv < ac; }) || enemy.actions[0];
    if (action.type === "skip") { pushTurn({ actor:"monster", source:enemy.idx, type:"skip", logText:`${enemy.name}:${action.label}`, logColor:"#3a3a3a" }); return; }
    if (action.type === "def")  { pushTurn({ actor:"monster", source:enemy.idx, type:"defend", logText:`${enemy.name}:${action.label}`, logColor:"#60a5fa" }); return; }

    const victim = pickPlayerSideTarget();
    if (!victim) return;

    // 召喚物が狙われた場合
    if (victim.side === "ally") {
      const atkS = action.type === "matk" ? enemy.mag : enemy.atk;
      let dmg = calcDamage(atkS, 0);
      victim.hp = Math.max(0, victim.hp - dmg);
      pushTurn({ actor:"monster", source:enemy.idx, type:"attackAlly", allyUid:victim.uid, dmg, logText:`${enemy.name}の${action.label}！${victim.name}に${dmg}ダメージ`, logColor:"#f87171" });
      if (victim.hp <= 0) {
        const snapshot = allies.filter(al=>al.hp>0).map(al=>({ summonType:al.summonType, position:al.position, hp:al.hp, maxHp:al.maxHp }));
        pushTurn({ actor:"monster", source:enemy.idx, type:"allyDown", allyUid:victim.uid, summonSnapshot:snapshot, logText:`💥 ${victim.name}が倒れた…`, logColor:"#666" });
      }
      return;
    }

    // プレイヤーが狙われた
    if (Math.random()*100 < playerEntity.eva) { pushTurn({ actor:"monster", source:enemy.idx, type:"miss", logText:"✨ 攻撃を回避した！", logColor:"#34d399" }); return; }
    const isCrit = Math.random()*100 < enemy.crit;
    const atkS = action.type === "matk" ? enemy.mag : enemy.atk;
    const defS = (action.type === "matk" ? playerEntity.mdef : playerEntity.def) + defBuff;
    let dmg = calcDamage(atkS, defS);
    if (isCrit) dmg = Math.floor(dmg * 1.5);
    playerEntity.hp = Math.max(0, playerEntity.hp - dmg);

    if (learned.has("df_wound")) atkScale += 4;

    if (playerEntity.hp <= 0 && learned.has("df_undying") && !deathSaveUsed) {
      deathSaveUsed = true;
      playerEntity.hp = Math.max(1, Math.floor(playerEntity.maxHp * 0.10));
      pushTurn({ actor:"monster", source:enemy.idx, type:"attack", dmg, isCrit, label:action.label, hpLeft:playerEntity.hp, logText:`${enemy.name}の${action.label}！${dmg}ダメージ`, logColor:action.type==="matk"?"#a78bfa":"#f87171" });
      pushTurn({ actor:"player", target:-1, type:"info", logText:`💫 不屈！HP${playerEntity.hp}で耐えた！`, logColor:"#fb923c" });
      return;
    }

    pushTurn({ actor:"monster", source:enemy.idx, type:"attack", dmg, isCrit, label:action.label, hpLeft:playerEntity.hp, logText:`${enemy.name}の${action.label}！${dmg}ダメージ`, logColor:action.type==="matk"?"#a78bfa":"#f87171" });

    // カウンター
    const hasCounter = (player.activeSkillSlots||[]).some(id => SKILLS[id]?.active?.type === "counter");
    if (hasCounter && playerEntity.hp > 0 && enemy.hp > 0) {
      const counterDmg = Math.floor(dmg * 1.5);
      dealToEnemy(enemy, counterDmg, false, "カウンター");
    }
  };

  // ─── メインループ（スピード順）───
  for (let round = 0; round < 30; round++) {
    if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) break;

    // 全エンティティを集めてスピード順にソート
    const order = [
      playerEntity,
      ...allies.filter(a => a.hp > 0),
      ...enemies.filter(e => e.hp > 0),
    ].sort((a, b) => b.speed - a.speed);

    for (const ent of order) {
      if (playerEntity.hp <= 0 || enemies.every(e => e.hp <= 0)) break;
      if (ent.hp <= 0) continue;

      if (ent.side === "player") playerAct();
      else if (ent.side === "ally") allyAct(ent);
      else if (ent.side === "enemy") enemyAct(ent);
    }
  }

  const won = enemies.every(e => e.hp <= 0);
  if (!won && playerEntity.hp <= 0) pushTurn({ actor:"player", target:-1, type:"info", logText:"💀 撤退…", logColor:"#f87171" });

  if (turns.length === 0) pushTurn({ actor:"player", target:0, type:"skip", logText:"様子を見ている…", logColor:"#3a3a3a" });

  return {
    logs, turns, playerHpAfter: playerEntity.hp,
    totalExp, totalGold, materials, drops, won,
    monsters: monsters.map((m, i) => ({ ...m, hpLeft: enemies[i].hp })),
    summonsUsed: allies.length > 0,
  };
};