# Cloud neural TTS (Microsoft edge-tts, no API key) — served same-origin at /api/tts
# Default voice: zh-CN-YunjianNeural (云健 · 铿锵有力的男声)
# Other good male voices: zh-CN-YunyangNeural (云扬·播报), zh-CN-YunxiNeural (云希), zh-CN-YunzeNeural (云泽)
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import asyncio
import json
import edge_tts

DEFAULT_VOICE = "zh-CN-YunjianNeural"
ALLOWED = {
    "zh-CN-YunjianNeural", "zh-CN-YunyangNeural", "zh-CN-YunxiNeural",
    "zh-CN-YunzeNeural", "zh-CN-YunjieNeural", "zh-CN-XiaoxiaoNeural",
    "zh-CN-XiaoyiNeural", "zh-HK-WanLungNeural", "zh-TW-YunJheNeural",
}


async def _synth(text, voice, rate, pitch):
    kwargs = {}
    if rate:
        kwargs["rate"] = rate
    if pitch:
        kwargs["pitch"] = pitch
    comm = edge_tts.Communicate(text, voice, **kwargs)
    buf = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            buf.extend(chunk["data"])
    return bytes(buf)


class handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        text = (q.get("text", [""])[0] or "")[:800].strip()
        voice = q.get("voice", [DEFAULT_VOICE])[0] or DEFAULT_VOICE
        if voice not in ALLOWED:
            voice = DEFAULT_VOICE
        rate = q.get("rate", [""])[0]
        pitch = q.get("pitch", [""])[0]
        probe = q.get("probe", [""])[0]
        # Light anti-hotlink guard: block foreign embeds; allow same-site and direct hits.
        ref = self.headers.get("Referer") or self.headers.get("Origin") or ""
        if ref:
            host = (urlparse(ref).hostname or "").lower()
            allowed = (
                host == "holiness.uk"
                or host.endswith(".holiness.uk")
                or host.endswith(".vercel.app")
                or host in ("localhost", "127.0.0.1")
            )
            if not allowed:
                self._json(403, {"ok": False, "error": "forbidden origin"})
                return
        if not text:
            self._json(200, {"ok": True, "service": "edge-tts", "voice": DEFAULT_VOICE})
            return
        try:
            audio = asyncio.run(_synth(text, voice, rate, pitch))
        except Exception as e:  # noqa: BLE001
            self._json(502, {"ok": False, "error": str(e)})
            return
        if not audio:
            self._json(502, {"ok": False, "error": "empty audio"})
            return
        if probe:
            self._json(200, {"ok": True, "bytes": len(audio), "voice": voice})
            return
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Cache-Control", "public, max-age=604800, immutable")
        self._cors()
        self.end_headers()
        self.wfile.write(audio)
