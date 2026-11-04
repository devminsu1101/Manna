import { generateKeyPairSync } from "node:crypto";
import { readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const current = readFileSync(envPath, "utf8");
if (/^PUSH_VAPID_(PUBLIC|PRIVATE)_KEY=/m.test(current)) {
  throw new Error(".env에 VAPID 키가 이미 있습니다. 기존 구독을 유지하려면 키를 바꾸지 마세요.");
}

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = privateKey.export({ format: "jwk" });
const publicKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, "base64url"),
  Buffer.from(jwk.y, "base64url"),
]).toString("base64url");
appendFileSync(envPath,
  `\nPUSH_VAPID_PUBLIC_KEY=${publicKey}\nPUSH_VAPID_PRIVATE_KEY=${jwk.d}\n`);
process.stdout.write("VAPID 키를 apps/backend/.env에 저장했습니다. 개인 키는 커밋하지 마세요.\n");
