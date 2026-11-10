#!/usr/bin/env python3
"""zh lint — flag Simplified-only glyphs hiding in the HK Traditional copy.

Detector, never a converter: blind s2t wrecks Cantonese wording
(唔 / 嘅 / 啲 / 瞓 / 佢 / 搵), so each hit is fixed by hand in app.js.

  python3 tools/scan_zh.py [file ...]        # default: app.js
Exit 0 = clean, 1 = offenders found.
"""
import sys, pathlib, re

# char -> the HK Traditional / Cantonese form it should be.
# Characters that are identical in both standards (的了在治查窗境冷清模似拿抬碰踩呼吸)
# are deliberately NOT here, so a hit is a real problem (a few, marked *review*,
# are legitimate Traditional in some words and need a human glance).
FIX = {
    "么": "麼", "这": "這", "远": "遠", "书": "書*", "买": "買", "卖": "賣", "读": "讀",
    "变": "變", "让": "讓", "们": "們", "应": "應", "样": "樣", "会": "會", "来": "來*",
    "个": "個", "没": "沒", "为": "為", "说": "說", "请": "請", "觉": "覺", "题": "題",
    "学": "學", "习": "習", "压": "壓", "结": "結", "单": "單", "简": "簡", "欢": "歡",
    "乐": "樂", "兴": "興", "复": "複/伏", "钟": "鐘", "时": "時", "间": "間", "对": "對",
    "错": "錯", "当": "當*", "误": "誤", "总": "總", "实": "實", "际": "際", "帮": "幫",
    "协": "協", "调": "調", "诊": "診", "环": "環", "气": "氣", "虚": "虛", "历": "歷",
    "脑": "腦", "内": "內", "节": "節", "静": "靜", "杂": "雜", "线": "線", "条": "條",
    "页": "頁", "册": "冊", "锁": "鎖", "边": "邊", "邻": "鄰", "开": "開", "关": "關",
    "闭": "閉", "获": "獲", "举": "舉", "热": "熱", "温": "溫", "凉": "涼", "冻": "凍",
    "浅": "淺", "证": "證", "号": "號", "码": "碼", "达": "達", "连": "連", "运": "運",
    "儿": "兒", "众": "眾", "许": "許", "认": "認", "识": "識", "记": "記", "讲": "講",
    "论": "論", "议": "議", "设": "設", "诉": "訴", "现": "現", "规": "規", "视": "視",
    "览": "覽", "触": "觸", "讯": "訊", "译": "譯", "评": "評", "执": "執", "扩": "擴",
    "担": "擔", "拟": "擬", "拥": "擁", "显": "顯", "术": "術", "极": "極", "构": "構",
    "松": "鬆", "标": "標", "录": "錄", "忆": "憶", "态": "態", "怀": "懷", "惊": "驚",
    "惧": "懼", "愿": "願", "战": "戰", "户": "戶", "报": "報", "图": "圖", "圆": "圓",
    "尘": "塵", "层": "層", "并": "並", "广": "廣", "庆": "慶", "弯": "彎", "弹": "彈",
    "强": "強", "径": "徑", "恋": "戀", "悦": "悅", "悬": "懸", "夺": "奪", "词": "詞",
    "谁": "誰", "财": "財", "责": "責", "货": "貨", "质": "質", "购": "購", "费": "費",
    "资": "資", "员": "員", "戏": "戲", "顶": "頂", "顺": "順", "须": "須", "预": "預",
    "频": "頻", "额": "額", "风": "風", "飞": "飛", "饭": "飯", "马": "馬", "骑": "騎",
    "鱼": "魚", "鸟": "鳥", "麦": "麥", "黄": "黃*", "齐": "齊", "齿": "齒", "龙": "龍",
    "网": "網", "与": "與", "产": "產", "亲": "親", "价": "價", "体": "體", "干": "幹/乾*",
    "里": "裡/裏*", "后": "後*", "于": "於*", "余": "餘*", 
    "找": "搵", "点": "點",
}
# 低 / 什 alone / 治 / 窗 / 境 / 内 ... are legitimate Traditional characters.

