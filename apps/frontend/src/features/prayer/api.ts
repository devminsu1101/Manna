import "server-only";

import type { MyPrayerRequest, PrayPerson, PrayRoom, PraySummary } from "./types";

/**
 * 기도 데이터 접근 계층.
 *
 * ⚠️ **지금은 목데이터다.** 백엔드의 Pray API(docs/03_API_SPEC.md의 `/pray/*` 6개)가 붙으면
 * **이 파일만** fetch로 바꾼다. 호출부(page·컴포넌트)는 그대로 둔다 —
 * `features/community/api.ts`와 같은 구조다(D-1801).
 *
 * ⚠️ **인물·공동체는 `features/community/api.ts`에서 그대로 베꼈다.** 공동체 대문의 기도짝
 * 카드가 `/prayer/21`로 링크되므로 21번이 여기 없으면 404가 난다. 한쪽을 고치면 다른 쪽도
 * 고칠 것. 공유 원장을 따로 두는 안은 반려했다 — 실패 경로("없는 사람")를 막지 못하면서
 * 이미 도는 코드에 회귀 위험만 더한다. 진짜 DB는 postgres고 조회 주체는 백엔드다.
 *
 * 목데이터가 **테이블이 아니라 응답 모양**인 것에 유의. 조인·정렬·파생값이 이미 끝나 있다
 * (`communities`는 조인 결과, `request`는 최신 한 건, `prayedByMeToday`는 prayer_logs 파생,
 * 배열 순서는 D-1703 정렬 완료). 여기서 그걸 계산하기 시작하면 백엔드가 붙을 때 통째로
 * 버려질 코드가 자란다.
 */

const C1 = { id: 1, name: "2026-2기 수요 새가족반" };
const C2 = { id: 2, name: "청년부 3목장" };

/**
 * 중보기도실. **나(userId 1)는 들어가지 않는다** — 자기 기도는 400이라 카드는 보이는데
 * 버튼이 안 눌리는 상태가 된다. 최다은(31)·한재민(32)도 없다. 승인 대기는 서로 안 보인다(D-1707).
 *
 * **순서가 서버 정렬 결과다**(D-1909). 네 키:
 *   1. 오늘 내가 아직 안 한 사람 먼저 — 목록을 크게 둘로 가른다
 *   2. 기도제목이 최신인 사람 먼저 (없는 사람은 그 무리의 뒤로)
 *   3. 내가 오래 안 한 사람 먼저 — 실질적으로 기도제목 없는 사람들끼리의 순서
 *   4. userId (타이브레이커)
 * 그래서 목데이터는 22(오늘) 41(2일) 21(4일) 23(없음) | 24(12일) 42(없음) 순이다 —
 * 앞 넷이 아직 기도 안 한 사람, 뒤 둘이 오늘 이미 기도한 사람이다.
 * 목데이터가 이 순서를 어기면 화면에서 정렬이 틀려 보이고 "클라이언트에서 한 번 정렬할까"라는
 * 잘못된 유혹이 생긴다. 클라이언트는 순서를 절대 다시 만들지 않는다.
 */
const MOCK_ROOM: PrayRoom = {
  // 기도짝 배정 스케줄러가 Phase 3라 **실서버에서도 당분간 항상 빈 배열**이다.
  // 화면은 이때 구획을 통째로 숨긴다. 한 번 눈으로 보려면 아래 MOCK_PARTNER를 넣어 볼 것.
  partners: [],

  members: [
    {
      userId: 22,
      name: "박지영",
      profileImageUrl: null,
      communities: [C1],
      request: {
        body: "오늘 면접이 있어요. 마음이 흔들리지 않게 기도 부탁드립니다.",
        createdAt: "2026-09-01T01:00:00Z",
        // 0이면 "오늘"로 표시된다.
        daysAgo: 0,
      },
      prayedByMeToday: false,
    },
    {
      userId: 41,
      name: "오세훈",
      profileImageUrl: null,
      communities: [C2],
      request: {
        body: "목장 식구들과 더 깊이 나눌 수 있는 한 주가 되기를 기도해 주세요.",
        createdAt: "2026-08-30T09:12:00Z",
        daysAgo: 2,
      },
      prayedByMeToday: false,
    },
    {
      userId: 21,
      name: "김민수",
      profileImageUrl: null,
      // 두 방에 걸친 사람. 카드는 하나고 꼬리표만 둘이다(D-905).
      // 공동체 대문의 기도짝 카드가 여기로 착지한다.
      communities: [C1, C2],
      request: {
        // 여러 줄. line-clamp와 whitespace-pre-line이 같이 걸릴 때를 눈으로 보려고 넣었다.
        body: "1. 이직 준비 가운데 하나님이 기뻐하실 일터를 분별할 수 있기를\n2. 나를 둘러싼 공동체와 사람들을 위해 기도할 수 있기를\n3. 말씀과 기도의 자리로 나아가는 데 세상의 시선을 계산하지 않기를",
        createdAt: "2026-08-28T13:40:00Z",
        daysAgo: 4,
      },
      prayedByMeToday: false,
    },
    {
      userId: 23,
      name: "이현우",
      profileImageUrl: null,
      communities: [C1],
      // D-903. 기도제목이 없어도 카드는 있고 기도는 눌린다.
      request: null,
      prayedByMeToday: false,
    },
    {
      userId: 24,
      name: "정수빈",
      profileImageUrl: null,
      communities: [C1],
      request: {
        body: "요즘 몸이 계속 안 좋아서 검사를 받았는데 결과를 기다리는 중이에요. 어떤 결과가 나오더라도 흔들리지 않고 하나님을 신뢰할 수 있도록, 그리고 가족들이 너무 걱정하지 않도록 함께 기도해 주시면 감사하겠습니다.",
        createdAt: "2026-08-20T22:05:00Z",
        daysAgo: 12,
      },
      // 오늘 이미 기도한 사람. 1순위가 그것이라 기도제목이 있어도 아래 무리로 내려간다.
      prayedByMeToday: true,
    },
    {
      userId: 42,
      name: "윤가은",
      profileImageUrl: null,
      communities: [C2],
      // 두 상태가 겹치는 가장 심심한 카드. 이것도 화면이 감당해야 한다.
      request: null,
      prayedByMeToday: true,
    },
  ],
};

