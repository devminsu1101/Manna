"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-white px-10 py-16">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-7xl">🌾</div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Manna</h1>
          <p className="text-sm text-[#555555] leading-relaxed max-w-[240px] text-center">
            서로 사랑하는 공동체로 모이기로 순종한 여러분 모두를 환영합니다
          </p>
          <p className="text-xs text-[#aaaaaa]">(창 00:00)</p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={() => router.push("/home")}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white border border-[#dddddd] text-[15px] font-medium text-[#333333] hover:bg-gray-50 transition-colors"
        >
          <span className="w-5 h-5 flex items-center justify-center font-bold text-[#4285F4]">G</span>
          Google 로그인
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-[#FEE500] text-[15px] font-medium text-[#3C1E1E] hover:bg-[#F5DC00] transition-colors"
        >
          <span className="w-5 h-5 flex items-center justify-center font-bold">K</span>
          Kakao 로그인
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-[#03C75A] text-[15px] font-medium text-white hover:bg-[#02B050] transition-colors"
        >
          <span className="w-5 h-5 flex items-center justify-center font-bold">N</span>
          Naver 로그인
        </button>
      </div>
    </div>
  );
}
