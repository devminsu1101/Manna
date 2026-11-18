"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** 첫 진입에서 인증·기도 데이터가 준비되는 동안 표시하는 화면. */
export function LaunchScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (!document.querySelector("[data-app-shell]")) return;
      observer.disconnect();
      // 완성된 화면이 DOM에 붙은 뒤에도 시작 화면을 한 번은 그릴 시간을 둔다.
      timer = setTimeout(() => setVisible(false), 400);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    if (document.querySelector("[data-app-shell]")) {
      observer.disconnect();
      timer = setTimeout(() => setVisible(false), 400);
    }

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div data-launch-screen className="fixed inset-0 z-50 bg-muted" role="status" aria-label="만나를 여는 중">
      <Image src="/mascot/hi.png" alt="" width={160} height={160} priority className="absolute left-1/2 top-[45%] size-28 -translate-x-1/2 -translate-y-1/2 object-contain" />
    </div>
  );
}
