"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";

const tabs = ["일상", "기도제목"];

export default function SharePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col bg-white">
      <TopBar />

      <div className="px-4 pt-2 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1a1a]">나눔 작성</h2>
        </div>

        {/* 탭 */}
        <div className="flex bg-[#f5f5f5] rounded-xl p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === i
                  ? "bg-white text-[#f44070] shadow-sm"
                  : "text-[#aaaaaa]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 작성 폼 */}
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-medium text-[#555555] mb-1 block">제목</label>
            <input
              type="text"
              placeholder={
                activeTab === 0
                  ? "오늘의 일상을 나눠주세요"
                  : "기도제목을 입력해주세요"
              }
              className="w-full h-11 px-4 bg-[#f9f9f9] rounded-xl text-[13px] text-[#1a1a1a] placeholder:text-[#cccccc] outline-none focus:ring-2 focus:ring-[#f44070]/20"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#555555] mb-1 block">내용</label>
            <textarea
              rows={6}
              placeholder={
                activeTab === 0
                  ? "오늘 묵상하며 느낀 것들을 공동체와 나눠보세요..."
                  : "하나님께 올려드리고 싶은 기도제목을 나눠보세요..."
              }
              className="w-full px-4 py-3 bg-[#f9f9f9] rounded-xl text-[13px] text-[#1a1a1a] placeholder:text-[#cccccc] outline-none focus:ring-2 focus:ring-[#f44070]/20 resize-none"
            />
          </div>

          {activeTab === 1 && (
            <div>
              <label className="text-[12px] font-medium text-[#555555] mb-1 block">카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {["진로", "건강", "가족", "사역", "감사", "기타"].map((cat) => (
                  <button
                    key={cat}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#888888] hover:bg-[#fff0f3] hover:text-[#f44070] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="w-full h-12 bg-[#f44070] text-white rounded-xl font-bold text-[15px] hover:bg-[#e03060] transition-colors mt-2">
            나눔 올리기
          </button>
        </div>
      </div>
    </div>
  );
}
