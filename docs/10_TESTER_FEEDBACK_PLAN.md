# 초기 테스터 피드백 반영 계획

> **2026-11-18 변경:** 아래 2절의 방별 댓글·반응 제안은 단일 나눔 글과 글 단위 댓글·반응으로 대체됐다. 구현 기준은 [`12_PRAYER_FIRST_REDESIGN.md`](12_PRAYER_FIRST_REDESIGN.md). 푸시·읽음·초대 안내 기록은 그대로 유효하다.

> **상태 (2026-11-05):** 운영 iPhone에서 홈 화면 웹앱의 푸시 수신을 확인했다. 앱 안 알림과 같은 푸시 본문·벨을 닫을 때 전체 읽음은 수정했으며 배포 후 재검증이 필요하다. 06:00 배치·Android 수신은 미확인이다. 나눔 댓글/반응·초대 복사 안내는 미구현이다. 현재 API는 `03_API_SPEC.md`, 현재 DB는 `apps/init-db.sql`과 `06_ERD.md`가 기준이다.
> **추가 (2026-11-14):** 초대 복사 안내를 브라우저 기본 팝업으로 구현했다. 모바일 실기기 확인은 남았다. 위 상태 문장은 2026-11-05 당시 기록이다.
> 결정의 이유는 `07_HISTORY.md` D-3629~3632, 진행 상태는 `05_ROADMAP.md`를 본다.

## 현재 호출 흐름

- `manifest.ts`는 standalone 시작 화면과 아이콘을 정의한다. 서비스 워커와 구독·발송 코드는 운영에 배포됐고 iPhone에서 푸시 수신을 확인했다.
- 가입 신청·승인·기도마니또 시작은 `CommunityService`, 새 나눔은 `SharingService`가 `NotificationService.notify`를 부른다. `NotificationRepository`는 사용자별 최근 30일 최대 50개와 미읽음 수를 조회한다. `prayed_for_you`는 KST 자정 배치가 만들고 벨 조회에서도 빠진 알림을 생성한다.
- `NotificationBell`은 시트를 열 때 `GET /notifications`로 목록만 조회하고, 닫을 때 `POST /notifications/read-all`로 전체 읽음 처리한다.
- 나눔은 `sharings`와 `sharing_communities`에 저장한다. 여러 방을 선택하면 방마다 별도 글이 생긴다(D-3507). 목록·홈 소식·상세가 `/sharings/{id}`로 이어지며 댓글·반응은 아직 없다.
- active 멤버의 대문에 있는 `InviteButton`은 `${location.origin}/invite/{inviteCode}`를 `copyToClipboard`로 복사한다. Clipboard API 실패 시 `execCommand`로 재시도하고 성공 여부를 반환한다. 결과는 공동체 나가기의 `confirm()`과 같은 브라우저 기본 팝업 계열인 `alert()`로 안내한다.

## 1. PWA 푸시 알림

**목표:** 이미 저장하는 앱 안 알림을 사용자가 허용한 기기에도 보여 준다. 앱 안 알림이 기준이며 푸시 실패로 알림 행을 잃지 않는다.

1. 프런트에 서비스 워커를 등록한다. `push`에서는 곧바로 `showNotification`을 호출하고, `notificationclick`에서는 알림의 앱 내부 `linkPath`를 연다. 마이페이지의 **이 기기에서 알림 받기** 켜기에서만 권한 요청·구독을 시작한다. 지원하지 않거나 거절한 환경은 앱 안 알림을 계속 사용한다.
2. 인증된 구독 등록·해제 API와 `push_subscriptions` 테이블을 둔다. 사용자 한 명에게 여러 기기를 허용하고 endpoint를 중복 저장하지 않는다. endpoint·암호화 키는 비밀 값으로 취급하며 VAPID 개인 키는 서버 환경변수에 둔다. 재로그인·계정 전환·로그아웃·구독 해제 시 기기와 사용자 연결을 정리한다. 사용자 요청에 따라 OS 알림 본문에도 앱 안 알림의 실명·공동체명이 포함될 수 있다.
3. `NotificationService.notify`가 저장한 알림을 **트랜잭션 확정 후** 해당 사용자의 구독으로 발송한다. 만료된 구독은 제거하고 일시적인 발송 실패를 기록한다. 발송 실패는 원래 API와 앱 안 알림 저장을 실패시키지 않는다.
4. `prayed_for_you`는 KST 자정 배치가 전날 기도자 수가 1명 이상인 사람의 빠진 행을 만들고, 아직 읽지 않은 행만 푸시 작업에 넣는다. 벨 조회에서도 빠진 행을 만들 수 있다. 본문은 기존과 같은 “날 위해 n명이 기도하고 있어요”다. `prayer_date` 고유 인덱스로 중복 생성을 막는다.

