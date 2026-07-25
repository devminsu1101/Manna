/**
 * nkrv.json(개역개정)을 앱이 쓸 수 있는 형태로 변환한다.
 *
 * 실행: npm run bible:build
 * 입력: data/raw/nkrv.json  (flat dict: { "창1:1": "태초에 하나님이...", ... })
 * 출력: src/features/bible/data/<abbrev>.json  (권별 66개)
 *       src/features/bible/data/books.json     (권 목록 메타)
 *
 * 원본은 권별로 쪼갠다. 5MB 단일 JSON을 라우트에서 import하면 서버 번들이
 * 통째로 커진다. 권별로 나누면 요청된 권만 동적 import로 올라온다.
 *
 * ── 왜 개역개정으로 갈아탔나 ────────────────────────────────────
 * 이전 소스는 개역한글(thiagobodruk/bible의 ko_ko.json)이었는데 데이터가 망가져 있었다:
 *  - 27/66권에서 장 끝 절이 잘려 155절이 사라짐 (골 4장은 18절 중 9절만 있었다)
 *  - 욥기는 36장이 통째로 빠지고 그 뒤 장 번호가 하나씩 밀려, "욥기 38장"을 열면
 *    실제로는 39장이 나왔다. 42장은 빈 장이었다.
 * 대체 후보였던 getbible의 개역성경은 장은 온전했으나 생략절(막 9:44 등)을 지우고
 * 번호를 당겨 버려 같은 종류의 오류를 새로 만들었다. 그래서 둘 다 버렸다.
 *
 * ── 절 번호를 믿을 수 있는 근거 ─────────────────────────────────
 * 이 소스는 사본상 생략된 절을 "(없음)"으로 남겨 번호를 유지한다(막 9:44/46, 행 8:37 등 13곳).
 * 행 24장처럼 개역개정이 6하반~8상반을 통째로 들어낸 곳은 7절 키 자체가 없는데, 이것도
 * 정본과 같다 — 24:6 본문이 "(6하반-8상반 없음)"이라고 직접 밝힌다.
 * 즉 절 번호의 구멍은 손상이 아니라 정본의 표기다. 그래서 절 번호는 연속성을 검사하지 않는다.
 * 반면 장 번호에는 구멍이 있을 수 없으므로 아래에서 1..N을 강제한다.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data/raw/nkrv.json");
const OUT = join(ROOT, "src/features/bible/data");

/**
 * 원본의 한글 약어 → 앱의 abbrev / 한글 권 이름. 정경 순서대로다(배열 순서 = order).
 *
 * abbrev는 라우트 키(/bible/gn/1)라 바꾸면 기존 링크가 깨진다. 원본이 바뀌어도 그대로 둔다.
 */
