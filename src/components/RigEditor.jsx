import { useState, useRef, useEffect, useCallback } from "react";

// DEBUG専用: MULTIPART_MONSTERSのconfigオブジェクトを直接ミュータブルに編集するツール。
// configはモジュール内で共有されているオブジェクトそのものなので、ここでの変更は
// 即座に実際のバトル画面のモンスター描画にも反映される（別ウィンドウで見比べながら調整できる）。

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

const PART_KEYS = [
  { key: "frontLeg", anchorKey: "frontLegAnchor", pivotKey: "frontLegPivot", label: "前脚", color: "#D85A30" },
  { key: "backLeg", anchorKey: "backLegAnchor", pivotKey: "backLegPivot", label: "後脚", color: "#185FA5" },
  { key: "tail", anchorKey: "tailAnchor", pivotKey: "tailPivot", label: "尻尾", color: "#3B6D11" },
];

const STAGE_BODY_WIDTH = 380;
const DEFAULT_BODY_POS = { x: 260, y: 60 };
const PAN_STEP = 40;

function PartHandle({ config, partKey, anchorKey, pivotKey, color, bodyLeft, bodyTop, bodyDispW, bodyDispH, bodyNaturalW, forceUpdate }) {
  const src = config[partKey];
  const natural = useNaturalSize(src);
  const wrapRef = useRef(null);

  if (!natural) return null;

  const scale = bodyDispW / (bodyNaturalW || bodyDispW);
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  const anchor = config[anchorKey];
  const pivot = config[pivotKey];

  const anchorPxX = bodyLeft + bodyDispW * anchor.x;
  const anchorPxY = bodyTop + bodyDispH * anchor.y;
  const left = anchorPxX - dispW * pivot.x;
  const top = anchorPxY - dispH * pivot.y;

  const startDragAnchor = (e) => {
    e.preventDefault();
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
      style={{ position: "absolute", left, top, width: dispW, height: dispH, cursor: "grab" }}
    >
      <img src={src} draggable={false} style={{ width: "100%", height: "100%", pointerEvents: "none", userSelect: "none", opacity: 0.9 }} />
      <div
        onMouseDown={startDragPivot}
        style={{
          position: "absolute", left: `${pivot.x * 100}%`, top: `${pivot.y * 100}%`,
          width: 12, height: 12, borderRadius: "50%", background: color,
          border: "2px solid var(--surface-2, #fff)", transform: "translate(-50%,-50%)", cursor: "crosshair",
        }}
      />
    </div>
  );
}

export default function RigEditor({ config, onClose }) {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);
  const bodyNatural = useNaturalSize(config.body);
  const seedRef = useRef(null);

  useEffect(() => {
    if (!seedRef.current) {
      seedRef.current = JSON.parse(JSON.stringify({
        frontLegAnchor: config.frontLegAnchor, backLegAnchor: config.backLegAnchor, tailAnchor: config.tailAnchor,
        frontLegPivot: config.frontLegPivot, backLegPivot: config.backLegPivot, tailPivot: config.tailPivot,
      }));
    }
  }, [config]);

  const [bodyPos, setBodyPos] = useState(DEFAULT_BODY_POS);
  const pan = (dx, dy) => setBodyPos((p) => ({ x: p.x + dx, y: p.y + dy }));

  const bodyDispW = STAGE_BODY_WIDTH;
  const bodyDispH = bodyNatural ? (bodyNatural.h / bodyNatural.w) * STAGE_BODY_WIDTH : STAGE_BODY_WIDTH;

  const handleReset = () => {
    const seed = seedRef.current;
    if (!seed) return;
    PART_KEYS.forEach(({ anchorKey, pivotKey }) => {
      config[anchorKey].x = seed[anchorKey].x; config[anchorKey].y = seed[anchorKey].y;
      config[pivotKey].x = seed[pivotKey].x; config[pivotKey].y = seed[pivotKey].y;
    });
    forceUpdate();
  };

  const jsonOut = JSON.stringify(
    Object.fromEntries(PART_KEYS.flatMap(({ anchorKey, pivotKey }) => [
      [anchorKey, { x: Math.round(config[anchorKey].x * 100) / 100, y: Math.round(config[anchorKey].y * 100) / 100 }],
      [pivotKey, { x: Math.round(config[pivotKey].x * 100) / 100, y: Math.round(config[pivotKey].y * 100) / 100 }],
    ])),
    null, 2
  );

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonOut).catch(() => {});
  };

  const panBtnStyle = { fontSize: 12, width: 32, height: 28, background: "#1a0a1a", border: "1px solid #60a5fa44", borderRadius: 4, color: "#60a5fa", cursor: "pointer" };

  return (
    <div style={{
      position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 920, maxWidth: "97vw", maxHeight: "94vh", overflowY: "auto",
      background: "#0a0a12ee", border: "1px solid #4ade8044", borderRadius: 8, padding: 10, zIndex: 50,
      fontFamily: "monospace", color: "#e5e5e5",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#4ade80" }}>DEBUG: リグエディタ（実イラスト・ライブ反映）</span>
        <button onClick={onClose} style={{ fontSize: 10, background: "none", border: "1px solid #666", borderRadius: 4, color: "#ccc", cursor: "pointer", padding: "2px 8px" }}>閉じる</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1, height: 560, background: "#111", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            {config.body && (
              <img
                src={config.body}
                draggable={false}
                style={{ position: "absolute", left: bodyPos.x, top: bodyPos.y, width: bodyDispW, height: bodyDispH, pointerEvents: "none", userSelect: "none" }}
              />
            )}
            {PART_KEYS.map(({ key, anchorKey, pivotKey, color }) => (
              <PartHandle
                key={key}
                config={config}
                partKey={key}
                anchorKey={anchorKey}
                pivotKey={pivotKey}
                color={color}
                bodyLeft={bodyPos.x}
                bodyTop={bodyPos.y}
                bodyDispW={bodyDispW}
                bodyDispH={bodyDispH}
                bodyNaturalW={bodyNatural?.w}
                forceUpdate={forceUpdate}
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
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#888", marginBottom: 8 }}>
        形をドラッグ＝体への付け根位置／色付きの点をドラッグ＝パーツ自身の回転軸／右の矢印ボタンで体全体の表示位置を移動できる。実際のバトル画面のモンスターにも即座に反映される。
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
