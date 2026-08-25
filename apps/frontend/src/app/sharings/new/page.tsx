import { ComingSoonScreen } from "@/components/ComingSoonScreen";

/**
 * 하단 네비 가운데 + 버튼의 목적지. 로드맵 Phase 3의 나눔 작성이다.
 *
 * 최종 형태는 페이지가 아니라 시트일 수 있다(BottomNav의 TODO). 그때 이 라우트를 지우든
 * 남기든, 지금 필요한 건 + 를 눌렀을 때 404가 아닌 것이다.
 */
export default function NewSharingPage() {
  return (
    <ComingSoonScreen
      icon="/mascot/default.png"
      iconAlt="만나 마스코트"
      title="나눔 작성"
      description={
        <>
          일상과 기도제목, 말씀 묵상을
          <br />
          공동체와 나눌 수 있게 됩니다
        </>
      }
      surface="cool"
    />
  );
}
