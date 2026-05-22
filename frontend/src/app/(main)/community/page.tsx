import TopBar from "@/components/TopBar";

const posts = [
  {
    id: 1,
    author: "승현",
    category: "매일묵상",
    title: "삼하 5:1-10",
    date: "260508",
    content: "다윗이 온 이스라엘의 왕이 되었습니다. 하나님께서 함께하심으로 나라가 세워지는 것을 보며...",
    prayCount: 3,
    commentCount: 2,
  },
  {
    id: 2,
    author: "민수",
    category: "매일묵상",
    title: "삼하 4:1-12",
    date: "260507",
    content: "이스보셋의 죽음 이후, 다윗은 의로운 판단을 내립니다. 우리의 삶에서도 정의를 세워가는...",
    prayCount: 5,
    commentCount: 1,
  },
  {
    id: 3,
    author: "현솔",
    category: "기도제목",
    title: "취업 준비 중입니다",
    date: "260506",
    content: "이번 달 면접이 여러 개 있는데, 하나님의 인도하심을 구합니다. 함께 기도해주세요.",
    prayCount: 12,
    commentCount: 4,
  },
];

export default function CommunityPage() {
  return (
    <div className="flex flex-col bg-white">
      <TopBar />

      <div className="px-4 pt-2 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1a1a]">공동체 나눔</h2>
          <button className="text-[12px] text-[#f44070] font-medium">+ 나눔 쓰기</button>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2">
          {["전체", "매일묵상", "기도제목", "일상"].map((cat, i) => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === 0
                  ? "bg-[#f44070] text-white"
                  : "bg-[#f5f5f5] text-[#888888]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-2xl border border-[#eeeeee] p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center text-sm">
                  👤
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#1a1a1a]">{post.author}님</p>
                  <p className="text-[10px] text-[#aaaaaa]">{post.date}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  post.category === "기도제목"
                    ? "bg-[#fff9e0] text-[#f5a800]"
                    : "bg-[#fff0f3] text-[#f44070]"
                }`}
              >
                {post.category}
              </span>
            </div>

            <div>
              <p className="text-[13px] font-bold text-[#1a1a1a]">[{post.category}] {post.date} {post.title}</p>
              <p className="text-[12px] text-[#666666] mt-1 leading-relaxed line-clamp-2">
                {post.content}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button className="flex items-center gap-1 text-[11px] text-[#aaaaaa]">
                🙏 <span>{post.prayCount}</span>
              </button>
              <button className="flex items-center gap-1 text-[11px] text-[#aaaaaa]">
                💬 <span>{post.commentCount}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
