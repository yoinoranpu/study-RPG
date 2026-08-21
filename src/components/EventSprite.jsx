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

// 罠/回復/NPC/妖精/精霊は宝箱と違い「その場に佇む単体イラスト」をモンスターの立ち絵と
// 同程度の大きさで表示したいため、バッジ版とは別に大きい一枚絵(event_scene_*)を用意する。
// sizeはMonsterSprite.jsxのfitScaleと同じ考え方の倍率(k)：長辺がH*0.18*kに収まるようスケールする
// (H*0.18はモンスター側の基準サイズと合わせてある)。float:trueのものだけ上下にふわふわ浮かせる
// (妖精/精霊)。罠/回復/NPCは床に設置・直立の表現として浮遊させない。colorAltがあるものは
// 2色の間でグローの色をゆっくり変化させる
const EVENT_DESIGNS = {
  ...CHEST_EVENT_DESIGNS,
  trap:      { icon:"⚠",  color:"#fb923c", label:"罠！",         kind:"trap",    image:"/assets/images/event_scene_trap.png",  size:1.4, float:false },
  heal:      { icon:"💧", color:"#38bdf8", label:"回復の泉",     kind:"ripple",  image:"/assets/images/event_scene_heal.png",  size:1.5, float:false },
  npc:       { icon:"🧝", color:"#34d399", label:"冒険者に遭遇", kind:"npc",     image:"/assets/images/event_scene_npc.png",   size:1.6, float:false },
  fairy:     { icon:"🧚", color:"#4ade80", label:"妖精の加護",   kind:"sparkle", image:"/assets/images/event_scene_fairy.png", size:1.3, float:true, colorAlt:"#fde047" },
  spirit:    { icon:"👻", color:"#a78bfa", label:"精霊の祝福",   kind:"sparkle", image:"/assets/images/event_scene_spirit.png",size:1.5, float:true, colorAlt:"#60a5fa" },
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

// 2色の16進カラーをtimeに応じて滑らかに行き来させる(妖精/精霊の色が変わる表現用)
function shimmerColor(colorA, colorB, t, alpha = 1) {
  const a = parseInt(colorA.slice(1), 16), b = parseInt(colorB.slice(1), 16);
  const ar=(a>>16)&255, ag=(a>>8)&255, ab=a&255;
  const br=(b>>16)&255, bg=(b>>8)&255, bb=b&255;
  const mix = (Math.sin(t) + 1) / 2;
  const r = Math.round(ar + (br-ar)*mix), g = Math.round(ag + (bg-ag)*mix), bl = Math.round(ab + (bb-ab)*mix);
  return `rgba(${r},${g},${bl},${alpha})`;
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

function drawKindEffect(ctx, x, y, design, phase, phaseTime, frame, H) {
  // float:trueのもの(妖精/精霊)だけ上下にふわふわ浮かせる。罠/回復/NPCは床に設置・直立の表現
  const bounce = design.float ? Math.sin(frame * 0.05) * 6 : 0;
  const popScale = phase === "action" && design.kind === "chest"
    ? 1 + Math.max(0, 1 - phaseTime / ACTION_DURATION.chest) * 0.35
    : 1 + Math.sin(frame * 0.08) * 0.05;

  // yは呼び出し側で「バッジ(宝箱)=中心の高さ／シーン立ち絵=接地ライン(足元)の高さ」を渡す
  const cx = x;
  const cy = y + bounce;

  const shimmerT = frame * 0.02;
  const activeColor = design.colorAlt ? shimmerColor(design.color, design.colorAlt, shimmerT) : design.color;

  const img = design.image ? getCachedImage(design.image) : null;
  const hasNaturalSize = img && img.complete && img.naturalWidth > 0;

  // サイズ計算：バッジ(宝箱)は従来通り固定px。シーン立ち絵(罠/回復/NPC/妖精/精霊)は
  // モンスター立ち絵と同じ考え方(長辺がH*0.18*sizeKに収まる)でスケールする
  let drawW, drawH;
  if (design.size && hasNaturalSize) {
    const longSide = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = (H * 0.18 * design.size) / longSide;
    drawW = img.naturalWidth * scale;
    drawH = img.naturalHeight * scale;
  } else {
    drawW = design.size || 66;
    drawH = hasNaturalSize ? drawW * (img.naturalHeight / img.naturalWidth) : drawW;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(popScale, popScale);

  const glowR = design.size ? Math.max(drawW, drawH) * 0.42 : drawW * 0.8;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
  glow.addColorStop(0, design.colorAlt ? shimmerColor(design.color, design.colorAlt, shimmerT, 0.27) : design.color + "44");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(-glowR, -glowR, glowR * 2, glowR * 2);

  if (design.kind === "ripple") {
    const t = (frame * 0.02) % 1;
    for (let i = 0; i < 2; i++) {
      const rt = (t + i * 0.5) % 1;
      ctx.strokeStyle = design.color;
      ctx.globalAlpha = 1 - rt;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -drawH * 0.05, drawW * (0.1 + rt * 0.35), drawW * (0.03 + rt * 0.1), 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (design.kind === "sparkle") {
    const orbitY = -drawH * 0.45;
    const orbitR = drawW * 0.5;
    for (let i = 0; i < 5; i++) {
      const ang = frame * 0.04 + (i / 5) * Math.PI * 2;
      const r = orbitR + Math.sin(frame * 0.06 + i) * orbitR * 0.15;
      const sx = Math.cos(ang) * r, sy = orbitY + Math.sin(ang) * r * 0.5;
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (phase === "trap-shake") ctx.translate((Math.random() - 0.5) * 6, 0);
  if (hasNaturalSize) {
    // シーン立ち絵は接地ライン(0)に足元が来るよう上方向に描画、バッジ級の小さいアイコンは中央寄せのまま
    const offsetY = design.size ? -drawH : -drawH / 2;
    ctx.drawImage(img, -drawW / 2, offsetY, drawW, drawH);
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
  ctx.fillText(design.label, cx, cy - (design.size ? drawH * 1.05 : 44));
}

export default function EventSprite({ eventType, isVisible, onReach }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const stateRef  = useRef({ x:null, targetX:null, animFrame:0, reached:false, phase:"enter", phaseTime:0, particles:[], nextBurst:0, design:null });
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
      const s = stateRef.current;
      // モンスターと違い、この手のイベントは主人公との遭遇後に唐突に消えるのではなく
      // 「左から流れてきて→立ち止まって(イベントが生きている間)→右へ流れて消える」動きにする。
      // isVisibleがfalseになった瞬間にeventTypeもnullになるため、direnctにeventTypeを見るのではなく
      // 一度設定されたdesignをstateRef側で保持し続け、退場アニメーションの間も参照できるようにする
      if (!s.design) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      if (!isVisible && s.phase !== "exit" && s.phase !== "gone") {
        if (s.reached) { s.phase = "exit"; s.phaseTime = 0; }
        else { s.phase = "gone"; }
      }
      if (s.phase === "gone") {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      const design = s.design;
      // シーン立ち絵(size指定あり)はモンスターの足元の高さに合わせて下寄りに、
      // バッジ(宝箱)は従来通りやや上のセンター位置に表示する
      const anchorY = design.size ? H * 0.70 : H * 0.55;

      if (s.x === null) {
        s.x = -80;
        s.targetX = W * 0.28;
      }
      s.animFrame += dt * 0.05;

      if (s.phase === "enter") {
        if (s.x < s.targetX - 2) {
          s.x += dt * 0.15;
        } else {
          s.x = s.targetX;
          s.phase = "action";
          s.phaseTime = 0;
          if (!s.reached) { s.reached = true; onReach && onReach(); }
          const cx = s.x, cy = anchorY;
          if (design.kind === "chest") spawnBurst(s.particles, cx, cy, design.color, 14, "spark");
          if (design.kind === "trap")  spawnSpikes(s.particles, cx, cy + 30, design.color, 7);
        }
      } else if (s.phase === "exit") {
        s.phaseTime += dt;
        s.x += dt * 0.28;
        if (s.x > W + 100) { s.phase = "gone"; }
      } else {
        s.phaseTime += dt;
        const cx = s.x, cy = anchorY;
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
      drawKindEffect(ctx, s.x, anchorY, design, drawPhase, s.phaseTime, s.animFrame, H);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [eventType, isVisible]);

  useEffect(() => {
    // eventTypeがnullになる時(=退場アニメーションに入るタイミング)はここでリセットしない。
    // 新しいイベントが始まった時だけ、その内容でstateを作り直す
    if (eventType) {
      stateRef.current = { x:null, targetX:null, animFrame:0, reached:false, phase:"enter", phaseTime:0, particles:[], nextBurst:0, design: EVENT_DESIGNS[eventType] || EVENT_DESIGNS.chest_common };
    }
  }, [eventType]);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />
  );
}
