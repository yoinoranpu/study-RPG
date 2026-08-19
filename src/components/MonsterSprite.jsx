import { useEffect, useRef } from "react";
import { MULTIPART_MONSTERS, SIMPLE_IMAGE_MONSTERS, GROUP_IMAGE_MONSTERS, SWAY_IMAGE_MONSTERS, FLOAT_IMAGE_MONSTERS, FLOAT_RIG_MONSTERS, GROUND_RIG_MONSTERS } from "../data/multipartMonsters";

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

// 画像の「幅」ではなく「長い方の辺」がsize*kに収まるようスケールを計算する。
// 縦長の立ち絵（人型キャラなど）を幅基準でスケールすると身長が異常に伸びて画面からはみ出すため、
// 常に見た目の一番大きい辺を基準にする（CSSのobject-fit:containに近い考え方）。
function fitScale(size, img, k) {
  return (size * k) / Math.max(img.naturalWidth, img.naturalHeight);
}

function drawPart(ctx, img, anchorX, anchorY, scale, angle, pivotFracX, pivotFracY, mirror = false) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.rotate(angle);
  if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(img, -w * pivotFracX, -h * pivotFracY, w, h);
  ctx.restore();
}

// 戻り値: 描画できたらスプライト最上部のY座標（HPバー配置に使う）、
// 画像がまだ読み込み中ならnull（呼び出し側で通常描画にフォールバック）
function drawMultipartCreature(ctx, x, groundY, size, frame, walking, config) {
  const body = getCachedImage(config.body);
  if (!body || !body.complete || !body.naturalWidth) return null;

  ctx.save();
  if (!config.faceRight) {
    // 体を軸に左右反転（プレイヤーは画面右側にいるため、頭を右に向ける）
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  const bodyScale = fitScale(size, body, 1.5);
  const bodyW = body.naturalWidth * bodyScale;
  const bodyH = body.naturalHeight * bodyScale;
  const bodyX = x - bodyW * 0.45;
  const bodyY = groundY - bodyH * 0.95;

  // 歩行中はしっかり脚を振る、到着後(戦闘待機中)はごくわずかな揺れだけにする
  const swingAmp = walking ? 1 : 0.12;
  const walkPhase = frame * 0.08;
  const frontSwing = Math.sin(walkPhase) * 0.3 * swingAmp;
  const backSwing  = Math.sin(walkPhase + Math.PI) * 0.26 * swingAmp;
  const tailSway   = Math.sin(frame * 0.03) * 0.15;

  const frontLeg = getCachedImage(config.frontLeg);
  const backLeg  = getCachedImage(config.backLeg);
  const tail     = getCachedImage(config.tail);

  const anchorPx = (a, dx = 0, dy = 0) => ({ x: bodyX + bodyW * a.x + dx, y: bodyY + bodyH * a.y + dy });
  // 奥側の脚は少し体の中心寄り・少し小さく描いて奥行きを出す（反対位相で振ることで4本脚に見せる）
  const fFar  = anchorPx(config.frontLegAnchor, -bodyW * 0.05, -bodyH * 0.02);
  const fNear = anchorPx(config.frontLegAnchor);
  const bFar  = anchorPx(config.backLegAnchor, -bodyW * 0.05, -bodyH * 0.02);
  const bNear = anchorPx(config.backLegAnchor);
  const tAnchor = anchorPx(config.tailAnchor);

  const fPivot = config.frontLegPivot || { x:0.5, y:0.02 };
  const bPivot = config.backLegPivot  || { x:0.5, y:0.02 };
  const tPivot = config.tailPivot     || { x:0.5, y:0.1 };

  // 奥側の脚・尻尾 → 体 → 手前側の脚、の順で重ねて奥行き感を出す
  drawPart(ctx, backLeg, bFar.x, bFar.y, bodyScale * 0.92, -backSwing, bPivot.x, bPivot.y);
  drawPart(ctx, frontLeg, fFar.x, fFar.y, bodyScale * 0.92, -frontSwing, fPivot.x, fPivot.y);
  drawPart(ctx, tail, tAnchor.x, tAnchor.y, bodyScale, tailSway, tPivot.x, tPivot.y);
  ctx.drawImage(body, bodyX, bodyY, bodyW, bodyH);
  drawPart(ctx, backLeg, bNear.x, bNear.y, bodyScale, backSwing, bPivot.x, bPivot.y);
  drawPart(ctx, frontLeg, fNear.x, fNear.y, bodyScale, frontSwing, fPivot.x, fPivot.y);

  ctx.restore();
  return bodyY;
}

// パーツ分け不要の1枚絵モンスター（粘体系）。潰れ・伸び・バウンドはcanvas変形だけで表現する。
// 戻り値: 描画できたらスプライト最上部のY座標、画像がまだ読み込み中ならnull
function drawImageCreature(ctx, src, x, groundY, size, frame, phaseOffset = 0) {
  const img = getCachedImage(src);
  if (!img || !img.complete || !img.naturalWidth) return null;
  const amp = size * 0.08;
  const phase = Math.sin(frame * 0.05 + phaseOffset);
  const bounce = phase * amp;
  const squish = 1 + phase * 0.1;
  const baseScale = fitScale(size, img, 1.7);
  const w = img.naturalWidth * baseScale * squish;
  const h = (img.naturalHeight * baseScale) / squish;
  const bottom = groundY + size * 0.22 - (amp - bounce);
  const top = bottom - h;
  ctx.drawImage(img, x - w / 2, top, w, h);
  return top;
}

// パーツ分け不要の1枚絵モンスター（植物系）。脚を持たず歩かないので、根元付近のpivotを軸に
// 画像全体をわずかに回転させるだけ（旧drawPlantの sway = sin(frame*0.03)*0.08 をそのまま流用）。
function drawSwayCreature(ctx, src, pivot, x, groundY, size, frame) {
  const img = getCachedImage(src);
  if (!img || !img.complete || !img.naturalWidth) return null;
  const sway = Math.sin(frame * 0.03) * 0.08;
  const baseScale = fitScale(size, img, 1.7);
  const w = img.naturalWidth * baseScale;
  const h = img.naturalHeight * baseScale;
  ctx.save();
  ctx.translate(x, groundY);
  ctx.rotate(sway);
  ctx.drawImage(img, -w * pivot.x, -h * pivot.y, w, h);
  ctx.restore();
  // 回転はわずかなので、HPバー配置には無回転時の最上部Yで近似する
  return groundY - h * pivot.y;
}

// 複数の1枚絵を同時に描画するモンスター（スライム軍団など）。全パーツの画像が揃うまではnullを返す。
function drawImageGroup(ctx, parts, x, groundY, size, frame) {
  const allReady = parts.every(p => {
    const img = getCachedImage(p.src);
    return img && img.complete && img.naturalWidth;
  });
  if (!allReady) return null;
  let topY = groundY;
  parts.forEach(p => {
    const t = drawImageCreature(ctx, p.src, x + size * (p.dx || 0), groundY, size * (p.scale ?? 1), frame, p.phase || 0);
    if (t != null) topY = Math.min(topY, t);
  });
  return topY;
}

// パーツ分け不要の1枚絵モンスター（不死系など）。潰れ・伸び・回転なし、上下にフワフワ浮遊するだけ。
function drawFloatCreature(ctx, src, x, groundY, size, frame) {
  const img = getCachedImage(src);
  if (!img || !img.complete || !img.naturalWidth) return null;
  const float = Math.sin(frame * 0.04) * size * 0.06;
  const baseScale = fitScale(size, img, 1.7);
  const w = img.naturalWidth * baseScale;
  const h = img.naturalHeight * baseScale;
  const top = groundY - h * 0.85 + float;
  ctx.drawImage(img, x - w / 2, top, w, h);
  return top;
}

// 体は浮遊するだけ・腕や剣などの付属パーツをアンカー+ピボットで取り付けて個別に揺らすモンスター
// （不死系の骸骨の腕・脚、幽霊の剣など）。歩行はしないため常に浮遊系の揺れになる。
function drawFloatRig(ctx, x, groundY, size, frame, config) {
  const body = getCachedImage(config.body);
  if (!body || !body.complete || !body.naturalWidth) return null;

  const float = Math.sin(frame * 0.04) * size * 0.06;
  const bodyScale = fitScale(size, body, 1.6);
  const bodyW = body.naturalWidth * bodyScale;
  const bodyH = body.naturalHeight * bodyScale;
  const bodyX = x - bodyW * 0.5;
  const bodyY = groundY - bodyH * 0.85 + float;

  ctx.save();
  if (!config.faceRight) {
    ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0);
  }

  const parts = config.parts || [];
  const drawOne = (p) => {
    const img = getCachedImage(p.img);
    if (!img || !img.complete || !img.naturalWidth) return;
    const anchorX = bodyX + bodyW * p.anchor.x;
    const anchorY = bodyY + bodyH * p.anchor.y;
    // mirror:trueのパーツは描画時にscale(-1,1)で反転しているため、同じ回転角では
    // 視覚上は逆回転になってしまう（鏡像は回転の向きを反転させる）。左右対称に同期して
    // 揺らすには角度の符号を反転させる必要がある。
    const rawSway = Math.sin(frame * 0.03 + (p.phase || 0)) * (p.swingAmp ?? 0.12);
    const sway = p.mirror ? -rawSway : rawSway;
    drawPart(ctx, img, anchorX, anchorY, bodyScale * (p.scale ?? 1), sway, p.pivot.x, p.pivot.y, p.mirror);
  };

  parts.filter(p => p.behind).forEach(drawOne);
  ctx.drawImage(body, bodyX, bodyY, bodyW, bodyH);
  parts.filter(p => !p.behind).forEach(drawOne);

  ctx.restore();
  return bodyY;
}