const BOOKS = [
  { key: "창", abbrev: "gn", name: "창세기" },
  { key: "출", abbrev: "ex", name: "출애굽기" },
  { key: "레", abbrev: "lv", name: "레위기" },
  { key: "민", abbrev: "nm", name: "민수기" },
  { key: "신", abbrev: "dt", name: "신명기" },
  { key: "수", abbrev: "js", name: "여호수아" },
  { key: "삿", abbrev: "jud", name: "사사기" },
  { key: "룻", abbrev: "rt", name: "룻기" },
  { key: "삼상", abbrev: "1sm", name: "사무엘상" },
  { key: "삼하", abbrev: "2sm", name: "사무엘하" },
  { key: "왕상", abbrev: "1kgs", name: "열왕기상" },
  { key: "왕하", abbrev: "2kgs", name: "열왕기하" },
  { key: "대상", abbrev: "1ch", name: "역대상" },
  { key: "대하", abbrev: "2ch", name: "역대하" },
  { key: "스", abbrev: "ezr", name: "에스라" },
  { key: "느", abbrev: "ne", name: "느헤미야" },
  { key: "에", abbrev: "et", name: "에스더" },
  { key: "욥", abbrev: "job", name: "욥기" },
  { key: "시", abbrev: "ps", name: "시편" },
  { key: "잠", abbrev: "prv", name: "잠언" },
  { key: "전", abbrev: "ec", name: "전도서" },
  { key: "아", abbrev: "so", name: "아가" },
  { key: "사", abbrev: "is", name: "이사야" },
  { key: "렘", abbrev: "jr", name: "예레미야" },
  { key: "애", abbrev: "lm", name: "예레미야애가" },
  { key: "겔", abbrev: "ez", name: "에스겔" },
  { key: "단", abbrev: "dn", name: "다니엘" },
  { key: "호", abbrev: "ho", name: "호세아" },
  { key: "욜", abbrev: "jl", name: "요엘" },
  { key: "암", abbrev: "am", name: "아모스" },
  { key: "옵", abbrev: "ob", name: "오바댜" },
  { key: "욘", abbrev: "jn", name: "요나" },
  { key: "미", abbrev: "mi", name: "미가" },
  { key: "나", abbrev: "na", name: "나훔" },
  { key: "합", abbrev: "hk", name: "하박국" },
  { key: "습", abbrev: "zp", name: "스바냐" },
  { key: "학", abbrev: "hg", name: "학개" },
  { key: "슥", abbrev: "zc", name: "스가랴" },
  { key: "말", abbrev: "ml", name: "말라기" },
  { key: "마", abbrev: "mt", name: "마태복음" },
  { key: "막", abbrev: "mk", name: "마가복음" },
  { key: "눅", abbrev: "lk", name: "누가복음" },
  { key: "요", abbrev: "jo", name: "요한복음" },
  { key: "행", abbrev: "act", name: "사도행전" },
  { key: "롬", abbrev: "rm", name: "로마서" },
  { key: "고전", abbrev: "1co", name: "고린도전서" },
  { key: "고후", abbrev: "2co", name: "고린도후서" },
  { key: "갈", abbrev: "gl", name: "갈라디아서" },
  { key: "엡", abbrev: "eph", name: "에베소서" },
  { key: "빌", abbrev: "ph", name: "빌립보서" },
  { key: "골", abbrev: "cl", name: "골로새서" },
  { key: "살전", abbrev: "1ts", name: "데살로니가전서" },
  { key: "살후", abbrev: "2ts", name: "데살로니가후서" },
  { key: "딤전", abbrev: "1tm", name: "디모데전서" },
  { key: "딤후", abbrev: "2tm", name: "디모데후서" },
  { key: "딛", abbrev: "tt", name: "디도서" },
  { key: "몬", abbrev: "phm", name: "빌레몬서" },
  { key: "히", abbrev: "hb", name: "히브리서" },
  { key: "약", abbrev: "jm", name: "야고보서" },
  { key: "벧전", abbrev: "1pe", name: "베드로전서" },
  { key: "벧후", abbrev: "2pe", name: "베드로후서" },
  { key: "요일", abbrev: "1jo", name: "요한일서" },
  { key: "요이", abbrev: "2jo", name: "요한이서" },
  { key: "요삼", abbrev: "3jo", name: "요한삼서" },
  { key: "유", abbrev: "jd", name: "유다서" },
  { key: "계", abbrev: "re", name: "요한계시록" },
];

/**
 * 원본의 유일한 파싱 사고.
 *
 * 요 18:38은 "빌라도가 이르되 진리가 무엇이냐 하더라 이 말을 하고 다시 유대인들에게..."인데,
 * 원본을 만든 파서가 본문 중간의 "이"를 절 번호로 잘못 읽어 절을 둘로 쪼갰다.
 * 그 결과 "요18:38"에는 앞 토막만, "요18:이"에는 "이"가 떨어져 나간 뒷 토막만 남았다.
 * 개역한글 두 소스 모두 이 절이 한 절로 이어짐을 확인하고 되붙인다.
 */
const SPLIT = { key: "요18:이", target: "요18:38", lostToken: "이" };

/**
 * 절 텍스트를 정규화한다. 원본은 세 가지가 지저분하다:
 *  1. NUL 패딩 (삿 21:25, 습 3:20, 벧전 5:14 — 셋 다 각 권의 마지막 절이다)
 *  2. 앞뒤 공백 (2414절)
 *  3. 문장부호 앞 공백과 연속 공백 (소수)
 *
 * 이전 개역한글 소스에 있던 &#x27; / 백틱 처리는 뺐다 — 이 소스엔 하나도 없다.
 */
function normalize(text) {
  return (
    text
      // 제어문자를 먼저 턴다. \s는 NUL을 공백으로 치지 않아 아래 collapse도 trim도 못 지운다.
      // 화면에서는 보이지 않아 넘어가기 쉽지만 Postgres의 text 타입은 NUL을 담지 못해
      // 적재가 통째로 실패한다(실제로 겪었다). \t \n \r은 여기서 빼고 아래에서 공백으로 만든다 —
      // 지워 버리면 앞뒤 단어가 붙는다.
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([!?,.;:])/g, "$1")
      .trim()
  );
}

