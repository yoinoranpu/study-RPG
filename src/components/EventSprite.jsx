import { useEffect, useRef } from "react";
import { CHEST_TYPES } from "../data/chest_table";

// 宝箱は木箱/銀箱/金箱/虹箱それぞれの実イラストを使う（開閉2枚を別々にAI生成すると
// 同一の箱に見えない事故が起きやすいため、閉じた1枚だけ用意しパーティクル演出で「開いた感」を出す）
const CHEST_EVENT_DESIGNS = Object.fromEntries(
  Object.values(CHEST_TYPES).map(ct => [
    `chest_${ct.id}`,
    { icon: ct.icon, color: ct.color, image: ct.image, label: `${ct.label}発見！`, kind: "chest" },
  ])
);

const EVENT_DESIGNS = {
  ...CHEST_EVENT_DESIGNS,
  trap:      { icon:"⚠",  color:"#fb923c", label:"罠！",         kind:"trap"    },
  heal:      { icon:"💧", color:"#38bdf8", label:"回復の泉",     kind:"ripple"  },
  npc:       { icon:"🧝", color:"#34d399", label:"冒険者に遭遇", kind:"npc"     },
  fairy:     { icon:"🧚", color:"#f472b6", label:"妖精の加護",   kind:"sparkle" },
  spirit:    { icon:"👻", color:"#a78bfa", label:"精霊の祝福",   kind:"sparkle" },
};

const ACTION_DURATION = { chest:900, trap:500, ripple:99999, npc:700, sparkle:99999 };

// キャンバス描画用の画像プリロードキャッシュ（モジュールスコープでセッション中1回だけ読み込む）
const imageCache = {};
function getCachedImage(src) {
  if (!src) return null;
  if (!imageCache[src]) {
    const img = new Image();
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

function spawnBurst(particles, x, y, color, count, type) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 1.2 + Math.random() * 1.6;
    particles.push({
      type, x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
      life: 500 + Math.random() * 300, maxLife: 800, color,
    });
  }
}

function spawnSpikes(particles, cx, groundY, color, count) {
  for (let i = 0; i < count; i++) {
    const x = cx + (i - (count - 1) / 2) * 12 + (Math.random() - 0.5) * 4;
    particles.push({
      type:"spike", x, y:groundY, vx:0, vy:0,
      life: 380 + Math.random() * 120, maxLife: 500, color,
      delay: i * 25,
    });
  }
}

