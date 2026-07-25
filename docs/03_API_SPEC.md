# API 명세서

## Endpoints (초안)

### Bible
- GET /api/v1/bible/books
- GET /api/v1/bible/{book}/{chapter} — **구현됨** (아래 스키마 참고)
- GET /api/v1/bible/search?q=keyword

### Community
- GET /api/v1/communities
- POST /api/v1/communities
- GET /api/v1/communities/{id}

### Sharing (나눔)
- POST /api/v1/sharings
- GET /api/v1/sharings?communityId=

### Prayer (기도)
- POST /api/v1/prayers
- GET /api/v1/prayers/partner
- POST /api/v1/prayers/{id}/pray

(나머지 상세 내용은 개발 중 추가)

---

## 확정된 스키마

### GET /api/v1/bible/{book}/{chapter}

성경 한 장을 읽는다. 프론트엔드가 현재 Next 라우트 핸들러로 구현해 쓰고 있으며
(`apps/frontend/src/app/api/v1/bible/[book]/[chapter]/route.ts`), 백엔드는 **이 응답 형태를
그대로** 구현하면 된다. 그러면 프론트는 `NEXT_PUBLIC_BIBLE_API_BASE_URL` 하나만 바꾸면 전환된다.

**Path 파라미터**

| 이름 | 타입 | 설명 |
|---|---|---|
| `book` | string | 권 약어. `books.abbreviation`. 예: `gn`, `ps`, `1co`, `re` |
| `chapter` | int | 장 번호. 1부터 `books.total_chapters`까지 |

**200 응답** — 필드는 모두 camelCase (DB는 snake_case, 변환은 경계에서)

```json
{
  "book": {
    "abbrev": "gn",
    "name": "창세기",
    "order": 1,
    "totalChapters": 50
  },
  "chapterNum": 3,
  "verses": [
    { "verseNum": 1, "text": "그런데 뱀은 여호와 하나님이 지으신 들짐승 중에 가장 간교하니라 ..." },
    { "verseNum": 2, "text": "여자가 뱀에게 말하되 동산 나무의 열매를 우리가 먹을 수 있으나" }
  ]
}
```

| 필드 | DB 대응 |
|---|---|
| `book.abbrev` | `books.abbreviation` |
| `book.name` | `books.name` (한글 권 이름) |
| `book.order` | `books.canonical_order` (정경 순서 1~66) |
| `book.totalChapters` | `books.total_chapters` |
| `chapterNum` | `chapters.chapter_num` |
| `verses[].verseNum` | `verses.verse_num` |
| `verses[].endVerseNum` | `verses.end_verse_num` (없으면 필드 자체를 생략) |
| `verses[].text` | `verses.text` |

**번역본** — 개역개정. 아래 두 가지는 손상이 아니라 정본의 표기이므로 클라이언트가 감당해야 한다.

**1) 절 번호는 장 안에서 1..N으로 이어지지 않는다.** 배열 인덱스로 번호를 유도하면 안 된다.
개역개정은 사도행전 24장에서 6하반~8상반을 들어내어 **7절이 존재하지 않는다**(6절 본문이
`(6하반-8상반 없음)`이라고 직접 밝힌다). 전 성경에서 이 한 곳뿐이지만, 인덱스로 계산하면
그 장의 번호가 통째로 밀린다.

```json
{ "verseNum": 6, "text": "그가 또 성전을 더럽게 하려 하므로 우리가 잡았사오니 (6하반-8상반 없음)" },
{ "verseNum": 8, "text": "당신이 친히 그를 심문하시면 우리가 고발하는 이 모든 일을 아실 수 있나이다 하니" }
```

**2) 여러 절이 한 단락으로 묶인 곳이 11군데 있다.** 이때만 `endVerseNum`이 붙는다.
화면에는 `18-19`로 보여준다 — 시작 번호만 찍으면 다음이 20이라 절이 빠진 것처럼 읽힌다.
식별자(`toVerseId`)는 시작 번호로 만든다.

```json
{ "verseNum": 18, "endVerseNum": 19, "text": "여호와께서 보시기에 정직하고 선량한 일을 행하라 ..." }
```

해당 위치: 신 6:18-19, 신 15:4-5, 신 30:9-10, 대상 16:12-13, 시 92:1-3, 시 105:5-6,
렘 32:3-5, 렘 33:10-11, 겔 24:4-5, 행 15:25-26, 롬 9:1-2.

또한 사본상 생략된 절 13곳(마 17:21, 18:11, 23:14 / 막 9:44, 9:46, 11:26, 15:28 /
눅 17:36, 23:17 / 행 8:37, 15:34, 28:29 / 롬 16:24)은 번호를 유지한 채 `text`가 `(없음)`이다.
빈 문자열이 아니라 실제 본문이므로 그대로 렌더한다.

**404 응답** — 없는 권이거나 장 번호가 범위 밖일 때

```json
{ "error": { "code": "NOT_FOUND", "message": "없는 권 또는 장입니다." } }
```

**캐시 헤더**

```
Cache-Control: public, max-age=86400, stale-while-revalidate=31536000
```

`immutable`을 쓰지 않는다. 불변인 것은 성경 본문이지 우리가 저장한 데이터가 아니다.
실제로 원본을 통째로 갈아엎은 적이 있다 — 이전 개역한글 소스는 27개 권에서 장 끝 절이 잘려
155절이 없었고, 욥기는 36장이 통째로 빠져 그 뒤 장 번호가 하나씩 밀려 있었다.
URL이 배포마다 동일하므로 `immutable`이면 이미 읽은 클라이언트에 수정본이 최대 1년간
도달하지 못한다. 그 사이 사용자는 잘못된 장 번호를 계속 본다. SWR은 성능은 동일하면서
24시간 내에 자가 치유된다.

**호출 패턴** — 리더는 장이 끝나갈 때 다음 장을 미리 부른다(연속 스크롤). 첫 장은 서버 렌더로
내려가므로 이 엔드포인트를 타지 않는다.