import { useEffect, useRef } from "react";

const EVENT_DESIGNS = {
  chest:     { icon:"📦", color:"#fbbf24", label:"宝箱発見！" },
  rare_chest:{ icon:"💜", color:"#a78bfa", label:"レア宝箱！" },
  trap:      { icon:"⚠",  color:"#fb923c", label:"罠！" },
  heal:      { icon:"💧", color:"#38bdf8", label:"回復の泉" },
  npc:       { icon:"🧝", color:"#34d399", label:"冒険者に遭遇" },
  fairy:     { icon:"🧚", color:"#f472b6", label:"妖精の加護" },
  spirit:    { icon:"👻", color:"#a78bfa", label:"精霊の祝福" },
};

function drawEvent(ctx, x, y, design, frame) {
  const bounce = Math.sin(frame * 0.05) * 6;
  const scale  = 1 + Math.sin(frame * 0.08) * 0.05;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  glow.addColorStop(0, design.color + "44");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(-50, -50, 100, 100);
  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(design.icon, 0, 0);
  ctx.restore();
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = design.color;
  ctx.fillText(design.label, x, y + bounce - 44);
}

export default function EventSprite({ eventType, isVisible, onReach }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({ x:null, targetX:null, animFrame:0, reached:false });

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
      if (!eventType || !isVisible) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      const s = stateRef.current;
      if (s.x === null) {
        s.x = -80;
        s.targetX = W * 0.28;
      }
      s.animFrame += dt * 0.05;
      // 左から右へ移動（背景と同じ速度）
      if (s.x < s.targetX - 2) {
        s.x += dt * 0.15;
      } else {
        s.x = s.targetX;
        if (!s.reached) {
          s.reached = true;
          onReach && onReach();
        }
      }
      const design = EVENT_DESIGNS[eventType] || EVENT_DESIGNS.chest;
      drawEvent(ctx, s.x, H * 0.55, design, s.animFrame);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [eventType, isVisible, onReach]);

  useEffect(() => {
    stateRef.current = { x:null, targetX:null, animFrame:0, reached:false };
  }, [eventType]);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />
  );
}