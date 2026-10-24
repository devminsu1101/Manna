import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { SURFACE_COLOR } from "./brand";

/** 카톡 · 링크 미리보기 규격. 카카오 권장 비율(1.91:1)과 같다. */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * 링크 미리보기 이미지 — warm 바탕 가운데 마스코트 하나.
 *
 * og:image가 없으면 카톡이 페이지에서 아무 그림이나 주워 늘린다. 홈은 32px 탭 아이콘뿐이라 깨져
 * 보였고, 초대 페이지는 큰 마스코트가 있어 우연히 괜찮았다. 그 우연을 규칙으로 만든 것이다.
 * 마스코트 원본이 594px이라 그보다 키우지 않는다 — 키우면 다시 흐려진다.
 */
export async function mascotOgImage(mascot: string) {
  const data = await readFile(join(process.cwd(), "public/mascot", mascot), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SURFACE_COLOR.warm,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse는 <img>만 그린다 */}
        <img src={`data:image/png;base64,${data}`} width={540} height={540} alt="" />
      </div>
    ),
    OG_SIZE,
  );
}
