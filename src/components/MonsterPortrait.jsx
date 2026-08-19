import { useEffect, useState } from "react";
import { getMonsterPortraitSrc } from "../data/monsterPortraits";

// モジュールスコープでキャッシュ（同じ画像を何度も読み込み直さない）
const naturalSizeCache = {};
function useNaturalSize(src) {
  const [size, setSize] = useState(src ? naturalSizeCache[src] || null : null);
  useEffect(() => {
    if (!src || naturalSizeCache[src]) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const s = { w: img.naturalWidth, h: img.naturalHeight };
      naturalSizeCache[src] = s;
      setSize(s);
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return size;
}

// crop.x/crop.y(0〜100, background-positionと同じ意味)・crop.zoom(1=ちょうどcover)から、
// boxSizeピクセルの正方形を過不足なく覆うbackground-size/positionをpx単位で計算する。
// object-fit+transform:scaleの組み合わせは、transformがobject-positionの後に中心基準で
// かかるため縦方向がほとんど動かないように見える不具合があったので、この方式に統一した。
export function useMonsterPortraitStyle(id, crop, boxSize) {
  const portrait = getMonsterPortraitSrc(id);
  const natural = useNaturalSize(portrait?.src);
  if (!portrait || !natural || !natural.w || !natural.h) {
    return { portrait, natural: null, style: null, minX: 0, minY: 0 };
  }
  const baseScale = Math.max(boxSize / natural.w, boxSize / natural.h);
  const scale = baseScale * (crop.zoom || 1);
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;
  const minX = Math.min(0, boxSize - dispW);
  const minY = Math.min(0, boxSize - dispH);
  const offX = minX * ((crop.x ?? 50) / 100);
  const offY = minY * ((crop.y ?? 50) / 100);
  return {
    portrait, natural, dispW, dispH, minX, minY,
    style: {
      backgroundImage: `url(${portrait.src})`,
      backgroundSize: `${dispW}px ${dispH}px`,
      backgroundPosition: `${offX}px ${offY}px`,
      backgroundRepeat: "no-repeat",
      filter: portrait.tint || "none",
    },
  };
}
