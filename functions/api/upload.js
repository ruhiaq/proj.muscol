// POST /api/upload?ext=mp3|wav   (본문: 파일 그대로)
// 브라우저 → 이 서버 → B2 순서로 전달합니다. 브라우저가 B2에 직접 요청하지 않아서 CORS 설정이 필요 없습니다.
import { json, getUserToken, usedBytes } from "../_lib/auth.js";
import { presign } from "../_lib/b2.js";

const LIMIT = 9.5 * 1024 ** 3; // B2 무료 10GB보다 조금 아래에서 막음
const MAX_FILE = 95 * 1024 ** 2; // 서버 요청 크기 제한(약 100MB)보다 조금 작게
const TYPES = { mp3: "audio/mpeg", wav: "audio/wav" };

export async function onRequestPost({ request, env }) {
  const token = await getUserToken(request, env);
  if (!token) return json({ error: "unauthorized" }, 401);

  const ext = (new URL(request.url).searchParams.get("ext") || "").toLowerCase();
  const size = Number(request.headers.get("Content-Length"));
  if (!TYPES[ext] || !(size > 0)) {
    return json({ error: "mp3 또는 wav 파일만 올릴 수 있어요" }, 400);
  }
  if (size > MAX_FILE) return json({ error: "파일이 너무 커요 (약 95MB 이하만 가능)" }, 413);

  const used = await usedBytes(token, env);
  if (used + size > LIMIT) return json({ error: "quota", used, limit: LIMIT }, 413);

  const key = `tracks/${crypto.randomUUID()}.${ext}`;
  const url = await presign(env, "PUT", key, 15 * 60);

  // 받은 파일을 그대로 B2로 흘려보냅니다 (크기를 알려줘야 하므로 FixedLengthStream 사용)
  const { readable, writable } = new FixedLengthStream(size);
  request.body.pipeTo(writable);
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": TYPES[ext] },
    body: readable,
  });
  if (!res.ok) {
    const detail = (await res.text()).replace(/\s+/g, " ").slice(0, 200);
    return json({ error: "B2 업로드 실패", detail }, 502);
  }
  return json({ key, contentType: TYPES[ext] });
}
