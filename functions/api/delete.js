// POST /api/delete   본문: { id: 곡 id }
// 내 곡인지 확인한 뒤 B2의 파일을 지우고, DB의 곡 기록도 지웁니다.
// (플레이리스트에 담긴 기록은 DB 설정에 따라 함께 사라집니다)
import { json, getUserToken } from "../_lib/auth.js";
import { presign } from "../_lib/b2.js";

export async function onRequestPost({ request, env }) {
  const token = await getUserToken(request, env);
  if (!token) return json({ error: "unauthorized" }, 401);

  let id;
  try {
    ({ id } = await request.json());
  } catch {
    return json({ error: "bad request" }, 400);
  }
  if (!/^[0-9a-f-]{36}$/.test(String(id))) return json({ error: "bad id" }, 400);

  const h = { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` };

  // 내 곡만 조회됩니다 (RLS)
  const q = await fetch(`${env.SUPABASE_URL}/rest/v1/tracks?id=eq.${id}&select=file_key`, { headers: h });
  const rows = q.ok ? await q.json() : [];
  if (!rows.length) return json({ error: "not found" }, 404);

  const url = await presign(env, "DELETE", rows[0].file_key, 300);
  const del = await fetch(url, { method: "DELETE" });
  if (!del.ok && del.status !== 404) {
    const detail = (await del.text()).replace(/\s+/g, " ").slice(0, 200);
    return json({ error: "B2 삭제 실패", detail }, 502);
  }

  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/tracks?id=eq.${id}`, { method: "DELETE", headers: h });
  if (!r.ok) return json({ error: "DB 삭제 실패" }, 502);
  return json({ ok: true });
}