function drawParticle(ctx, p) {
  if (p.type === "spike") {
    const elapsed = p.maxLife - p.life;
    const localT = elapsed - (p.delay || 0);
    if (localT < 0) return;
    const dur = p.maxLife - (p.delay || 0);
    const prog = Math.min(1, localT / Math.max(1, dur));
    const rise = prog < 0.35 ? prog / 0.35 : 1 - ((prog - 0.35) / 0.65) * 0.4;
    const h = 22 * Math.max(0, rise);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - prog);
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x - 4, p.y); ctx.lineTo(p.x + 4, p.y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }
  const a = Math.max(0, p.life / p.maxLife);
  ctx.save();
  ctx.globalAlpha = a;
  if (p.type === "spark") {
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === "bubble") {
    ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.shadowColor = p.color; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 + Math.sin(p.life * 0.02) * 1, 0, Math.PI * 2); ctx.stroke();
  } else if (p.type === "dust") {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawKindEffect(ctx, x, y, design, phase, phaseTime, frame) {
  const bounce = phase === "trap" && phaseTime < ACTION_DURATION.trap
    ? (Math.random() - 0.5) * 6
    : Math.sin(frame * 0.05) * 6;
  const popScale = phase === "action" && design.kind === "chest"
    ? 1 + Math.max(0, 1 - phaseTime / ACTION_DURATION.chest) * 0.35
    : 1 + Math.sin(frame * 0.08) * 0.05;

  const cx = x + bounce * 0;
  const cy = y + bounce;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(popScale, popScale);

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  glow.addColorStop(0, design.color + "44");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(-50, -50, 100, 100);

  if (design.kind === "ripple") {
    const t = (frame * 0.02) % 1;
    for (let i = 0; i < 2; i++) {
      const rt = (t + i * 0.5) % 1;
      ctx.strokeStyle = design.color;
      ctx.globalAlpha = 1 - rt;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 30, 12 + rt * 46, 4 + rt * 14, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (design.kind === "sparkle") {
    for (let i = 0; i < 5; i++) {
      const ang = frame * 0.04 + (i / 5) * Math.PI * 2;
      const r = 34 + Math.sin(frame * 0.06 + i) * 6;
      const sx = Math.cos(ang) * r, sy = Math.sin(ang) * r * 0.6;
      ctx.fillStyle = design.color;
      ctx.shadowColor = design.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (phase === "trap-shake") ctx.translate((Math.random() - 0.5) * 6, 0);
  const img = design.image ? getCachedImage(design.image) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    const drawW = 66;
    const drawH = drawW * (img.naturalHeight / img.naturalWidth);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(design.icon, 0, 0);
  }
  ctx.restore();

  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = design.color;
  ctx.fillText(design.label, cx, cy - 44);
}

export default function EventSprite({ eventType, isVisible, onReach }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({ x:null, targetX:null, animFrame:0, reached:false, phase:"enter", phaseTime:0, particles:[], nextBurst:0 });
  // onReachは親の再レンダーのたびに新しい関数になるため、依存配列に直接入れず
  // refに最新版を格納してループ内から読む(アニメーションループの不要な再起動を防ぐ)
  const cbRef = useRef({});
  useEffect(() => { cbRef.current = { onReach }; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = 0;

    const loop = (time) => {
      const { onReach } = cbRef.current;
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
      const design = EVENT_DESIGNS[eventType] || EVENT_DESIGNS.chest_common;

      if (s.x === null) {
        s.x = -80;
        s.targetX = W * 0.28;
      }
      s.animFrame += dt * 0.05;

      if (s.phase === "enter") {
        if (s.x < s.targetX - 2) {
          s.x += dt * 0.15;
          if (design.kind === "npc" && Math.random() < 0.3) {
            s.particles.push({ type:"dust", x:s.x - 20, y:H * 0.55 + 30, vx:-0.3, vy:0, life:300, maxLife:300, color:"#4a4a3a" });
          }
        } else {
          s.x = s.targetX;
          s.phase = "action";
          s.phaseTime = 0;
          if (!s.reached) { s.reached = true; onReach && onReach(); }
          const cx = s.x, cy = H * 0.55;
          if (design.kind === "chest") spawnBurst(s.particles, cx, cy, design.color, 14, "spark");
          if (design.kind === "trap")  spawnSpikes(s.particles, cx, cy + 30, design.color, 7);
        }
      } else {
        s.phaseTime += dt;
        const cx = s.x, cy = H * 0.55;
        if (design.kind === "ripple" && s.phaseTime > s.nextBurst) {
          s.nextBurst = s.phaseTime + 900;
          s.particles.push({ type:"bubble", x:cx + (Math.random()-0.5)*20, y:cy + 20, vx:0, vy:-0.4, life:1200, maxLife:1200, color:design.color });
        }
        if (s.phase === "action" && s.phaseTime > ACTION_DURATION[design.kind]) {
          s.phase = "idle";
        }
      }

      s.particles = s.particles.filter(p => p.life > 0);
      s.particles.forEach(p => {
        p.life -= dt;
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;
        p.vy += dt * 0.002;
        drawParticle(ctx, p);
      });

      const drawPhase = design.kind === "trap" && s.phase === "action" && s.phaseTime < ACTION_DURATION.trap ? "trap-shake" : s.phase;
      drawKindEffect(ctx, s.x, H * 0.55, design, drawPhase, s.phaseTime, s.animFrame);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [eventType, isVisible]);

  useEffect(() => {
    stateRef.current = { x:null, targetX:null, animFrame:0, reached:false, phase:"enter", phaseTime:0, particles:[], nextBurst:0 };
  }, [eventType]);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />
  );
}
