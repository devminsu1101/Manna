"use client";

import { useRouter } from "next/navigation";

export default function PrayDetailPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* 헤더 */}
      <header className="h-[64px] flex items-end px-4 pb-3">
        <button onClick={() => router.back()} className="text-xl mr-3">
          ←
        </button>
        <span className="text-base font-bold text-[#1a1a1a]">기도제목</span>
      </header>

      <div className="px-4 pb-6 space-y-4">
        {/* 작성자 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-base">
            👤
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#1a1a1a]">현솔님</p>
            <p className="text-[11px] text-[#aaaaaa]">260506 · 진로</p>
          </div>
        </div>

        {/* 기도제목 내용 */}
        <div className="space-y-2">
          <h2 className="text-[15px] font-bold text-[#1a1a1a]">
            취업 준비 중에 주님의 인도하심을 구합니다
          </h2>
          <p className="text-[13px] text-[#555555] leading-relaxed">
            이번 달 면접이 여러 개 있는데, 제 힘으로는 어렵지만 하나님께서 함께해주실 것을 믿습니다.
            어디를 가게 되든 그 곳에서 주님의 영광을 드러낼 수 있는 일꾼이 되길 원합니다.
            함께 기도해주세요. 🙏
          </p>
        </div>

        {/* 기도 현황 */}
        <div className="bg-[#fff0f3] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#f44070] font-medium">함께 기도하는 중</p>
            <p className="text-[22px] font-bold text-[#1a1a1a]">12명</p>
          </div>
          <span className="text-3xl">🙏</span>
        </div>

        {/* 기도하기 버튼 */}
        <button className="w-full h-12 bg-[#f44070] text-white rounded-xl font-bold text-[15px] hover:bg-[#e03060] transition-colors">
          나도 기도할게요
        </button>

        {/* 집중 기도 모드 */}
        <button className="w-full h-12 bg-[#1a1a1a] text-white rounded-xl font-medium text-[13px] hover:bg-[#333333] transition-colors">
          🌙 집중 기도 모드
        </button>
      </div>
    </div>
  );
}
