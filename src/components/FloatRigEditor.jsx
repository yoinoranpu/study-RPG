import { useState, useRef, useEffect, useCallback } from "react";

// DEBUG専用: FLOAT_RIG_MONSTERSのconfigオブジェクトを直接ミュータブルに編集するツール。
// RigEditor.jsx(獣系MULTIPART_MONSTERS用)と同じ仕組みだが、こちらはconfig.partsという
// 汎用配列形式(パーツ数がモンスターごとに違う)に対応させたもの。

function useNaturalSize(src) {
  const [size, setSize] = useState(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return size;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const PART_COLORS = ["#D85A30", "#185FA5", "#3B6D11", "#993556", "#854F0B", "#534AB7"];

// DEBUGツールの根本仕様上、configオブジェクトを直接ミュータブルに書き換える必要がある
// （書き換えが即座にバトル画面のライブ描画に反映される）。react-hooks/immutabilityの
// 静的解析はコンポーネント本体内でのprops直接変更を検出するため、通常の関数に切り出して回避する。
function applyPartScale(target, nextScale) {
  target.scale = nextScale;
}
function applyNum(target, key, value) {
  target[key] = value;
}
function applyBoolField(target, key, value) {
  target[key] = value;
}

const STAGE_BODY_WIDTH = 380;
const DEFAULT_BODY_POS = { x: 260, y: 60 };
const PAN_STEP = 40;
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 2.5;
const STAGE_W = 640;
const STAGE_H = 560;

function PartHandle({ part, color, selected, onSelect, bodyLeft, bodyTop, bodyDispW, bodyDispH, bodyNaturalW, forceUpdate, onNaturalSize }) {
  const natural = useNaturalSize(part.img);
  const wrapRef = useRef(null);

  // React 17+はonWheelをpassiveリスナーとして登録するためpreventDefault()が効かない
  // （ページ全体のスクロールを止められない）。ネイティブaddEventListenerで
  // passive:falseを明示することで、パーツ上でのホイール操作がページスクロールを起こさないようにする。
  // (Hooksのルール上、下のnatural判定によるreturnより前で呼ぶ必要がある)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const cur = part.scale ?? 1;
      const next = clamp(cur - Math.sign(e.deltaY) * 0.02, 0.05, 3);
      applyPartScale(part, Math.round(next * 100) / 100);
      forceUpdate();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [part, forceUpdate]);

  useEffect(() => {
    if (natural) onNaturalSize(part.key, natural);
  }, [natural, part.key, onNaturalSize]);

  if (!natural) return null;

  const bodyToStageScale = bodyDispW / (bodyNaturalW || bodyDispW);
  const partScale = part.scale ?? 1;
  const dispW = natural.w * bodyToStageScale * partScale;
  const dispH = natural.h * bodyToStageScale * partScale;

  const anchor = part.anchor;
  const pivot = part.pivot;

  const anchorPxX = bodyLeft + bodyDispW * anchor.x;
  const anchorPxY = bodyTop + bodyDispH * anchor.y;
  const left = anchorPxX - dispW * pivot.x;
  const top = anchorPxY - dispH * pivot.y;

  const startDragAnchor = (e) => {
    e.preventDefault();
    onSelect(part.key);
    const startX = e.clientX, startY = e.clientY;
    const startA = { x: anchor.x, y: anchor.y };
    const onMove = (ev) => {
      anchor.x = clamp(startA.x + (ev.clientX - startX) / bodyDispW, -0.3, 1.3);
      anchor.y = clamp(startA.y + (ev.clientY - startY) / bodyDispH, -0.3, 1.3);
      forceUpdate();
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const startDragPivot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(part.key);
    const startX = e.clientX, startY = e.clientY;
    const startP = { x: pivot.x, y: pivot.y };
    const onMove = (ev) => {
      pivot.x = clamp(startP.x + (ev.clientX - startX) / dispW, -0.3, 1.3);
      pivot.y = clamp(startP.y + (ev.clientY - startY) / dispH, -0.3, 1.3);
      forceUpdate();
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={wrapRef}
      onMouseDown={startDragAnchor}
      style={{
        position: "absolute", left, top, width: dispW, height: dispH, cursor: "grab",
        opacity: part.behind ? 0.55 : 1, zIndex: selected ? 20 : 1,
        outline: selected ? "2px dashed #fff" : "none", outlineOffset: 2,
      }}
    >
      <img
        src={part.img}
        draggable={false}
        style={{
          width: "100%", height: "100%", pointerEvents: "none", userSelect: "none", opacity: 0.9,
          // canvas側のdrawPartはanchorへtranslate+rotateした「後」にscale(-1,1)するため、
          // 鏡像の中心はpivot点になる（画像中心ではない）。CSSでも同じくtransform-originをpivotに合わせる。
          transform: part.mirror ? "scaleX(-1)" : "none",
          transformOrigin: part.mirror ? `${pivot.x * 100}% ${pivot.y * 100}%` : undefined,
        }}
      />
      <div
        onMouseDown={startDragPivot}
        style={{
          position: "absolute", left: `${pivot.x * 100}%`, top: `${pivot.y * 100}%`,
          width: 12, height: 12, borderRadius: "50%", background: color,
          border: "2px solid var(--surface-2, #fff)", transform: "translate(-50%,-50%)", cursor: "crosshair",
        }}
      />
      <span style={{ position: "absolute", left: "50%", bottom: -14, transform: "translateX(-50%)", fontSize: 8, color, whiteSpace: "nowrap" }}>
        {part.key}{part.behind ? "(奥)" : ""}{part.mirror ? "(鏡像)" : ""} x{partScale.toFixed(2)}
      </span>
    </div>
  );
}

export default function FloatRigEditor({ config, onClose }) {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);
  const bodyNatural = useNaturalSize(config.body);
  const seedRef = useRef(null);
  const [selectedKey, setSelectedKey] = useState(config.parts[0]?.key ?? null);
  const [partNaturalSizes, setPartNaturalSizes] = useState({});
  const onNaturalSize = useCallback((key, size) => {
    setPartNaturalSizes((prev) => (prev[key] ? prev : { ...prev, [key]: size }));
  }, []);

  useEffect(() => {
    if (!seedRef.current) {
      seedRef.current = JSON.parse(JSON.stringify(config.parts.map(p => ({
        key: p.key, anchor: p.anchor, pivot: p.pivot, scale: p.scale ?? 1,
        mirror: !!p.mirror, behind: !!p.behind,
        swingAmp: p.swingAmp ?? 0.12, phase: p.phase ?? 0, walkSwing: !!p.walkSwing,
      }))));
    }
  }, [config]);

  const [bodyPos, setBodyPos] = useState(DEFAULT_BODY_POS);
  const pan = (dx, dy) => setBodyPos((p) => ({ x: p.x + dx, y: p.y + dy }));

  const [zoom, setZoom] = useState(1);
  const zoomBy = (mul) => setZoom((z) => clamp(Math.round(z * mul * 100) / 100, ZOOM_MIN, ZOOM_MAX));

  const bodyDispW = STAGE_BODY_WIDTH * zoom;
  const bodyDispH = (bodyNatural ? (bodyNatural.h / bodyNatural.w) * STAGE_BODY_WIDTH : STAGE_BODY_WIDTH) * zoom;

  // 体・全パーツの現在のanchor/pivot/scaleから実際の表示範囲を計算し、ステージに収まる縮尺に自動調整する。
  // パーツ画像が体より大幅に大きい/小さいモンスター(パディング量がバラバラ等)でステージからはみ出す問題への対策。
  const autoFit = () => {
    if (!bodyNatural) return;
    const baseBodyDispW = STAGE_BODY_WIDTH;
    const baseBodyDispH = (bodyNatural.h / bodyNatural.w) * STAGE_BODY_WIDTH;
    let minX = 0, minY = 0, maxX = baseBodyDispW, maxY = baseBodyDispH;
    config.parts.forEach((p) => {
      const nat = partNaturalSizes[p.key];
      if (!nat) return;
      const s = baseBodyDispW / bodyNatural.w * (p.scale ?? 1);
      const w = nat.w * s, h = nat.h * s;
      const anchorX = baseBodyDispW * p.anchor.x, anchorY = baseBodyDispH * p.anchor.y;
      const left = anchorX - w * p.pivot.x, top = anchorY - h * p.pivot.y;
      minX = Math.min(minX, left); minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + w); maxY = Math.max(maxY, top + h);
    });
    const contentW = maxX - minX, contentH = maxY - minY;
    const margin = 40;
    const fitZoom = clamp(Math.min((STAGE_W - margin) / contentW, (STAGE_H - margin) / contentH), ZOOM_MIN, ZOOM_MAX);
    setZoom(Math.round(fitZoom * 100) / 100);
    setBodyPos({ x: (STAGE_W - baseBodyDispW * fitZoom) / 2 - minX * fitZoom, y: (STAGE_H - baseBodyDispH * fitZoom) / 2 - minY * fitZoom });
  };

  const handleReset = () => {
    const seed = seedRef.current;
    if (!seed) return;
    config.parts.forEach((p, i) => {
      p.anchor.x = seed[i].anchor.x; p.anchor.y = seed[i].anchor.y;
      p.pivot.x = seed[i].pivot.x; p.pivot.y = seed[i].pivot.y;
      applyPartScale(p, seed[i].scale);
      applyBoolField(p, "mirror", seed[i].mirror);
      applyBoolField(p, "behind", seed[i].behind);
      applyNum(p, "swingAmp", seed[i].swingAmp);
      applyNum(p, "phase", seed[i].phase);
      applyBoolField(p, "walkSwing", seed[i].walkSwing);
    });
    forceUpdate();
  };

  const jsonOut = JSON.stringify(
    Object.fromEntries(config.parts.map(p => [
      p.key,
      {
        anchor: { x: Math.round(p.anchor.x * 100) / 100, y: Math.round(p.anchor.y * 100) / 100 },
        pivot: { x: Math.round(p.pivot.x * 100) / 100, y: Math.round(p.pivot.y * 100) / 100 },
        scale: Math.round((p.scale ?? 1) * 100) / 100,
        mirror: !!p.mirror,
        behind: !!p.behind,
        swingAmp: Math.round((p.swingAmp ?? 0.12) * 100) / 100,
        phaseDeg: Math.round(((p.phase ?? 0) * 180) / Math.PI),
        walkSwing: !!p.walkSwing,
      },
    ])),
    null, 2
  );

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonOut).catch(() => {});
  };

  const panBtnStyle = { fontSize: 12, width: 32, height: 28, background: "#1a0a1a", border: "1px solid #60a5fa44", borderRadius: 4, color: "#60a5fa", cursor: "pointer" };
  const numInputStyle = { width: 64, fontSize: 10, fontFamily: "monospace", background: "#000", color: "#4ade80", border: "1px solid #333", borderRadius: 3, padding: "2px 4px" };

  const selectedPart = config.parts.find((p) => p.key === selectedKey) ?? null;

  const setSelectedNum = (field, sub, value) => {
    if (!selectedPart || Number.isNaN(value)) return;
    if (field === "scale") applyPartScale(selectedPart, value);
    else if (sub === null) applyNum(selectedPart, field, value);
    else applyNum(selectedPart[field], sub, value);
    forceUpdate();
  };
  const setSelectedPhaseDeg = (deg) => {
    if (!selectedPart || Number.isNaN(deg)) return;
    applyNum(selectedPart, "phase", (deg * Math.PI) / 180);
    forceUpdate();
  };
  const toggleSelectedBool = (field) => {
    if (!selectedPart) return;
    applyBoolField(selectedPart, field, !selectedPart[field]);
    forceUpdate();
  };
  const toggleBtnStyle = (on, color) => ({
    fontSize: 9, padding: "3px 10px", borderRadius: 4, cursor: "pointer",
    background: on ? color : "#1a0a1a", color: on ? "#000" : color, border: `1px solid ${color}`,
  });

  return (
    <div style={{
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 980, maxWidth: "97vw", maxHeight: "94vh", overflowY: "auto",
      background: "#0a0a12ee", border: "1px solid #4ade8044", borderRadius: 8, padding: 10, zIndex: 50,
      fontFamily: "monospace", color: "#e5e5e5",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#4ade80" }}>DEBUG: 浮遊リグエディタ（FLOAT_RIG_MONSTERS・実イラスト・ライブ反映）</span>
        <button onClick={onClose} style={{ fontSize: 10, background: "none", border: "1px solid #666", borderRadius: 4, color: "#ccc", cursor: "pointer", padding: "2px 8px" }}>閉じる</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {config.parts.map((part, i) => (
          <button
            key={part.key}
            onClick={() => setSelectedKey(part.key)}
            style={{
              fontSize: 9, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
              background: selectedKey === part.key ? PART_COLORS[i % PART_COLORS.length] : "#1a0a1a",
              color: selectedKey === part.key ? "#000" : PART_COLORS[i % PART_COLORS.length],
              border: `1px solid ${PART_COLORS[i % PART_COLORS.length]}`,
            }}
          >
            {part.key}{part.behind ? "(奥)" : ""}{part.mirror ? "(鏡像)" : ""}
          </button>
        ))}
      </div>

      {selectedPart && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8, background: "#111", border: "1px solid #333", borderRadius: 6, padding: 8 }}>
          <span style={{ fontSize: 9, color: "#4ade80", fontWeight: "bold" }}>{selectedKey} を数値で編集:</span>
          <label style={{ fontSize: 9, color: "#888" }}>anchor.x
            <input type="number" step="0.01" style={numInputStyle} value={Math.round(selectedPart.anchor.x * 100) / 100}
              onChange={(e) => setSelectedNum("anchor", "x", parseFloat(e.target.value))} />
          </label>
          <label style={{ fontSize: 9, color: "#888" }}>anchor.y
            <input type="number" step="0.01" style={numInputStyle} value={Math.round(selectedPart.anchor.y * 100) / 100}
              onChange={(e) => setSelectedNum("anchor", "y", parseFloat(e.target.value))} />
          </label>
          <label style={{ fontSize: 9, color: "#888" }}>pivot.x
            <input type="number" step="0.01" style={numInputStyle} value={Math.round(selectedPart.pivot.x * 100) / 100}
              onChange={(e) => setSelectedNum("pivot", "x", parseFloat(e.target.value))} />
          </label>
          <label style={{ fontSize: 9, color: "#888" }}>pivot.y
            <input type="number" step="0.01" style={numInputStyle} value={Math.round(selectedPart.pivot.y * 100) / 100}
              onChange={(e) => setSelectedNum("pivot", "y", parseFloat(e.target.value))} />
          </label>
          <label style={{ fontSize: 9, color: "#888" }}>scale
            <input type="number" step="0.01" style={numInputStyle} value={Math.round((selectedPart.scale ?? 1) * 100) / 100}
              onChange={(e) => setSelectedNum("scale", null, parseFloat(e.target.value))} />
          </label>
          <button onClick={() => toggleSelectedBool("mirror")} style={toggleBtnStyle(!!selectedPart.mirror, "#f472b6")}>
            反転(mirror) {selectedPart.mirror ? "ON" : "OFF"}
          </button>
          <button onClick={() => toggleSelectedBool("behind")} style={toggleBtnStyle(!!selectedPart.behind, "#60a5fa")}>
            奥に描画(behind) {selectedPart.behind ? "ON" : "OFF"}
          </button>
          <button onClick={() => toggleSelectedBool("walkSwing")} style={toggleBtnStyle(!!selectedPart.walkSwing, "#fbbf24")}>
            歩行時のみ大きく揺れる(walkSwing) {selectedPart.walkSwing ? "ON" : "OFF"}
          </button>
          <label style={{ fontSize: 9, color: "#888" }}>揺れ幅(swingAmp)
            <input type="number" step="0.01" style={numInputStyle} value={Math.round((selectedPart.swingAmp ?? 0.12) * 100) / 100}
              onChange={(e) => setSelectedNum("swingAmp", null, parseFloat(e.target.value))} />
          </label>
          <label style={{ fontSize: 9, color: "#888" }}>位相(phase・度)
            <input type="number" step="5" style={numInputStyle} value={Math.round((((selectedPart.phase ?? 0) * 180) / Math.PI) * 10) / 10}
              onChange={(e) => setSelectedPhaseDeg(parseFloat(e.target.value))} />
          </label>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <div style={{ position: "relative", width: STAGE_W, height: STAGE_H, background: "#111", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            {config.body && (
              <img
                src={config.body}
                draggable={false}
                style={{ position: "absolute", left: bodyPos.x, top: bodyPos.y, width: bodyDispW, height: bodyDispH, pointerEvents: "none", userSelect: "none" }}
              />
            )}
            {config.parts.map((part, i) => (
              <PartHandle
                key={part.key}
                part={part}
                color={PART_COLORS[i % PART_COLORS.length]}
                selected={selectedKey === part.key}
                onSelect={setSelectedKey}
                bodyLeft={bodyPos.x}
                bodyTop={bodyPos.y}
                bodyDispW={bodyDispW}
                bodyDispH={bodyDispH}
                bodyNaturalW={bodyNatural?.w}
                forceUpdate={forceUpdate}
                onNaturalSize={onNaturalSize}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 100 }}>
          <span style={{ fontSize: 9, color: "#888", textAlign: "center" }}>中心点を移動</span>
          <button onClick={() => pan(0, -PAN_STEP)} style={panBtnStyle}>↑</button>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => pan(-PAN_STEP, 0)} style={panBtnStyle}>←</button>
            <button onClick={() => pan(PAN_STEP, 0)} style={panBtnStyle}>→</button>
          </div>
          <button onClick={() => pan(0, PAN_STEP)} style={panBtnStyle}>↓</button>
          <button onClick={() => setBodyPos(DEFAULT_BODY_POS)} style={{ ...panBtnStyle, width: "auto", fontSize: 9, padding: "4px 8px", marginTop: 8, color: "#a78bfa", borderColor: "#a78bfa44" }}>中央に戻す</button>

          <span style={{ fontSize: 9, color: "#888", textAlign: "center", marginTop: 12 }}>全体の縮尺</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => zoomBy(0.8)} style={panBtnStyle}>－</button>
            <button onClick={() => zoomBy(1.25)} style={panBtnStyle}>＋</button>
          </div>
          <span style={{ fontSize: 9, color: "#4ade80" }}>x{zoom.toFixed(2)}</span>
          <button onClick={() => setZoom(1)} style={{ ...panBtnStyle, width: "auto", fontSize: 9, padding: "4px 8px", color: "#4ade80", borderColor: "#4ade8044" }}>縮尺リセット</button>
          <button onClick={autoFit} style={{ ...panBtnStyle, width: "auto", fontSize: 9, padding: "4px 8px", marginTop: 4, color: "#fbbf24", borderColor: "#fbbf2444" }}>自動フィット</button>
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#888", marginBottom: 8 }}>
        上のボタンでパーツを選択すると数値入力欄で正確に編集できる(ドラッグより確実)。「反転(mirror)」ボタンでパーツを左右反転、「奥に描画(behind)」ボタンで体より奥/手前のどちらに描くか切り替えられる。「揺れ幅(swingAmp)」「位相(phase)」で歩行時の揺れ方を調整できる(位相を同じ値にした2パーツは常に同じ動き、180度ずらすと逆の動きになる)。「歩行時のみ大きく揺れる(walkSwing)」をONにすると、待機中は揺れが小さく・歩行中だけ大きく揺れるようになる(脚パーツ向け)。このエディタのステージ自体はアニメーションしないため、揺れ方の確認は実際のバトル画面(下に表示されているモンスター)を見ながら調整すること。形をドラッグ＝体への付け根位置／色付きの点をドラッグ＝パーツ自身の回転軸／パーツの上でホイール回転＝パーツの拡大縮小(scale)。選択中のパーツは白い破線で囲まれ最前面に表示される。「自動フィット」でパーツ画像が体より大幅に大きい/小さい場合でもステージ全体に収まる縮尺に自動調整できる。実際のバトル画面のモンスターにも即座に反映される。奥に描くパーツ(behind:true)は半透明で表示。
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={handleReset} style={{ fontSize: 9, background: "#1a0a1a", border: "1px solid #a78bfa44", borderRadius: 4, color: "#a78bfa", cursor: "pointer", padding: "4px 10px" }}>付け根・軸を元に戻す</button>
        <button onClick={handleCopy} style={{ fontSize: 9, background: "#1a0a1a", border: "1px solid #4ade8044", borderRadius: 4, color: "#4ade80", cursor: "pointer", padding: "4px 10px" }}>JSONをコピー</button>
      </div>

      <textarea
        readOnly
        value={jsonOut}
        style={{ width: "100%", height: 140, fontSize: 9, fontFamily: "monospace", background: "#000", color: "#4ade80", border: "1px solid #333", borderRadius: 4, resize: "vertical" }}
      />
    </div>
  );
}
