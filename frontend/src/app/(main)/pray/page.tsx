import TopBar from "@/components/TopBar";
import Link from "next/link";

const prayers = [
  {
    id: 1,
    author: "현솔",
    title: "취업 준비 중에 주님의 인도하심을 구합니다",
    category: "진로",
    prayCount: 12,
    daysLeft: 3,
    isMyPrayPair: true,
  },
  {
    id: 2,
    author: "승현",
    title: "아버지의 건강 회복을 위해 기도해주세요",
    category: "건강",
    prayCount: 8,
    daysLeft: 5,
    isMyPrayPair: false,
  },
  {
    id: 3,
    author: "민수",
    title: "가족들이 모두 믿음 안에 서게 되길",
    category: "가족",
    prayCount: 15,
    daysLeft: 1,
    isMyPrayPair: false,
  },
  {
    id: 4,
    author: "지영",
    title: "새로운 사역지에서 열매 맺기를",
    category: "사역",
    prayCount: 6,
    daysLeft: 7,
    isMyPrayPair: false,
  },
];

export default function PrayPage() {
  return (
    <div className="flex flex-col bg-white">
      <TopBar />

      <div className="px-4 pt-2 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1a1a]">기도 나눔</h2>
          <button className="text-[12px] text-[#f44070] font-medium">+ 기도제목 쓰기</button>
        </div>

        {/* 이번주 기도짝 */}
        <div className="bg-[#fff9e0] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5c800] flex items-center justify-center text-lg">
            🙏
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-[#888888]">이번주 기도짝</p>
            <p className="text-[13px] font-bold text-[#1a1a1a]">현솔님이에요</p>
          </div>
          <button className="text-[11px] text-[#f5a800] font-medium">기도제목 보기 →</button>
        </div>

        {/* 기도제목 목록 */}
        {prayers.map((prayer) => (
          <Link key={prayer.id} href={`/pray/${prayer.id}`}>
            <article className="bg-white rounded-2xl border border-[#eeeeee] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center text-xs">
                    👤
                  </div>
                  <span className="text-[12px] font-bold text-[#1a1a1a]">{prayer.author}님</span>
                  {prayer.isMyPrayPair && (
                    <span className="px-1.5 py-0.5 bg-[#fff9e0] rounded-full text-[9px] text-[#f5a800] font-medium">
                      기도짝
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 bg-[#fff0f3] rounded-full text-[10px] text-[#f44070] font-medium">
                  {prayer.category}
                </span>
              </div>

              <p className="text-[13px] text-[#333333] leading-relaxed">{prayer.title}</p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[11px] text-[#aaaaaa]">
                  🙏 <span>{prayer.prayCount}명이 기도했어요</span>
                </div>
                <span className="text-[11px] text-[#aaaaaa]">D-{prayer.daysLeft}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
