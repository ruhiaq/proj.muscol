// GET /api/config
// 화면(브라우저)이 로그인할 때 필요한 값을 알려줍니다.
// Project URL과 publishable 키는 원래 공개해도 되는 값이라 안전합니다. (secret 키는 절대 넣지 마세요)
import { json } from "../_lib/auth.js";

export function onRequestGet({ env }) {
  return json({ url: env.SUPABASE_URL, key: env.SUPABASE_PUBLISHABLE_KEY });
}
