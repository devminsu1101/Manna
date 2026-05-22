import TopBar from "@/components/TopBar";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">
      <TopBar />

      <div className="flex flex-col gap-3 px-3 pb-4">
        {/* 사랑으로 나누세요 */}
        <section className="bg-white rounded-2xl border border-[#eeeeee] overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#fff9e0] flex items-center justify-center text-lg">
              🌾
            </div>
            <span className="text-sm font-bold text-[#1a1a1a]">사랑으로 나누세요</span>
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5] flex items-center gap-3">
            <div className="w-1 h-full min-h-[36px] rounded-full bg-[#f44070]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">날 위해 5명이 기도했어요</p>
              <p className="text-[11px] text-[#aaaaaa] mt-0.5">나의 기도가 필요한 곳이 있어요</p>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5] flex items-center gap-3">
            <div className="w-1 h-full min-h-[36px] rounded-full bg-[#f5c800]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">이번주 기도짝은 현솔님이에요</p>
              <p className="text-[11px] text-[#aaaaaa] mt-0.5">기도제목 보기</p>
            </div>
          </div>
        </section>

        {/* 지금 공동체에서는 */}
        <section className="bg-white rounded-2xl border border-[#eeeeee] overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#fff0f3] flex items-center justify-center text-lg">
              👥
            </div>
            <span className="text-sm font-bold text-[#1a1a1a]">지금 공동체에서는</span>
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5] flex items-center gap-3">
            <div className="w-1 h-full min-h-[36px] rounded-full bg-[#f44070]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">승현님이 나눔을 남겼어요</p>
              <p className="text-[11px] text-[#aaaaaa] mt-0.5">[매일묵상] 260508 삼하 5:1-10</p>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5] flex items-center gap-3">
            <div className="w-1 h-full min-h-[36px] rounded-full bg-[#f44070]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">민수님이 나눔을 남겼어요</p>
              <p className="text-[11px] text-[#aaaaaa] mt-0.5">[매일묵상] 260507 삼하 4:1-12</p>
            </div>
          </div>
        </section>

        {/* 오늘의 말씀 */}
        <section className="bg-white rounded-2xl border border-[#eeeeee] overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center text-lg">
                📿
              </div>
              <span className="text-sm font-bold text-[#1a1a1a]">오늘의 말씀</span>
            </div>
            <span className="text-[11px] text-[#aaaaaa]">@dailymayim</span>
          </div>

          <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-[#f5f5f5] h-28 flex items-center justify-center">
            <span className="text-4xl">🌊</span>
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5]">
            <p className="text-[13px] font-semibold text-[#1a1a1a]">오늘의 말씀을 확인하세요</p>
            <p className="text-[11px] text-[#aaaaaa] mt-0.5">매일 새벽 업데이트됩니다</p>
          </div>
        </section>
      </div>
    </div>
  );
}
