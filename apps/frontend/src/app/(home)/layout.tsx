import { LaunchScreen } from "@/features/home/LaunchScreen";

/** `/`의 HTML 껍데기에 시작 화면을 넣어 서버 응답이 시작되면 곧바로 그린다. */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="contents">
      <LaunchScreen />
      {children}
    </div>
  );
}
