// GET /api/play-url?key=tracks/xxxx.mp3
// 응답: { url, expiresIn }  → <audio src>나 오프라인 저장용 fetch에 사용
import { json, getUserToken } from "../_lib/auth.js";
import { presign } from "../_lib/b2.js";

export async function onRequestGet({ request, env }) {
  const token = await getUserToken(request, env);
  if (!token) return json({ error: "unauthorized" }, 401);

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!/^tracks\/[0-9a-f-]{36}\.(mp3|wav)$/.test(key)) {
    return json({ error: "bad key" }, 400);
  }

  const expiresIn = 6 * 60 * 60; // 6시간
  const url = await presign(env, "GET", key, expiresIn);
  return json({ url, expiresIn });
}
