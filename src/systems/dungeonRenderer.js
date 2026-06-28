// ダンジョン背景描画エンジン
export const THEMES = {
  stone: {
    id: "stone",
    name: "石造りのダンジョン",
    colors: {
      ceiling:  "#0a0810",
      wallTop:  "#1a1208",
      wallBot:  "#0a0805",
      floorTop: "#1a1208",
      floorBot: "#2a1e10",
      fog:      "rgba(5,4,10,0.75)",
      ambient:  "rgba(180,90,0,0.06)",
    },
    textures: {
      wall:  "/assets/textures/stone/wall.png",
      floor: null,
    },
    backWalls: [
      { id:"normal",  weight:50, color:"#12100a" },
      { id:"hole",    weight:15, color:"#0a0805" },
      { id:"rubble",  weight:10, color:"#1a1510" },
      { id:"bars",    weight:10, color:"#0d0c0a" },
      { id:"light",   weight:10, color:"#1a1208" },
      { id:"stairs",  weight:5,  color:"#0f0e0a" },
    ],
    effects: {
      torchColor:  "#cc6600",
      torchColor2: "#ff9900",
      fogDensity:  0.75,
    },
  },
};

export const pickBackWall = (theme) => {
  const walls = theme.backWalls;
  const total = walls.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of walls) { r -= w.weight; if (r <= 0) return w; }
  return walls[0];
};

const imageCache = {};
const loadImage = (src) => {
  if (!src) return null;
  if (imageCache[src]) return imageCache[src];
  const img = new Image();
  img.src = src;
  imageCache[src] = img;
  return img;
};

export const renderDungeon = (ctx, W, H, state, theme) => {
  const { offset, torchFlicker, fogAlpha, backWall } = state;
  const C = theme.colors;
  const E = theme.effects;

  ctx.clearRect(0, 0, W, H);

  const MID = H * 0.38; // 0.48から0.38に変更
  const VX  = W * 0.5;
  const VY  = MID;

  // 天井
  const ceilGrad = ctx.createLinearGradient(0, 0, 0, MID);
  ceilGrad.addColorStop(0, "#050408");
  ceilGrad.addColorStop(1, C.ceiling);
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, W, MID);

  const wallTexture = loadImage(theme.textures?.wall);

// 左壁
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.30, MID * 0.25);
  ctx.lineTo(W * 0.30, MID + (H - MID) * 0.75);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  if (wallTexture?.complete && wallTexture.naturalWidth > 0) {
    const pat = ctx.createPattern(wallTexture, "repeat");
    const m = new DOMMatrix();
    m.translateSelf(-offset * 0.5, offset * 0.2);
    pat.setTransform(m);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W * 0.30, H);
  } else {
    const wg = ctx.createLinearGradient(0, 0, W * 0.30, 0);
    wg.addColorStop(0, C.wallBot);
    wg.addColorStop(1, C.wallTop);
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W * 0.30, H);
  }
  const shadowL = ctx.createLinearGradient(W * 0.30, 0, 0, 0);
  shadowL.addColorStop(0, "rgba(0,0,0,0.6)");
  shadowL.addColorStop(1, "rgba(0,0,0,0.0)");
  ctx.fillStyle = shadowL;
  ctx.fillRect(0, 0, W * 0.30, H);
  ctx.restore();

  // 右壁
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.70, MID * 0.25);
  ctx.lineTo(W * 0.70, MID + (H - MID) * 0.75);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.clip();
  if (wallTexture?.complete && wallTexture.naturalWidth > 0) {
    const pat = ctx.createPattern(wallTexture, "repeat");
    const m = new DOMMatrix();
    m.translateSelf(offset * 0.5, offset * 0.2);
    pat.setTransform(m);
    ctx.fillStyle = pat;
    ctx.fillRect(W * 0.70, 0, W * 0.30, H);
  } else {
    const wg = ctx.createLinearGradient(W, 0, W * 0.70, 0);
    wg.addColorStop(0, C.wallBot);
    wg.addColorStop(1, C.wallTop);
    ctx.fillStyle = wg;
    ctx.fillRect(W * 0.70, 0, W * 0.30, H);
  }
  const shadowR = ctx.createLinearGradient(W * 0.70, 0, W, 0);
  shadowR.addColorStop(0, "rgba(0,0,0,0.6)");
  shadowR.addColorStop(1, "rgba(0,0,0,0.0)");
  ctx.fillStyle = shadowR;
  ctx.fillRect(W * 0.70, 0, W * 0.30, H);
  ctx.restore();
  
  // 床
  ctx.save();
  ctx.beginPath();
