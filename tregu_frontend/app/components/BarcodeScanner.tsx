"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  onDetected?: (code: string) => void;
  className?: string;
};

export default function BarcodeScanner({ onDetected, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;

    (async () => {
      try {
        // @ts-ignore
        const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
        setSupported(hasDetector);
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        stream = media;
        videoRef.current.srcObject = media;
        await videoRef.current.play();

        if (!hasDetector) return;

        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ["ean_13", "qr_code", "code_128", "upc_e", "upc_a"] });

        const tick = async () => {
          if (stopped) return;
          try {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              const captures = await detector.detect(videoRef.current);
              if (captures && captures.length) {
                const code = captures[0].rawValue || "";
                if (code) {
                  onDetected?.(code);
                }
              }
            }
          } catch {}
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch (e: any) {
        setError(e?.message || "Camera unavailable");
      }
    })();

    return () => {
      stopped = true;
      try { videoRef.current?.pause(); } catch {}
      try { (stream?.getTracks() || []).forEach(t => t.stop()); } catch {}
    };
  }, [onDetected]);

  return (
    <div className={className}>
      {supported === false && (
        <div className="rounded-xl border p-4 mb-3 text-sm">
          Your browser does not support live barcode scanning. Use manual entry below.
        </div>
      )}
      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 mb-3 text-sm">{error}</div>}

      <div className="aspect-video w-full rounded-xl overflow-hidden border mb-3 bg-black/5">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Type or paste a barcode…"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { onDetected?.(manual.trim()); setManual(""); } }}
        />
        <button className="btn" onClick={() => { if (manual.trim()) { onDetected?.(manual.trim()); setManual(""); } }}>
          Add
        </button>
      </div>
    </div>
  );
}