// 地面に立つが獣系の4足構成ではないモンスター（ゴブリン系など、二足+得物を持つ腕）。
// walkSwing:trueのパーツ(脚)は歩行中(walking)だけ大きく振れる。それ以外は常に一定振幅で揺れる。
function drawGroundRig(ctx, x, groundY, size, frame, walking, config) {
  const body = getCachedImage(config.body);
  if (!body || !body.complete || !body.naturalWidth) return null;

  // 通常はbody画像が全身(頭〜脚まで)を表す前提でk=1.5固定だが、体画像が胴体だけの
  // モンスター（頭・脚が完全に別パーツ）だとそれでは全体が巨大化しすぎるため、
  // config.bodyScaleKで倍率を上書きできるようにしている。
  const bodyScale = fitScale(size, body, config.bodyScaleK ?? 1.5);
  const bodyW = body.naturalWidth * bodyScale;
  const bodyH = body.naturalHeight * bodyScale;
  const bodyX = x - bodyW * 0.45;
  const bodyY = groundY - bodyH * 0.95;

  ctx.save();
  if (config.tint) ctx.filter = config.tint;
  if (!config.faceRight) {
    ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0);
  }

  const parts = config.parts || [];
  const walkSpeedMul = config.walkSpeedMul ?? 1;
  const drawOne = (p) => {
    const img = getCachedImage(p.img);
    if (!img || !img.complete || !img.naturalWidth) return;
    const anchorX = bodyX + bodyW * p.anchor.x;
    const anchorY = bodyY + bodyH * p.anchor.y;
    // 体が大きい4足モンスターほど歩行速度(脚の振り)がキビキビしすぎて違和感が出るため、
    // config.walkSpeedMulで歩行時のみ周期を遅くできるようにしている（待機中の揺れには影響しない）。
    const speed = p.walkSwing ? 0.08 * walkSpeedMul : 0.03;
    const ampMul = p.walkSwing ? (walking ? 1 : 0.12) : 1;
    // mirror:trueのパーツは反転して描画するため、同じ回転角では視覚上は逆回転になる。
    // 左右対称に同期して動かすには角度の符号を反転させる必要がある。
    const rawSway = Math.sin(frame * speed + (p.phase || 0)) * (p.swingAmp ?? 0.12) * ampMul;
    const sway = p.mirror ? -rawSway : rawSway;
    drawPart(ctx, img, anchorX, anchorY, bodyScale * (p.scale ?? 1), sway, p.pivot.x, p.pivot.y, p.mirror);
  };

  parts.filter(p => p.behind).forEach(drawOne);
  ctx.drawImage(body, bodyX, bodyY, bodyW, bodyH);
  parts.filter(p => !p.behind).forEach(drawOne);

  ctx.restore();
  return bodyY;
}

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
        const multipart = MULTIPART_MONSTERS[monster.id];
        const group = GROUP_IMAGE_MONSTERS[monster.id];
        const sway = SWAY_IMAGE_MONSTERS[monster.id];
        const floatRig = FLOAT_RIG_MONSTERS[monster.id];
        const groundRig = GROUND_RIG_MONSTERS[monster.id];
        const floatImage = FLOAT_IMAGE_MONSTERS[monster.id];
        const simpleImage = SIMPLE_IMAGE_MONSTERS[monster.id];
        const drewMultipart = multipart && drawMultipartCreature(ctx, p.x, py, size, s.animFrame + i * 20, p.x < p.targetX, multipart);
        const drewGroup = !drewMultipart && group && drawImageGroup(ctx, group, p.x, py, size, s.animFrame + i * 20);
        const drewSway = !drewMultipart && !drewGroup && sway && drawSwayCreature(ctx, sway.src, sway.pivot, p.x, py, size, s.animFrame + i * 20);
        const drewFloatRig = !drewMultipart && !drewGroup && !drewSway && floatRig && drawFloatRig(ctx, p.x, py, size, s.animFrame + i * 20, floatRig);
        const drewGroundRig = !drewMultipart && !drewGroup && !drewSway && !drewFloatRig && groundRig && drawGroundRig(ctx, p.x, py, size, s.animFrame + i * 20, p.x < p.targetX, groundRig);
        const drewFloat = !drewMultipart && !drewGroup && !drewSway && !drewFloatRig && !drewGroundRig && floatImage && drawFloatCreature(ctx, floatImage, p.x, py, size, s.animFrame + i * 20);
        const drewSimple = !drewMultipart && !drewGroup && !drewSway && !drewFloatRig && !drewGroundRig && !drewFloat && simpleImage && drawImageCreature(ctx, simpleImage, p.x, py, size, s.animFrame + i * 20);
        if (!drewMultipart && !drewGroup && !drewSway && !drewFloatRig && !drewGroundRig && !drewFloat && !drewSimple && drawFn) drawFn(ctx, p.x, py, size, design.color, s.animFrame + i * 20);
        ctx.restore();
        ctx.globalAlpha = 1;

        const topY = [drewMultipart, drewGroup, drewSway, drewFloatRig, drewGroundRig, drewFloat, drewSimple]
          .find((v) => typeof v === "number");
        const headroomY = topY != null ? topY : py - size * 1.2;

        // HPバー
        if (monster.maxHp) {
          const barW = size * 2.2;
          const barH = i === 0 ? 20 : 13;
          const barY = headroomY - 17;
          const barX = p.x - barW/2;
          const rad = i === 0 ? 5 : 3;

          ctx.fillStyle = "#1a0a0a";
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, rad);
          ctx.fill();

          const hpPct = Math.max(0, (monster.hp||0) / monster.maxHp);
          const fillColor = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
          ctx.save();
          ctx.shadowColor = fillColor;
          ctx.shadowBlur = 5;
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW * hpPct, barH, rad);
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = "rgba(255,255,255,0.16)";
          ctx.beginPath();
          ctx.roundRect(barX + 2, barY + 2, Math.max(0, barW * hpPct - 4), barH * 0.32, Math.max(1, rad-1));
          ctx.fill();

          ctx.strokeStyle = "rgba(201,150,61,0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, rad);
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
        ctx.fillText(monster.displayName, p.x, headroomY - 22);
        ctx.shadowBlur = 0;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [monsters, isVisible, floorY]);

  useEffect(() => {
    if (!isVisible) {
      stateRef.current = { positions:[], animFrame:0, arrived:false };
    }
  }, [isVisible]);

  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3, pointerEvents:"none" }} />;
}