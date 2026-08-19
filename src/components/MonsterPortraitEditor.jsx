import { useState, useRef, useEffect } from "react";
import { MONSTER_BASE } from "../systems/monsters";
import { useMonsterPortraitStyle } from "./MonsterPortrait";

// DEBUG専用: 図鑑アイコンの「顔クロップ」を、プレビューを直接ドラッグ(位置)・
// ホイール(拡大率)で調整できるツール。ステッパーのクリック連打より圧倒的に速い。
// CharacterLayoutEditor等と同じ「暫定値+自己調整ツール」方針。

const BOX = 220;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function CropStage({ id, crop, onChange }) {
  const { style, minX, minY } = useMonsterPortraitStyle(id, crop, BOX);
  const dragRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // React 17+はonWheelがpassiveのためpreventDefault()が効かない。
    // ネイティブリスナーをpassive:falseで登録してページスクロールを止める。
    const onWheel = (e) => {
      e.preventDefault();
      const dz = e.deltaY > 0 ? -0.1 : 0.1;
      onChange("zoom", clamp(Math.round((crop.zoom + dz) * 100) / 100, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [crop.zoom, onChange]);

  const onPointerDown = (e) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startCropX: crop.x, startCropY: crop.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (minX !== 0) onChange("x", clamp(d.startCropX + (dx / minX) * 100, 0, 100));
    if (minY !== 0) onChange("y", clamp(d.startCropY + (dy / minY) * 100, 0, 100));
  };
  const onPointerUp = () => { dragRef.current = null; };

  return (
    <div ref={stageRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      style={{ width: BOX, height: BOX, margin: "0 auto 10px", position: "relative", background: "#080810", borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a3a", cursor: "grab", touchAction: "none", userSelect: "none" }}>
      {style ? (
        <div key={id} style={{ width: "100%", height: "100%", ...style, pointerEvents: "none" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5c5c82", fontSize: 10 }}>読み込み中...</div>
      )}
      {/* 中央の目安十字線 */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.25)" }} />
    </div>
  );
}

export default function MonsterPortraitEditor({ portraits, onChange, onClose }) {
  const [selId, setSelId] = useState(MONSTER_BASE[0]?.id);
  const crop = portraits[selId] || { x: 50, y: 15, zoom: 2.2 };

  const handleChange = (axis, value) => onChange(selId, axis, value);

  const handleCopy = () => {
    const text = `export const MONSTER_PORTRAIT_DEFAULT = ${JSON.stringify(portraits, null, 2)};\n`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "rgba(13,13,21,0.98)", border: "1px solid #2a2a3a", borderRadius: 10, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", width: 340, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", fontFamily: "monospace" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#a78bfa", letterSpacing: 1, flex: 1 }}>DEBUG: 顔クロップエディタ</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>

        <CropStage id={selId} crop={crop} onChange={handleChange} />
        <div style={{ fontSize: 9, color: "#4a4a6a", textAlign: "center", marginBottom: 10 }}>ドラッグで位置調整・ホイールで拡大縮小</div>

        {/* モンスター選択 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12, maxHeight: 110, overflowY: "auto" }}>
          {MONSTER_BASE.map(m => (
            <button key={m.id} onClick={() => setSelId(m.id)}
              style={{ padding: "4px 7px", background: selId === m.id ? "#2a1a3a" : "#1a1a1a", border: `1px solid ${selId === m.id ? "#a78bfa" : "#333"}`, borderRadius: 4, cursor: "pointer", color: selId === m.id ? "#a78bfa" : "#888", fontSize: 9, fontFamily: "monospace" }}>
              {m.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 9, color: "#7a7a9a" }}>
          <span>拡大率</span>
          <span style={{ marginLeft: "auto", color: "#e8e0d0" }}>{crop.zoom.toFixed(1)}x</span>
        </div>
        <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.1} value={crop.zoom}
          onChange={(e) => handleChange("zoom", parseFloat(e.target.value))}
          style={{ width: "100%", marginBottom: 12 }} />

        <button onClick={handleCopy} style={{ width: "100%", padding: "8px 0", background: "#0a1a0a", border: "1px solid #4ade80", borderRadius: 6, cursor: "pointer", color: "#4ade80", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>
          全モンスター分JSONをコピー
        </button>
        <div style={{ fontSize: 9, color: "#4a4a6a", marginTop: 6 }}>調整が終わったらコピーして monsterPortraits.js の MONSTER_PORTRAIT_DEFAULT に貼り戻してください</div>
      </div>
    </div>
  );
}
