// GET /api/ping
// 환경변수가 설정되어 있는지만 true/false로 알려줍니다. (값 자체는 절대 노출하지 않음)
import { json } from "../_lib/auth.js";

const NAMES = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "B2_KEY_ID",
  "B2_APP_KEY",
  "B2_BUCKET",
  "B2_ENDPOINT",
];

export function onRequestGet({ env }) {
  return json(Object.fromEntries(NAMES.map((n) => [n, Boolean(env[n])])));
}
