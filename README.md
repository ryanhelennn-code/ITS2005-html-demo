# EchoCheck — 情緒篩查示範網站 / Mood pre-screening demo

**Student project demo. It is a screening demo only — NOT clinical diagnosis or therapy.**
學生專題示範作品。只作情緒「初步篩查」示範，**不是臨床診斷，也不是心理治療**。

---

## 1. What this is 這是什麼

A bilingual (English ⇄ 繁體中文) web page that walks an HK secondary student (Secondary 1–6)
through an anonymous emotional **pre-screening**, then returns a preset profile +
risk level + support resources, plus a static aggregated dashboard for the school
social worker.

一個讓全港中學生（中一至中六）匿名做情緒初步篩查的雙語網頁：一步一題 → 給出「預設解讀画像 +
風險分級 + 支援資源」，右側另設學校社工用的**聚合匿名**後台。

Three hard limits baked into the code:

| Rule 規則 | How it is enforced 如何保證 |
|---|---|
| Screening, never diagnosis 篩查而非診斷 | The disclaimer bar, both result bodies, the closing note and the About panel all state it; no string in the app names a disorder. `core.test.js` fails the build if 診斷/depression/治療 wording enters the item pool. |
| No invented quiz items 嚴禁自創題目 | `QUIZ_POOL` contains only the expert-audited banks: imagery **I1–I5**, scenario **S1–S4**. Nothing else is generated at runtime. |
| Interpretation is rule-mapped 解讀靠規則 | Profile text is selected by `mode × risk` from a fixed table; option tags A/B/C/D and the `0–1 / 2 / 3–4` threshold come from the panel. No free-form AI reading. |

Nothing is stored and nothing is fetched: no account, no localStorage, no backend, no
CDN, no analytics. The whole demo runs from `file://`. 完全匿名，唔儲存、唔上傳、唔用網絡。

---

## 2. Files 檔案

```
EchoCheck/
├─ EchoCheck-demo.html   ← ONE FILE, double-click to present (built from the 3 sources)
├─ index.html            ← shell (B1 bar / B2 about / B3 chat / B4 dashboard / B5 resources)
├─ styles.css            ← the visual system (low-saturation blue-white academic look)
├─ app.js                ← all content + logic + rendering + QA harness
├─ core.test.js          ← 83 rule checks you can run without a browser
└─ tools/
   ├─ build_singlefile.py  rebuilds EchoCheck-demo.html
   ├─ scan_zh.py           lint: flags Simplified glyphs in HK Traditional copy
   └─ fix_zh_copy.py       one-off reviewable copy pass (kept for the audit trail)
```

---

## 3. Presenting 演示

**Just double-click `EchoCheck-demo.html`.** It works offline and needs no server.
直接雙擊 `EchoCheck-demo.html`，離線可用，唔使開 server。

Live flow: the AI opening line is already sent → type (or tap a suggested chip) what
bothers you → **Step 1** theme match + choose mode A / B → **Step 2** four questions,
one at a time (A/B/C/D buttons, keyboard A B C D also work) → **Step 3** profile +
tally + risk report → **Step 4** closing with 【Restart new check】【View support resources】.

### URL switches (for the presentation and for QA)

| URL | What it does |
|---|---|
| `?shot=low` / `moderate` / `high` | Auto-plays the whole academic quiz with the fixed answer key `AABA` / `BCBD` / `CDCD` and lands on that risk level. Useful when you must show a specific branch on stage in ~3 s. |
| `?shot=crisis` | Types a self-harm mention and shows the crisis page — proving the quiz is **skipped entirely**. |
| `?shot=offtopic` | Types `today is a sunny day` and shows the verbatim redirect — proving small talk is **not** counted as a concern and no quiz starts. |
| `?shot=stop` | Starts the quiz, then types `stop` after question 1 — the check ends on the spot with "Stopped — nothing was saved". |
| `?shot=support` | Finishes a Moderate check, then opens the support roster, books a slot and cancels it — the whole Step-4 follow-up in one URL. |
| `?shot=idle` | The opening screen only. |
| `?lang=zh` | Open straight in 繁體中文 (the top-right toggle does the same mid-session; every panel, question, disclaimer and hotline label switches together). |
| `?qa=1` | Runs the 13–26 in-browser assertions for that branch and prints them into `#qaReport`; the page title becomes `QA x/y :: …`. |

Answer key → score mapping is the panel's: A = 穩定正向, B = 輕微壓力可調節,
C = 情緒負擔持續困擾, D = 強烈痛苦高風險; over 4 questions count **C/D**:
`0–1 → Low`, `2 → Moderate`, `3–4 → High`.

Three scripted safety moments worth showing live (each also has a one-URL version):

* **Off-topic** — type `today is a sunny day` (or open `?shot=offtopic`): the redirect line
  appears verbatim and the quiz never starts. Routing is `theme keyword → emotion word →
  otherwise redirect`, so weather, `2+2`, `tell me a joke`, `我今日好無聊` and
  `幫我寫功課` are all bounced, while `my grandma died last week`, `I feel meh` and
  `我最近瞓唔着` are accepted. A message that merely *opens* with a greeting
  (`hi i have been feeling low`) is still taken seriously.
