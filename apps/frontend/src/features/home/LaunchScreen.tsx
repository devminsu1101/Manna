import Image from "next/image";

/** 첫 진입에서 인증·기도 데이터가 준비되는 동안 표시하는 화면. */
export function LaunchScreen() {
  return (
    <div data-launch-screen className="fixed inset-0 bg-muted" role="status" aria-label="만나를 여는 중">
      <Image src="/mascot/hi.png" alt="" width={160} height={160} priority className="absolute left-1/2 top-[45%] size-28 -translate-x-1/2 -translate-y-1/2 object-contain" />
    </div>
  );
}
