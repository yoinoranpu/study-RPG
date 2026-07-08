import { useState, useEffect, useRef, useCallback } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { rollEventType, rollNpcEvent, rollChest } from "../systems/events";
import { pickMonsters, getBossData, generateBoss } from "../systems/monsters";
import { simulateBattle } from "../systems/battle";
import TimerSettings from "../components/TimerSettings";
import { calcPlayerStats } from "../systems/playerStats";
import DungeonCanvas from "../components/DungeonCanvas";
import PlayerSprite from "../components/PlayerSprite";
import MonsterSprite from "../components/MonsterSprite";
import EventSprite from "../components/EventSprite";
import BattleEffect from "../components/BattleEffect";
import { calcExp, calcGold, calcFloorProgress, MAPPING_PER_SET, expToLevel, LEVEL_UNLOCKS } from "../systems/timer";
import { calcPassiveBonus } from "../data/skills";
import { openChest } from "../data/chest_table";
import { RARITY_COLOR } from "../data/items";

const EVENT_INTERVAL = 6 * 60 * 1000;
const BASE_MAX_EVENTS = 4;
const DEBUG = import.meta.env.DEV;

// ─── 宝箱開封コンポーネント ───
function ChestOpenSection({ chests, onAllOpened }) {
  const [opened, setOpened] = useState([]);
  const [current, setCurrent] = useState(0);

  const allOpened = current >= chests.length;

  useEffect(() => {
    if (allOpened) onAllOpened && onAllOpened();
  }, [allOpened]);

  function openNext() {
    if (current >= chests.length) return;
    setOpened(o => [...o, chests[current]]);
    setCurrent(c => c + 1);
  }

  function openAll() {
    setOpened(chests);
    setCurrent(chests.length);
  }

  return (
    <div style={{ width:"100%", maxWidth:320 }}>
      <div style={{ fontSize:8, color:"#fbbf24", letterSpacing:2, marginBottom:8 }}>
        宝箱 {current}/{chests.length}
      </div>

      {/* 未開封の宝箱（大きく） */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10, justifyContent:"center" }}>
        {chests.map((chest, i) => (
          <div key={i} style={{ fontSize: i < current ? 24 : 36, opacity: i < current ? 0.3 : 1, transition:"all 0.3s" }}>
            {i < current ? "📭" : chest.chestType?.icon || "📦"}
          </div>
        ))}
      </div>

      {/* 開封済みアイテム */}
      {opened.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
          {opened.map((chest, i) => (
            <div key={i} style={{ background:"#0d0d15", border:`1px solid ${chest.chestType?.color||"#2a2a3a"}44`, borderRadius:4, padding:"6px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{chest.chestType?.icon || "📦"}</span>
              <div style={{ flex:1 }}>
                {chest.type === "gold" ? (
                  <span style={{ fontSize:10, color:"#fbbf24" }}>+{chest.gold}G</span>
                ) : (
                  <span style={{ fontSize:10, color: RARITY_COLOR[chest.item?.rarity]||"#e8e0d0" }}>
                    {chest.item?.icon} {chest.item?.name}
                  </span>
                )}
              </div>
              <span style={{ fontSize:8, color:chest.chestType?.color||"#888" }}>
                {chest.chestType?.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {!allOpened ? (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={openNext} style={{ flex:2, padding:"12px 0", background:"#0a1a0a", border:"1px solid #fbbf24", borderRadius:4, cursor:"pointer", color:"#fbbf24", fontSize:13, fontFamily:"monospace", fontWeight:700 }}>
            📦 開封！
          </button>
          <button onClick={openAll} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #333", borderRadius:4, cursor:"pointer", color:"#555", fontSize:10, fontFamily:"monospace" }}>
            全開封
          </button>
        </div>
      ) : (
        <div style={{ textAlign:"center", fontSize:9, color:"#4ade80" }}>全ての宝箱を開封した！</div>
      )}
    </div>
  );
}

// ─── メインコンポーネント ───
export default function DungeonPage({ onBack }) {
  const player = usePlayerStore();
  const { updatePlayer } = usePlayerStore();

  const [workMin, setWorkMin]     = useState(player.timerWork);
  const [breakMin, setBreakMin]   = useState(player.timerBreak);
  const [totalSets, setTotalSets] = useState(player.timerSets);
  const [phase, setPhase]         = useState("work");
  const [currentSet, setCurrentSet] = useState(1);
  const [seconds, setSeconds]     = useState(player.timerWork * 60);
  const [totalSec, setTotalSec]   = useState(player.timerWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mapping, setMapping]     = useState(player.floorMapping || 0);
  const [floor, setFloor]         = useState(player.floor || 1);
  const [hp, setHp]               = useState(player.hp || 100);
  const [eventCount, setEventCount] = useState(0);
  const [logs, setLogs]           = useState([{ id:0, text:"ダンジョンに到着した…", color:"#86efac" }]);
  const [battlePopup, setBattlePopup] = useState(null);
  const [showResult, setShowResult]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMonster, setCurrentMonster] = useState(null);
  const [monsterVisible, setMonsterVisible] = useState(false);
  const [currentEvent, setCurrentEvent]     = useState(null);
  const [eventVisible, setEventVisible]     = useState(false);
  const [monsterArrived, setMonsterArrived] = useState(false);
  const [battleEffectActive, setBattleEffectActive] = useState(false);
  const [battleTurns, setBattleTurns] = useState([]);
  const [playerDefeated, setPlayerDefeated] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [bossFloor, setBossFloor] = useState(false);
  const [bossMonster, setBossMonster] = useState(null);
  const [chestsAllOpened, setChestsAllOpened] = useState(false);
 
  

  const logId         = useRef(1);
  const sessionExp    = useRef(0);
  const sessionGold   = useRef(0);
  const sessionMats   = useRef({});
  const sessionChests = useRef([]);
  const defeatedList  = useRef([]);
  const floorRef      = useRef(player.floor || 1);
  const mappingRef    = useRef(player.floorMapping || 0);
  const hpRef         = useRef(player.hp || 100);
  const eventCountRef = useRef(0);
  const pendingBattleRef = useRef(null);
  const passiveBonusRef  = useRef({});

  useEffect(() => {
    passiveBonusRef.current = calcPassiveBonus(player.passiveSkillSlots || []);
  }, [player.passiveSkillSlots]);

  const addLog = useCallback((text, color="#666") => {
    setLogs(l => [...l, { id:logId.current++, text, color }]);
  }, []);

  // 鍵なしボス階層：自動退却
  useEffect(() => {
    if (!bossFloor) return;
    const keyEffect = floor <= 35 ? "boss_key_1" : floor <= 70 ? "boss_key_2" : "boss_key_3";
    const hasKey = (player.specialSlots||[]).some(s => s?.effect === keyEffect)
      || (player.itemBox||[]).some(it => it.effect === keyEffect);
    if (!hasKey) {
      const timer = setTimeout(() => {
        setBossFloor(false);
        floorRef.current -= 1;
        setFloor(floorRef.current);
        mappingRef.current = 99;
        setMapping(99);
        addLog(`🔒 鍵がなく退却…B${floorRef.current}Fに戻った`, "#f87171");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bossFloor, floor, player.specialSlots, player.itemBox, addLog]);

  // 鍵ありボス階層：自動挑戦
  useEffect(() => {
    if (!bossFloor) return;
    const keyEffect = floor <= 35 ? "boss_key_1" : floor <= 70 ? "boss_key_2" : "boss_key_3";
    const keyItem = (player.specialSlots||[]).find(s => s?.effect === keyEffect)
      || (player.itemBox||[]).find(it => it.effect === keyEffect);
    if (!keyItem) return;
    const timer = setTimeout(() => {
      const newSlots = (player.specialSlots||[]).map(s => s?.effect === keyEffect ? null : s);
      const newBox = (player.itemBox||[]).filter(it => it.uid !== keyItem.uid);
      updatePlayer({ specialSlots: newSlots, itemBox: newBox });
      const bossData = getBossData(floor);
      if (!bossData) return;
      const boss = generateBoss(bossData);
      if (!boss) return;
      setBossFloor(false);
      setBossMonster(boss);
      setCurrentMonster(boss);
      setMonsterVisible(true);
      setMonsterArrived(false);
      const baseStats = calcPlayerStats(player);
      const ps = {
        ...baseStats,
        hp:Math.max(1, hpRef.current),
        maxHp:baseStats.maxHp,
        activeSkillSlots: player.activeSkillSlots || [],
        skillMode: player.skillMode || "order",
        learnedSkills: player.learnedSkills || [],
      };
      const result = simulateBattle(ps, [boss]);
      pendingBattleRef.current = { result, monsters:[boss], isBoss:true };
      addLog(`🔥 ${boss.displayName}が現れた！`, "#ef4444");
    }, 3000);
    return () => clearTimeout(timer);
  }, [bossFloor, floor, player.specialSlots, player.itemBox, addLog, updatePlayer]);

  const addMapping = useCallback((amount) => {
    const bonus = passiveBonusRef.current.mapBonus || 0;
    const actual = amount * (1 + bonus / 100);
    const result = calcFloorProgress(mappingRef.current, actual);
    mappingRef.current = result.mapping;
    if (result.newFloor) {
      floorRef.current += 1;
      setFloor(floorRef.current);
      addLog(`🗺 B${floorRef.current}Fに到達！`, "#60a5fa");
      if (floorRef.current % 5 === 0) {
        setTimeout(() => {
          setShowBossWarning(true);
          setTimeout(() => { setShowBossWarning(false); setBossFloor(true); }, 3000);
        }, 500);
        addLog(`⚠ B${floorRef.current}F ボス階層！`, "#ef4444");
      }
      const RARITY_UNLOCKS = { 10:"uncommon", 25:"rare", 50:"epic", 75:"legendary" };
      const unlocked = RARITY_UNLOCKS[floorRef.current];
      if (unlocked) {
        setTimeout(() => { updatePlayer({ unlockedRarity: unlocked, maxFloor: floorRef.current }); }, 0);
        addLog(`🎉 ${unlocked.toUpperCase()}装備が解放された！`, "#fbbf24");
      }
    }
    setMapping(result.mapping);
  }, [addLog, updatePlayer]);

  const fireEvent = useCallback(() => {
    if (eventCountRef.current >= BASE_MAX_EVENTS) return;
    const evType = rollEventType();
    eventCountRef.current += 1;
    setEventCount(eventCountRef.current);

    if (evType === "battle") {
      console.log("activeSkillSlots:", player.activeSkillSlots);
      console.log("skillMode:", player.skillMode);
      const monsters = pickMonsters(floorRef.current);
      addLog(`⚔ ${monsters.map(m=>m.displayName).join("と")}が現れた！`, "#f87171");
      setCurrentEvent(null); setEventVisible(false);
      setCurrentMonster(monsters[0]); setMonsterVisible(true); setMonsterArrived(false);
      const baseStats = calcPlayerStats(player);
      const ps = {
        ...baseStats,
        hp:Math.max(1, hpRef.current),
        maxHp:baseStats.maxHp,
        activeSkillSlots: player.activeSkillSlots || [],
        skillMode: player.skillMode || "order",
        learnedSkills: player.learnedSkills || [],
      };
      const result = simulateBattle(ps, monsters);
      pendingBattleRef.current = { result, monsters };

    } else if (evType === "chest") {
      const chestRarity = rollChest();
      const result = openChest(chestRarity.id || "common", floorRef.current);
      if (result.type === "gold") {
        const bonusGold = Math.floor(result.gold * (1 + (passiveBonusRef.current.goldBonus||0)/100));
        sessionGold.current += bonusGold;
        result.gold = bonusGold;
        addLog(`${result.chestType?.icon||"📦"} ${result.chestType?.label}を開けた！+${bonusGold}G`, "#fbbf24");
      } else {
        addLog(`${result.chestType?.icon||"📦"} ${result.chestType?.label}を発見！`, result.chestType?.color||"#fbbf24");
      }
      sessionChests.current.push(result);
      setMonsterVisible(false); setCurrentMonster(null);
      setCurrentEvent("chest"); setEventVisible(true); setMonsterArrived(false);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, 6000);

    } else if (evType === "trap") {
      const dmg = Math.floor(Math.random()*15+5);
      hpRef.current = Math.max(1, hpRef.current-dmg); setHp(hpRef.current);
      addLog(`⚠ 罠発動！${dmg}ダメージ！`, "#fb923c");
      setMonsterVisible(false); setCurrentMonster(null);
      setCurrentEvent("trap"); setEventVisible(true); setMonsterArrived(false);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, 4000);

    } else {
      const ev = rollNpcEvent();
      addLog(`${ev.icon} ${ev.text}`, ev.color);
      if (ev.effect==="heal") { hpRef.current=player.maxHp||100; setHp(hpRef.current); }
      if (ev.effect==="map") addMapping(5);
      setMonsterVisible(false); setCurrentMonster(null);
      setCurrentEvent(ev.effect==="heal"?"heal":ev.effect==="buff"?"fairy":"npc");
      setEventVisible(true); setMonsterArrived(false);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, 5000);
    }
  }, [addLog, addMapping, player]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (s > 1) return s - 1;
        if (phase === "work") {
          const expBonus  = passiveBonusRef.current.expBonus  || 0;
          const goldBonus = passiveBonusRef.current.goldBonus || 0;
          const exp  = Math.floor(calcExp(workMin)  * (1 + expBonus  / 100));
          const gold = Math.floor(calcGold(workMin) * (1 + goldBonus / 100));
          sessionExp.current  += exp;
          sessionGold.current += gold;
          addMapping(MAPPING_PER_SET);
          addLog(`✨ ${workMin}分完了！ +${exp}EXP +${gold}G`, "#fbbf24");
          if (currentSet >= totalSets) {
            setIsRunning(false);
            setShowResult(true);
            return 0;
          }
          setPhase("break");
          setCurrentSet(c => c + 1);
          eventCountRef.current = 0;
          setEventCount(0);
          const t = breakMin * 60;
          setTotalSec(t);
          addLog("🔥 キャンプ休憩…", "#a78bfa");
          return t;
        } else {
          setPhase("work");
          const t = workMin * 60;
          setTotalSec(t);
          addLog(`⚔ セット${currentSet + 1}開始！`, "#86efac");
          return t;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, phase, workMin, breakMin, currentSet, totalSets, addLog, addMapping]);

  useEffect(() => {
    if (!isRunning || phase !== "work") return;
    const id = setInterval(() => {
      if (eventCountRef.current >= BASE_MAX_EVENTS) return;
      if (Math.random() >= 0.70) return;
      fireEvent();
    }, EVENT_INTERVAL);
    return () => clearInterval(id);
  }, [isRunning, phase, fireEvent]);

  const handleResultClose = () => {
    const newMats = { ...(player.materials||{}) };
    Object.entries(sessionMats.current).forEach(([k,v]) => { newMats[k] = (newMats[k]||0)+v; });
    const studiedMinutes = workMin * currentSet;
    const oldLv = expToLevel(player.totalExp);
    const newTotalExp = player.totalExp + sessionExp.current;
    const newLv = expToLevel(newTotalExp);
    if (newLv > oldLv) {
      for (let lv = oldLv + 1; lv <= newLv; lv++) {
        const unlock = LEVEL_UNLOCKS[lv];
        if (unlock) addLog(`🎉 Lv${lv}到達！${unlock.label}`, "#fbbf24");
      }
    }
    // 宝箱アイテムをアイテムボックスに追加
    const newItemBox = [...(player.itemBox||[])];
    sessionChests.current.forEach(chest => {
      if (chest.type === "item" && chest.item && newItemBox.length < 30) {
        newItemBox.push(chest.item);
      }
    });
    updatePlayer({
      totalExp: newTotalExp,
      gold:     player.gold + sessionGold.current,
      floor:    floorRef.current,
      maxFloor: Math.max(player.maxFloor||1, floorRef.current),
      floorMapping: mappingRef.current,
      hp:       hpRef.current,
      materials: newMats,
      itemBox:  newItemBox,
      timerWork: workMin, timerBreak: breakMin, timerSets: totalSets,
      studyMinutesTotal: (player.studyMinutesTotal||0) + studiedMinutes,
      studyMinutesToday: (player.studyMinutesToday||0) + studiedMinutes,
      studyMinutesWeek:  (player.studyMinutesWeek||0)  + studiedMinutes,
    });
    setShowResult(false);
    onBack();
  };

  const mins   = Math.floor(seconds / 60);
  const secs   = seconds % 60;
  const pct    = totalSec > 0 ? seconds / totalSec : 0;
  const accent = phase === "break" ? "#a78bfa" : "#4ade80";
  const lv     = expToLevel(player.totalExp);
  const maxHp  = player.maxHp || 100;



  if (showResult) return (
    
    <div style={{ height:"100vh", background:"#06060f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"monospace", padding:20, overflowY:"auto" }}>
      <div style={{ fontSize:9, letterSpacing:6, color:"#60a5fa" }}>EXPLORATION RESULT</div>
      <div style={{ fontSize:24, fontWeight:900, color:"#fff", letterSpacing:2 }}>探索終了</div>
      <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:8, padding:"16px 24px", width:"100%", maxWidth:320 }}>
        {[
          { label:"獲得EXP",  val:`+${sessionExp.current}`,             color:"#86efac" },
          { label:"獲得G",    val:`+${sessionGold.current}`,            color:"#fbbf24" },
          { label:"到達階層", val:`B${floorRef.current}F`,              color:"#60a5fa" },
          { label:"マップ率", val:`${Math.floor(mappingRef.current)}%`, color:"#60a5fa" },
          { label:"倒した敵", val:`${defeatedList.current.length}体`,   color:"#f87171" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:"#4a4a6a", fontSize:11 }}>{label}</span>
            <span style={{ color, fontSize:13, fontWeight:700 }}>{val}</span>
          </div>
        ))}
      </div>
      {Object.keys(sessionMats.current).length > 0 && (
        <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:"10px 16px", width:"100%", maxWidth:320 }}>
          <div style={{ fontSize:8, color:"#fb923c", marginBottom:6, letterSpacing:2 }}>獲得素材</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(sessionMats.current).map(([name, cnt]) => (
              <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#fb923c" }}>{name}×{cnt}</div>
            ))}
          </div>
        </div>
      )}
      {sessionChests.current.length > 0 && (
        <ChestOpenSection
          chests={sessionChests.current}
          onAllOpened={() => setChestsAllOpened(true)}
        />
      )}
      {(sessionChests.current.length === 0 || chestsAllOpened) && (
        <button onClick={handleResultClose} style={{ padding:"12px 32px", background:"#0a2a0a", border:"1px solid #4ade80", borderRadius:6, cursor:"pointer", color:"#4ade80", fontSize:12, letterSpacing:3, fontWeight:700 }}>
          街へ帰還 →
        </button>
      )}
    </div>
  );

  return (
    <div style={{ height:"100vh", background:"#000", fontFamily:"monospace", display:"flex", flexDirection:"column", position:"relative" }}>
      <DungeonCanvas isRunning={isRunning} isBreak={phase==="break"} isPaused={monsterArrived} />
      <PlayerSprite hp={hp} maxHp={maxHp} isRunning={isRunning} isBreak={phase==="break"} isDefeated={playerDefeated} />
      <MonsterSprite
        monster={currentMonster}
        isVisible={monsterVisible && !eventVisible}
        onReach={() => {
          setMonsterArrived(true);
          const pending = pendingBattleRef.current;
          if (!pending) return;
          const turnsToUse = pending.result.turns.length > 0
            ? pending.result.turns
            : [{ actor:"player", target:0, type:"skip" }];
          setBattleTurns(turnsToUse);
          setBattleEffectActive(true);
        }}
        floorY={null}
      />
      <EventSprite eventType={currentEvent} isVisible={eventVisible && !monsterVisible} onReach={() => setMonsterArrived(true)} />
      <BattleEffect
        isActive={battleEffectActive}
        turns={battleTurns}
        onTurnLog={(text, color) => addLog(text, color)}
        onPlayerHpUpdate={(newHp) => { hpRef.current = newHp; setHp(newHp); }}
        onMonsterHpUpdate={(idx, newHp) => { setCurrentMonster(m => m ? { ...m, hp: newHp } : m); }}
        onComplete={() => {
          const pending = pendingBattleRef.current;
          if (!pending) return;
          const { result, monsters } = pending;
          const baseStats = calcPlayerStats(player);
          const maxHpVal = baseStats.maxHp;
          let currentHp = Math.max(1, result.playerHpAfter);
          const slots = [...(player.specialSlots||[null,null,null])];
          let newItemBox = [...(player.itemBox||[])];
          slots.forEach((slot, i) => {
            if (!slot) return;
            const hpPct = currentHp / maxHpVal;
            let threshold = 0, healAmt = 0;
            if (slot.effect === "heal_30")  { threshold = 0.30; healAmt = Math.floor(maxHpVal * 0.30); }
            if (slot.effect === "heal_50")  { threshold = 0.40; healAmt = Math.floor(maxHpVal * 0.50); }
            if (slot.effect === "heal_100") { threshold = 0.25; healAmt = maxHpVal; }
            if (threshold > 0 && hpPct <= threshold) {
              currentHp = Math.min(maxHpVal, currentHp + healAmt);
              newItemBox = newItemBox.filter(x => x.uid !== slot.uid);
              slots[i] = null;
              addLog(`💊 ${slot.name}を使用！HP+${healAmt}`, "#38bdf8");
            }
          });
          hpRef.current = currentHp;
          setHp(currentHp);
          updatePlayer({ specialSlots: slots, itemBox: newItemBox });
          if (!result.won && result.playerHpAfter <= 0) {
            setPlayerDefeated(true);
            setTimeout(() => setPlayerDefeated(false), 6000);
          }
          result.logs.forEach(l => addLog(l.text, l.color));
          if (result.won) {
            if (pending.isBoss) {
              const bossGold = Math.floor(500 * (floor / 5));
              const bossExp  = Math.floor(100 * (floor / 5));
              sessionGold.current += bossGold;
              sessionExp.current  += bossExp;
              addLog(`🏆 ボス撃破！ +${bossExp}EXP +${bossGold}G`, "#fbbf24");
              sessionChests.current.push(rollChest());
              sessionChests.current.push(rollChest());
            }
            sessionExp.current += result.totalExp;
            sessionGold.current += result.totalGold;
            const dropBonus = passiveBonusRef.current.dropBonus || 0;
            result.materials.forEach(mat => {
              if (Math.random() < 0.60 * (1 + dropBonus/100)) {
                sessionMats.current[mat]=(sessionMats.current[mat]||0)+1;
              }
            });
            monsters.forEach(m => defeatedList.current.push(m));
            const newBook = { ...(player.monsterBook||{}) };
            monsters.forEach(m => {
              if (!newBook[m.id]) newBook[m.id] = { count:0, name:m.name, tribe:m.tribe, material:m.material };
              newBook[m.id].count += 1;
            });
            updatePlayer({ monsterBook: newBook });
            if (Math.random() < 0.25 * (1 + (passiveBonusRef.current.chestBonus||0)/100)) {
              const chestResult = openChest(rollChest().id || "common", floorRef.current);
              sessionChests.current.push(chestResult);
            }
            addMapping(2);
          }
          setBattlePopup({ monsters, won:result.won, exp:result.totalExp, gold:result.totalGold, materials:result.materials, dangerStar:Math.max(...monsters.map(m=>m.dangerStar)) });
          setBattleEffectActive(false);
          pendingBattleRef.current = null;
          setTimeout(() => setHp(currentHp), 100);
          setTimeout(() => { setMonsterVisible(false); setCurrentMonster(null); setMonsterArrived(false); setBattlePopup(null); }, 3000);
        }}
        monsterX={0.35} monsterY={0.72}
        playerX={0.72}  playerY={0.72}
      />

      {/* ボスWARNING演出 */}
      {showBossWarning && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ fontSize:11, letterSpacing:8, color:"#ef4444", marginBottom:8 }}>⚠ WARNING ⚠</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#ef4444", letterSpacing:4, textShadow:"0 0 20px #ef4444" }}>BOSS</div>
          <div style={{ fontSize:13, color:"#fbbf24", marginTop:8, letterSpacing:2 }}>B{floor}F ボスが出現した！</div>
          <div style={{ fontSize:9, color:"#666", marginTop:16 }}>準備はいいか？</div>
        </div>
      )}

      {/* ボス部屋 */}
      {bossFloor && !showBossWarning && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:9, gap:16 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:"#ef4444" }}>BOSS FLOOR</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>B{floor}F</div>
          {(() => {
            const keyEffect = floor <= 35 ? "boss_key_1" : floor <= 70 ? "boss_key_2" : "boss_key_3";
            const keyItem = (player.specialSlots||[]).find(s => s?.effect === keyEffect)
              || (player.itemBox||[]).find(it => it.effect === keyEffect);
            const hasKey = !!keyItem;
            return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:10, color:hasKey?"#4ade80":"#f87171" }}>
                  {hasKey ? `🗝 鍵あり: ${keyItem.name}` : "🔒 鍵がない！"}
                </div>
                {!hasKey && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:8, color:"#4a4a6a", textAlign:"center" }}>
                      {floor <= 35 ? "古びた鍵" : floor <= 70 ? "封印の鍵" : "禁忌の鍵"}を入手してください
                    </div>
                    <div style={{ fontSize:8, color:"#f87171" }}>自動的に前の階層に戻ります…</div>
                  </div>
                )}
                {hasKey && (
                  <div style={{ fontSize:8, color:"#4ade80" }}>自動的にボス戦闘を開始します…</div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ padding:"10px 16px", background:"rgba(0,0,0,0.9)", borderBottom:"1px solid #1a1a2a", display:"flex", alignItems:"center", gap:12, position:"relative", zIndex:1 }}>
        <button onClick={onBack} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:"4px 10px", cursor:"pointer", fontSize:10 }}>← 街へ</button>
        <button onClick={() => setShowSettings(true)} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:"4px 10px", cursor:"pointer", fontSize:10 }}>⚙</button>
        <div style={{ color:"#60a5fa", fontSize:12, letterSpacing:2 }}>B{floor}F</div>
        <div style={{ flex:1 }} />
        <div style={{ color:"#86efac", fontSize:10 }}>Lv{lv}</div>
        <div style={{ color:"#fbbf24", fontSize:10 }}>G {player.gold + sessionGold.current}</div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ color:"#f87171", fontSize:10 }}>♥</span>
          <div style={{ width:50, height:5, background:"#1a0a0a", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(hp/maxHp)*100}%`, background:hp/maxHp>0.5?"#4ade80":hp/maxHp>0.25?"#fbbf24":"#f87171", borderRadius:3, transition:"width 0.5s" }} />
          </div>
          <span style={{ color:"#555", fontSize:8 }}>{hp}</span>
        </div>
      </div>

      {/* メイン */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:16, position:"relative", zIndex:1 }}>
        <div style={{ position:"relative", width:180, height:180 }}>
          <svg width={180} height={180} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={90} cy={90} r={78} fill="none" stroke="#1a1a1a" strokeWidth={8} />
            <circle cx={90} cy={90} r={78} fill="none" stroke={accent} strokeWidth={8}
              strokeDasharray={`${2*Math.PI*78*pct} ${2*Math.PI*78}`}
              strokeLinecap="round"
              style={{ transition:"stroke-dasharray 0.5s linear", filter:`drop-shadow(0 0 6px ${accent})` }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:2 }}>
              {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
            </div>
            <div style={{ fontSize:10, color:accent, marginTop:4 }}>
              {phase==="break" ? "🔥 休憩中" : `SET ${currentSet}/${totalSets}`}
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:6 }}>
          {Array.from({ length:BASE_MAX_EVENTS }).map((_,i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:3, background:i<eventCount?"#fbbf24":"#1a1a1a", border:`1px solid ${i<eventCount?"#fbbf2488":"#333"}`, boxShadow:i<eventCount?"0 0 4px #fbbf2488":"none", transition:"all 0.3s" }} />
          ))}
          <span style={{ fontSize:8, color:"#4a4a6a", marginLeft:4 }}>EVENTS {eventCount}/{BASE_MAX_EVENTS}</span>
        </div>

        <div style={{ width:"100%", maxWidth:280 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#4a4a6a", marginBottom:4 }}>
            <span>マッピング B{floor}F</span><span>{Math.floor(mapping)}%</span>
          </div>
          <div style={{ height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${mapping}%`, background:"#60a5fa", borderRadius:3, transition:"width 0.5s" }} />
          </div>
        </div>

        <button onClick={() => setIsRunning(r => !r)} style={{ padding:"14px 40px", background:isRunning?"#2a0a0a":"#0a2a0a", border:`2px solid ${isRunning?"#f87171":"#4ade80"}`, borderRadius:8, cursor:"pointer", color:isRunning?"#f87171":"#4ade80", fontSize:16, letterSpacing:4, fontWeight:900 }}>
          {isRunning ? "STOP" : "START"}
        </button>

        {DEBUG && (
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={fireEvent} style={{ padding:"6px 16px", background:"#1a0a1a", border:"1px solid #a78bfa44", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:9, fontFamily:"monospace" }}>
              DEBUG: イベント
            </button>
            <button onClick={() => addMapping(25)} style={{ padding:"6px 16px", background:"#1a0a1a", border:"1px solid #60a5fa44", borderRadius:4, cursor:"pointer", color:"#60a5fa", fontSize:9, fontFamily:"monospace" }}>
              DEBUG: マップ+25%
            </button>
          </div>
        )}

        {/* 戦闘ログ（右上固定） */}
        <div style={{ position:"absolute", top:60, right:8, width:180, maxHeight:"40vh", display:"flex", flexDirection:"column", gap:2, zIndex:2, pointerEvents:"none" }}>
          <div style={{ fontSize:7, color:"#3a3a5a", letterSpacing:2, marginBottom:2, textAlign:"right" }}>BATTLE LOG</div>
          <div style={{ display:"flex", flexDirection:"column-reverse", overflowY:"auto", gap:2, maxHeight:"38vh" }}>
            {[...logs].reverse().slice(0, 8).map((log, i) => (
              <div key={log.id} style={{ fontSize:9, color:log.color, opacity: i===0?1:i<3?0.8:0.4, padding:"2px 6px", background:"rgba(0,0,0,0.7)", borderLeft:`2px solid ${log.color}44`, borderRadius:"0 2px 2px 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {battlePopup && (
        <div style={{ position:"absolute", bottom:20, left:16, right:16, background:"rgba(0,0,0,0.95)", border:"1px solid #2a2a3a", borderRadius:8, padding:"12px 14px", fontFamily:"monospace", zIndex:5 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:9, color:battlePopup.won?"#4ade80":"#f87171", letterSpacing:2 }}>
              {battlePopup.won ? "⚔ 撃破！" : "💨 逃走"}
            </span>
            <span style={{ fontSize:8, color:"#fbbf24" }}>{"★".repeat(Math.min(battlePopup.dangerStar,10))}</span>
          </div>
          {battlePopup.monsters.map((m,i) => (
            <div key={i} style={{ fontSize:10, color:m.rarity?.color||"#888", marginBottom:2 }}>{m.displayName}</div>
          ))}
          <div style={{ display:"flex", gap:10, marginTop:6, paddingTop:6, borderTop:"1px solid #1a1a2a", flexWrap:"wrap" }}>
            <span style={{ color:"#86efac", fontSize:10 }}>+{battlePopup.exp}EXP</span>
            <span style={{ color:"#fbbf24", fontSize:10 }}>+{battlePopup.gold}G</span>
            {battlePopup.materials.length>0 && (
              <span style={{ color:"#fb923c", fontSize:10 }}>
                📦{[...new Set(battlePopup.materials)].map(m=>`${m}×${battlePopup.materials.filter(x=>x===m).length}`).join(" ")}
              </span>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <TimerSettings
          workMin={workMin}
          breakMin={breakMin}
          sets={totalSets}
          onApply={(w,b,s) => {
            setWorkMin(w); setBreakMin(b); setTotalSets(s);
            if (!isRunning) { setSeconds(w*60); setTotalSec(w*60); }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}