import { useEffect, useRef } from "react";

const TURN_DURATION = 1500;

export default function BattleEffect({ isActive, turns, onComplete, onPlayerHpUpdate, onMonsterHpUpdate, onTurnLog, onSummonUpdate, monsterX, monsterY, playerX, playerY }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({
    turnIndex:0, turnTime:0, effects:[],
    playerHitFlash:0, monsterHitFlash:0,
    playerShake:0, monsterShake:0,
    done:false, lastLoggedIndex:-1,
  });

  useEffect(() => {
    stateRef.current = {
      turnIndex:0, turnTime:0, effects:[],
      playerHitFlash:0, monsterHitFlash:0,
      playerShake:0, monsterShake:0,
      done:false, lastLoggedIndex:-1,
    };
  }, [isActive, turns]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = 0;

    const loop = (time) => {
      const dt = Math.min(time - lastTime, 50);
      lastTime = time;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) { canvas.width=W; canvas.height=H; }
      ctx.clearRect(0, 0, W, H);

      const s = stateRef.current;
      if (!isActive || !turns || turns.length === 0 || s.done) {
        if (isActive && turns && turns.length === 0 && !s.done) {
          s.done = true;
          setTimeout(() => onComplete && onComplete(), 0);
        }
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      s.turnTime += dt;
      s.playerHitFlash  = Math.max(0, s.playerHitFlash  - dt);
      s.monsterHitFlash = Math.max(0, s.monsterHitFlash - dt);
      s.playerShake     = Math.max(0, s.playerShake     - dt);
      s.monsterShake    = Math.max(0, s.monsterShake    - dt);

      if (s.turnTime >= TURN_DURATION) {
        s.turnTime = 0;
        s.turnIndex++;
        if (s.turnIndex >= turns.length) {
          s.done = true;
          onComplete && onComplete();
        }
      }

      const turn = turns[Math.min(s.turnIndex, turns.length - 1)];

      if (s.turnTime < 30 && turn && s.lastLoggedIndex !== s.turnIndex) {
        s.lastLoggedIndex = s.turnIndex;

        if (turn.logText && onTurnLog) {
          onTurnLog(turn.logText, turn.logColor || "#a0a0a0");
        }

        const px = playerX * W, py = playerY * H;
        const mx = monsterX * W, my = monsterY * H;

        if (turn.type === "attack") {
          const tx = turn.actor === "player" ? mx : px;
          const ty = turn.actor === "player" ? my : py;

          if (turn.actor === "player" && onMonsterHpUpdate) onMonsterHpUpdate(turn.target, turn.hpLeft);
          if (turn.actor === "monster" && onPlayerHpUpdate) onPlayerHpUpdate(turn.hpLeft);

          const slashCount = turn.isCrit ? 8 : 4;
          for (let i = 0; i < slashCount; i++) {
            s.effects.push({
              x: tx + (Math.random()-0.5)*40, y: ty + (Math.random()-0.5)*40,
              vx: (Math.random()-0.5)*4, vy: -Math.random()*3 - 1,
              life:500, maxLife:500, alpha:1,
              angle: Math.random()*Math.PI, len: turn.isCrit ? 24 : 16,
              color: turn.actor==="player" ? "#e8e0d0" : "#f87171", type:"slash",
            });
          }
          s.effects.push({ x:tx, y:ty, vx:0, vy:0, life:300, maxLife:300, alpha:1, radius:0, maxRadius:50, color: turn.actor==="player" ? "#ffffff" : "#f87171", type:"shockwave" });
          s.effects.push({ x: tx + (turn.actor === "player" ? -30 : 30), y: ty - 60, vx: turn.actor === "player" ? -0.3 : 0.3, vy: -1.5, life:900, maxLife:900, alpha:1, text:`${turn.dmg}`, isCrit:turn.isCrit, color: turn.actor==="player" ? (turn.isCrit?"#fbbf24":"#e8e0d0") : "#f87171", type:"number" });

          if (turn.label) {
            s.effects.push({ x: turn.actor === "player" ? px : mx, y: (turn.actor === "player" ? py : my) - 100, vx:0, vy:-0.8, life:1000, maxLife:1000, alpha:1, text: turn.label, color: turn.actor==="player" ? "#60a5fa" : "#f87171", type:"skillname" });
          }

          if (turn.actor === "player") { s.monsterHitFlash = 200; s.monsterShake = 300; }
          else { s.playerHitFlash = 200; s.playerShake = 300; }

        } else if (turn.type === "attackAlly") {
          // 召喚物が攻撃を受けた
          const tx = W * 0.7, ty = H * 0.72;
          s.effects.push({ x:tx, y:ty-40, vx:0.3, vy:-1.5, life:900, maxLife:900, alpha:1, text:`${turn.dmg}`, color:"#f87171", type:"number" });
          for (let i = 0; i < 4; i++) {
            s.effects.push({ x:tx+(Math.random()-0.5)*30, y:ty+(Math.random()-0.5)*30, vx:(Math.random()-0.5)*3, vy:-Math.random()*2, life:400, maxLife:400, alpha:1, angle:Math.random()*Math.PI, len:14, color:"#f87171", type:"slash" });
          }

        } else if (turn.type === "miss") {
          const tx = turn.actor==="player" ? mx : px;
          const ty = turn.actor==="player" ? my : py;
          s.effects.push({ x:tx, y:ty-40, vx:0, vy:-1, life:700, maxLife:700, alpha:1, text:"MISS", color:"#34d399", type:"number" });

        } else if (turn.type === "defeat") {
          for (let i = 0; i < 20; i++) {
            const angle = (i/20)*Math.PI*2;
            s.effects.push({ x:mx, y:my-40, vx:Math.cos(angle)*3, vy:Math.sin(angle)*3 - 2, life:800, maxLife:800, alpha:1, color:["#fbbf24","#f87171","#a78bfa","#4ade80"][i%4], type:"particle" });
          }
          s.effects.push({ x:mx, y:my-80, vx:0, vy:-0.5, life:1000, maxLife:1000, alpha:1, text:"DEFEAT!", color:"#fbbf24", type:"number", big:true });

        } else if (turn.type === "buff") {
          s.effects.push({ x:px, y:py-90, vx:0, vy:-0.8, life:1000, maxLife:1000, alpha:1, text: turn.label || "BUFF", color:"#60a5fa", type:"skillname" });

        } else if (turn.type === "summon") {
          if (onSummonUpdate && turn.summonSnapshot) {
            onSummonUpdate(turn.summonSnapshot);
          }
          s.effects.push({ x:px-40, y:py-90, vx:0, vy:-0.8, life:1200, maxLife:1200, alpha:1, text:"召喚！", color:turn.logColor||"#c084fc", type:"skillname" });
          // 召喚の光
          s.effects.push({ x:W*0.65, y:py, vx:0, vy:0, life:500, maxLife:500, alpha:1, radius:0, maxRadius:60, color:turn.logColor||"#c084fc", type:"shockwave" });

        } else if (turn.type === "statusDmg") {
          // HP更新
          if (turn.actor === "player" && onMonsterHpUpdate && turn.target >= 0) {
            onMonsterHpUpdate(turn.target, turn.hpLeft);
          }
          if (turn.actor === "monster" && onPlayerHpUpdate && turn.hpLeft !== undefined) {
            onPlayerHpUpdate(turn.hpLeft);
          }
          // ダメージ数字
          const isEnemy = turn.actor === "player";
          const tx = isEnemy ? mx : px;
          const ty = isEnemy ? my : py;
          const STATUS_COLOR = { poison:"#a78bfa", burn:"#ef4444", paralyze:"#fbbf24", freeze:"#38bdf8" };
          const STATUS_ICON = { poison:"☠", burn:"🔥", paralyze:"⚡", freeze:"❄" };
          s.effects.push({
            x:tx, y:ty-70, vx:0, vy:-1.2,
            life:800, maxLife:800, alpha:1,
            text:`${STATUS_ICON[turn.statusType]||""}${turn.dmg}`,
            color:STATUS_COLOR[turn.statusType]||"#a0a0a0",
            type:"number",
          });

        } else if (turn.type === "status") {
          const STATUS_COLOR = { poison:"#a78bfa", burn:"#ef4444", paralyze:"#fbbf24", freeze:"#38bdf8", stun:"#e8e0d0" };
          const STATUS_ICON = { poison:"☠", burn:"🔥", paralyze:"⚡", freeze:"❄", stun:"💫" };
          const tx = turn.target >= 0 ? mx : px;
          const ty = turn.target >= 0 ? my : py;
          s.effects.push({
            x:tx, y:ty-90, vx:0, vy:-0.6,
            life:1000, maxLife:1000, alpha:1,
            text:STATUS_ICON[turn.statusType]||"?",
            color:STATUS_COLOR[turn.statusType]||"#a0a0a0",
            type:"skillname",
          });
          // 状態異常の輪
          s.effects.push({
            x:tx, y:ty-40, vx:0, vy:0,
            life:600, maxLife:600, alpha:1,
            radius:0, maxRadius:45,
            color:STATUS_COLOR[turn.statusType]||"#a0a0a0",
            type:"shockwave",
          });
        }
      }

      s.effects = s.effects.filter(e => e.life > 0);
      s.effects.forEach(e => {
        e.life -= dt;
        e.x += (e.vx||0) * dt * 0.05;
        e.y += (e.vy||0) * dt * 0.05;
        e.alpha = Math.max(0, e.life / e.maxLife);

        ctx.save();
        ctx.globalAlpha = e.alpha;

        if (e.type === "slash") {
          ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.shadowColor = e.color; ctx.shadowBlur = 8;
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
          ctx.beginPath(); ctx.moveTo(-(e.len||16), 0); ctx.lineTo(e.len||16, 0); ctx.stroke();
          ctx.restore();
        } else if (e.type === "shockwave") {
          const progress = 1 - e.life / e.maxLife;
          const r = e.maxRadius * progress;
          ctx.strokeStyle = e.color; ctx.lineWidth = 2;
          ctx.globalAlpha = e.alpha * (1 - progress);
          ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI*2); ctx.stroke();
        } else if (e.type === "particle") {
          ctx.fillStyle = e.color;
          ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, Math.PI*2); ctx.fill();
        } else if (e.type === "number") {
          const fontSize = e.big ? H*0.05 : e.isCrit ? H*0.045 : H*0.035;
          ctx.font = `bold ${fontSize}px monospace`; ctx.textAlign = "center";
          ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = e.isCrit ? 16 : 8;
          ctx.fillText(e.text, e.x, e.y);
          if (e.isCrit) { ctx.font = `bold ${H*0.022}px monospace`; ctx.fillStyle = "#fbbf24"; ctx.fillText("CRITICAL!", e.x, e.y - fontSize); }
        } else if (e.type === "skillname") {
          ctx.font = `bold ${H*0.026}px monospace`; ctx.textAlign = "center";
          ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 10;
          ctx.fillText(e.text, e.x, e.y);
        }
        ctx.restore();
      });

      if (s.playerHitFlash > 0) {
        const shakeX = s.playerShake > 0 ? (Math.random()-0.5)*8 : 0;
        const a = s.playerHitFlash / 200;
        const g = ctx.createRadialGradient(playerX*W+shakeX, playerY*H-40, 0, playerX*W+shakeX, playerY*H-40, 70);
        g.addColorStop(0, `rgba(248,113,113,${a*0.6})`); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (s.monsterHitFlash > 0) {
        const shakeX = s.monsterShake > 0 ? (Math.random()-0.5)*8 : 0;
        const a = s.monsterHitFlash / 200;
        const g = ctx.createRadialGradient(monsterX*W+shakeX, monsterY*H-40, 0, monsterX*W+shakeX, monsterY*H-40, 70);
        g.addColorStop(0, `rgba(255,255,255,${a*0.5})`); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isActive, turns, monsterX, monsterY, playerX, playerY, onComplete, onPlayerHpUpdate, onMonsterHpUpdate, onTurnLog, onSummonUpdate]);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:4, pointerEvents:"none" }} />
  );
}