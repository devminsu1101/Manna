"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let current = 0;
    const timer = setInterval(() => {
      current += 3;
      if (current >= 99) {
        clearInterval(timer);
        setProgress(99);
        setTimeout(() => routerRef.current.push("/login"), 600);
      } else {
        setProgress(current);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#fafae6] px-10">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-8xl select-none">🌾</div>
      </div>
      <div className="w-full pb-12 space-y-3">
        <div className="w-full h-2 bg-[#f0eed8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#f5c800] rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-[#888888]">
          최신 다운로드 버전 확인 중 ({progress}%)
        </p>
      </div>
    </div>
  );
}