ctx.moveTo(W * 0.30, MID + (H - MID) * 0.75);
  ctx.lineTo(W * 0.70, MID + (H - MID) * 0.75);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const floorTexture = loadImage(theme.textures?.floor);
  if (floorTexture?.complete && floorTexture.naturalWidth > 0) {
    const pat = ctx.createPattern(floorTexture, "repeat");
    const m = new DOMMatrix();
    m.translateSelf(0, offset);
    pat.setTransform(m);
    ctx.fillStyle = pat;
  } else {
    const fg = ctx.createLinearGradient(0, MID, 0, H);
    fg.addColorStop(0, C.floorTop);
    fg.addColorStop(1, C.floorBot);
    ctx.fillStyle = fg;
  }
  ctx.fill();
  // 床グリッド
  if (!floorTexture) {
    ctx.strokeStyle = "#2a1e10";
    ctx.lineWidth = 1;
    const gridSize = 60;
    const scrolled = offset % gridSize;
    for (let i = -2; i <= 12; i++) {
      const x = W * 0.3 + (W * 0.4 / 10) * i;
      ctx.beginPath();
      ctx.moveTo(VX + (x - VX) * 0.01, VY + 1);
      ctx.lineTo(x < VX ? 0 : W, H);
      ctx.stroke();
    }
    for (let y = MID + scrolled; y < H;) {
      ctx.beginPath();
      const prog = (y - MID) / (H - MID);
      const lx = W * 0.30 * (1 - prog);
      const rx = W - lx;
      ctx.moveTo(lx, y);
      ctx.lineTo(rx, y);
      ctx.stroke();
      y += gridSize * Math.max(0.05, prog * 0.8) + gridSize * 0.1;
    }
  }
  ctx.restore();

  // 奥壁
  const bwSize = Math.min(W, H) * 0.35;
  const bwX = VX - bwSize / 2;
  const bwY = VY - bwSize / 2;
  if (backWall) {
    ctx.fillStyle = backWall.color || "#12100a";
    ctx.fillRect(bwX, bwY, bwSize, bwSize);
    ctx.fillStyle = "#2a2015";
    ctx.font = `${bwSize * 0.1}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(backWall.id, VX, VY + bwSize * 0.05);
  }

  // 松明
  const torchY = MID * 0.55;
  const torchSize = H * 0.08;
  const flicker = torchFlicker || 1;
  [[W * 0.28, torchY], [W * 0.72, torchY]].forEach(([tx, ty]) => {
    ctx.fillStyle = "#5a3a10";
    ctx.fillRect(tx - 4, ty, 8, torchSize);
    const fireH = torchSize * 1.2 * flicker;
    const fireGrad = ctx.createRadialGradient(tx, ty - fireH * 0.3, 0, tx, ty, fireH);
    fireGrad.addColorStop(0, E.torchColor2 + "ff");
    fireGrad.addColorStop(0.4, E.torchColor + "cc");
    fireGrad.addColorStop(1, "transparent");
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty - fireH * 0.3, torchSize * 0.5 * flicker, fireH * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    const glowGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, W * 0.25);
    glowGrad.addColorStop(0, E.torchColor + "22");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);
  });

  // 霧
  const fogGrad = ctx.createRadialGradient(VX, VY, W * 0.1, VX, VY, W * 0.8);
  fogGrad.addColorStop(0, "transparent");
  fogGrad.addColorStop(1, C.fog);
  ctx.fillStyle = fogGrad;
  ctx.globalAlpha = fogAlpha || E.fogDensity;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  const cornerGrad = ctx.createRadialGradient(VX, VY, W * 0.2, VX, VY, W * 0.9);
  cornerGrad.addColorStop(0, "transparent");
  cornerGrad.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = cornerGrad;
  ctx.fillRect(0, 0, W, H);
};