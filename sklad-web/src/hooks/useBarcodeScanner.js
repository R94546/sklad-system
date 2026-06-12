import { useEffect, useRef } from "react";

// Перехват сканера-пистолета (работает как клавиатура): быстрая серия символов,
// завершающаяся Enter. Обычный ручной ввод не срабатывает — паузы между
// нажатиями больше maxDelay.
export default function useBarcodeScanner(onScan, { minLength = 4, maxDelay = 50, enabled = true } = {}) {
  const buf = useRef("");
  const last = useRef(0);
  const cb = useRef(onScan);
  useEffect(() => { cb.current = onScan; });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      const now = Date.now();
      if (now - last.current > maxDelay) buf.current = "";
      last.current = now;
      if (e.key === "Enter") {
        if (buf.current.length >= minLength) {
          const code = buf.current;
          buf.current = "";
          // не даём Enter сабмитнуть форму, в которой стоит фокус
          e.preventDefault();
          e.stopPropagation();
          cb.current(code);
        }
        return;
      }
      if (e.key.length === 1) buf.current += e.key;
    };
    // capture: перехватываем раньше обработчиков форм/полей
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [enabled, minLength, maxDelay]);
}
