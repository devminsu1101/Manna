import { List, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { composeHref } from "@/features/compose/href";
import { SharingRow } from "@/features/sharing/components/SharingRow";
import type { Sharing } from "@/features/sharing/types";
import { CommunitySection, EmptyRow } from "./CommunitySection";

/** 대문에 펼쳐 두는 줄 수 — 시안이 셋을 보여 준다. 나머지는 제목 옆 목록 버튼으로 본다. */
const PREVIEW_COUNT = 3;

/**
 * 나눔 자료실 (D-1003).
 *
 * 시안의 네 구역 중 이것이 살아남은 이유는 **`sharings`·`sharing_communities`로 이미
 * 받쳐지기 때문**이다. 공지사항·갤러리는 ERD에 테이블이 없어 빠졌다(갤러리는 오브젝트
 * 스토리지라는 인프라 층까지 새로 부른다).
 */
export function SharingShelf({
  communityId,
  sharings,
}: {
  communityId: number;
  sharings: Sharing[];
}) {
  const preview = sharings.slice(0, PREVIEW_COUNT);

  return (
    <CommunitySection
      icon="/mascot/hi.png"
      title="나눔 자료실"
      surface="warm"
      action={
        <span className="flex shrink-0 items-center">
          {/* 이 방을 미리 골라 둔 채로 연다. */}
          <Button asChild variant="ghost" size="icon" aria-label="나눔 쓰기">
            <Link href={composeHref({ kind: "sharing", communityId })}>
              <Plus className="size-5" />
            </Link>
          </Button>
          {/* 이 방의 나눔 전부. 대문에는 앞 몇 개만 둔다. */}
          <Button asChild variant="ghost" size="icon" aria-label="나눔 목록">
            <Link href={`/communities/${communityId}/sharings`}>
              <List className="size-5" />
            </Link>
          </Button>
        </span>
      }
    >
      {preview.length === 0 ? (
        <EmptyRow>아직 올라온 나눔이 없어요</EmptyRow>
      ) : (
        preview.map((sharing) => <SharingRow key={sharing.id} sharing={sharing} />)
      )}
    </CommunitySection>
  );
}
