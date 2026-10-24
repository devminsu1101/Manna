/**
 * 알림 시각을 "방금 · n분 전 · n시간 전 · n일 전"으로. 보관이 30일이라 그 이상은 없다.
 * 기도제목의 `daysAgoLabel`은 날짜 단위라 하루 안의 알림을 구분하지 못해 따로 둔다.
 */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
