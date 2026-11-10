#!/usr/bin/env python3
"""Bundle index.html + styles.css + app.js into one double-clickable file.

Why: presenting from Desktop means dragging a single file onto the projector /
uploading to Classroom — no folder, no relative paths, no network.

  python3 tools/build_singlefile.py [out.html]
"""
import pathlib, re, sys, datetime

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")

out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "EchoCheck-demo.html"

# guard: the app must not gain external references silently
for bad in re.findall(r'(?:src|href)\s*=\s*"(https?://[^"]+)"', html + js):
    sys.exit("refusing to bundle, external reference found: %s" % bad)

html = re.sub(r'<link rel="stylesheet" href="styles.css"\s*/?>',
              "<style>\n" + css + "\n</style>", html)
html = html.replace('<script src="app.js"></script>',
                    "<script>\n" + js + "\n</script>")
stamp = "<!-- built %s from index.html + styles.css + app.js; edit the sources, not this file -->\n" % (
    datetime.date.today().isoformat())
html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + stamp, 1)

out.write_text(html, encoding="utf-8")
print("%s  %.1f KB  (self-contained)" % (out, out.stat().st_size / 1024))
