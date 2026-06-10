import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, CameraOff } from "lucide-react";

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const stopScanner = () => {
    try { BrowserMultiFormatReader.releaseAllStreams(); } catch { /* потоки уже освобождены */ }
    setScanning(false);
  };

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result) {
        onScan(result.getText());
        stopScanner();
      }
    }).then(() => {
      setScanning(true);
    }).catch(() => {
      setError("Камера не открылась. Дайте разрешение.");
    });

    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-white">Сканер штрихкода</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CameraOff size={40} className="text-red-400" />
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <video ref={videoRef} className="w-full rounded-lg bg-black" style={{ height: 260 }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-indigo-400 rounded-lg opacity-70">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 rounded-br" />
                </div>
              </div>
              {scanning && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">Наведите штрихкод на камеру...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