* **Right to stop** — type `stop` / `停止` (or open `?shot=stop`), or press the
  **Stop this check** button: the check ends immediately with "Stopped — nothing was
  saved", no pressure. A long sentence that merely contains 停 is *not* a stop request —
  see `isStopIntent`, and a stop request is never answered as if it were small talk.
* **Crisis** — type `I don't want to be here anymore` (or open `?shot=crisis`) → hotlines
  **2896 0000 / 182 / 2777 8899** come first, interpretation comes never. Crisis beats
  off-topic detection, so a cry for help can never be redirected.
* **Asking for help in words** — after a check, type `我想搵社工預約` or `book an appointment`:
  the roster opens instead of the redirect line being thrown at someone who asked a
  real question.

### 3.5 Step 4 support roster 支援名單 + 示範預約

【View support resources】／【查看支援資源】used to only scroll the page to the footer bar,
which on a projector reads as a dead button. It now opens a real card in the conversation:

1. a **roster of three roles** — 學校社工·駐校 / 高級社工·學校輔導組 / 青年外展社工·可即席 —
   each showing which kind of worry it fits, the languages, and how many slots;
2. tap a role → its **free slots** appear; tap a time → a **booking card** appears with
   role / time / status / where a real booking is actually made;
3. **Cancel this demo booking** or **Choose a different role** at any point; the roster also
   keeps a 【而家唔想約】exit and a 【睇頁底支援熱線】shortcut, and the hotlines stay one
   scroll away.

Governance of this step — the four claims that must survive scrutiny:

| Claim | Where it is enforced |
|---|---|
| The list is **roles, not people** | `ROSTER` has no names; `sup.intro` states the real names/rooms/hours are set by the school social work team; the amber `sup.mock` badge reads `DEMO ROSTER · not real staff · no appointment is actually made`. |
| Nothing is booked or sent | `sup.stateV` = `Held in this tab only — not confirmed, not sent`; `bookCancel` restores `S.book`; the QA branch asserts a booking card can only exist after a slot tap. |
| Nothing is stored | No `localStorage`/`sessionStorage`/network anywhere; the state lives in the in-memory `S.book` object, dropped by 【Restart new check】 and by closing the page. |
| It does not touch the statistics | `sup.dashNote` says so, and B4 keeps reading only its own fixed demo aggregate — the QA branch asserts 72 % / 24 % / 4 % unchanged after booking. |

It is also optional: rule 5 (you may stop at any point) is repeated inside the card, and the
roster never auto-opens — it only appears when the student asks for it.

---

## 4. Verification 驗收

```bash
node --check app.js                 # syntax
node core.test.js                   # 83 rule assertions (no browser needed)
python3 tools/scan_zh.py app.js     # Traditional-Chinese copy lint
python3 tools/scan_zh.py --selftest  # proves the lint can still SEE display copy
python3 tools/build_singlefile.py   # rebuild the one-file bundle

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --virtual-time-budget=40000 --user-data-dir=/tmp/eq \
  --dump-dom "file://$PWD/EchoCheck-demo.html?shot=moderate&qa=1" | grep -o '<title>[^<]*'
# → QA 25/25 :: ALL GREEN

# the whole matrix, both entry points
for f in index.html EchoCheck-demo.html; do for s in idle offtopic stop low moderate high crisis support; do for lg in en zh; do
  rm -rf /tmp/eq; T=$("$CHROME" --headless=new --disable-gpu --window-size=1680,1000 \
    --virtual-time-budget=40000 --user-data-dir=/tmp/eq --dump-dom "file://$PWD/$f?shot=$s&lang=$lg&qa=1" \
    | grep -o '<title>[^<]*' | sed 's/<title>//')
  case "$T" in *"ALL GREEN"*) echo "ok   $f $s $lg";; echo "FAIL $f $s $lg -> $T";; esac
done; done; done
```

Current state: **83/83 core rules · 8 branches × 2 languages × 2 entry points = 32 QA
runs, all green (13 checks idle, 17 offtopic/stop/crisis, 25 low/moderate/high, 26 support)
· zh lint clean, 408 CJK display lines examined · width ladder 390–1680 px × en/zh = 22/22
with the roster and booking cards open · bundle rebuilt after every change.**

`core.test.js` guards the parts an audience cannot see: every bank really has 4
questions × 4 options; tags are only A–D; thresholds are exactly `0–1/2/3–4`; the crisis
bypass fires on mentions and *does not* fire on ordinary worries; the item pool contains
no diagnosis / disorder / treatment wording.

---

## 5. Content governance 題目管治

Loaded banks — **reference samples from the expert panel, not authored here**:

