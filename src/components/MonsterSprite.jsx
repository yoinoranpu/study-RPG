import { useEffect, useRef } from "react";

const TRIBE_DESIGNS = {
  粘体:   { color:"#4ade80", body:"slime"  },
  獣:     { color:"#fb923c", body:"beast"  },
  ゴブリン:{ color:"#86efac", body:"goblin" },
  不死:   { color:"#a78bfa", body:"undead" },
  悪魔:   { color:"#f87171", body:"demon"  },
  植物:   { color:"#4ade80", body:"plant"  },
  竜:     { color:"#fbbf24", body:"dragon" },
};

function drawSlime(ctx, x, y, size, color, frame) {
  const bounce = Math.sin(frame * 0.05) * size * 0.08;
  const squish = 1 + Math.sin(frame * 0.05) * 0.1;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size*0.5*squish, size*0.4/squish, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = color + "88";
  ctx.beginPath();
  ctx.ellipse(-size*0.1, -size*0.1, size*0.15, size*0.12, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(-size*0.15, -size*0.05, size*0.06, size*0.08, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size*0.15, -size*0.05, size*0.06, size*0.08, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawBeast(ctx, x, y, size, color, frame) {
  const walkY = Math.sin(frame*0.08)*size*0.05;
  const legSwing = Math.sin(frame*0.08)*0.3;
  ctx.save();
  ctx.translate(x, y+walkY);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -size*0.2, size*0.35, size*0.25, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size*0.2, -size*0.45, size*0.22, size*0.2, 0.3, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size*0.28, -size*0.6);
  ctx.lineTo(size*0.18, -size*0.72);
  ctx.lineTo(size*0.38, -size*0.68);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = size*0.1;
  ctx.lineCap = "round";
  ctx.save(); ctx.rotate(legSwing);
  ctx.beginPath(); ctx.moveTo(-size*0.15,-size*0.1); ctx.lineTo(-size*0.2,size*0.25); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.rotate(-legSwing);
  ctx.beginPath(); ctx.moveTo(size*0.1,-size*0.1); ctx.lineTo(size*0.15,size*0.25); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#f00";
  ctx.beginPath(); ctx.arc(size*0.28,-size*0.46,size*0.05,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(size*0.29,-size*0.46,size*0.03,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = size*0.08;
  ctx.beginPath();
  ctx.moveTo(-size*0.3,-size*0.2);
  ctx.quadraticCurveTo(-size*0.5,-size*0.4+Math.sin(frame*0.05)*size*0.1,-size*0.4,-size*0.5);
  ctx.stroke();
  ctx.restore();
}

function drawGoblin(ctx, x, y, size, color, frame) {
  const walkY = Math.sin(frame*0.08)*size*0.04;
  const legSwing = Math.sin(frame*0.08)*0.25;
  ctx.save();
  ctx.translate(x, y+walkY);
  ctx.fillStyle = "#5a3a10";
  ctx.save(); ctx.rotate(legSwing);
  ctx.fillRect(-size*0.22,size*0.05,size*0.12,size*0.3); ctx.restore();
  ctx.save(); ctx.rotate(-legSwing);
  ctx.fillRect(size*0.1,size*0.05,size*0.12,size*0.3); ctx.restore();
  ctx.fillStyle = color;
  ctx.fillRect(-size*0.25,-size*0.3,size*0.5,size*0.35);
  ctx.beginPath(); ctx.ellipse(0,-size*0.45,size*0.22,size*0.2,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-size*0.18,-size*0.45); ctx.lineTo(-size*0.35,-size*0.6); ctx.lineTo(-size*0.12,-size*0.38); ctx.fill();
  ctx.beginPath(); ctx.moveTo(size*0.18,-size*0.45); ctx.lineTo(size*0.35,-size*0.6); ctx.lineTo(size*0.12,-size*0.38); ctx.fill();
  ctx.fillStyle = "#f00";
  ctx.beginPath(); ctx.arc(-size*0.09,-size*0.47,size*0.05,0,Math.PI*2); ctx.arc(size*0.09,-size*0.47,size*0.05,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#5a3a10"; ctx.lineWidth = size*0.07; ctx.lineCap = "round";
  ctx.save(); ctx.rotate(Math.sin(frame*0.08)*0.2);
  ctx.beginPath(); ctx.moveTo(-size*0.3,-size*0.2); ctx.lineTo(-size*0.45,-size*0.55); ctx.stroke();
  ctx.fillStyle = "#3a2a08"; ctx.beginPath(); ctx.arc(-size*0.45,-size*0.6,size*0.1,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawUndead(ctx, x, y, size, color, frame) {
  const float = Math.sin(frame*0.04)*size*0.06;
  ctx.save(); ctx.translate(x, y+float); ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#2a2a3a";
  ctx.beginPath();
  ctx.moveTo(-size*0.3,-size*0.5); ctx.lineTo(size*0.3,-size*0.5);
  ctx.lineTo(size*0.4,size*0.35); ctx.lineTo(-size*0.4,size*0.35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e8e0d0";
  ctx.beginPath(); ctx.ellipse(0,-size*0.6,size*0.2,size*0.22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(-size*0.08,-size*0.62,size*0.06,size*0.07,0,0,Math.PI*2);
  ctx.ellipse(size*0.08,-size*0.62,size*0.06,size*0.07,0,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#e8e0d0"; ctx.lineWidth = size*0.06; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-size*0.3,-size*0.3); ctx.lineTo(-size*0.5,size*0.1+Math.sin(frame*0.04)*size*0.05); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(size*0.3,-size*0.3); ctx.lineTo(size*0.5,size*0.1+Math.sin(frame*0.04+1)*size*0.05); ctx.stroke();
  ctx.globalAlpha = 1; ctx.restore();
}

function drawDemon(ctx, x, y, size, color, frame) {
  const walkY = Math.sin(frame*0.08)*size*0.04;
  ctx.save(); ctx.translate(x, y+walkY);
  ctx.fillStyle = "#1a0a0a";
  ctx.save(); ctx.rotate(Math.sin(frame*0.06)*0.15);
  ctx.beginPath(); ctx.moveTo(0,-size*0.3); ctx.quadraticCurveTo(-size*0.6,-size*0.6,-size*0.7,size*0.1); ctx.quadraticCurveTo(-size*0.3,-size*0.1,0,0); ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(-Math.sin(frame*0.06)*0.15);
  ctx.beginPath(); ctx.moveTo(0,-size*0.3); ctx.quadraticCurveTo(size*0.6,-size*0.6,size*0.7,size*0.1); ctx.quadraticCurveTo(size*0.3,-size*0.1,0,0); ctx.fill(); ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0,-size*0.15,size*0.28,size*0.35,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-size*0.52,size*0.22,size*0.2,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#ff4444"; ctx.lineWidth = size*0.06; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-size*0.1,-size*0.65); ctx.lineTo(-size*0.18,-size*0.82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(size*0.1,-size*0.65); ctx.lineTo(size*0.18,-size*0.82); ctx.stroke();
  ctx.fillStyle = "#ff0"; ctx.shadowColor = "#ff0"; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(-size*0.09,-size*0.52,size*0.06,size*0.05,0,0,Math.PI*2);
  ctx.ellipse(size*0.09,-size*0.52,size*0.06,size*0.05,0,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

function drawPlant(ctx, x, y, size, color, frame) {
  const sway = Math.sin(frame*0.03)*0.08;
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = "#2d6a2d"; ctx.lineWidth = size*0.12; ctx.lineCap = "round";
  ctx.save(); ctx.rotate(sway);
  ctx.beginPath(); ctx.moveTo(0,size*0.35); ctx.quadraticCurveTo(0,0,0,-size*0.3); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(-size*0.3,-size*0.15,size*0.28,size*0.12,-0.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(size*0.3,-size*0.05,size*0.28,size*0.12,0.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-size*0.42,size*0.25,0,Math.PI*2); ctx.fill();
  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2+frame*0.01;
    ctx.fillStyle="#ffdd44";
    ctx.beginPath(); ctx.ellipse(Math.cos(a)*size*0.28,-size*0.42+Math.sin(a)*size*0.28,size*0.1,size*0.07,a,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle="#000";
  ctx.beginPath(); ctx.arc(-size*0.09,-size*0.44,size*0.05,0,Math.PI*2); ctx.arc(size*0.09,-size*0.44,size*0.05,0,Math.PI*2); ctx.fill();
  ctx.restore(); ctx.restore();
}

function drawDragon(ctx, x, y, size, color, frame) {
  const walkY = Math.sin(frame*0.06)*size*0.04;
  ctx.save(); ctx.translate(x, y+walkY);
  ctx.strokeStyle = color; ctx.lineWidth = size*0.12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-size*0.1,size*0.1); ctx.quadraticCurveTo(-size*0.5,size*0.2+Math.sin(frame*0.04)*size*0.05,-size*0.6,-size*0.1); ctx.stroke();
  const legS = Math.sin(frame*0.06)*0.3;
  ctx.lineWidth = size*0.1;
  ctx.save(); ctx.rotate(legS); ctx.beginPath(); ctx.moveTo(-size*0.15,size*0.1); ctx.lineTo(-size*0.2,size*0.38); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.rotate(-legS); ctx.beginPath(); ctx.moveTo(size*0.15,size*0.1); ctx.lineTo(size*0.2,size*0.38); ctx.stroke(); ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0,-size*0.1,size*0.32,size*0.28,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = color+"88";
  ctx.save(); ctx.rotate(Math.sin(frame*0.06)*0.1);
  ctx.beginPath(); ctx.moveTo(0,-size*0.2); ctx.quadraticCurveTo(-size*0.5,-size*0.5,-size*0.55,0); ctx.quadraticCurveTo(-size*0.2,-size*0.1,0,0); ctx.fill(); ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(size*0.22,-size*0.38,size*0.22,size*0.17,0.3,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = size*0.05;
  ctx.beginPath(); ctx.moveTo(size*0.28,-size*0.5); ctx.lineTo(size*0.35,-size*0.66); ctx.stroke();
  ctx.fillStyle = "#f00"; ctx.shadowColor = "#f00"; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(size*0.32,-size*0.4,size*0.05,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

const DRAW_FUNCS = { slime:drawSlime, beast:drawBeast, goblin:drawGoblin, undead:drawUndead, demon:drawDemon, plant:drawPlant, dragon:drawDragon };

export default function MonsterSprite({ monsters, isVisible, onReach, floorY }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({ positions:[], animFrame:0, arrived:false });

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

      const list = monsters || [];
      if (list.length === 0 || !isVisible) { frameRef.current = requestAnimationFrame(loop); return; }

      const s = stateRef.current;

      // 初期化：各モンスターの位置を設定
      if (s.positions.length !== list.length) {
        s.positions = list.map((_, i) => ({
          x: -W * 0.2 - i * 60,
          targetX: W * (0.35 - i * 0.13),
        }));
        s.arrived = false;
      }

      s.animFrame += dt * 0.05;

      // 全員が到着したかチェック
      let allArrived = true;
      s.positions.forEach(p => {
        if (p.x < p.targetX) {
          p.x += dt * 0.15;
          if (p.x >= p.targetX) p.x = p.targetX;
          else allArrived = false;
        }
      });

      if (allArrived && !s.arrived) {
        s.arrived = true;
        onReach && onReach();
      }

      // 各モンスターを描画（後ろの敵から先に描く）
      [...list].reverse().forEach((monster, revIdx) => {
        const i = list.length - 1 - revIdx;
        if (!monster || monster.hp <= 0) return;
        const p = s.positions[i];
        if (!p) return;

        const tribe = monster.tribe || "粘体";
        const design = TRIBE_DESIGNS[tribe] || TRIBE_DESIGNS["粘体"];
        const drawFn = DRAW_FUNCS[design.body];
        const py = (floorY || H * 0.72) - i * 12;
        const rarityMul = { none:1.0, elite:1.15, hero:1.3, legend:1.5 }[monster.rarity?.id||"none"] || 1.0;
        const size = H * 0.18 * rarityMul * (1 - i * 0.12);

        ctx.save();
        ctx.globalAlpha = 1;
        if (drawFn) drawFn(ctx, p.x, py, size, design.color, s.animFrame + i * 20);
        ctx.restore();
        ctx.globalAlpha = 1;

        // HPバー
        if (monster.maxHp) {
          const barW = size * 2.2;
          const barH = i === 0 ? 18 : 12;
          const barY = py - size * 1.2 - 16;
          const barX = p.x - barW/2;

          ctx.fillStyle = "#1a0a0a";
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.fill();

          const hpPct = Math.max(0, (monster.hp||0) / monster.maxHp);
          ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW * hpPct, barH, 3);
          ctx.fill();

          ctx.strokeStyle = "#333";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.stroke();

          ctx.font = `bold ${H * (i===0 ? 0.016 : 0.012)}px monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.shadowBlur = 0;
          ctx.fillText(`${monster.hp||0}/${monster.maxHp}`, p.x, barY + barH * 0.75);
        }

        // 名前
        ctx.font = `bold ${H * (i===0 ? 0.020 : 0.015)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = monster.rarity?.color || "#888";
        ctx.shadowColor = monster.rarity?.color || "#888";
        ctx.shadowBlur = 4;
        ctx.fillText(monster.displayName, p.x, py - size * 1.2 - 22);
        ctx.shadowBlur = 0;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [monsters, isVisible, onReach, floorY]);

  useEffect(() => {
    if (!isVisible) {
      stateRef.current = { positions:[], animFrame:0, arrived:false };
    }
  }, [isVisible]);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />;
}