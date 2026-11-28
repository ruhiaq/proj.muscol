import { onRequestGet as audio } from "../functions/api/audio.js";
import { onRequestGet as config } from "../functions/api/config.js";
import { onRequestPost as del } from "../functions/api/delete.js";
import { onRequestGet as ping } from "../functions/api/ping.js";
import { onRequestGet as playUrl } from "../functions/api/play-url.js";
import { onRequestPost as upload } from "../functions/api/upload.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const ctx = { request, env };
    const m = request.method;
    if (pathname === "/api/config" && m === "GET") return config(ctx);
    if (pathname === "/api/ping" && m === "GET") return ping(ctx);
    if (pathname === "/api/play-url" && m === "GET") return playUrl(ctx);
    if (pathname === "/api/audio" && m === "GET") return audio(ctx);
    if (pathname === "/api/upload" && m === "POST") return upload(ctx);
    if (pathname === "/api/delete" && m === "POST") return del(ctx);
    return new Response("Not found", { status: 404 });
  },
};
