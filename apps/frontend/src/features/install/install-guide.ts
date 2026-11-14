export const INSTALL_GUIDE_RECHECK = "manna:install-guide-recheck";
export const INSTALL_GUIDE_OPEN = "manna:install-guide-open";

const SNOOZED_DATE_KEY = "manna:install-guide-snoozed-date";
const INSTALLED_KEY = "manna:install-guide-installed";

export type InstallPlatform = "ios-kakao" | "ios-safari" | "android-kakao" | "android-samsung" | "android-chrome" | "other";

export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function detectInstallPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  const kakao = /KAKAOTALK/i.test(ua);
  if (/iPhone|iPad|iPod/i.test(ua)) return kakao ? "ios-kakao" : "ios-safari";
  if (/Android/i.test(ua)) {
    if (kakao) return "android-kakao";
    return /SamsungBrowser/i.test(ua) ? "android-samsung" : "android-chrome";
  }
  return "other";
}

export function kstDate(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

function stored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function save(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* 저장할 수 없으면 다음 방문에 다시 안내한다. */ }
}

export function mayAutoOpen(): boolean {
  return !isStandalone() && stored(INSTALLED_KEY) !== "true" && stored(SNOOZED_DATE_KEY) !== kstDate();
}

export function snoozeToday(): void { save(SNOOZED_DATE_KEY, kstDate()); }
export function markInstalled(): void { save(INSTALLED_KEY, "true"); }

export function isInstallGuideRoute(pathname: string): boolean {
  if (pathname.startsWith("/dev") || pathname.startsWith("/admin")) return false;
  if (pathname === "/login" || pathname === "/landing" || pathname === "/") return false;
  if (pathname.startsWith("/bible")) return false;
  if (pathname.endsWith("/new") || pathname.endsWith("/edit")) return false;
  if (pathname === "/prayer" && new URLSearchParams(window.location.search).get("focus") === "1") return false;
  if (pathname.startsWith("/invite/")) return document.querySelector("[data-invite-pending]") !== null;
  return pathname.startsWith("/communities")
    || pathname.startsWith("/prayer") || pathname.startsWith("/mypage") || pathname.startsWith("/sharings/");
}
