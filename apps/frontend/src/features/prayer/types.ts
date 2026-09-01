/**
 * 기도 도메인의 화면용 타입.
 *
 * 필드 이름은 docs/03_API_SPEC.md의 camelCase 규약을 그대로 따른다 — 백엔드가 붙을 때
 * 이 타입은 손대지 않고 api.ts의 구현만 fetch로 바뀌게 하려는 것이다.
 * `features/community/types.ts`와 같은 구조다.
 */

/** 카드에 붙는 공동체 꼬리표. 이름만 쓴다. */
export type PrayCommunityRef = {
  id: number;
  name: string;
};

/**
 * 그 사람의 **최신** 기도제목 하나.
 *
 * 저장은 `sharings(type='prayer')`에 append-only이고 "최신만"은 조회 시점의 규칙이다
 * (D-1706, init-db.sql:117). 그래서 여기 오는 건 언제나 한 건이다.
 *
 * ⚠️ `daysAgo`는 **서버가 계산한다.** 화면에서 `createdAt`을 파싱해 다시 세지 말 것 —
 * 파싱하는 순간 클라이언트 시계와 타임존이 따라 들어온다. `createdAt`은 계약이라 두지만
 * 화면은 읽지 않는다.
 */
export type PrayerRequest = {
  body: string;
  createdAt: string;
  daysAgo: number;
};

/**
 * 중보기도실의 사람 카드 하나. **상세 화면도 같은 모양**이라 타입이 하나다
 * (API_SPEC: "목록의 항목 하나와 같은 모양").
 *
 * 기도의 단위가 사람이라(D-303, `prayer_logs`에 `sharing_id`가 없다) 카드도 사람 단위다.
 * 여러 공동체에 걸친 사람도 카드는 하나고 `communities`만 여럿이다 (D-905).
 */
export type PrayPerson = {
  userId: number;
  name: string;
  /** `users.profile_image_url`. 아직 아무도 값이 없어 마스코트로 떨어진다. */
  profileImageUrl: string | null;
  communities: PrayCommunityRef[];
  /** 기도짝 구획에만 온다. Phase 3까지 그 구획이 늘 비어 화면은 읽지 않는다. */
  partnerIn?: PrayCommunityRef[];
  /** **없어도 카드는 만든다** — 조용한 사람이 기도에서 배제되지 않게 (D-903). */
  request: PrayerRequest | null;
  prayedByMeToday: boolean;
};

/**
 * 중보기도실 응답. 구획 둘로 나뉘어 온다.
 *
 * ⚠️ **정렬은 서버가 끝내서 준다.** 클라이언트에서 다시 만들지 않는다. 네 키다(D-1909):
 *   1. 오늘 내가 아직 안 한 사람 먼저 — 목록을 크게 둘로 가른다
 *   2. 기도제목이 최신인 사람 먼저 (없는 사람은 그 무리의 뒤로)
 *   3. 내가 오래 안 한 사람 먼저 — 2가 TIMESTAMPTZ라 거의 다 갈리므로, 실질적으로는
 *      **기도제목이 없는 사람들끼리의 순서**를 정한다. D-903이 지켜지는 자리가 여기다
 *   4. userId (타이브레이커)
 * 이름순으로 두면 앞사람만 계속 기도받아 D-303이 무너진다. 최신순은 업데이트하면 올라가므로
 * 고정되지 않아 그 함정에 걸리지 않는다.
 *
 * 익명 구획(`anonymous`)은 **필드 자체를 만들지 않는다** (D-906). 이름이 없으면 "기도했어요"의
 * 카운트를 누구에게 보낼지가 성립하지 않아 카드 목록에 섞일 수 없다. 나중에 맨 아래 별도
 * 구역으로 더한다 — 없던 필드가 느는 건 안 깨진다.
 */
export type PrayRoom = {
  partners: PrayPerson[];
  members: PrayPerson[];
};

/**
 * 홈 최상단 한 칸.
 *
 * ⚠️ **`partner`와 `partnerTotal`을 한 필드로 합치지 말 것.** 둘은 다른 상태다:
 *   partnerTotal: 0                → 기도짝이 없다 (배정 스케줄러가 Phase 3라 지금은 늘 이것)
 *   partner: null, partnerTotal: 3 → 짝은 있는데 이미 모두를 위해 기도했다
 * 합치면 "짝 없음"과 "다 했음"이 같은 화면이 되는데, 전자는 줄을 숨기고 후자는 칭찬해야 한다.
 *
 * `yesterdayCount`가 **어제 기준**인 것이 핵심이다 (D-901). "어제의 기도로 오늘을 산다"는
 * 뜻이고, 오늘 기준으로 바꾸면 아침마다 0에서 시작해 그 의미가 사라진다.
 */
export type PraySummary = {
  yesterdayCount: number;
  partner: { userId: number; name: string; communityName: string } | null;
  partnerTotal: number;
};

/**
 * 내 기도제목 이력 한 건.
 *
 * ⚠️ `PrayerRequest`와 달리 **`daysAgo`가 없다** — API_SPEC이 `/pray/requests/me`에만 안 넣었다.
 * 이력은 연대기 목록이라 "○일 전"보다 절대 날짜가 맞으므로 `createdAt`을 앞 10자만 잘라 쓴다.
 * TODO(백엔드): 서버가 KST로 내려줄지 `daysAgo`를 여기도 추가할지 그때 정한다. 지금 잘라 쓰는
 * 값은 목데이터라 그대로 날짜다.
 */
export type MyPrayerRequest = {
  id: number;
  body: string;
  createdAt: string;
  communities: PrayCommunityRef[];
};
