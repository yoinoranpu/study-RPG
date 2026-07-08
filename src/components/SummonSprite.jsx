import { useEffect, useRef } from "react";

const SUMMON_STYLE = {
  familiar: { color:"#c084fc", size:0.7, label:"使い魔" },
  wolf:     { color:"#a78bfa", size:1.0, label:"オオカミ" },
  skeleton: { color:"#e8e0d0", size:0.6, label:"スケルトン" },
  turret:   { color:"#9ca3af", size:0.9, label:"タレット" },
  golem:    { color:"#a16207", size:1.4, label:"ゴーレム" },
};

export default function SummonSprite({ summons }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const animRef = useRef(0);

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

      animRef.current += dt * 0.003;

      if (!summons || summons.length === 0) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      // プレイヤーの周辺に召喚物を配置
      summons.forEach((summon, i) => {
        if (summon.hp <= 0) return;
        const style = SUMMON_STYLE[summon.summonType] || SUMMON_STYLE.familiar;
        const baseSize = H * 0.08 * style.size;

        // 前衛は前、後衛は後ろに配置
        const isFront = summon.position === "front";
        const baseX = isFront ? W * 0.62 : W * 0.82;
        const baseY = H * 0.72;

        // 複数召喚物を少しずらす
        const offsetX = (i % 2) * 30 - 15;
        const offsetY = Math.floor(i / 2) * -25;
        const bob = Math.sin(animRef.current * 2 + i) * 3;

        const x = baseX + offsetX;
        const y = baseY + offsetY + bob;

        // 影
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(x, y + baseSize*0.5, baseSize*0.4, 4, 0, 0, Math.PI*2);
        ctx.fill();

        // 四角オブジェクト
        ctx.fillStyle = style.color;
        ctx.shadowColor = style.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(x - baseSize/2, y - baseSize/2, baseSize, baseSize);
        ctx.shadowBlur = 0;

        // 枠
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - baseSize/2, y - baseSize/2, baseSize, baseSize);

        // 目（簡易的なキャラ感）
        ctx.fillStyle = "#000";
        ctx.fillRect(x - baseSize*0.2, y - baseSize*0.1, baseSize*0.12, baseSize*0.12);
        ctx.fillRect(x + baseSize*0.08, y - baseSize*0.1, baseSize*0.12, baseSize*0.12);

        // HPバー
        const barW = baseSize * 1.2;
        const barH = 4;
        const barX = x - barW/2;
        const barY = y - baseSize/2 - 8;
        ctx.fillStyle = "#1a0a0a";
        ctx.fillRect(barX, barY, barW, barH);
        const hpPct = summon.hp / summon.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
        ctx.fillRect(barX, barY, barW * hpPct, barH);

        // 名前
        ctx.font = `${H*0.014}px monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = style.color;
        ctx.fillText(style.label, x, barY - 3);
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [summons]);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />;
}