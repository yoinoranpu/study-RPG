import { useState, useEffect } from "react";

// isMobile/isTabletは「幅」ではなく「短い方の辺」で判定する。幅だけで見ると、スマホを
// 横向きにした瞬間(例:812×375)に幅が768pxを超えてデスクトップ扱いになってしまうため。
// 短辺基準なら回転してもスマホはスマホのまま判定される。
function computeViewport() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const shortSide = Math.min(width, height);
  return {
    width,
    height,
    isMobile: shortSide < 768,
    isTablet: shortSide >= 768 && shortSide < 1024,
    isLandscape: width > height,
  };
}

export default function useViewport() {
  const [viewport, setViewport] = useState(computeViewport);

  useEffect(() => {
    const handleResize = () => setViewport(computeViewport());
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return viewport;
}
