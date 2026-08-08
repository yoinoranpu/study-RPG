import { useState, useEffect, useRef, useCallback } from "react";
import usePlayerStore from "../store/usePlayerStore";
import { rollEventType, rollNpcEvent, rollChest } from "../systems/events";
import { pickMonsters, getBossData, generateBoss, generateMonster, MONSTER_BASE } from "../systems/monsters";
import { simulateBattle } from "../systems/battle";
import TimerSettings from "../components/TimerSettings";
import { calcPlayerStats } from "../systems/playerStats";
import DungeonCanvas from "../components/DungeonCanvas";
import PlayerSprite from "../components/PlayerSprite";
import SummonSprite from "../components/SummonSprite";
import MonsterSprite from "../components/MonsterSprite";
import EventSprite from "../components/EventSprite";
import BattleEffect from "../components/BattleEffect";
import { calcExp, calcGold, calcFloorProgress, MAPPING_PER_SET, expToLevel, LEVEL_UNLOCKS } from "../systems/timer";
import { calcBookPassiveBonus, mergeBookDex, SKILL_BOOKS, BOOK_RARITY_COLOR, BOOK_RARITY_LABEL } from "../data/skills";
import { openChest } from "../data/chest_table";
import { RARITY_COLOR, SPECIAL_DB, getEquippedInnateBonus } from "../data/items";
import { DUNGEON_FLOOR_COUNT, getDungeon, globalDepth, makeInitialDungeons } from "../systems/dungeons";
import { resetQuestsIfNeeded, getTodayKey } from "../systems/quests";
import { makeInitialStats } from "../systems/achievements";

// イベント回数は4回固定のまま（負け戦が続くと以降のイベントが軒並み無報酬になるため、
// 回数を増やすとその連鎖リスクも増える。代わりに1回ずつの見せ方を長く・濃くする）
const EVENT_CHECK_INTERVAL = 6 * 60 * 1000; // 6分おきに抽選（旧と同じ間隔）
const FIRST_EVENT_DELAY    = 3 * 60 * 1000; // 最初の抽選だけ3分後に前倒し（開始6分間の無風を解消）
const EVENT_FIRE_CHANCE    = 0.85;          // 4回の枠にできるだけ収まるよう当選率を上げる
const BASE_MAX_EVENTS = 4;
const EVENT_KIND_LABEL = { heal:"回復の泉", npc:"冒険者に遭遇", fairy:"妖精の加護", spirit:"精霊の祝福" };
const DEBUG = import.meta.env.DEV;

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
  function openAll() { setOpened(chests); setCurrent(chests.length); }

  return (
    <div style={{ width:"100%", maxWidth:320 }}>
      <div style={{ fontSize:8, color:"#fbbf24", letterSpacing:2, marginBottom:8 }}>宝箱 {current}/{chests.length}</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10, justifyContent:"center" }}>
        {chests.map((chest, i) => {
          const isOpened = i < current;
          return (
            <div key={i} style={{ position:"relative", width:36, height:36, opacity:isOpened?0.35:1, filter:isOpened?"grayscale(1)":"none", transition:"all 0.3s" }}>
              {chest.chestType?.image ? (
                <img src={chest.chestType.image} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
              ) : (
                <div style={{ fontSize:32, textAlign:"center", lineHeight:1 }}>{chest.chestType?.icon || "📦"}</div>
              )}
              {isOpened && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#4ade80", fontWeight:700, textShadow:"0 0 3px #000" }}>✓</div>
              )}
            </div>
          );
        })}
      </div>
      {opened.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
          {opened.map((chest, i) => (
            <div key={i} style={{ background:"#0d0d15", border:`1px solid ${chest.chestType?.color||"#2a2a3a"}44`, borderRadius:4, padding:"6px 10px", display:"flex", alignItems:"center", gap:8 }}>
              {chest.chestType?.image ? (
                <img src={chest.chestType.image} alt="" style={{ width:22, height:22, objectFit:"contain", flexShrink:0 }} />
              ) : (
                <span style={{ fontSize:18 }}>{chest.chestType?.icon || "📦"}</span>
              )}
              <div style={{ flex:1 }}>
                {chest.type === "gold" ? (
                  <span style={{ fontSize:10, color:"#fbbf24" }}>+{chest.gold}G</span>
                ) : chest.type === "skillbook" ? (
                  <span style={{ fontSize:10, color: BOOK_RARITY_COLOR[chest.book?.rarity]||"#e8e0d0" }}>
                    {SKILL_BOOKS[chest.book?.id]?.icon} {SKILL_BOOKS[chest.book?.id]?.name}
                    <span style={{ fontSize:7, marginLeft:4 }}>{BOOK_RARITY_LABEL[chest.book?.rarity]}</span>
                  </span>
                ) : (
                  <span style={{ fontSize:10, color: RARITY_COLOR[chest.item?.rarity]||"#e8e0d0", display:"inline-flex", alignItems:"center", gap:4 }}>
                    {chest.item?.image ? <img src={chest.item.image} alt="" style={{ width:16, height:16, objectFit:"contain" }} /> : chest.item?.icon} {chest.item?.name}
                  </span>
                )}
              </div>
              <span style={{ fontSize:8, color:chest.chestType?.color||"#888" }}>{chest.chestType?.label}</span>
            </div>
          ))}
        </div>
      )}
      {!allOpened ? (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={openNext} style={{ flex:2, padding:"12px 0", background:"#0a1a0a", border:"1px solid #fbbf24", borderRadius:4, cursor:"pointer", color:"#fbbf24", fontSize:13, fontFamily:"monospace", fontWeight:700 }}>📦 開封！</button>
          <button onClick={openAll} style={{ flex:1, padding:"12px 0", background:"#080810", border:"1px solid #333", borderRadius:4, cursor:"pointer", color:"#555", fontSize:10, fontFamily:"monospace" }}>全開封</button>
        </div>
      ) : (
        <div style={{ textAlign:"center", fontSize:9, color:"#4ade80" }}>全ての宝箱を開封した！</div>
      )}
    </div>
  );
}

