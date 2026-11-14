import { notFound } from "next/navigation";
import { InstallGuidePreview } from "@/features/install/InstallGuidePreview";

/** 네 가지 안내 상태를 기기 없이 확인한다. 운영 환경에서는 404. */
export default function InstallGuidePreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <InstallGuidePreview />;
}
