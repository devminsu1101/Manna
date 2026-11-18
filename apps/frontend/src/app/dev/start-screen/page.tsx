import { notFound } from "next/navigation";

import { LaunchScreen } from "@/features/home/LaunchScreen";

/** 실제 시작 화면과 같은 UI를 로컬에서 계속 띄워 확인한다. 운영 환경에서는 404. */
export default function StartScreenPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LaunchScreen />;
}
