"""Offline browser UI. Start with python -m poker_odds.server."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.resources import files
import json
from threading import Lock

from .core import calculate

_compute_lock = Lock()


class Handler(BaseHTTPRequestHandler):
    def _respond(self, status, payload, mime="application/json; charset=utf-8"):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            self._respond(200, files("poker_odds").joinpath("web.html").read_bytes(),
                          "text/html; charset=utf-8")
        else:
            self._respond(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/api/equity":
            self._respond(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 8192:
                raise ValueError("Request must contain 1..8192 bytes.")
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict) or set(data) - {"hand1", "hand2", "board", "dead"}:
                raise ValueError("Expected hand1, hand2, board, and dead fields.")
            if any(not isinstance(v, str) for v in data.values()):
                raise ValueError("All card fields must be text.")
            if not {"hand1", "hand2"} <= set(data):
                raise ValueError("Both hands are required.")
        except (ValueError, UnicodeError) as exc:
            self._respond(400, {"error": str(exc)})
            return
        if not _compute_lock.acquire(blocking=False):
            self._respond(409, {"error": "A calculation is already running. Please try again when it finishes."})
            return
        try:
            self._respond(200, calculate(**data).as_dict())
        except ValueError as exc:
            self._respond(400, {"error": str(exc)})
        finally:
            _compute_lock.release()


def main():
    parser = argparse.ArgumentParser(description="Start the local, offline poker odds browser UI.")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"Open http://127.0.0.1:{server.server_port} — Ctrl+C to stop", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
