import { useEffect, useRef, useState } from "react";

const THEMES = {
  stone: {
    skyColor:    "#0a0810",
    farColor:    "#1a1208",
    floorColor:  "#1a1208",
    floorLine:   "#2a1e10",
    torchColor:  "#cc6600",
    torchColor2: "#ff9900",
  },
};

const SCROLL_SPEED_PX_PER_SEC = 150; // 旧canvas版のdt*0.15(px/ms)と同じ速度

// 画像プリロードキャッシュ（ファイルが無い間はnaturalWidth=0のままなので、
// 用意でき次第コード変更なしで自動的に差し替わる）
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
const isReady = (img) => !!img && img.complete && img.naturalWidth > 0;

function FogVignette() {
  return (
    <div style={{
      position:"absolute", inset:0, pointerEvents:"none",
      backgroundImage: [
        "linear-gradient(to right, rgba(0,0,0,0.9), transparent 12%)",
        "linear-gradient(to left, rgba(0,0,0,0.9), transparent 12%)",
        "linear-gradient(to bottom, rgba(0,0,0,0.95), transparent 20%)",
        "linear-gradient(to top, rgba(0,0,0,0.6), transparent 6%)",
      ].join(","),
    }} />
  );
}

export default function DungeonCanvas({ isRunning, isBreak, isPaused, dungeonId = 1, bossFloor = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const stateRef = useRef({ offset: 0, torchPhase: 0 });

  const [, forceTick] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const dId = dungeonId || 1;
  const corridorTileSrc = `/assets/images/bg_dungeon${dId}_corridor_tile.jpg`;
  const bossSrc = `/assets/images/bg_dungeon${dId}_boss.jpg`;
  const corridorImg = getCachedImage(corridorTileSrc);
  const bossImg = getCachedImage(bossSrc);

  // 画像の読み込み完了を検知して再レンダーする（読み込み前はプロシージャル版にフォールバック）
  useEffect(() => {
    if (isReady(corridorImg) && isReady(bossImg)) return;
    const onLoad = () => forceTick(t => t + 1);
    corridorImg.addEventListener("load", onLoad);
    bossImg.addEventListener("load", onLoad);
    return () => {
      corridorImg.removeEventListener("load", onLoad);
      bossImg.removeEventListener("load", onLoad);
    };
  }, [corridorImg, bossImg]);

  // コンテナの実際の高さを測る（タイル1枚分の実描画幅の計算に必要）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showCorridor = !bossFloor && isReady(corridorImg) && containerH > 0;
  const showBoss = bossFloor && isReady(bossImg);
  const showProcedural = !showCorridor && !showBoss;

  // corridorTileSrcは「元画像+反転コピー」を横に並べた合わせ鏡タイル(幅は元画像の2倍)
  const singleTileW = showCorridor ? (corridorImg.naturalWidth / 2) * (containerH / corridorImg.naturalHeight) : 0;
  const shiftPx = Math.round(singleTileW * 2);
  const durationSec = shiftPx > 0 ? shiftPx / SCROLL_SPEED_PX_PER_SEC : 8;
  const scrolling = isRunning && !isBreak && !isPaused;

  // プロシージャル版(フォールバック)のcanvas描画ループ。イラストが表示されている間は動かさない。
  useEffect(() => {
    if (!showProcedural) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let lastTime = 0;

    const loop = (time) => {
      const dt = Math.min(time - lastTime, 50);
      lastTime = time;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        ctx.imageSmoothingEnabled = false;
      }
      const s = stateRef.current;
      const speed = isRunning && !isBreak && !isPaused ? dt * 0.15 : 0;
      s.offset = ((s.offset - speed) % 1000000 + 1000000) % 1000000;
      s.torchPhase = (s.torchPhase + dt * 0.006) % (Math.PI * 2);
      draw(ctx, W, H, s, THEMES.stone);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [showProcedural, isRunning, isBreak, isPaused]);

  return (
    <div ref={containerRef} style={{ position:"absolute", inset:0, overflow:"hidden", zIndex:0 }}>
      {showCorridor && (
        <>
          <div style={{
            position:"absolute", inset:0,
            backgroundImage: `url(${corridorTileSrc})`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            "--corridor-shift": `${shiftPx}px`,
            animation: `dungeonCorridorScroll ${durationSec}s linear infinite`,
            animationPlayState: scrolling ? "running" : "paused",
          }} />
          <FogVignette />
        </>
      )}
      {showBoss && (
        <>
          <img src={bossSrc} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          <FogVignette />
        </>
      )}
      {showProcedural && (
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
      )}
    </div>
  );
}

function draw(ctx, W, H, state, C) {
  const { offset, torchPhase } = state;
  const FLOOR_Y = H * 0.72;
  const CEIL_Y  = H * 0.18;

  // 背景色
  ctx.fillStyle = C.skyColor;
  ctx.fillRect(0, 0, W, H);

  // 壁
  ctx.fillStyle = C.farColor;
  ctx.fillRect(0, CEIL_Y, W, FLOOR_Y - CEIL_Y);

  // レンガパターン（1回だけ）
  const brickH = 28, brickW = 56;
  ctx.strokeStyle = "#0d0a08";
  ctx.lineWidth = 1;
  for (let row = 0; row * brickH < FLOOR_Y - CEIL_Y; row++) {
    const y = CEIL_Y + row * brickH;
    const rowOff = row % 2 === 0 ? 0 : brickW / 2;
    const scrollX = offset % brickW;
    for (let col = -1; col * brickW < W + brickW; col++) {
      const x = col * brickW + rowOff - scrollX;
      ctx.strokeRect(x, y, brickW, brickH);
    }
  }

  // 天井
  const ceilGrad = ctx.createLinearGradient(0, 0, 0, CEIL_Y);
  ceilGrad.addColorStop(0, "#030205");
  ceilGrad.addColorStop(1, "#0a0810");
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, W, CEIL_Y);

  // 天井石ブロック
  const blockW = 80;
  const blockOff = offset % blockW;
  for (let x = -blockOff; x < W + blockW; x += blockW) {
    ctx.fillStyle = "#12100a";
    ctx.fillRect(x, CEIL_Y - 20, blockW - 4, 20);
    ctx.strokeStyle = "#0a0805";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, CEIL_Y - 20, blockW - 4, 20);
  }

  // 松明
  const torchInterval = 280;
  const torchOff = offset % torchInterval;
  for (let x = -torchOff + torchInterval * 0.3; x < W + torchInterval; x += torchInterval) {
    const flicker = 0.85 + Math.sin(torchPhase + x * 0.01) * 0.1 + Math.random() * 0.04;
    drawTorch(ctx, x, FLOOR_Y - 180, flicker, C);
  }

  // 床
  const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
  floorGrad.addColorStop(0, "#2a1e10");
  floorGrad.addColorStop(1, "#1a1208");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

  // 床タイル
  const tileW = 64;
  const tileOff = offset % tileW;
  ctx.strokeStyle = C.floorLine;
  ctx.lineWidth = 1;
  for (let x = -tileOff; x < W + tileW; x += tileW) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_Y);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = FLOOR_Y; y < H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 境界線
  ctx.fillStyle = "#0a0805";
  ctx.fillRect(0, FLOOR_Y - 4, W, 4);
  ctx.fillRect(0, CEIL_Y, W, 4);

  // 左右の暗闇
  const leftFog = ctx.createLinearGradient(0, 0, W * 0.12, 0);
  leftFog.addColorStop(0, "rgba(0,0,0,0.9)");
  leftFog.addColorStop(1, "transparent");
  ctx.fillStyle = leftFog;
  ctx.fillRect(0, 0, W * 0.12, H);

  const rightFog = ctx.createLinearGradient(W * 0.88, 0, W, 0);
  rightFog.addColorStop(0, "transparent");
  rightFog.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = rightFog;
  ctx.fillRect(W * 0.88, 0, W * 0.12, H);

  // 上下の暗闇
  const topFog = ctx.createLinearGradient(0, 0, 0, CEIL_Y + 10);
  topFog.addColorStop(0, "rgba(0,0,0,0.95)");
  topFog.addColorStop(1, "transparent");
  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, W, CEIL_Y + 10);

  const botFog = ctx.createLinearGradient(0, H - 20, 0, H);
  botFog.addColorStop(0, "transparent");
  botFog.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = botFog;
  ctx.fillRect(0, H - 20, W, 20);
}

function drawTorch(ctx, x, y, flicker, C) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 90 * flicker);
  glow.addColorStop(0, C.torchColor + "44");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 90, y - 90, 180, 180);
  ctx.fillStyle = "#5a3a10";
  ctx.fillRect(x - 3, y + 12, 6, 28);
  const fireGrad = ctx.createRadialGradient(x, y, 0, x, y, 18 * flicker);
  fireGrad.addColorStop(0, C.torchColor2 + "ff");
  fireGrad.addColorStop(0.5, C.torchColor + "bb");
  fireGrad.addColorStop(1, "transparent");
  ctx.fillStyle = fireGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, 7 * flicker, 16 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
}
