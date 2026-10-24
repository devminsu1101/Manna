/**
 * 올리기 전에 브라우저에서 사진을 줄인다 — 휴대폰 사진(수 MB)을 그대로 올리지 않는다(D-3618).
 * 가운데를 `width:height` 비율로 잘라 그 크기의 JPEG로 만든다. 브라우저가 못 읽는 형식이면
 * createImageBitmap이 던진다.
 */
export async function shrinkImage(file: File, width: number, height: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(bitmap.width / width, bitmap.height / height);
  const sw = width * scale;
  const sh = height * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
}