export default function DungeonPage({ onBack }) {
  const player = usePlayerStore();
  const { updatePlayer } = usePlayerStore();

  const dungeonId = player.currentDungeonId || 1;
  const dungeon = getDungeon(dungeonId);
  const dungeonState = (player.dungeons || makeInitialDungeons())[dungeonId] || { floor:1, maxFloor:1, floorMapping:0, cleared:false };

  const w = window.innerWidth;
  const [isMobile, setIsMobile] = useState(w < 768);

  const [workMin, setWorkMin]     = useState(player.timerWork);
  const [breakMin, setBreakMin]   = useState(player.timerBreak);
  const [totalSets, setTotalSets] = useState(player.timerSets);
  const [phase, setPhase]         = useState("work");
  const [currentSet, setCurrentSet] = useState(1);
  const [seconds, setSeconds]     = useState(player.timerWork * 60);
  const [totalSec, setTotalSec]   = useState(player.timerWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mapping, setMapping]     = useState(dungeonState.floorMapping || 0);
  const [floor, setFloor]         = useState(dungeonState.floor || 1);
  const [hp, setHp]               = useState(player.hp || 100);
  const [eventCount, setEventCount] = useState(0);
  const [logs, setLogs]           = useState([{ id:0, text:"ダンジョンに到着した…", color:"#86efac" }]);
  const [battlePopup, setBattlePopup] = useState(null);
  const [eventPopup, setEventPopup]   = useState(null);
  const [showResult, setShowResult]   = useState(false);
  const [chestsAllOpened, setChestsAllOpened] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMonsters, setCurrentMonsters] = useState([]);
  const [monsterVisible, setMonsterVisible] = useState(false);
  const [currentEvent, setCurrentEvent]     = useState(null);
  const [eventVisible, setEventVisible]     = useState(false);
  const [monsterArrived, setMonsterArrived] = useState(false);
  const [battleEffectActive, setBattleEffectActive] = useState(false);
  const [battleTurns, setBattleTurns] = useState([]);
  const [playerDefeated, setPlayerDefeated] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [bossFloor, setBossFloor] = useState(false);
  const [activeSummons, setActiveSummons] = useState([]);
  // 以下はレンダー中にrefを直接読まないための表示用ミラー（floor/mappingと同じパターン）
  const [sessionExpDisplay, setSessionExpDisplay] = useState(0);
  const [sessionGoldDisplay, setSessionGoldDisplay] = useState(0);
  const [sessionMatsDisplay, setSessionMatsDisplay] = useState({});
  const [sessionChestsDisplay, setSessionChestsDisplay] = useState([]);
  const [defeatedCount, setDefeatedCount] = useState(0);

  const logId         = useRef(1);
  const sessionExp    = useRef(0);
  const sessionGold   = useRef(0);
  const sessionMats   = useRef({});
  const sessionChests = useRef([]);
  const defeatedList  = useRef([]);
  const floorRef      = useRef(dungeonState.floor || 1);
  const mappingRef    = useRef(dungeonState.floorMapping || 0);
  const hpRef         = useRef(player.hp || 100);
  const eventCountRef = useRef(0);
  const pendingBattleRef = useRef(null);
  const monsterVisibleRef = useRef(false);
  const eventVisibleRef   = useRef(false);
  const healTimerRef      = useRef(null);
  const eventPopupTimerRef = useRef(null);
  const passiveBonusRef  = useRef({});
  const sessionBuffsConsumedRef = useRef(false);
  const atkBuffRef  = useRef(0);   // % ボーナス（消耗品atk_up_20）
  const expBuffRef  = useRef(0);   // % ボーナス（消耗品exp_up_50）
  const luckBuffRef = useRef(0);   // % ボーナス（消耗品luck_up）
  const sessionScaleRef = useRef({ atk: 0, mag: 0 });
  const dungeonClearedRef = useRef(dungeonState.cleared || false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { monsterVisibleRef.current = monsterVisible; }, [monsterVisible]);
  useEffect(() => { eventVisibleRef.current = eventVisible; }, [eventVisible]);

  useEffect(() => () => {
    if (healTimerRef.current) clearInterval(healTimerRef.current);
    if (eventPopupTimerRef.current) clearTimeout(eventPopupTimerRef.current);
  }, []);

  useEffect(() => {
    const bookBonus = calcBookPassiveBonus(player.passiveSkillSlots || [], player.skillBooks || []);
    const innateBonus = getEquippedInnateBonus({
      equippedWeapon: player.equippedWeapon, equippedArmor: player.equippedArmor,
      equippedAcc1: player.equippedAcc1, equippedAcc2: player.equippedAcc2,
    });
    passiveBonusRef.current = {
      ...bookBonus,
      mapBonus:  (bookBonus.mapBonus  || 0) + (innateBonus.mapBonus  || 0),
      dropBonus: (bookBonus.dropBonus || 0) + (innateBonus.dropBonus || 0),
      expBonus:  (bookBonus.expBonus  || 0) + (innateBonus.expBonus  || 0),
    };
  }, [player.passiveSkillSlots, player.skillBooks, player.equippedWeapon, player.equippedArmor, player.equippedAcc1, player.equippedAcc2]);

  const addLog = useCallback((text, color="#666") => {
    setLogs(l => [...l, { id:logId.current++, text, color }]);
  }, []);

  // イベント発生を見落とさないよう、画面上部に大きめのポップアップで表示する
  const showEventPopup = useCallback((popup, duration) => {
    if (eventPopupTimerRef.current) clearTimeout(eventPopupTimerRef.current);
    setEventPopup(popup);
    eventPopupTimerRef.current = setTimeout(() => setEventPopup(null), duration);
  }, []);

  // セッション開始時に特殊スロットのatk_up_20/exp_up_50/luck_upを消費し、探索中ずっと効くバフにする
  useEffect(() => {
    if (!isRunning || sessionBuffsConsumedRef.current) return;
    sessionBuffsConsumedRef.current = true;
    const slots = [...(player.specialSlots || [null,null,null])];
    const buffEffects = { atk_up_20:20, exp_up_50:50, luck_up:20 };
    let changed = false;
    let newItemBox = [...(player.itemBox || [])];
    slots.forEach((slot, i) => {
      const pct = slot && buffEffects[slot.effect];
      if (!pct) return;
      if (slot.effect === "atk_up_20")  { atkBuffRef.current  = pct; addLog(`⚗ ${slot.name}を使用！探索中ATK+${pct}%`, "#f87171"); }
      if (slot.effect === "exp_up_50")  { expBuffRef.current  = pct; addLog(`📖 ${slot.name}を使用！探索中EXP+${pct}%`, "#86efac"); }
      if (slot.effect === "luck_up")    { luckBuffRef.current = pct; addLog(`🍀 ${slot.name}を使用！探索中レア出現率+${pct}%`, "#fbbf24"); }
      newItemBox = newItemBox.filter(x => x.uid !== slot.uid);
      slots[i] = null;
      changed = true;
    });
    if (changed) updatePlayer({ specialSlots: slots, itemBox: newItemBox });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const buildPlayerStats = useCallback(() => {
    const baseStats = calcPlayerStats(player);
    const atkBuff = atkBuffRef.current || 0;
    return {
      ...baseStats,
      atk: atkBuff ? Math.floor(baseStats.atk * (1 + atkBuff / 100)) : baseStats.atk,
      hp: Math.max(1, hpRef.current),
      maxHp: baseStats.maxHp,
      skillBooks: player.skillBooks || [],
      activeSkillSlots: player.activeSkillSlots || [],
      passiveSkillSlots: player.passiveSkillSlots || [],
      skillMode: player.skillMode || "order",
      innateBonus: getEquippedInnateBonus(player),
    };
  }, [player]);

  // 鍵なしボス階層：自動退却
  useEffect(() => {
    if (!bossFloor) return;
    const keyEffect = dungeon.keyEffect;
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
        // 初めて鍵不足で詰まった時だけ、救済としてショップで鍵を購入できるようにする(一回限り)
        if (player.keyRescueDungeonId == null) {
          updatePlayer({ keyRescueDungeonId: dungeonId });
          addLog(`💡 ショップで鍵が買えるようになった`, "#60a5fa");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bossFloor, dungeon.keyEffect, player.specialSlots, player.itemBox, addLog, dungeonId, player.keyRescueDungeonId, updatePlayer]);

  // 鍵ありボス階層：自動挑戦
  useEffect(() => {
    if (!bossFloor) return;
    const keyEffect = dungeon.keyEffect;
    const keyItem = (player.specialSlots||[]).find(s => s?.effect === keyEffect)
      || (player.itemBox||[]).find(it => it.effect === keyEffect);
    if (!keyItem) return;
    const timer = setTimeout(() => {
      const newSlots = (player.specialSlots||[]).map(s => s?.effect === keyEffect ? null : s);
      const newBox = (player.itemBox||[]).filter(it => it.uid !== keyItem.uid);
      updatePlayer({ specialSlots: newSlots, itemBox: newBox });
      const bossData = getBossData(dungeonId, floor);
      if (!bossData) return;
      const boss = generateBoss(bossData);
      if (!boss) return;
      setBossFloor(false);
      setCurrentMonsters([boss]);
      setMonsterVisible(true);
      setMonsterArrived(false);
      const result = simulateBattle(buildPlayerStats(), [boss], { sessionScale: sessionScaleRef.current });
      pendingBattleRef.current = { result, monsters:[boss], isBoss:true, startHp: Math.max(1, hpRef.current) };
      addLog(`🔥 ${boss.displayName}が現れた！`, "#ef4444");
    }, 3000);
    return () => clearTimeout(timer);
  }, [bossFloor, dungeon.keyEffect, dungeonId, floor, player.specialSlots, player.itemBox, addLog, updatePlayer, buildPlayerStats]);

  const addMapping = useCallback((amount) => {
    const bonus = passiveBonusRef.current.mapBonus || 0;
    const actual = amount * (1 + bonus / 100);
    const result = calcFloorProgress(mappingRef.current, actual);
    mappingRef.current = result.mapping;
    if (result.newFloor) {
      if (floorRef.current < DUNGEON_FLOOR_COUNT) {
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
        // レアリティ解放は全ダンジョン通算の深度で判定（ダンジョンが変わってもコモンに逆戻りしない）
        // ダンジョン1(1〜30階)だけで最上位まで出し切る。items.jsのRARITY.unlockFloorと揃える。
        const RARITY_UNLOCKS = { 5:"uncommon", 12:"rare", 20:"epic", 28:"legendary" };
        const unlocked = RARITY_UNLOCKS[globalDepth(dungeonId, floorRef.current)];
        if (unlocked) {
          setTimeout(() => { updatePlayer({ unlockedRarity: unlocked }); }, 0);
          addLog(`🎉 ${unlocked.toUpperCase()}装備が解放された！`, "#fbbf24");
        }
      } else {
        // ダンジョン最終階：これ以上は進まずマップ済みのまま据え置き
        mappingRef.current = 99;
      }
    }
    setMapping(mappingRef.current);
  }, [addLog, updatePlayer, dungeonId]);

  // 通常の戦闘イベントとDEBUG強制召喚の両方から使う共通処理
  const spawnBattle = useCallback((monsters) => {
    addLog(`⚔ ${monsters.map(m=>m.displayName).join("と")}が現れた！`, "#f87171");
    setCurrentEvent(null); setEventVisible(false);
    setCurrentMonsters(monsters); setMonsterVisible(true); setMonsterArrived(false);
    const result = simulateBattle(buildPlayerStats(), monsters, { sessionScale: sessionScaleRef.current });
    pendingBattleRef.current = { result, monsters, startHp: Math.max(1, hpRef.current) };
  }, [addLog, buildPlayerStats]);

  // DEBUG専用：指定したモンスターを即座に戦闘に召喚する（パーツ分けイラスト等の目視確認用）
  const debugSpawnMonster = useCallback((monsterId) => {
    if (!monsterId) return;
    const base = MONSTER_BASE.find(m => m.id === monsterId);
    if (!base) return;
    const monster = generateMonster(base, globalDepth(dungeonId, floorRef.current), luckBuffRef.current);
    spawnBattle([monster]);
  }, [dungeonId, spawnBattle]);

  const fireEvent = useCallback(() => {
    if (eventCountRef.current >= BASE_MAX_EVENTS) return;
    const evType = rollEventType();
    eventCountRef.current += 1;
    setEventCount(eventCountRef.current);

    if (evType === "battle") {
      const monsters = pickMonsters(globalDepth(dungeonId, floorRef.current), dungeonId, luckBuffRef.current);
      spawnBattle(monsters);

    } else if (evType === "chest") {
      const chestRarity = rollChest();
      const result = openChest(chestRarity.id || "common", globalDepth(dungeonId, floorRef.current), dungeonId);
      let popupText;
      if (result.type === "gold") {
        const bonusGold = Math.floor(result.gold * (1 + (passiveBonusRef.current.goldBonus||0)/100));
        sessionGold.current += bonusGold;
        setSessionGoldDisplay(sessionGold.current);
        result.gold = bonusGold;
        popupText = `+${bonusGold}G`;
        addLog(`${result.chestType?.icon||"📦"} ${result.chestType?.label}を開けた！+${bonusGold}G`, "#fbbf24");
      } else if (result.type === "skillbook") {
        popupText = `${SKILL_BOOKS[result.book?.id]?.name || "スキル書"}を発見！`;
        addLog(`${result.chestType?.icon||"📦"} ${result.chestType?.label}を発見！`, result.chestType?.color||"#fbbf24");
      } else {
        popupText = `${result.item?.name || "アイテム"}を発見！`;
        addLog(`${result.chestType?.icon||"📦"} ${result.chestType?.label}を発見！`, result.chestType?.color||"#fbbf24");
      }
      sessionChests.current.push(result);
      setSessionChestsDisplay([...sessionChests.current]);
      setMonsterVisible(false); setCurrentMonsters([]);
      setCurrentEvent(`chest_${result.chestType?.id || "common"}`); setEventVisible(true); setMonsterArrived(false);
      showEventPopup({ icon: result.chestType?.icon||"📦", image: result.chestType?.image, label: result.chestType?.label||"宝箱発見", text: popupText, color: result.chestType?.color||"#fbbf24" }, 7000);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, 7000);

    } else if (evType === "trap") {
      const dmg = Math.floor(Math.random()*15+5);
      hpRef.current = Math.max(1, hpRef.current-dmg); setHp(hpRef.current);
      addLog(`⚠ 罠発動！${dmg}ダメージ！`, "#fb923c");
      setMonsterVisible(false); setCurrentMonsters([]);
      setCurrentEvent("trap"); setEventVisible(true); setMonsterArrived(false);
      showEventPopup({ icon:"⚠", label:"罠発動！", text:`-${dmg} ダメージ`, color:"#fb923c" }, 5500);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, 5500);

    } else {
      const ev = rollNpcEvent();
      addLog(`${ev.icon} ${ev.text}`, ev.color);
      const kind = ev.effect==="heal"?"heal":ev.effect==="buff"?"fairy":ev.effect==="enhance"?"spirit":"npc";
      const duration = ev.effect === "heal" ? 8000 : 7000;
      if (ev.effect==="heal") {
        // 瞬間全回復ではなく、HPバーがじわじわ満ちていく様子を見せる
        if (healTimerRef.current) clearInterval(healTimerRef.current);
        const startHp = hpRef.current;
        const targetHp = player.maxHp || 100;
        const steps = 20;
        let i = 0;
        healTimerRef.current = setInterval(() => {
          i += 1;
          const next = i >= steps ? targetHp : Math.round(startHp + (targetHp - startHp) * (i / steps));
          hpRef.current = next; setHp(next);
          if (i >= steps) { clearInterval(healTimerRef.current); healTimerRef.current = null; }
        }, 120);
      }
      if (ev.effect==="map") addMapping(5);
      setMonsterVisible(false); setCurrentMonsters([]);
      setCurrentEvent(kind);
      setEventVisible(true); setMonsterArrived(false);
      showEventPopup({ icon: ev.icon, label: EVENT_KIND_LABEL[kind] || "?", text: ev.text, color: ev.color }, duration);
      setTimeout(() => { setEventVisible(false); setCurrentEvent(null); setMonsterArrived(false); }, duration);
    }
  }, [addLog, addMapping, player, dungeonId, showEventPopup, spawnBattle]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (s > 1) return s - 1;
        if (phase === "work") {
          const expBonus  = (passiveBonusRef.current.expBonus || 0) + (expBuffRef.current || 0);
          const goldBonus = passiveBonusRef.current.goldBonus || 0;
          const exp  = Math.floor(calcExp(workMin)  * (1 + expBonus  / 100));
          const gold = Math.floor(calcGold(workMin) * (1 + goldBonus / 100));
          sessionExp.current  += exp;
          sessionGold.current += gold;
          setSessionExpDisplay(sessionExp.current);
          setSessionGoldDisplay(sessionGold.current);
          addMapping(MAPPING_PER_SET);
          addLog(`✨ ${workMin}分完了！ +${exp}EXP +${gold}G`, "#fbbf24");
          if (currentSet >= totalSets) { setIsRunning(false); setShowResult(true); return 0; }
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
    let cancelled = false;
    let timeoutId;
    const tick = (delay) => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        const canFire = eventCountRef.current < BASE_MAX_EVENTS
          && !monsterVisibleRef.current && !eventVisibleRef.current;
        if (canFire && Math.random() < EVENT_FIRE_CHANCE) fireEvent();
        tick(EVENT_CHECK_INTERVAL);
      }, delay);
    };
    tick(FIRST_EVENT_DELAY);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [isRunning, phase, fireEvent]);

  const handleResultClose = () => {
    const newMats = { ...(player.materials||{}) };
    Object.entries(sessionMats.current).forEach(([k,v]) => { newMats[k] = (newMats[k]||0)+v; });
    const studiedMinutes = workMin * currentSet;
    const { quests: resetQuests, dailyReset, weeklyReset } = resetQuestsIfNeeded(player.quests);
    const baseMinutesToday = dailyReset ? 0 : (player.studyMinutesToday||0);
    const baseMinutesWeek  = weeklyReset ? 0 : (player.studyMinutesWeek||0);
    const oldLv = expToLevel(player.totalExp);
    const newTotalExp = player.totalExp + sessionExp.current;
    const newLv = expToLevel(newTotalExp);
    if (newLv > oldLv) {
      for (let lv = oldLv + 1; lv <= newLv; lv++) {
        const unlock = LEVEL_UNLOCKS[lv];
        if (unlock) addLog(`🎉 Lv${lv}到達！${unlock.label}`, "#fbbf24");
      }
    }
    const newItemBox = [...(player.itemBox||[])];
    const newSkillBooks = [...(player.skillBooks||[])];
    const addedBooks = [];
    sessionChests.current.forEach(chest => {
      if (chest.type === "item" && chest.item && newItemBox.length < 30) newItemBox.push(chest.item);
      if (chest.type === "skillbook" && chest.book) { newSkillBooks.push(chest.book); addedBooks.push(chest.book); }
    });
    const prevDungeonState = (player.dungeons || makeInitialDungeons())[dungeonId] || { maxFloor:1, cleared:false };

    // 実績: 継続日数・宝箱累計・獲得G累計・深夜プレイ
    const prevStats = player.stats || makeInitialStats();
    const todayKey = getTodayKey();
    let newStreak = prevStats.currentStreak || 0;
    if (prevStats.lastPlayDate !== todayKey) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      newStreak = prevStats.lastPlayDate === yesterday.toDateString() ? newStreak + 1 : 1;
    }
    const hour = new Date().getHours();
    const newStatsFlags = { ...prevStats.flags };
    if (hour >= 0 && hour < 4) newStatsFlags.midnightSession = true;
    const newStats = {
      ...prevStats,
      totalChestsOpened: (prevStats.totalChestsOpened||0) + sessionChests.current.length,
      totalGoldEarned: (prevStats.totalGoldEarned||0) + sessionGold.current,
      lastPlayDate: todayKey,
      currentStreak: newStreak,
      bestStreak: Math.max(prevStats.bestStreak||0, newStreak),
      flags: newStatsFlags,
    };

    updatePlayer({
      totalExp: newTotalExp,
      gold:     player.gold + sessionGold.current,
      dungeons: {
        ...(player.dungeons || makeInitialDungeons()),
        [dungeonId]: {
          floor: floorRef.current,
          maxFloor: Math.max(prevDungeonState.maxFloor||1, floorRef.current),
          floorMapping: mappingRef.current,
          cleared: prevDungeonState.cleared || dungeonClearedRef.current,
        },
      },
      hp:       hpRef.current,
      materials: newMats,
      itemBox:  newItemBox,
      skillBooks: newSkillBooks,
      skillBookDex: mergeBookDex(player.skillBookDex, addedBooks),
      timerWork: workMin, timerBreak: breakMin, timerSets: totalSets,
      studyMinutesTotal: (player.studyMinutesTotal||0) + studiedMinutes,
      studyMinutesToday: baseMinutesToday + studiedMinutes,
      studyMinutesWeek:  baseMinutesWeek  + studiedMinutes,
      quests: {
        ...resetQuests,
        setsToday: resetQuests.setsToday + currentSet,
        setsWeek: resetQuests.setsWeek + currentSet,
        chestsWeek: resetQuests.chestsWeek + sessionChests.current.length,
      },
      stats: newStats,
    });
    setShowResult(false);
    onBack();
  };

  const escapeItem = (player.specialSlots || []).find(s => s?.effect === "escape") || null;
  function useEscapeScroll() {
    if (!escapeItem) return;
    const slots = (player.specialSlots || []).map(s => s?.uid === escapeItem.uid ? null : s);
    updatePlayer({ specialSlots: slots });
    addLog(`📜 ${escapeItem.name}を使って帰還する…`, "#fbbf24");
    setIsRunning(false);
    setShowResult(true);
  }

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
          { label:"獲得EXP",  val:`+${sessionExpDisplay}`,        color:"#86efac" },
          { label:"獲得G",    val:`+${sessionGoldDisplay}`,       color:"#fbbf24" },
          { label:"到達階層", val:`B${floor}F`,                   color:"#60a5fa" },
          { label:"マップ率", val:`${Math.floor(mapping)}%`,      color:"#60a5fa" },
          { label:"倒した敵", val:`${defeatedCount}体`,           color:"#f87171" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ color:"#4a4a6a", fontSize:11 }}>{label}</span>
            <span style={{ color, fontSize:13, fontWeight:700 }}>{val}</span>
          </div>
        ))}
      </div>
      {Object.keys(sessionMatsDisplay).length > 0 && (
        <div style={{ background:"#0d0d15", border:"1px solid #2a2a3a", borderRadius:6, padding:"10px 16px", width:"100%", maxWidth:320 }}>
          <div style={{ fontSize:8, color:"#fb923c", marginBottom:6, letterSpacing:2 }}>獲得素材</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(sessionMatsDisplay).map(([name, cnt]) => (
              <div key={name} style={{ background:"#080810", border:"1px solid #fb923c33", borderRadius:3, padding:"3px 8px", fontSize:9, color:"#fb923c" }}>{name}×{cnt}</div>
            ))}
          </div>
        </div>
      )}
      {sessionChestsDisplay.length > 0 && (
        <ChestOpenSection chests={sessionChestsDisplay} onAllOpened={() => setChestsAllOpened(true)} />
      )}
      {(sessionChestsDisplay.length === 0 || chestsAllOpened) && (
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
      <SummonSprite summons={activeSummons} />
      <MonsterSprite
        monsters={currentMonsters}
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
        onSummonUpdate={(snapshot) => setActiveSummons(snapshot)}
        onPlayerHpUpdate={(newHp) => { hpRef.current = newHp; setHp(newHp); }}
        onMonsterHpUpdate={(idx, newHp) => {
          setCurrentMonsters(ms => ms.map((m, i) => i === idx ? { ...m, hp: newHp } : m));
        }}
        onComplete={() => {
          const pending = pendingBattleRef.current;
          if (!pending) return;
          const { result, monsters } = pending;
          if (result.sessionScaleAfter) sessionScaleRef.current = result.sessionScaleAfter;
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

          if (result.won) {
            if (pending.isBoss) {
              const depth = globalDepth(dungeonId, floorRef.current);
              const bossGold = Math.floor(500 * (depth / 5));
              const bossExp  = Math.floor(100 * (depth / 5));
              sessionGold.current += bossGold;
              sessionExp.current  += bossExp;
              addLog(`🏆 ボス撃破！ +${bossExp}EXP +${bossGold}G`, "#fbbf24");
              sessionChests.current.push(openChest(rollChest().id || "rare", depth, dungeonId));
              sessionChests.current.push(openChest(rollChest().id || "rare", depth, dungeonId));
              if (floorRef.current >= DUNGEON_FLOOR_COUNT) {
                dungeonClearedRef.current = true;
                addLog(`🎊 ${dungeon.name}クリア！`, "#fbbf24");
              }
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
            setSessionExpDisplay(sessionExp.current);
            setSessionGoldDisplay(sessionGold.current);
            setSessionMatsDisplay({ ...sessionMats.current });
            setDefeatedCount(defeatedList.current.length);
            const newBook = { ...(player.monsterBook||{}) };
            monsters.forEach(m => {
              if (!newBook[m.id]) newBook[m.id] = { count:0, name:m.name, tribe:m.tribe, material:m.material };
              newBook[m.id].count += 1;
            });

            // 実績: 戦闘結果に基づくフラグ更新
            const prevStats = player.stats || makeInitialStats();
            const newFlags = { ...prevStats.flags };
            const flag = (key) => { newFlags[key] = true; };
            if (pending.isBoss) flag("firstBossWin");
            if (result.playerHpAfter === pending.startHp) {
              flag("noDamageWin");
              if (pending.isBoss) flag("bossNoDamageWin");
            }
            if (result.playerHpAfter >= 1 && result.playerHpAfter <= 9) flag("hp1DigitWin");
            if (result.deathSaveUsed) flag("undyingWin");
            if (result.killedByAssassinate) flag("assassinateKill");
            if (result.killedByCounter) flag("counterKill");
            if (result.killedByAlly) flag("summonFinish");
            if (result.killedByPoison) flag("poisonKill");
            if (result.killedByFreeze) flag("freezeKill");
            if (result.bigCritHit) flag("bigCritHit");
            if (result.aoeDoubleKill) flag("aoeDoubleKill");

            updatePlayer({
              monsterBook: newBook,
              stats: {
                ...prevStats,
                totalMonstersDefeated: (prevStats.totalMonstersDefeated||0) + monsters.length,
                flags: newFlags,
              },
            });
            if (Math.random() < 0.25 * (1 + (passiveBonusRef.current.chestBonus||0)/100)) {
              sessionChests.current.push(openChest(rollChest().id || "common", globalDepth(dungeonId, floorRef.current), dungeonId));
            }
            setSessionChestsDisplay([...sessionChests.current]);
            addMapping(2);
          }
          setBattlePopup({ monsters, won:result.won, exp:result.totalExp, gold:result.totalGold, materials:result.materials, dangerStar:Math.max(...monsters.map(m=>m.dangerStar||1)) });
          setBattleEffectActive(false);
          setActiveSummons([]);
          pendingBattleRef.current = null;
          setTimeout(() => setHp(currentHp), 100);
          setTimeout(() => { setMonsterVisible(false); setCurrentMonsters([]); setMonsterArrived(false); setBattlePopup(null); }, 3000);
        }}
        monsterX={0.35} monsterY={0.72}
        playerX={0.72}  playerY={0.72}
      />

      {showBossWarning && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ fontSize:11, letterSpacing:8, color:"#ef4444", marginBottom:8 }}>⚠ WARNING ⚠</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#ef4444", letterSpacing:4, textShadow:"0 0 20px #ef4444" }}>BOSS</div>
          <div style={{ fontSize:13, color:"#fbbf24", marginTop:8, letterSpacing:2 }}>B{floor}F ボスが出現した！</div>
          <div style={{ fontSize:9, color:"#666", marginTop:16 }}>準備はいいか？</div>
        </div>
      )}

      {bossFloor && !showBossWarning && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:9, gap:16 }}>
          <div style={{ fontSize:9, letterSpacing:4, color:"#ef4444" }}>BOSS FLOOR</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>B{floor}F</div>
          {(() => {
            const keyEffect = dungeon.keyEffect;
            const keyItem = (player.specialSlots||[]).find(s => s?.effect === keyEffect)
              || (player.itemBox||[]).find(it => it.effect === keyEffect);
            const hasKey = !!keyItem;
            const keyName = keyItem?.name || SPECIAL_DB.find(it => it.effect === keyEffect)?.name || "鍵";
            return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:10, color:hasKey?"#4ade80":"#f87171" }}>
                  {hasKey ? `🗝 鍵あり: ${keyItem.name}` : "🔒 鍵がない！"}
                </div>
                {!hasKey && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:8, color:"#4a4a6a", textAlign:"center" }}>
                      {keyName}を入手してください
                    </div>
                    <div style={{ fontSize:8, color:"#f87171" }}>自動的に前の階層に戻ります…</div>
                  </div>
                )}
                {hasKey && <div style={{ fontSize:8, color:"#4ade80" }}>自動的にボス戦闘を開始します…</div>}
              </div>
            );
          })()}
        </div>
      )}

      <div style={{ padding:isMobile?"6px 8px":"10px 16px", background:"rgba(0,0,0,0.9)", borderBottom:"1px solid #1a1a2a", display:"flex", alignItems:"center", gap:isMobile?6:12, position:"relative", zIndex:1, flexWrap:isMobile?"wrap":"nowrap" }}>
        <button onClick={onBack} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:isMobile?"3px 6px":"4px 10px", cursor:"pointer", fontSize:isMobile?8:10, minWidth:isMobile?"auto":"auto" }}>← 街へ</button>
        <button onClick={() => setShowSettings(true)} style={{ background:"transparent", border:"1px solid #333", borderRadius:4, color:"#666", padding:isMobile?"3px 6px":"4px 10px", cursor:"pointer", fontSize:10, minHeight:isMobile?"32px":"auto" }}>⚙</button>
        <div style={{ color:"#60a5fa", fontSize:isMobile?10:12, letterSpacing:2 }}>{dungeon.name} B{floor}F</div>
        <div style={{ flex:1 }} />
        {!isMobile && <div style={{ color:"#86efac", fontSize:10 }}>Lv{lv}</div>}
        {!isMobile && <div style={{ color:"#fbbf24", fontSize:10 }}>G {player.gold + sessionGoldDisplay}</div>}
        <div style={{ display:"flex", alignItems:"center", gap:4, minHeight:isMobile?"32px":"auto" }}>
          <span style={{ color:"#f87171", fontSize:10 }}>♥</span>
          <div style={{ width:isMobile?40:50, height:5, background:"#1a0a0a", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(hp/maxHp)*100}%`, background:hp/maxHp>0.5?"#4ade80":hp/maxHp>0.25?"#fbbf24":"#f87171", borderRadius:3, transition:"width 0.5s" }} />
          </div>
          <span style={{ color:"#555", fontSize:8 }}>{hp}</span>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:16, position:"relative", zIndex:1 }}>
        <div style={{ position:"relative", width:180, height:180 }}>
          <svg width={180} height={180} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={90} cy={90} r={78} fill="none" stroke="#1a1a1a" strokeWidth={8} />
            <circle cx={90} cy={90} r={78} fill="none" stroke={accent} strokeWidth={8}
              strokeDasharray={`${2*Math.PI*78*pct} ${2*Math.PI*78}`} strokeLinecap="round"
              style={{ transition:"stroke-dasharray 0.5s linear", filter:`drop-shadow(0 0 6px ${accent})` }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:isMobile?24:36, fontWeight:900, color:"#fff", letterSpacing:2 }}>
              {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
            </div>
            <div style={{ fontSize:isMobile?8:10, color:accent, marginTop:4 }}>
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

        <button onClick={() => setIsRunning(r => !r)} style={{ padding:isMobile?"10px 24px":"14px 40px", background:isRunning?"#2a0a0a":"#0a2a0a", border:`2px solid ${isRunning?"#f87171":"#4ade80"}`, borderRadius:8, cursor:"pointer", color:isRunning?"#f87171":"#4ade80", fontSize:isMobile?14:16, letterSpacing:isMobile?2:4, fontWeight:900, minHeight:"44px", minWidth:"44px" }}>
          {isRunning ? "STOP" : "START"}
        </button>

        {escapeItem && isRunning && (
          <button onClick={useEscapeScroll} style={{ padding:"8px 20px", background:"#1a1000", border:"1px solid #fbbf2488", borderRadius:6, cursor:"pointer", color:"#fbbf24", fontSize:10, fontFamily:"monospace" }}>
            📜 {escapeItem.name}を使って帰還
          </button>
        )}

        {DEBUG && (
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={fireEvent} style={{ padding:"6px 16px", background:"#1a0a1a", border:"1px solid #a78bfa44", borderRadius:4, cursor:"pointer", color:"#a78bfa", fontSize:9, fontFamily:"monospace" }}>DEBUG: イベント</button>
            <button onClick={() => addMapping(25)} style={{ padding:"6px 16px", background:"#1a0a1a", border:"1px solid #60a5fa44", borderRadius:4, cursor:"pointer", color:"#60a5fa", fontSize:9, fontFamily:"monospace" }}>DEBUG: マップ+25%</button>
            <select onChange={(e) => { debugSpawnMonster(e.target.value); e.target.value=""; }} defaultValue=""
              style={{ padding:"6px 8px", background:"#1a0a1a", border:"1px solid #4ade8044", borderRadius:4, cursor:"pointer", color:"#4ade80", fontSize:9, fontFamily:"monospace" }}>
              <option value="" disabled>DEBUG: モンスター召喚</option>
              {MONSTER_BASE.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

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

      {eventPopup && (
        <div style={{ position:"absolute", top:isMobile?66:96, left:16, right:16, maxWidth:360, margin:"0 auto", background:"rgba(0,0,0,0.92)", border:`1px solid ${eventPopup.color}88`, borderRadius:8, padding:"10px 14px", fontFamily:"monospace", zIndex:6, display:"flex", alignItems:"center", gap:10, boxShadow:`0 0 16px ${eventPopup.color}33` }}>
          {eventPopup.image ? (
            <img src={eventPopup.image} alt="" style={{ width:28, height:28, objectFit:"contain", flexShrink:0 }} />
          ) : (
            <span style={{ fontSize:24, flexShrink:0 }}>{eventPopup.icon}</span>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:eventPopup.color, letterSpacing:1, marginBottom:2 }}>{eventPopup.label}</div>
            <div style={{ fontSize:11, color:"#e8e0d0", lineHeight:1.4 }}>{eventPopup.text}</div>
          </div>
        </div>
      )}

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
        <TimerSettings workMin={workMin} breakMin={breakMin} sets={totalSets}
          onApply={(w,b,s) => { setWorkMin(w); setBreakMin(b); setTotalSets(s); if (!isRunning) { setSeconds(w*60); setTotalSec(w*60); } }}
          onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}