* `I1` Academic pressure (path to your goal) 學業壓力（通往目標的小路）
* `I2` Peer relationship & loneliness (small animal / note / sound) 同輩關係與孤獨
* `I3` Family conflict (the house you stay in) 家庭衝突
* `I4` Low mood & lost interest (sea / paints / flower) 低落與失去興趣
* `I5` Anxiety & overthinking (wheel / bubble / fog) 焦慮與胡思亂想
* `S1`–`S4` scenario self-report sets 情景自評卷

Theme routing is keyword-based over the panel's theme lists. The lists intentionally
carry **both** Traditional and Simplified spellings (`功課/作业`, `考試/测验`) so a student
typing Simplified still gets routed — `tools/scan_zh.py` therefore skips those arrays;
display copy must be Traditional.

**Known caveat, say it out loud if asked 需主動說明**: the audited brief supplied four
scenario sets but no scenario set for the anxiety theme, so choosing mode **B** on the
anxiety route reuses `S1` (academic) and the demo prints a visible note that this bank is
a placeholder pending expert review. It does **not** invent an `S5`.

To add a real bank later: append to `QUIZ_POOL.scenario`, give it `theme: "anxiety"`,
set `anxiety.scenario` to its id and drop `scenarioProxy`. The rule engine, scoring and
interpretation need no change.

---

## 6. What to say when challenged 被問到时點樣答

* **“Is this a diagnosis?”** — No. It is a pre-screening demo; the label comes from a
  preset mapping rule, and every result page repeats that it is not a diagnosis and that
  only a psychologist / psychiatrist / school social worker can assess properly.
* **“Why projective questions?”** — Lower defensiveness for teenagers, exactly as the
  panel specified; the reading is still a preset label mapping, not a Rorschach-style
  free interpretation, and the About panel says full Rorschach / MBTI / tarot are excluded.
* **“Where does the data go?”** — Nowhere. No storage, no requests. The dashboard numbers
  are simulated for the presentation, which the note under it states.
* **“What if a real student is in trouble?”** — Crisis mentions bypass the quiz and put
  2896 0000 / 182 / 2777 8899 and the school social worker first. The B5 resource bar is
  permanently visible on every screen.

---

## 7. Editing 改動時注意

* All user-visible strings live in `T` (UI copy) and `QUIZ_POOL` (items) in `app.js`;
  `index.html` has no copy at all, so a language switch can rebuild the whole thread.
* Keep both `en` and `zh` on every string, or the toggle will show a blank.
* Never write interpretation as generated text; add a new key to `T.profile` instead.
* `t("sup.mock")` resolves one dotted level. A miss now prints `⚠ missing string: …`, and
  `?qa=1` fails `no unresolved i18n key printed` — that guard exists because the first
  roster build printed `sup.slotLbl` where an audience would read it.
* Never hand-write `\uXXXX` escapes for Chinese in an assertion. The code points were wrong
  (節 for 範, 應 for 預), so the regex simply never matched while the copy on screen was
  correct. Take the string from `T` / `ROSTER` instead.
* `tools/scan_zh.py` tracks alias blocks by bracket depth and prints how many CJK display
  lines it actually examined; run `python3 tools/scan_zh.py --selftest` after touching it.
  The earlier version stayed "inside" the `feel` list forever and reported CLEAN while blind
  to every string after it.
* The roster and booking cards render from state (`S.book` + message data) — never by
  imperative DOM writes — so the language toggle rebuilds them like everything else.
* Re-run §4 after any edit, and rebuild the bundle — `EchoCheck-demo.html` is generated,
  so edit the sources.

---

## 8. Publishing 發佈

**What is actually running.** `serve_gz.py` + an outbound `ssh -R` tunnel to
localhost.run. No port is opened on the Mac, no router is touched, no account is created,
nothing is uploaded to a host: the demo still runs 100 % in the visitor's browser.

| | |
|---|---|
| 本地 local | `python3 serve_gz.py <folder> 8766` (binds **127.0.0.1** only) |
| 公網 public | `https://<random>.lhr.life/` handed out per tunnel |
| 壓縮 | the four served files get `.gz` siblings — 130 KB → 43 KB, so a visitor waits ~5 s instead of ~25 s over the relay |
| 一鍵重發 | `一键发布.command` — regenerates the gzip copies, restarts the server if down, re-opens the tunnel, prints the new URL and opens the browser |

**Known limits, stated plainly.** A tunnel link dies when the Mac sleeps, when the tunnel
window closes, or when the free tier rotates it (hours, not months), and every re-open gives
a **different address**. For anything permanent you need an account on a real host
(Netlify Drop / GitHub Pages) — the bundle is one file, so dragging it there takes 20 seconds.
**The most robust share is still the file itself**: `EchoCheck-demo.html` (128 KB) goes over
WeChat/Drive/USB and opens offline with no server at all.

**Verified from the public URL, not just locally:** `?shot=support&lang=zh&qa=1` → 26/26,
`?shot=moderate&lang=en&qa=1` → 25/25, bundle byte-identical after decompression,
`noindex, nofollow, noarchive, nosnippet` present, demo pill present.
