import TopBar from "@/components/TopBar";

const books = [
  { name: "창세기", abbr: "창", chapters: 50 },
  { name: "출애굽기", abbr: "출", chapters: 40 },
  { name: "레위기", abbr: "레", chapters: 27 },
  { name: "민수기", abbr: "민", chapters: 36 },
  { name: "신명기", abbr: "신", chapters: 34 },
  { name: "여호수아", abbr: "수", chapters: 24 },
  { name: "사사기", abbr: "삿", chapters: 21 },
  { name: "룻기", abbr: "룻", chapters: 4 },
];

export default function BiblePage() {
  return (
    <div className="flex flex-col bg-white">
      <TopBar />

      <div className="px-4 pt-2 pb-4">
        <h2 className="text-base font-bold text-[#1a1a1a] mb-3">성경 읽기</h2>

        {/* 오늘의 묵상 */}
        <div className="bg-[#fff0f3] rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f44070] flex items-center justify-center text-white text-lg">
            📖
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#1a1a1a]">오늘의 묵상</p>
            <p className="text-[11px] text-[#f44070] font-medium">삼하 5:1-10 · 260508</p>
          </div>
        </div>

        {/* 성경 목록 */}
        <div className="grid grid-cols-4 gap-2">
          {books.map((book) => (
            <button
              key={book.abbr}
              className="flex flex-col items-center justify-center bg-[#f9f9f9] rounded-xl py-3 gap-1 hover:bg-[#fff0f3] transition-colors"
            >
              <span className="text-xs font-bold text-[#1a1a1a]">{book.abbr}</span>
              <span className="text-[10px] text-[#aaaaaa]">{book.chapters}장</span>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-[#cccccc]">전체 66권 · 구약 39권 · 신약 27권</p>
        </div>
      </div>
    </div>
  );
}
