import { lastReadLocation } from "./last-read";

/**
 * 장 단위 이동 기록. 좌·우 하단의 "이전/다음 말씀" 버튼이 읽는다.
 *
 * **브라우저 히스토리와 같은 모형이다** — 지나온 자취(entries)와 그 위의 커서(index).
 * 순수 스택으로 시작했다가 앞으로가기를 붙이면서 바꿨다. 스택은 뒤로 갈 때 값을 버리므로
 * 되짚어 온 자리로 다시 갈 방법이 없다.
 *
 *   entries: [예레미야26, 시편15, 마태19]
 *   index:                  ↑ 1        → 뒤로=예레미야26, 앞으로=마태19
 *
 * **기록은 떠날 때 한 번**(사용자 제안). 도착할 때 "직전에 리더가 있던 곳"과 비교하는 방식도
 * 검토했으나 셋 때문에 버렸다:
 *  1. 브라우저 뒤로가기도 "도착"이라 자취가 오염된다
 *  2. 이 버튼으로 이동한 것도 "도착"이라 핑퐁을 막을 플래그가 따로 필요하다
 *  3. 스크롤 중 "지금 어디인가"를 계속 갱신해야 해 `ChapterFeed`를 건드려야 한다
 * 떠날 때 기록하면 셋 다 사라진다. 이 버튼들은 커서만 옮기므로 플래그가 필요 없다.
 *
 * 쿠키가 아니라 sessionStorage인 이유: **서버가 읽을 필요가 전혀 없다.** `last-read`가 쿠키인
 * 유일한 이유가 서버 리다이렉트인데(last-read.ts 참고) 여기는 그게 없다. 탭 단위 수명도
 * "이번에 읽는 흐름"과 정확히 맞는다 — 내일 앱을 열었을 때 어제 자취가 남아 있을 이유가 없다.
 * 앱에서 sessionStorage를 쓰는 첫 자리다.
 */

const TRAIL_KEY = "manna_jump_trail";

/** 되짚어 오가는 용도지 히스토리 브라우징이 아니다. 넘치면 앞쪽부터 버린다. */
const MAX_ENTRIES = 10;

export type JumpTarget = { path: string; bookName: string; chapterNum: number };

/** 양쪽 다 갈 곳이 없을 때 쓰는 **고정 객체**. 매번 새로 만들면 리렌더가 멈추지 않는다. */
export const NO_JUMP_NAV: { back: JumpTarget | null; forward: JumpTarget | null } = {
  back: null,
  forward: null,
};

type Trail = { entries: readonly string[]; index: number };

const listeners = new Set<() => void>();

/**
 * 자취와, 거기서 파생한 양쪽 목적지.
 *
 * 목적지를 같이 캐시하는 이유: `useSyncExternalStore`의 getSnapshot이 매번 새 객체를 만들면
 * 무한 루프에 빠진다. 자취가 바뀔 때만 다시 만들어 정체성을 고정한다.
 */
let trail: Trail | null = null;
let nav = NO_JUMP_NAV;

function setTrail(next: Trail): void {
  trail = next;
  const back = next.index > 0 ? lastReadLocation(next.entries[next.index - 1]) : null;
  const forward =
    next.index >= 0 && next.index < next.entries.length - 1
      ? lastReadLocation(next.entries[next.index + 1])
      : null;
  // 둘 다 없으면 고정 객체로 돌려보낸다 — 없는 상태끼리는 정체성이 흔들리지 않아야 한다.
  nav = back || forward ? { back, forward } : NO_JUMP_NAV;
}

/**
 * 처음 읽을 때 한 번만 sessionStorage를 훑는다. 탭 단위 저장소라 우리 말고 쓰는 쪽이 없어,
 * 이후로는 메모리 캐시가 곧 진실이다.
 *
 * **여기가 신뢰 경계다.** sessionStorage는 devtools로 얼마든지 고칠 수 있고, 이 값이
 * `router.push`의 경로가 된다. `lastReadLocation`이 실재하는 권인지·장이 범위 안인지까지
 * 확인하므로(last-read.ts) 하나라도 통과 못 하면 자취를 통째로 버린다. 일부만 걸러내면
 * index가 가리키던 자리가 의미를 잃어, 깨끗이 비우는 편이 안전하고 단순하다.
 * 쿠키와 같은 `"{abbrev}/{n}"` 형식으로 저장하는 것도 그 검증을 그대로 쓰기 위해서다.
 */
