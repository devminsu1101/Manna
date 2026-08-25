import { ComingSoonScreen } from "@/components/ComingSoonScreen";

/** 기도 탭. 로드맵 Phase 2에서 중보기도실 + "기도했어요"로 채워진다(D-901~905). */
export default function PrayerPage() {
  return (
    <ComingSoonScreen
      icon="/mascot/warm.png"
      iconAlt="기도하는 만나 마스코트"
      title="기도하기"
      description={
        <>
          서로의 기도제목을 나누고
          <br />
          함께 기도할 수 있게 됩니다
        </>
      }
      surface="love"
    />
  );
}
