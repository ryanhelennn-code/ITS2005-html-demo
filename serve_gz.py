#!/usr/bin/env python3
"""Tiny gzip-aware static server for the EchoCheck hand-out folder.

python3 -m http.server does not compress, and the demo is 130 KB of
HTML/CSS/JS. Over a relay tunnel that costs ~25 s for one visitor, so we
pre-gzip the four served files and answer Accept-Encoding: gzip with the
.gz sibling plus the right Content-Type. Browsers decompress transparently;
nothing in the app changes.

  python3 serve_gz.py <dir> <port>      # binds 127.0.0.1 only
"""
import gzip
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

TYPES = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".js": "text/javascript; charset=utf-8", ".txt": "text/plain; charset=utf-8"}


class Handler(SimpleHTTPRequestHandler):
    extensions_map = TYPES

    def send_head(self):
        path = self.translate_path(self.path)
        wants_gz = "gzip" in (self.headers.get("Accept-Encoding") or "")
        base, ext = os.path.splitext(path)
        gz = path + ".gz"
        if wants_gz and ext in TYPES and os.path.isfile(gz):
            f = open(gz, "rb")
            self.send_response(200)
            self.send_header("Content-Type", TYPES[ext])
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Robots-Tag", "noindex, nofollow, noarchive")
            self.end_headers()
            return f
        return SimpleHTTPRequestHandler.send_head(self)

    def log_message(self, fmt, *a):
        sys.stderr.write("GET %s\n" % (a[0] if a else ""))


d = sys.argv[1] if len(sys.argv) > 1 else "."
port = int(sys.argv[2]) if len(sys.argv) > 2 else 8766
os.chdir(d)
print("serving %s on 127.0.0.1:%d (gzip on)" % (d, port), file=sys.stderr)
ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
