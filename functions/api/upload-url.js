// POST /api/upload-url
// 요청: { ext: "mp3" | "wav", size: 파일 크기(byte) }
// 응답: { key, url, contentType }  → 브라우저가 url로 PUT 업로드 (Content-Type 헤더 필수)
import { json, getUserToken, usedBytes } from "../_lib/auth.js";
import { presign } from "../_lib/b2.js";

// B2 무료 10GB보다 조금 아래에서 막습니다.
const LIMIT = 9.5 * 1024 ** 3;
const TYPES = { mp3: "audio/mpeg", wav: "audio/wav" };

export async function onRequestPost({ request, env }) {
  const token = await getUserToken(request, env);
  if (!token) return json({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  const ext = String(body.ext || "").toLowerCase();
  const size = Number(body.size);
  if (!TYPES[ext] || !(size > 0)) {
    return json({ error: "mp3 또는 wav 파일만 올릴 수 있어요" }, 400);
  }

  const used = await usedBytes(token, env);
  if (used + size > LIMIT) {
    return json({ error: "quota", used, limit: LIMIT }, 413);
  }

  const key = `tracks/${crypto.randomUUID()}.${ext}`;
  const url = await presign(env, "PUT", key, 15 * 60); // 15분 동안 유효
  return json({ key, url, contentType: TYPES[ext] });
}