**실기기 시험:** 관리자 화면 아래에서 사용자 ID와 메시지를 입력해 `POST /api/v1/admin/notifications/test`를 호출한다. 관리자만 가능하며, 대상에게 구독 기기가 없으면 `409`를 반환한다. `202`는 발송 작업 접수이고 휴대폰 수신 여부는 iPhone에서 직접 확인한다. 홈 화면 앱에서 알림 켜기 → 자기 ID로 시험 발송 → 앱 닫은 상태에서 수신 → 탭 이동 → 벨을 열어 미읽음 확인 → 벨을 닫아 전체 읽음 → 알림 끄기를 확인한다.

**플랫폼 조건:** iOS·iPadOS 16.4 이상은 홈 화면에 추가한 standalone 웹앱에서 Web Push를 쓸 수 있다. Android 지원 브라우저는 브라우저와 설치 앱에서 쓸 수 있다. 공통으로 HTTPS, 서비스 워커, 사용자 허용이 필요하다. 권한·구독 요청은 버튼 클릭에 연결하고 `denied`·미결정 상태를 처리한다. Safari에서는 수신한 푸시를 사용자에게 즉시 보여 줘야 한다. [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [MDN PushManager.subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [MDN 권한 요청](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static).

**확인 기준:** Android 브라우저·설치 앱과 iOS 홈 화면 앱에서 허용·거절·알림 탭을 확인한다. 여러 기기, 구독 만료, 로그아웃·계정 전환, 앱을 닫은 동안의 기도 소식을 확인한다. iOS 일반 브라우저에서는 지원 안내가 정확해야 한다.

## 2. 공동체 나눔 댓글·캐릭터 반응

> **종전 초안 — 구현하지 않음.** 아래 `community_id` 기반 분리는 방마다 별도 글을 저장하던 구조를 전제로 한다. 개편에서는 한 글에 댓글·반응을 하나씩 묶고, 조회·쓰기는 글의 현재 공개 대상과 양쪽의 `active` 소속으로 검사한다. 반응 네 종류·교체/취소·본인 댓글 삭제 규칙은 유지한다.

**목표:** 글이 걸린 **공동체 안에서만** 댓글과 반응을 주고받는다. 기도제목(`type='prayer'`)에는 붙이지 않는다.

- DB 계획: `sharing_comments(id, sharing_id, community_id, author_id, body, created_at)`와 `sharing_reactions(sharing_id, community_id, user_id, reaction_key, created_at)`를 추가한다. 반응은 `(sharing_id, community_id, user_id)`당 하나이며 같은 키를 다시 누르면 취소, 다른 키는 교체한다. `(sharing_id, community_id)`는 `sharing_communities`를 참조하고 삭제 시 종속 행을 정리한다. 이 방 식별자가 있어야 과거 한 글이 여러 방에 걸린 행도 댓글을 서로 노출하지 않는다.
- API 계획: `/sharings/{id}/comments` 조회·작성, `/sharings/{id}/comments/{commentId}` 본인 삭제, `/sharings/{id}/reactions` 요약 조회, `/sharings/{id}/reaction` 내 선택·취소. 요청의 `communityId`가 해당 글에 연결되어 있고 내가 그 방의 **active** 멤버인지 확인한다. 작성자는 자신의 글 상세를 볼 수 있어도 방에서 나간 뒤에는 새 대화에 참여하거나 댓글·반응을 조회할 수 없다. 본문 길이·반응 키는 서버에서 검증하고, 남의 방·기도제목은 404로 감춘다.
- 화면 계획: `/sharings/{id}` 하단에 반응별 수·내 선택과 댓글 목록·작성·본인 삭제를 둔다. 작성·삭제 실패는 화면에 알리고, 성공 후 목록·수를 갱신한다. 글을 삭제하면 댓글·반응도 함께 사라진다.
- 이미지 계획: 현재 `public/mascot/`의 투명 PNG `hi`, `warm`, `tears`, `together`를 첫 반응 세트로 재사용하고 각 버튼에 텍스트 이름과 접근 가능한 라벨을 붙인다. `default`는 기본 캐릭터, `bible`은 책 그림이므로 반응에서는 제외한다. 새 표정 제작은 이 원본의 형태·색·투명도를 기준으로 후속 작업에서 결정한다.

**확인 기준:** active·pending·비멤버·탈퇴한 작성자별 조회·작성 권한, 다른 공동체와 과거 다중 연결 글 사이의 격리, 반응 교체·취소, 글·방 삭제 시 정리, 모바일 키보드와 스크린 리더를 검증한다.

## 3. 벨을 닫으면 미읽음 전체 읽음

**목표:** 벨 시트를 닫으면 그 사용자의 **기존 미읽음 행 전체**를 읽음 처리한다. 목록의 최근 30일·50개 제한 밖에 있는 행도 포함한다.

- `POST /notifications/read-all`을 추가했다. Service가 오늘의 `prayed_for_you`를 먼저 생성하고 Repository가 `user_id = 나 AND read_at IS NULL`을 한 번에 갱신한다. GET 조회에 **읽음 처리**를 넣지 않는다.
- 벨을 열 때 GET으로 목록을 보여 주고, 닫을 때 `read-all`을 호출한다. 알림 줄 클릭으로 시트가 닫혀도 같은 처리를 한다. `NotificationBell`은 성공 후 빨간 점을 내리고, 실패 시 읽음 성공처럼 표시하지 않는다. 줄 클릭 시의 개별 읽음 호출은 UI에서 제거하되 기존 API는 호환을 위해 유지한다.
- 새 알림이 읽음 요청과 동시에 도착할 수 있으므로 읽음 처리 시점 이후에 생성된 알림은 다음 조회에서 미읽음으로 남는다. 30일 보관 표시는 그대로다.

**확인 기준:** 다른 사용자의 알림은 바뀌지 않고, 50개 초과·30일 이전 알림도 읽음이 되며, 재호출이 안전하다. 기도 소식이 그날 새로 만들어져도 즉시 읽음 상태가 된다. 실패하면 점이 거짓으로 사라지지 않는다.

## 4. 초대 링크 복사 안내

**목표:** 기존 링크 생성·복사 흐름을 유지하면서 결과를 눈으로도 확인할 수 있게 한다. API·DB 변경은 없다.

- `InviteButton`의 `copyToClipboard`가 `true`이면 브라우저 기본 `alert()`에 **“초대 링크를 복사했어요. 초대할 사람이나 그룹에 붙여넣어 공유해 주세요.”**를 표시한다. 첫 문장과 다음 행동 사이에 줄바꿈을 넣는다.
- `false`이면 같은 팝업에 **“초대 링크를 복사하지 못했어요. 다시 시도해 주세요.”**를 표시한다. 버튼 아이콘과 `aria-label`은 초대 링크 복사 동작을 나타낸다. 연속 클릭으로 팝업이 겹치지 않게 한다.

**확인 기준:** 프런트 ESLint·TypeScript 검사와 운영 빌드 통과. 모바일 실기기에서는 HTTPS 복사 성공, 권한 거부·비보안 LAN 환경의 폴백 성공 또는 실패, 카톡 등에 붙여넣은 실제 URL과 기본 팝업 안내를 확인한다.

## 구현 시 함께 맞출 문서·배포 순서

- `03_API_SPEC.md`의 **계획안**을 실제 계약으로 바꾸고, `05_ROADMAP.md`는 검증한 항목만 `[x]`로 바꾼다. `08_USER_FLOWS.md`의 예정 흐름도 구현 흐름으로 바꾼다.
- 새 테이블의 실제 DDL을 `apps/init-db.sql`에 추가하고 **같은 컬럼·제약**을 `06_ERD.md`에 반영한다. `01_PROJECT_OVERVIEW.md`의 현재 상태·테이블 수가 달라지면 함께 갱신한다.
- 운영 DB에는 `09_DEPLOYMENT.md`에 확정된 증분 SQL을 기록하고 **DB 적용 후 백엔드 배포** 순서를 지킨다. VAPID 키·설정이 생기면 `00_SETUP_GUIDE.md`와 `09_DEPLOYMENT.md`의 환경변수 설명을 갱신한다. `07_HISTORY.md`에는 구현·검증 결과를 새 날짜 항목으로 덧붙인다.
- 백엔드 `NotificationApiTests`·`SharingApiTests`에 권한·경계 사례를 추가하고, 프런트는 실제 모바일 브라우저에서 복사와 푸시 권한을 확인한다. `next.config.ts`의 `/api/v1/notifications/**`·`/api/v1/sharings/**` rewrite와 `apiFetch`의 CSRF 경로를 사용한다.