function load(): Trail {
  if (trail) return trail;

  let parsed: unknown = null;
  try {
    const raw = sessionStorage.getItem(TRAIL_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    // 저장소 접근 거부(사파리 프라이빗 모드 등)와 깨진 JSON이 둘 다 여기로 온다.
    // 어느 쪽이든 "기록 없음"으로 시작하면 된다.
  }

  const next: Trail = isValidTrail(parsed) ? parsed : { entries: [], index: -1 };
  setTrail(next);
  return next;
}

function isValidTrail(value: unknown): value is Trail {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const { entries, index } = value as { entries?: unknown; index?: unknown };
  if (!Array.isArray(entries) || !Number.isInteger(index)) return false;
  if (!entries.every((v) => typeof v === "string" && lastReadLocation(v) !== null)) return false;
  return (index as number) >= 0 && (index as number) < entries.length;
}

function save(next: Trail): void {
  setTrail(next);
  try {
    sessionStorage.setItem(TRAIL_KEY, JSON.stringify(next));
  } catch {
    // 못 써도 이번 세션 동안은 메모리 캐시로 그대로 동작한다.
  }
  for (const listener of listeners) listener();
}

export function subscribeJumps(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** 지금 갈 수 있는 양쪽 목적지. 없는 쪽은 null이고, 그쪽 버튼은 뜨지 않는다. */
export function jumpNav(): { back: JumpTarget | null; forward: JumpTarget | null } {
  load();
  return nav;
}

/**
 * 다른 장으로 떠난다. **선택 시트에서 장을 고를 때만** 부른다.
 *
 * 책 경계 안내(`BookEndNotice`/`BookStartNotice`)에서는 부르지 않는다. 예레미야 마지막 장에서
 * 애가 1장으로 넘어가는 건 이어 읽는 흐름이지 점프가 아니다. 거기서 쌓기 시작하면 순차로
 * 읽기만 해도 버튼이 계속 떠 있고, 그 자리엔 이미 반대 방향 링크가 있다.
 *
 * @param fromChapter 라우트 파라미터가 아니라 **그때 화면에 보이던 장**이어야 한다.
 *   /bible/ps/13으로 들어와 15장까지 읽었으면 돌아갈 곳은 13이 아니라 15다.
 */
export function pushJump(
  fromAbbrev: string,
  fromChapter: number,
  toAbbrev: string,
  toChapter: number,
): void {
  const from = `${fromAbbrev}/${fromChapter}`;
  const to = `${toAbbrev}/${toChapter}`;
  if (from === to) return;

  const t = load();

  // 뒤로 와 있던 상태에서 새 곳으로 가면 앞쪽 기록은 버린다. 브라우저와 같은 규칙이다.
  const kept = t.index >= 0 ? t.entries.slice(0, t.index + 1) : [];

  // 커서 자리를 지금 위치로 갱신한다. 들어온 뒤 스크롤로 장이 넘어갔을 수 있어,
  // 자취에 박아 둔 값이 이미 낡았다.
  if (kept.length > 0) kept[kept.length - 1] = from;
  else kept.push(from);

  const entries = [...kept, to];
  const excess = Math.max(0, entries.length - MAX_ENTRIES);
  save({ entries: entries.slice(excess), index: kept.length - excess });
}

/** 커서를 한 칸 뒤로 옮기고 그 목적지를 준다. */
export function goBack(): JumpTarget | null {
  const t = load();
  const target = nav.back;
  if (!target) return null;
  save({ entries: t.entries, index: t.index - 1 });
  return target;
}

/** 커서를 한 칸 앞으로 옮기고 그 목적지를 준다. */
export function goForward(): JumpTarget | null {
  const t = load();
  const target = nav.forward;
  if (!target) return null;
  save({ entries: t.entries, index: t.index + 1 });
  return target;
}
