"use client";

import { useEffect } from "react";

/**
 * 마운트되어 있는 동안 화면이 꺼지지 않게 한다.
 *
 * 예배 중에 성경을 펴 두면 몇 분 만에 화면이 잠겼다. 읽는 도중에 잠기는 건 "읽고 있지 않다"는
 * 오판이고, 매번 깨우는 동작이 예배를 방해한다.
 *
 * 토글이 없다. 리더에 있으면 무조건 잡는다(사용자 결정). 대신 **받아들인 트레이드오프**가
 * 하나 있다: 실패해도 사용자에게 아무 신호가 없다. 저전력 모드에서 거부당하면 화면은 그냥
 * 꺼지고 왜인지 알 방법이 없다. 그게 문제가 되면 헤더에 상태 토글을 붙이는 게 다음 수다.
 *
 * 호출 위치는 리더와 생명주기가 같은 곳이어야 한다 — 앱 전역에서 잡으면 성경을 안 보는
 * 동안에도 배터리를 먹는다.
 */
export function useWakeLock(): void {
  useEffect(() => {
    // 타입에는 `navigator.wakeLock`이 항상 있는 것으로 돼 있지만(스펙상 필수 프로퍼티),
    // 런타임엔 없을 수 있다. iOS 16.4 미만이 그렇고, **보안 컨텍스트가 아닌 곳**도 그렇다.
    // 후자가 중요하다 — 폰에서 http://192.168.x.x로 여는 실기기 검증 경로가 정확히 그
    // 경우라서, 로컬 LAN에서는 이 기능이 "동작 안 하는" 게 아니라 "존재하지 않는다".
    // navigator.clipboard가 같은 이유로 당했다(D-704). 검증은 배포본에서만 된다.
    if (!("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let alive = true;

    const releaseQuietly = (s: WakeLockSentinel) => {
      // 이미 풀린 sentinel에 release를 부르면 reject된다. 정리 경로에서 터뜨릴 이유가 없다.
      void s.release().catch(() => {});
    };

    const acquire = async () => {
      // 이미 들고 있거나 요청이 떠 있으면 겹쳐 부르지 않는다. visibilitychange는 연달아 온다.
      if (sentinel || requesting || !alive) return;
      // 숨은 문서의 요청은 스펙상 거부된다. 예외를 만들어 삼키느니 아예 안 부른다.
      if (document.visibilityState !== "visible") return;

      requesting = true;
      try {
        const next = await navigator.wakeLock.request("screen");

        // await 사이에 리더를 떠났을 수 있다. 그대로 두면 성경을 닫았는데도 화면이 영영
        // 안 꺼진다 — 정리 함수는 이미 지나갔으므로 여기서 직접 놓아야 한다.
        if (!alive) {
          releaseQuietly(next);
          return;
        }

        sentinel = next;

        // 시스템이 먼저 놓을 수 있다(탭 숨김, 저전력 전환). 참조를 비워 두지 않으면
        // 다음 재획득이 "이미 들고 있다"고 판단해 그냥 돌아간다.
        next.addEventListener("release", () => {
          if (sentinel === next) sentinel = null;
        });
      } catch {
        // 저전력 모드·권한 거부. 토글이 없어 사용자에게 물을 것도 없으니 조용히 포기한다.
      } finally {
        requesting = false;
      }
    };

    // 탭이 숨으면 락이 자동으로 풀린다. 돌아올 때 다시 잡지 않으면 "알림 확인하고 왔더니
    // 또 꺼짐"이 된다 — 예배 중 카톡 한 번이면 바로 겪는다.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sentinel) releaseQuietly(sentinel);
      sentinel = null;
    };
  }, []);
}