/**
 * 홈 최상단. **기본값이 "Phase 3까지의 실제 상태"다** — 기도짝 배정이 없으니 partnerTotal은 0.
 *
 * 나머지 상태는 미리보기 스위치(`?state=...`)를 만들지 않고 주석으로 둔다. 스위치를 만들면
 * 지울 때 화면 코드를 손대게 된다. 확인할 때 아래 한 줄과 바꿔치기하고 되돌릴 것.
 *
 *   { yesterdayCount: 0, partner: null, partnerTotal: 0 }   가입 첫날. 두 줄이 다 빈다
 *   { yesterdayCount: 5, partner: { userId: 21, name: "김민수", communityName: C1.name }, partnerTotal: 3 }
 *   { yesterdayCount: 5, partner: null, partnerTotal: 3 }   짝 모두를 위해 이미 기도함
 */
const MOCK_SUMMARY: PraySummary = {
  yesterdayCount: 5,
  partner: null,
  partnerTotal: 0,
};

/**
 * 내 기도제목 이력. **최신순**이고 맨 위 한 건만 남들에게 보인다
 * (`ORDER BY created_at DESC LIMIT 1`, D-1706).
 *
 * 같은 사람의 제목이 여러 벌 쌓인 모습이 이 화면의 존재 이유다 — append-only를 고른 이유가
 * "이력이 공짜로 남는다"였다. 어느 방에 냈는지가 건마다 다른 것도 이력의 정보다.
 *
 * 빈 이력(첫 사용자는 반드시 이 상태다)을 보려면:  const MOCK_MY_REQUESTS: MyPrayerRequest[] = [];
 */
const MOCK_MY_REQUESTS: MyPrayerRequest[] = [
  {
    id: 501,
    body: "새로 맡은 일이 버겁게 느껴집니다. 조급해하지 않고 하루치의 몫만 감당할 수 있도록 기도해 주세요.",
    createdAt: "2026-08-28T21:10:00Z",
    communities: [C1, C2],
  },
  {
    id: 494,
    body: "가족들과의 관계가 회복되기를 기도하고 있어요. 제가 먼저 말을 건넬 용기를 구합니다.",
    createdAt: "2026-08-12T07:30:00Z",
    communities: [C1],
  },
  {
    id: 470,
    body: "여름 수련회를 앞두고 마음을 준비하고 있습니다. 형식이 아니라 실제로 만나 뵙는 시간이 되기를.",
    createdAt: "2026-07-30T11:00:00Z",
    communities: [C1, C2],
  },
];

/** 중보기도실 목록. 정렬은 서버가 끝내서 준다 — 여기서 다시 만지지 않는다. */
export async function getPrayRoom(): Promise<PrayRoom> {
  return MOCK_ROOM;
}

/**
 * 한 사람의 카드. **내가 볼 수 없는 사람이면 null**이고, 화면은 그걸 404로 옮긴다.
 *
 * 403이 아닌 이유는 공동체 대문과 같다 — 볼 수 없는 사람은 존재 자체를 노출하지 않는다.
 * 나 자신(userId 1)이 목록에 없으므로 `/prayer/1`도 자동으로 404가 된다.
 */
export async function getPrayPerson(userId: number): Promise<PrayPerson | null> {
  if (!Number.isInteger(userId)) return null;
  return [...MOCK_ROOM.partners, ...MOCK_ROOM.members].find((p) => p.userId === userId) ?? null;
}

/** 홈 최상단 한 칸. 어제 받은 수 + 이번 주 기도짝. */
export async function getPraySummary(): Promise<PraySummary> {
  return MOCK_SUMMARY;
}

/** 내 기도제목 이력. 최신순. */
export async function getMyPrayerRequests(): Promise<MyPrayerRequest[]> {
  return MOCK_MY_REQUESTS;
}