/** 정규화를 빠져나간 제어문자가 남아 있으면 여기서 멈춘다. 조용히 DB까지 흘러가면 늦다. */
const CONTROL_CHAR = /[\u0000-\u001F\u007F]/;

/** "창1:1" / "신6:18-19" → { key, chapter, verse, endVerse } */
function parseRef(ref) {
  const m = /^(.+?)(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) throw new Error(`해석할 수 없는 절 참조: ${ref}`);
  return {
    key: m[1],
    chapter: Number(m[2]),
    verse: Number(m[3]),
    endVerse: m[4] ? Number(m[4]) : undefined,
  };
}

const raw = JSON.parse(readFileSync(SRC, "utf8").replace(/^﻿/, "")); // BOM 제거 후 파싱

// 쪼개진 절을 먼저 되붙인다. 그래야 아래 파싱은 정상 키만 상대하면 된다.
if (raw[SPLIT.key] !== undefined) {
  if (raw[SPLIT.target] === undefined) throw new Error(`${SPLIT.target}이 없어 복원할 수 없다`);
  raw[SPLIT.target] = `${raw[SPLIT.target]} ${SPLIT.lostToken}${raw[SPLIT.key]}`;
  delete raw[SPLIT.key];
}

/** key → chapter → Verse[] */
const byBook = new Map(BOOKS.map((b) => [b.key, new Map()]));

for (const [ref, text] of Object.entries(raw)) {
  const { key, chapter, verse, endVerse } = parseRef(ref);
  const chapters = byBook.get(key);
  if (!chapters) throw new Error(`알 수 없는 권 약어: ${key} (${ref})`);
  if (!chapters.has(chapter)) chapters.set(chapter, []);
  chapters.get(chapter).push({
    verseNum: verse,
    // 개역개정이 여러 절을 한 단락으로 묶은 곳(신 6:18-19 등 11곳). 화면엔 "18-19"로 나간다.
    ...(endVerse === undefined ? {} : { endVerseNum: endVerse }),
    text: normalize(text),
  });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const meta = [];
let verseCount = 0;

for (const [index, book] of BOOKS.entries()) {
  const chapterMap = byBook.get(book.key);
  const nums = [...chapterMap.keys()].sort((a, b) => a - b);
  if (nums.length === 0) throw new Error(`본문이 없는 권: ${book.name}`);
  // 장 번호는 절과 달리 구멍이 있을 수 없다.
  if (nums[0] !== 1 || nums[nums.length - 1] !== nums.length) {
    throw new Error(`${book.name}: 장 번호가 1..N이 아니다 (${nums.length}개, 끝 ${nums[nums.length - 1]})`);
  }

  const chapters = nums.map((n) => {
    const verses = chapterMap.get(n).sort((a, b) => a.verseNum - b.verseNum);
    if (verses.length === 0) throw new Error(`${book.name} ${n}장이 비어 있다`);
    for (const v of verses) {
      if (CONTROL_CHAR.test(v.text)) {
        const codes = [...v.text].filter((c) => CONTROL_CHAR.test(c)).map((c) => c.codePointAt(0));
        throw new Error(`${book.name} ${n}:${v.verseNum}에 제어문자가 남았다: ${codes}`);
      }
      if (!v.text) throw new Error(`${book.name} ${n}:${v.verseNum}의 본문이 비었다`);
    }
    return verses;
  });
  verseCount += chapters.reduce((sum, c) => sum + c.length, 0);

  const entry = {
    abbrev: book.abbrev,
    name: book.name,
    order: index + 1,
    totalChapters: chapters.length,
  };
  meta.push(entry);
  writeFileSync(join(OUT, `${book.abbrev}.json`), JSON.stringify({ ...entry, chapters }));
}

writeFileSync(join(OUT, "books.json"), JSON.stringify(meta, null, 2));

const chapterCount = meta.reduce((s, b) => s + b.totalChapters, 0);
if (chapterCount !== 1189) throw new Error(`장 수가 1189가 아니다: ${chapterCount}`);
console.log(`완료: ${meta.length}권 / ${chapterCount}장 / ${verseCount}절`);
