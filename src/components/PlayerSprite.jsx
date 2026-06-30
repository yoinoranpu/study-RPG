import { useEffect, useRef } from "react";

function drawPlayer(ctx, x, y, frame, hp, maxHp, hitFlash) {
  const scale = 2;
  const W = 24 * scale;
  const H = 32 * scale;
  const bx = x - W / 2;
  const by = y - H;

  const legOffset = Math.sin(frame * 0.3) * 4;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.ellipse(x, y + 2, W * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 被弾時は赤みがかる
  const tint = hitFlash > 0 ? hitFlash / 200 : 0;

  ctx.fillStyle = "#5a3a10";
  ctx.fillRect(bx + W * 0.2, by + H * 0.75 + legOffset, W * 0.22, H * 0.28);
  ctx.fillRect(bx + W * 0.55, by + H * 0.75 - legOffset, W * 0.22, H * 0.28);

  ctx.fillStyle = tint > 0 ? `rgb(${74+tint*180},${74-tint*40},${106-tint*60})` : "#4a4a6a";
  ctx.fillRect(bx + W * 0.15, by + H * 0.35, W * 0.70, H * 0.42);

  ctx.fillStyle = "#6a6a8a";
  ctx.fillRect(bx + W * 0.25, by + H * 0.38, W * 0.50, H * 0.06);
  ctx.fillRect(bx + W * 0.25, by + H * 0.50, W * 0.50, H * 0.06);

  ctx.fillStyle = tint > 0 ? `rgb(${74+tint*180},${74-tint*40},${106-tint*60})` : "#4a4a6a";
  ctx.fillRect(bx, by + H * 0.35, W * 0.18, H * 0.35);

  const swordAngle = Math.sin(frame * 0.3) * 0.15;
  ctx.save();
  ctx.translate(bx + W * 0.85, by + H * 0.45);
  ctx.rotate(swordAngle);
  ctx.fillStyle = "#c0c0d0";
  ctx.fillRect(-3, -H * 0.35, 6, H * 0.35);
  ctx.fillStyle = "#8a7a20";
  ctx.fillRect(-8, 0, 16, 5);
  ctx.fillStyle = "#5a3a10";
  ctx.fillRect(-3, 5, 6, H * 0.15);
  ctx.restore();

  ctx.fillStyle = tint > 0 ? `rgb(${200+tint*55},${168-tint*60},${122-tint*60})` : "#c8a87a";
  ctx.fillRect(bx + W * 0.20, by + H * 0.08, W * 0.60, H * 0.28);

  ctx.fillStyle = tint > 0 ? `rgb(${74+tint*180},${74-tint*40},${106-tint*60})` : "#4a4a6a";
  ctx.fillRect(bx + W * 0.15, by, W * 0.70, H * 0.18);
  ctx.fillRect(bx + W * 0.22, by + H * 0.16, W * 0.56, H * 0.08);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx + W * 0.28, by + H * 0.13, W * 0.16, H * 0.07);
  ctx.fillRect(bx + W * 0.55, by + H * 0.13, W * 0.16, H * 0.07);
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(bx + W * 0.32, by + H * 0.14, W * 0.08, H * 0.05);
  ctx.fillRect(bx + W * 0.59, by + H * 0.14, W * 0.08, H * 0.05);

  // 被弾フラッシュ（全体に赤いオーバーレイ）
  if (hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = (hitFlash / 200) * 0.4;
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(bx, by, W, H);
    ctx.restore();
  }

  // HPバー
  const barW = W * 1.2;
  const barX = x - barW / 2;
  const barY = by - 12;
  ctx.fillStyle = "#1a0a0a";
  ctx.fillRect(barX, barY, barW, 5);
  const hpPct = Math.max(0, Math.min(1, hp / maxHp));
  ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
  ctx.fillRect(barX, barY, barW * hpPct, 5);
}

export default function PlayerSprite({ hp, maxHp, isRunning, isBreak, hitTrigger }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const animFrame = useRef(0);
  const hitFlashRef = useRef(0);
  const lastHitTrigger = useRef(0);

  // 被弾トリガー検知
  useEffect(() => {
    if (hitTrigger && hitTrigger !== lastHitTrigger.current) {
      hitFlashRef.current = 200;
      lastHitTrigger.current = hitTrigger;
    }
  }, [hitTrigger]);

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
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width  = W;
        canvas.height = H;
      }

      ctx.clearRect(0, 0, W, H);

      if (isRunning && !isBreak) {
        animFrame.current += dt * 0.05;
      }

      hitFlashRef.current = Math.max(0, hitFlashRef.current - dt);

      const bobY = isRunning && !isBreak
        ? Math.sin(animFrame.current * 0.3) * 3
        : 0;

      const px = W * 0.72;
      const py = H * 0.72 + bobY;

      drawPlayer(ctx, px, py, animFrame.current, hp, maxHp, hitFlashRef.current);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning, isBreak, hp, maxHp]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
      }}
    />
  );
}