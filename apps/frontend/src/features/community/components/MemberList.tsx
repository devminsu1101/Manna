import Image from "next/image";

import type { CommunityMember, MemberRole } from "../types";
import { CommunitySection, ROW_CLASS } from "./CommunitySection";
import { InviteButton } from "./InviteButton";
import { MemberActions } from "./MemberActions";
import { PendingActions } from "./PendingActions";
import { StartPartnersButton } from "./StartPartnersButton";

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
  communityId,
  members,
  myRole,
  inviteCode,
  partnersStarted,
}: {
  communityId: number;
  members: CommunityMember[];
  myRole: MemberRole;
  /** 리더에게만 온다. 없으면 초대 버튼도 없다 — 초대는 리더의 일이다. */
  inviteCode?: string;
  partnersStarted: boolean;
}) {
  const active = members.filter((m) => m.status === "active");
  // 리더가 아니면 신청자가 있는지조차 알 필요가 없다. 승인은 리더만 한다.
  const pending = myRole === "leader" ? members.filter((m) => m.status === "pending") : [];

  return (
    <CommunitySection
      icon="/mascot/together.png"
      title={`멤버 ${active.length}명`}
      surface="cool"
      // TODO(D-1003): 이름 변경 · 코드 재발급은 아직 API가 없다. 강퇴는 줄마다 붙는다.
      action={inviteCode && <InviteButton inviteCode={inviteCode} />}
    >
      {pending.length > 0 && (
        <div className="rounded-xl bg-white/70 p-3">
          <p className="px-1 text-sm font-bold text-foreground">승인 대기 {pending.length}명</p>

          <ul className="mt-2 space-y-2">
            {pending.map((member) => (
              <li key={member.userId} className={ROW_CLASS}>
                <MemberName name={member.name} photoUrl={member.profileImageUrl} />
                <PendingActions communityId={communityId} userId={member.userId} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-2">
        {active.map((member) => (
          <li key={member.userId} className={ROW_CLASS}>
            <MemberName name={member.name} photoUrl={member.profileImageUrl} />
            {member.role === "leader" ? (
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                리더
              </span>
            ) : (
              myRole === "leader" && (
                <MemberActions communityId={communityId} userId={member.userId} name={member.name} />
              )
            )}
          </li>
        ))}
      </ul>

      {/* 리더가 멤버를 다 받은 뒤 한꺼번에 시작한다(D-3602). 혼자인 방은 짝을 지을 수 없다. */}
      {myRole === "leader" && !partnersStarted && active.length >= 2 && (
        <StartPartnersButton communityId={communityId} />
      )}
    </CommunitySection>
  );
}

/** 프로필 사진이 없으면(provider가 안 줬거나 아직 안 올렸으면) 기본 마스코트다. */
function MemberName({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Image
        src={photoUrl ?? "/mascot/default.png"}
        alt=""
        width={32}
        height={32}
        className={`size-8 shrink-0 rounded-full ${photoUrl ? "object-cover" : "object-contain"}`}
      />
      <span className="truncate text-foreground">{name}</span>
    </span>
  );
}
