/**
 * 빌드된 권별 JSON을 Postgres 적재용 SQL로 뽑는다.
 *
 * 실행: npm run bible:sql          (먼저 npm run bible:build 로 JSON이 있어야 한다)
 * 입력: src/features/bible/data/*.json
 * 출력: data/bible-seed.sql
 *
 * 적재:
 *   docker compose -f ../docker-compose.yml exec -T postgres \
 *     psql -U manna_user -d manna_db < data/bible-seed.sql
 *
 * ── 왜 pg 클라이언트로 직접 넣지 않고 SQL 파일인가 ──────────────
 * 프론트엔드에 DB 드라이버 의존성을 새로 다는 대신 psql로 붓는다. psql은 이미 컨테이너에
 * 들어 있고, 이 작업은 배포마다 도는 게 아니라 데이터가 바뀔 때만 한 번 도는 일이다.
 * INSERT 3만 줄 대신 COPY를 쓰는 이유도 같다 — 한 번에 스트림으로 들어간다.
 *
 * ── 왜 docker-compose에 물려 자동 실행하지 않나 ─────────────────
 * /docker-entrypoint-initdb.d는 볼륨이 빌 때만 돈다. 자동 시딩을 붙이면 5MB 생성물을
 * 저장소에 커밋해야 하고, 그건 이미 있는 원본 JSON과 같은 데이터를 두 벌 두는 것이다.
 * 필요할 때 뽑아 쓰는 쪽이 낫다. 그래서 출력은 gitignore 대상이다.
 *
 * id를 SERIAL에 맡기지 않고 직접 매기는 이유: verses가 chapters를, chapters가 books를
 * 참조해야 하는데, COPY는 방금 넣은 행의 id를 돌려주지 않는다. 끝에서 시퀀스를 맞춰 둔다.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src/features/bible/data");
const OUT = join(ROOT, "data/bible-seed.sql");

/**
 * COPY의 텍스트 포맷 이스케이프.
 *
 * 현재 본문에는 역슬래시도 탭도 개행도 없다(확인함). 그래도 넣어 두는 이유는, 없다는 사실이
 * 데이터의 성질이 아니라 지금 이 소스의 우연이기 때문이다. 소스가 바뀌면 조용히 깨질 자리다.
 */
function copyEscape(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}

const books = JSON.parse(readFileSync(join(DATA, "books.json"), "utf8"));

const bookRows = [];
const chapterRows = [];
const verseRows = [];

let chapterId = 0;

for (const meta of books) {
  const file = JSON.parse(readFileSync(join(DATA, `${meta.abbrev}.json`), "utf8"));
  if (file.chapters.length !== meta.totalChapters) {
    throw new Error(`${meta.name}: books.json은 ${meta.totalChapters}장인데 파일은 ${file.chapters.length}장`);
  }

  // book.id = 정경 순서. 둘 다 1..66이라 굳이 어긋나게 둘 이유가 없다.
  const bookId = meta.order;
  bookRows.push([bookId, meta.name, meta.abbrev, meta.order, meta.totalChapters].join("\t"));

  file.chapters.forEach((verses, i) => {
    chapterId += 1;
    chapterRows.push([chapterId, bookId, i + 1].join("\t"));
    for (const v of verses) {
      verseRows.push(
        [chapterId, v.verseNum, v.endVerseNum ?? "\\N", copyEscape(v.text)].join("\t"),
      );
    }
  });
}

const sql = `-- 생성물이다. 직접 고치지 말 것.
-- 만든 곳: apps/frontend/scripts/build-bible-sql.mjs  (npm run bible:sql)
-- 번역본: 개역개정 (data/raw/nkrv.json)
-- ${books.length}권 / ${chapterRows.length}장 / ${verseRows.length}절
--
-- 적재:
--   docker compose -f ../docker-compose.yml exec -T postgres \\
--     psql -U manna_user -d manna_db < data/bible-seed.sql

BEGIN;

-- 다시 부어도 같은 결과가 나오게 비우고 시작한다. verses -> chapters -> books 순으로
-- 참조하므로 CASCADE로 한 번에 지운다. 성경 본문은 사용자 데이터를 참조하지 않는다.
TRUNCATE verses, chapters, books RESTART IDENTITY CASCADE;

COPY books (id, name, abbreviation, canonical_order, total_chapters) FROM stdin;
${bookRows.join("\n")}
\\.

COPY chapters (id, book_id, chapter_num) FROM stdin;
${chapterRows.join("\n")}
\\.

COPY verses (chapter_id, verse_num, end_verse_num, text) FROM stdin;
${verseRows.join("\n")}
\\.

-- COPY로 id를 직접 넣었으므로 시퀀스가 1에 멈춰 있다. 맞춰 두지 않으면 다음 INSERT가
-- 중복 키로 죽는다.
SELECT setval('books_id_seq', (SELECT MAX(id) FROM books));
SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));
SELECT setval('verses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM verses));

-- 적재가 온전한지 여기서 확인한다. 틀리면 트랜잭션째 되돌린다.
DO $$
DECLARE b INT; c INT; v INT;
BEGIN
  SELECT COUNT(*) INTO b FROM books;
  SELECT COUNT(*) INTO c FROM chapters;
  SELECT COUNT(*) INTO v FROM verses;
  IF b <> ${books.length} THEN RAISE EXCEPTION '권 수가 다르다: % (기대 ${books.length})', b; END IF;
  IF c <> ${chapterRows.length} THEN RAISE EXCEPTION '장 수가 다르다: % (기대 ${chapterRows.length})', c; END IF;
  IF v <> ${verseRows.length} THEN RAISE EXCEPTION '절 수가 다르다: % (기대 ${verseRows.length})', v; END IF;
END $$;

COMMIT;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, sql);

const mb = (Buffer.byteLength(sql) / 1024 / 1024).toFixed(1);
console.log(`완료: ${books.length}권 / ${chapterRows.length}장 / ${verseRows.length}절 → data/bible-seed.sql (${mb}MB)`);
