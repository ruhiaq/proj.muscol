// B2(S3 호환) 임시 주소(presigned URL) 생성기
// 외부 라이브러리 없이 브라우저 표준 WebCrypto만 사용합니다.
const enc = new TextEncoder();

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

async function hmac(key, text) {
  const k = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", k, enc.encode(text));
}

// RFC 3986 방식 인코딩
const rfc3986 = (s) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );

// method: "GET" | "PUT", key: 버킷 안의 파일 경로, expiresSec: 유효 시간(초)
export async function presign(env, method, key, expiresSec) {
  const host = env.B2_ENDPOINT; // 예: s3.us-west-004.backblazeb2.com
  const region = host.split(".")[1]; // 예: us-west-004
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;

  const path = "/" + [env.B2_BUCKET, ...key.split("/")].map(rfc3986).join("/");

  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${env.B2_KEY_ID}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSec),
    "X-Amz-SignedHeaders": "host",
  };
  const query = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join("&");

  const canonical = [
    method,
    path,
    query,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const toSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonical),
  ].join("\n");

  let k = await hmac(enc.encode("AWS4" + env.B2_APP_KEY), date);
  k = await hmac(k, region);
  k = await hmac(k, "s3");
  k = await hmac(k, "aws4_request");
  const signature = toHex(await hmac(k, toSign));

  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}
