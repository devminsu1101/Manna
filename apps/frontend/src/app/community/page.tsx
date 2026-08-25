import { ComingSoonScreen } from "@/components/ComingSoonScreen";

/** 공동체 탭. 로드맵 Phase 2에서 목록 화면 → 대문 화면으로 채워진다(D-1001~1003). */
export default function CommunityPage() {
  return (
    <ComingSoonScreen
      icon="/mascot/together.png"
      iconAlt="서로 안고 있는 만나 마스코트들"
      title="공동체"
      description={
        <>
          함께 기도하고 나눌 공동체를
          <br />
          만들고 초대할 수 있게 됩니다
        </>
      }
      surface="warm"
    />
  );
}