# Keyword-alias lists DELIBERATELY contain simplified spellings so a student
# typing simplified still gets matched. Those lines are not display copy.
IGNORE = [r"kwZh:", r"kwEn:", r"CRISIS_", r"STOP_RE", r"OFF_EN =", r"OFF_Q =",
          r"matching vocabulary"]
CJK = re.compile(r"[\u4e00-\u9fff]")


def scan(path):
    text = pathlib.Path(path).read_text(encoding="utf-8")
    lines, freq = [], {}
    # Alias blocks are tracked by BRACKET DEPTH, not by "does this line look
    # like a closer". The old version stayed inside the `feel` list forever
    # because it ends with `"..."];;` on a content line, which silently skipped
    # every display string after it — the lint reported CLEAN while being blind.
    ALIAS_OPEN = re.compile(r"(kwZh|kwEn|CRISIS_(ZH|EN)|STOP_RE_\w+|OFF_EN|OFF_Q|feel)\s*[:=]")
    in_alias, depth, scanned = False, 0, 0
    for ln, line in enumerate(text.split("\n"), 1):
        was_alias = in_alias          # the line that CLOSES a block is still
        if not in_alias and ALIAS_OPEN.search(line):
            in_alias, depth = True, line.count("[") + line.count("{") - line.count("]") - line.count("}")
        elif in_alias:
            depth += line.count("[") + line.count("{") - line.count("]") - line.count("}")
            if depth <= 0:
                in_alias, depth = False, 0
        if re.match(r"^\s*(/\*|\*|//)", line):   # prose/comments are not user-visible copy
            continue
        if was_alias or in_alias or any(re.search(pat, line) for pat in IGNORE):
            continue
        if not CJK.search(line):
            continue
        scanned += 1
        hits = sorted({c for c in line if c in FIX})
        if hits:
            lines.append((ln, hits, line.strip()[:160]))
            for c in hits:
                freq[c] = freq.get(c, 0) + 1
    return lines, freq, scanned


def main(argv):
    files = argv or ["app.js"]
    total = 0
    for f in files:
        lines, freq, scanned = scan(f)
        print("   %s: %d CJK display line(s) actually examined" % (f, scanned))
        if not lines:
            print("CLEAN  %s" % f)
            continue
        print("== %s : %d offending line(s) ==" % (f, len(lines)))
        print("   glyph -> should be   (occurrences)")
        for c, n in sorted(freq.items(), key=lambda x: -x[1]):
            print("     %s -> %-14s (%d)" % (c, FIX[c], n))
        print()
        for ln, hits, txt in lines:
            print("%5d  %s  %s" % (ln, "".join(hits), txt))
        total += len(lines)
    print("\nTOTAL offending lines: %d" % total)
    return 1 if total else 0


def selftest():
    """Prove the linter can still see display copy: inject a known Simplified
    glyph two lines after the biggest alias block and require it to be caught."""
    src = pathlib.Path("app.js").read_text(encoding="utf-8").split("\n")
    anchor = None
    for i, ln in enumerate(src):
        if re.search(r"demoPill:\s*\{", ln):      # inside T: pure display copy
            anchor = i
            break
    if anchor is None:
        print("SELFTEST SKIP (T anchor not found)"); return 2
    src.insert(anchor + 1, '      probe: { en: "x", zh: "probe 天气" },')
    tmp = pathlib.Path("/tmp/_zh_lint_probe.js"); tmp.write_text("\n".join(src), encoding="utf-8")
    lines, freq, scanned = scan(str(tmp))
    caught = any("天气" in t for _, _, t in lines)
    print("SELFTEST %s  (%d offender line(s) found, %d lines scanned)" %
          ("PASS" if caught else "FAIL — LINTER IS BLIND", len(lines), scanned))
    tmp.unlink(missing_ok=True)
    return 0 if caught else 2


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.argv.remove("--selftest"); sys.exit(selftest())
    sys.exit(main(sys.argv[1:]))
