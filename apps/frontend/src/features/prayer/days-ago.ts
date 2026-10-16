/**
 * "○일 전". 서버가 `daysAgo`를 숫자로 주기로 한 계약(API_SPEC) 덕에 이게 전부다.
 *
 * 날짜 라이브러리도 `lib/date.ts`도 만들지 않는다 — `createdAt`을 화면에서 파싱하는 순간
 * 클라이언트 시계와 타임존이 따라 들어온다. 계약이 숫자인 이유가 그것이다.
 * 기도 상세와 중보기도실 스토리 줄이 같이 쓴다.
 */
export function daysAgoLabel(daysAgo: number): string {
  if (daysAgo === 0) return "오늘";
  if (daysAgo === 1) return "어제";
  return `${daysAgo}일 전`;
}
