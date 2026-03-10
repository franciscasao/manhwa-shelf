"use client";

import { useEffect, useRef, useState } from "react";

interface ChapterCompleteToastProps {
  chapterNum: number;
  visible: boolean;
  onDismiss: () => void;
}

export function ChapterCompleteToast({ chapterNum, visible, onDismiss }: ChapterCompleteToastProps) {
  const [show, setShow] = useState(false);
  const dismissRef = useRef(onDismiss);
  useEffect(() => { dismissRef.current = onDismiss; });

  useEffect(() => {
    if (!visible) return;

    // Small delay so the animation plays after mount
    const enterTimer = setTimeout(() => setShow(true), 100);
    // Auto-dismiss after 4 seconds
    const exitTimer = setTimeout(() => {
      setShow(false);
      setTimeout(() => dismissRef.current(), 400);
    }, 4000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => dismissRef.current(), 400);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="border border-terminal-green/60 bg-terminal-bg/95 backdrop-blur-sm px-4 py-3 font-mono text-xs shadow-[0_0_20px_rgba(0,255,159,0.15)]">
        <div className="flex items-center gap-3">
          <span className="text-terminal-green text-sm">&#x2713;</span>
          <div>
            <div className="text-terminal-green">
              {">"} CHAPTER {String(chapterNum).padStart(3, "0")} COMPLETE
            </div>
            <div className="text-terminal-dim mt-0.5">
              {">"} progress saved to reading history
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-terminal-dim hover:text-terminal-cyan ml-2"
          >
            [x]
          </button>
        </div>
      </div>
    </div>
  );
}
