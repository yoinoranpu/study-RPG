import { useEffect, useRef } from "react";

const TURN_DURATION = 4000;  // 1ターンの表示時間(ms)

export default function BattleEffect({ isActive, turns, onComplete, monsterX, monsterY, playerX, playerY, onPlayerHpUpdate, onMonsterHpUpdate }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({ turnIndex:0, turnTime:0, effects:[], playerHitFlash:0, monsterHitFlash:0, done:false });

  useEffect(() => {
    if (!isActive) {
      stateRef.current = { turnIndex:0, turnTime:0, effects:[], playerHitFlash:0, monsterHitFlash:0, done:false };
      return;
    }
    stateRef.current = { turnIndex:0, turnTime:0, effects:[], playerHitFlash:0, monsterHitFlash:0, done:false };
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
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      s.turnTime += dt;
      s.playerHitFlash = Math.max(0, s.playerHitFlash - dt);
      s.monsterHitFlash = Math.max(0, s.monsterHitFlash - dt);

      // 現在のターン処理
      if (s.turnTime >= TURN_DURATION) {
        s.turnTime = 0;
        s.turnIndex++;
        if (s.turnIndex >= turns.length) {
          s.done = true;
          onComplete && onComplete();
        }
      }

      const turn = turns[Math.min(s.turnIndex, turns.length - 1)];

      // 新しいターンが始まったタイミングでエフェクト生成
      if (s.turnTime < 30 && turn) {
        if (turn.type === "attack") {
          const tx = turn.actor === "player" ? monsterX * W : playerX * W;
          const ty = turn.actor === "player" ? monsterY * H : playerY * H;

          if (turn.actor === "player" && onMonsterHpUpdate) {
            onMonsterHpUpdate(turn.target, turn.hpLeft);
          }
          if (turn.actor === "monster" && onPlayerHpUpdate) {
            onPlayerHpUpdate(turn.hpLeft);
          }

          for (let i = 0; i < 4; i++) {
            s.effects.push({
              x: tx + (Math.random()-0.5)*30, y: ty + (Math.random()-0.5)*30,
              vx: (Math.random()-0.5)*3, vy: -Math.random()*2,
              life: 400, maxLife: 400, alpha: 1,
              angle: Math.random()*Math.PI,
              color: turn.actor === "player" ? "#e8e0d0" : "#f87171",
              type: "slash",
            });
          }
          s.effects.push({
            x: tx, y: ty - 30, vx: (Math.random()-0.5)*0.3, vy: -1.2,
            life: 700, maxLife: 700, alpha: 1,
            text: `${turn.dmg}`, isCrit: turn.isCrit,
            color: turn.actor === "player" ? "#fbbf24" : "#f87171",
            type: "number",
          });
          if (turn.actor === "player") s.monsterHitFlash = 150;
          else s.playerHitFlash = 150;

        } else if (turn.type === "miss") {
          const tx = turn.actor === "player" ? monsterX * W : playerX * W;
          const ty = turn.actor === "player" ? monsterY * H : playerY * H;
          s.effects.push({
            x: tx, y: ty - 30, vx:0, vy:-1,
            life: 600, maxLife: 600, alpha: 1,
            text: "MISS", color: "#34d399", type: "number",
          });
        } else if (turn.type === "defeat") {
          s.effects.push({
            x: monsterX * W, y: monsterY * H - 50, vx:0, vy:-0.5,
            life: 900, maxLife: 900, alpha: 1,
            text: "DEFEAT!", color: "#fbbf24", type: "number", big:true,
          });
        }
      }

      // エフェクト更新・描画
      s.effects = s.effects.filter(e => e.life > 0);
      s.effects.forEach(e => {
        e.life -= dt;
        e.x += e.vx * dt * 0.05;
        e.y += e.vy * dt * 0.05;
        e.alpha = Math.max(0, e.life / e.maxLife);

        ctx.save();
        ctx.globalAlpha = e.alpha;
        if (e.type === "slash") {
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 6;
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(e.angle);
          ctx.beginPath();
          ctx.moveTo(-16, 0); ctx.lineTo(16, 0);
          ctx.stroke();
          ctx.restore();
        } else if (e.type === "number") {
          ctx.font = `bold ${e.big ? H*0.05 : (e.isCrit ? H*0.04 : H*0.032)}px monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = e.isCrit ? 14 : 8;
          ctx.fillText(e.text, e.x, e.y);
          if (e.isCrit) {
            ctx.font = `bold ${H*0.018}px monospace`;
            ctx.fillText("CRITICAL!", e.x, e.y - H*0.04);
          }
        }
        ctx.restore();
      });

      // 主人公・モンスターのヒットフラッシュ（赤く光る円）
      if (s.playerHitFlash > 0) {
        const a = s.playerHitFlash / 150;
        const g = ctx.createRadialGradient(playerX*W, playerY*H-40, 0, playerX*W, playerY*H-40, 60);
        g.addColorStop(0, `rgba(248,113,113,${a*0.5})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
      }
      if (s.monsterHitFlash > 0) {
        const a = s.monsterHitFlash / 150;
        const g = ctx.createRadialGradient(monsterX*W, monsterY*H-40, 0, monsterX*W, monsterY*H-40, 60);
        g.addColorStop(0, `rgba(255,255,255,${a*0.6})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isActive, turns, monsterX, monsterY, playerX, playerY, onComplete]);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:4, pointerEvents:"none" }} />
  );
}