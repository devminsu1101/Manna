/**
 * 텍스트를 클립보드에 넣는다.
 *
 * navigator.clipboard는 **보안 컨텍스트(HTTPS·localhost)에서만** 존재한다.
 * 폰으로 http://192.168.x.x:3000에 붙어 확인할 때는 undefined라 그냥 죽는다.
 * 그래서 구식 execCommand 경로를 폴백으로 남겨 둔다.
 *
 * 반드시 **사용자 제스처 핸들러 안에서 동기적으로** 불러야 한다. 앞에서 await를 걸면
 * iOS Safari가 제스처와의 연결을 끊고 두 경로 모두 거부한다.
 *
 * @returns 성공 여부. 실패를 조용히 넘기지 않기 위해 던지지 않고 돌려준다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 권한 거부·비보안 컨텍스트. 아래 폴백에 한 번 더 기회를 준다.
  }
  return copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // display:none이나 visibility:hidden은 안 된다 — 선택 자체가 불가능해진다.
  // 화면 밖으로 보내되 렌더는 되게 둔다. top:0인 이유는 iOS가 포커스 시 스크롤을 튀기기 때문.
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);

  // 사용자가 잡아 둔 선택 영역을 뺏었다가 돌려준다.
  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  // iOS는 select()만으로는 범위가 잡히지 않는다. 길이를 명시해야 실제로 선택된다.
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  if (selection && previous) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return copied;
}
