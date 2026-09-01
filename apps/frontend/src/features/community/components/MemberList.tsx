import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { CommunityMember, MemberRole } from "../types";
import { CommunitySection, ROW_CLASS } from "./CommunitySection";
import { InviteButton } from "./InviteButton";

/**
 * 멤버 목록 (D-1003). 시안의 공지사항 자리에 대신 들어온 구역이다.
 *
 * 리더에게는 위에 **승인 대기** 구역이 하나 더 붙는다. 초대 코드가 곧 입장 권한인데
 * 단톡방에 뿌린 링크는 어디로든 퍼지므로, 링크를 주운 사람이 그대로 들어오면 안 된다(D-1707).
 *
 * ⚠️ 승인 대기를 **푸시 알림에 걸지 않는다.** 알림 도메인과 PWA 푸시가 Phase 3라 지금
 * 알림에 기대면 MVP에서 아무 소식도 가지 않는다. 그래서 이 목록의 배지가 유일한 통보 수단이다.
 */
export function MemberList({
  members,
  myRole,
  inviteCode,
}: {
  members: CommunityMember[];
  myRole: MemberRole;
  inviteCode: string;
}) {
  const active = members.filter((m) => m.status === "active");
  // 리더가 아니면 신청자가 있는지조차 알 필요가 없다. 승인은 리더만 한다.
  const pending = myRole === "leader" ? members.filter((m) => m.status === "pending") : [];

  return (
    <CommunitySection
      icon="/mascot/together.png"
      title={`멤버 ${active.length}명`}
      surface="cool"
      // TODO(D-1003): `...`(관리 — 이름 변경 · 코드 재발급 · 강퇴)는 전부 쓰기 API가
      // 필요해 아직 두지 않았다. 지금 놓으면 눌러도 아무 일도 없는 버튼이 된다.
      action={<InviteButton inviteCode={inviteCode} />}
    >
      {pending.length > 0 && (
        <div className="rounded-xl bg-white/70 p-3">
          <p className="px-1 text-sm font-bold text-foreground">승인 대기 {pending.length}명</p>

          <ul className="mt-2 space-y-2">
            {pending.map((member) => (
              <li key={member.userId} className={ROW_CLASS}>
                <MemberName name={member.name} />
                <span className="flex shrink-0 gap-1">
                  {/* TODO(Community API): POST .../approve · DELETE .../members/{userId}.
                      거절·강퇴·나가기는 같은 엔드포인트다 — 셋 다 그 행을 지우는 일이라서. */}
                  <Button size="sm" disabled>
                    승인
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    거절
                  </Button>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-2 px-1 text-xs text-foreground/50">
            승인·거절은 백엔드가 연결되면 열립니다
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {active.map((member) => (
          <li key={member.userId} className={ROW_CLASS}>
            <MemberName name={member.name} />
            {member.role === "leader" && (
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                리더
              </span>
            )}
          </li>
        ))}
      </ul>
    </CommunitySection>
  );
}

/** 프로필 사진은 아직 없다. `users`에 컬럼이 없어 기본 마스코트를 모두가 함께 쓴다. */
function MemberName({ name }: { name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Image
        src="/mascot/default.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-contain"
      />
      <span className="truncate text-foreground">{name}</span>
    </span>
  );
}
