// 공통 도우미: JSON 응답, 로그인 확인, 사용 용량 조회

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Supabase 로그인 토큰을 확인합니다. 로그인한 상태면 토큰을, 아니면 null을 돌려줍니다.
export async function getUserToken(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(
    /^Bearer\s+/i,
    ""
  );
  if (!token) return null;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
    },
  });
  return res.ok ? token : null;
}

// 지금까지 올린 곡의 총 용량(byte). RLS 덕분에 내 곡만 합산됩니다.
export async function usedBytes(token, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/used_bytes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) throw new Error("used_bytes 조회 실패");
  return Number(await res.json());
}
