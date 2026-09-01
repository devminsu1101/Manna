import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SharingSummary } from "../types";
import { CommunitySection, EmptyRow, ROW_CLASS } from "./CommunitySection";

/** 대문에 펼쳐 두는 줄 수. 넘으면 "더보기"로 접는다 — 시안이 셋을 보여 준다. */
const PREVIEW_COUNT = 3;

/**
 * 나눔 자료실 (D-1003).
 *
 * 시안의 네 구역 중 이것이 살아남은 이유는 **`sharings`·`sharing_communities`로 이미
 * 받쳐지기 때문**이다. 공지사항·갤러리는 ERD에 테이블이 없어 빠졌다(갤러리는 오브젝트
 * 스토리지라는 인프라 층까지 새로 부른다).
 */
export function SharingShelf({ sharings }: { sharings: SharingSummary[] }) {
  const preview = sharings.slice(0, PREVIEW_COUNT);

  return (
    <CommunitySection
      icon="/mascot/hi.png"
      title="나눔 자료실"
      surface="warm"
      action={
        // TODO(나눔 도메인, Phase 3): 이 공동체로 지정된 작성 화면 열기.
        // 지금은 하단 네비 가운데 버튼과 같은 곳으로 보낸다.
        <Button asChild variant="ghost" size="icon" aria-label="나눔 쓰기">
          <Link href="/sharings/new">
            <Plus className="size-5" />
          </Link>
        </Button>
      }
    >
      {preview.length === 0 ? (
        <EmptyRow>아직 올라온 나눔이 없어요</EmptyRow>
      ) : (
        <>
          {preview.map((sharing) => (
            // TODO(나눔 도메인, Phase 3): 나눔 상세로. 라우트가 생기기 전이라 아직 링크가 아니다.
            <div key={sharing.id} className={ROW_CLASS}>
              <span className="min-w-0 truncate text-foreground">{sharing.title}</span>
              <ChevronRight className="size-5 shrink-0 text-foreground/40" />
            </div>
          ))}

          {/* 시안의 "더보기"는 아직 두지 않는다. 갈 곳(`/communities/{id}/sharings`)이
              나눔 도메인(Phase 3)과 함께 생기고, 지금 링크만 먼저 놓으면 404가 된다.
              펼침 개수를 여기서 자르고 있으므로 그때 이 자리에 한 줄만 붙이면 된다. */}
        </>
      )}
    </CommunitySection>
  );
}
