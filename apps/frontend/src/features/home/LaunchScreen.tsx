import Image from "next/image";

/** 첫 진입에서 인증·기도 데이터가 준비되는 동안 표시하는 화면. */
export function LaunchScreen() {
  return (
    <div data-launch-screen className="fixed inset-0 flex flex-col items-center justify-center bg-muted px-8 text-center" role="status" aria-live="polite">
      <Image src="/mascot/hi.png" alt="" width={160} height={160} priority className="size-40 object-contain" />
      <p className="mt-6 text-2xl font-bold text-foreground">만나</p>
      <p className="mt-2 text-sm text-foreground/60">앱을 여는 중이에요</p>
    </div>
  );
}
