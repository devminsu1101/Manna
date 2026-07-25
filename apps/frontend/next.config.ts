import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 개발 서버를 사설망 IP로 열 수 있게 한다. 실기기(아이폰 Safari) 확인용이다.
   *
   * 없으면 dev 서버가 /_next/* 요청을 Origin 기준으로 403 낸다. HTML은 200으로 내려와서
   * 화면은 멀쩡히 보이는데 JS 청크만 막히므로, 하이드레이션이 통째로 죽고도 조용하다.
   * 증상은 "스크롤해도 네비가 안 숨고 무한 스크롤이 안 된다" 정도로만 보인다 —
   * 클라이언트 훅이 하나도 안 붙기 때문이다. 콘솔을 볼 수 없는 실기기에서는 특히 헷갈린다.
   *
   * IP를 박지 않고 대역으로 두는 이유: DHCP와 접속 네트워크에 따라 계속 바뀐다.
   * 매처는 점 단위 세그먼트 비교라 `*`가 한 칸을 먹는다(`192.168.*.*` → 192.168.0.80 매치).
   * `**`는 맨 앞에만 올 수 있고 단독 `*`는 항상 거부되므로 이 형태여야 한다.
   * (node_modules/next/dist/server/app-render/csrf-protection.js)
   *
   * 넓혀도 되는 이유: 막으려는 건 악성 사이트가 브라우저를 시켜 개발 서버를 긁는 것인데,
   * 그때 Origin은 그 사이트의 도메인이지 사설망 IP가 아니다. 여기서 허용되는 건 같은 LAN의
   * 기기뿐이고 그게 정확히 우리가 원하는 것이다. dev 전용이라 배포 빌드에는 영향이 없다.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],

  /**
   * 인증 경로만 Spring 백엔드로 프록시한다. 브라우저는 :3000만 상대하므로 세션 쿠키가
   * first-party로 동작하고, 프록시가 X-Forwarded-* 를 붙여 Spring이 redirect_uri를
   * :3000 오리진으로 만든다(server.forward-headers-strategy=framework와 짝).
   *
   * **성경 API(/api/v1/bible/*)는 프록시하지 않는다** — 그건 Next 라우트 핸들러가 로컬
   * JSON으로 서빙한다. /api/* 전체를 넘기면 성경이 깨진다.
   *
   * 그리고 api/v1/me 도 여기서 프록시하지 않는다 — src/app/api/v1/me/route.ts 라우트 핸들러가
   * 백엔드로 포워딩하되, 백엔드가 꺼져 있으면 조용히 401을 준다. rewrite로 두면 백엔드가
   * 죽었을 때 Next가 ECONNREFUSED를 매 요청마다 시끄럽게 로그한다(프론트만 개발할 때 도배됨).
   *
   * OAuth 경로(/oauth2/*, /login/oauth2/*, /logout)는 브라우저 리다이렉트라 rewrite여야 한다 —
   * 라우트 핸들러로는 provider로 튀는 전체 이동을 못 다룬다. /login 페이지와는 경로가 겹치지 않음.
   */
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";
    return [
      { source: "/oauth2/:path*", destination: `${backend}/oauth2/:path*` },
      { source: "/login/oauth2/:path*", destination: `${backend}/login/oauth2/:path*` },
      { source: "/logout", destination: `${backend}/logout` },
    ];
  },
};

export default nextConfig;
