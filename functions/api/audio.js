// GET /api/audio?key=tracks/xxxx.mp3
// B2의 파일을 서버가 받아 그대로 전달합니다. (오프라인 저장용: 브라우저가 B2에 직접 요청하지 않아 CORS 설정이 필요 없음)
import { json, getUserToken } from "../_lib/auth.js";
import { presign } from "../_lib/b2.js";

export async function onRequestGet({ request, env }) {
  const token = await getUserToken(request, env);
  if (!token) return json({ error: "unauthorized" }, 401);

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!/^tracks\/[0-9a-f-]{36}\.(mp3|wav)$/.test(key)) return json({ error: "bad key" }, 400);

  const res = await fetch(await presign(env, "GET", key, 600));
  if (!res.ok) return json({ error: "B2 다운로드 실패", status: res.status }, 502);

  const h = new Headers({
    "Content-Type": key.endsWith(".wav") ? "audio/wav" : "audio/mpeg",
    "Cache-Control": "no-store",
  });
  const len = res.headers.get("Content-Length");
  if (len) h.set("Content-Length", len);
  return new Response(res.body, { headers: h });
}
