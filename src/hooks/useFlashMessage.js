import { useState, useRef, useCallback, useEffect } from "react";

export default function useFlashMessage(defaultDuration = 3000) {
  const [msg, setMsg] = useState("");
  const timerRef = useRef(null);

  const flash = useCallback((text, duration = defaultDuration) => {
    setMsg(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(""), duration);
  }, [defaultDuration]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [msg, flash];
}
