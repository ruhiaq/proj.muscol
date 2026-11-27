import { onRequestGet as ping } from "../functions/api/ping.js";
import { onRequestGet as playUrl } from "../functions/api/play-url.js";
import { onRequestPost as uploadUrl } from "../functions/api/upload-url.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const ctx = { request, env };
    if (pathname === "/api/ping" && request.method === "GET") return ping(ctx);
    if (pathname === "/api/play-url" && request.method === "GET") return playUrl(ctx);
    if (pathname === "/api/upload-url" && request.method === "POST") return uploadUrl(ctx);
    return new Response("Not found", { status: 404 });
  },
};
