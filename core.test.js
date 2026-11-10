/* EchoCheck — rule verification for the core engine (node core.test.js) */
var core = require("./app.js");
var pass = 0, fail = 0;
function eq(name, got, want) {
  var ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + "  got=" + JSON.stringify(got) + " want=" + JSON.stringify(want)); }
}

console.log("\n[1] quiz pool integrity (5 imagery + 4 scenario, 4 questions each, ABCD only)");
eq("imagery count", core.QUIZ_POOL.imagery.length, 5);
eq("scenario count", core.QUIZ_POOL.scenario.length, 4);
var shape = true, ids = {};
["imagery", "scenario"].forEach(function (k) {
  core.QUIZ_POOL[k].forEach(function (q) {
    if (ids[q.id]) shape = false; ids[q.id] = 1;
    if (q.questions.length !== 4) shape = false;
    q.questions.forEach(function (qq) {
      ["A", "B", "C", "D"].forEach(function (tag) {
        if (!qq.o[tag] || !qq.o[tag].en || !qq.o[tag].zh) shape = false;
      });
      if (Object.keys(qq.o).length !== 4) shape = false;
      if (!qq.q.en || !qq.q.zh) shape = false;
    });
  });
});
eq("every quiz: 4 questions x ABCD with en+zh", shape, true);

console.log("\n[2] theme routing -> audited quiz id");
eq("academic/A", core.resolveQuiz("academic", "A").quiz.id, "I1");
eq("peer/A", core.resolveQuiz("peer", "A").quiz.id, "I2");
eq("family/A", core.resolveQuiz("family", "A").quiz.id, "I3");
eq("low mood/A", core.resolveQuiz("low", "A").quiz.id, "I4");
eq("anxiety/A", core.resolveQuiz("anxiety", "A").quiz.id, "I5");
eq("academic/B", core.resolveQuiz("academic", "B").quiz.id, "S1");
eq("peer/B", core.resolveQuiz("peer", "B").quiz.id, "S2");
eq("family/B", core.resolveQuiz("family", "B").quiz.id, "S3");
eq("low mood/B", core.resolveQuiz("low", "B").quiz.id, "S4");
eq("anxiety/B flagged as closest-match proxy", core.resolveQuiz("anxiety", "B").proxy, true);

console.log("\n[3] panel scoring rule  (0-1 C/D Low, 2 Moderate, 3-4 High)");
eq("AAAA", core.scoreAnswers(["A", "A", "A", "A"]).risk, "low");
eq("ABAB", core.scoreAnswers(["A", "B", "A", "B"]).risk, "low");
eq("ABCD", core.scoreAnswers(["A", "B", "C", "D"]).risk, "moderate");
eq("BBCC", core.scoreAnswers(["B", "B", "C", "C"]).risk, "moderate");
eq("BCCD", core.scoreAnswers(["B", "C", "C", "D"]).risk, "high");
eq("DDDD", core.scoreAnswers(["D", "D", "D", "D"]).risk, "high");
eq("counts", core.scoreAnswers(["A", "B", "C", "D"]).counts, { A: 1, B: 1, C: 1, D: 1 });

console.log("\n[4] crisis bypass (rule 3)");
["i want to die", "Sometimes I think about suicide", "I don't want to be here anymore",
  "I cut myself last night", "there is no point in living", "我唔想活喇",
  "我有自殺念頭", "我成日想死", "我割腕咗", "我覺得活落去冇意思"].forEach(function (s) {
  eq("crisis: " + s, core.detectCrisis(s), true);
});
["I am stressed about DSE", "功課好多我寫唔切", "我同屋企人吵交", "瞓唔着好焦慮",
  "I killed time playing games"].forEach(function (s) {
  eq("not crisis: " + s, core.detectCrisis(s), false);
});

console.log("\n[5] topic classification (bilingual)");
eq("DSE english", core.classifyTopic("My DSE is next year and the exam pressure is huge").theme, "academic");
eq("考试 chinese", core.classifyTopic("我成日因為考試同成績好擔心").theme, "academic");
eq("friends chinese", core.classifyTopic("班入面冇人同我傾偈，我好孤單").theme, "peer");
eq("family chinese", core.classifyTopic("我同老豆每晚都吵，屋企氣氛好壓抑").theme, "family");
eq("low mood chinese", core.classifyTopic("做咩都冇樂趣，提唔起勁，好攰").theme, "low");
eq("anxiety english", core.classifyTopic("I keep overthinking and blaming myself all night").theme, "anxiety");
eq("anxiety chinese", core.classifyTopic("我個腦停唔落嚟，胡思亂想內耗好厲害").theme, "anxiety");
eq("unclear stays null", core.classifyTopic("my cat is sick").theme, null);

console.log("\n[6] off-topic + stop intent");
eq("hi", core.isOffTopic("hi"), true);
eq("tarot ask", core.isOffTopic("can you read my tarot cards"), true);
eq("real worry is not off-topic", core.isOffTopic("I have been feeling low and cannot sleep"), false);
/* small talk must be redirected, not accepted as a concern (spec: 跑题→引导句) */
["today is a sunny day", "nice weather today", "tell me a joke", "what is 2+2",
 "hello", "Hi there!", "asdf", "我今日好無聊", "who are you"].forEach(function (s) {
  eq("off-topic small talk: " + s, core.isOffTopic(s), true);
});
/* asking the demo to do schoolwork / fortune-telling is not a screening */
["can you write me an essay about friendship", "幫我寫功課", "do my homework"].forEach(function (s) {
  eq("off-topic request: " + s, core.isOffTopic(s), true);
});
/* a worry that merely opens with a greeting, or mentions weather, still counts */
["hi i have been feeling low", "my grandma died last week", "I feel meh",
 "DSE is killing me", "我同阿媽日日吵架", "我最近瞓唔着",
 "today is a sunny day but I feel empty inside"].forEach(function (s) {
  eq("concern accepted: " + s, core.isOffTopic(s), false);
});
/* never bounce a stop request or a crisis mention */
eq("stop is not off-topic", core.isOffTopic("stop"), false);
eq("停止 is not off-topic", core.isOffTopic("停止"), false);
eq("crisis is not off-topic", core.isOffTopic("I dont want to be here anymore"), false);
eq("stop en", core.isStopIntent("stop"), true);
eq("please stop en", core.isStopIntent("please stop"), true);
eq("stop zh", core.isStopIntent("唔想做喇"), true);
eq("退出 zh", core.isStopIntent("我想退出"), true);
eq("worry that merely contains 'stop' is NOT a stop", core.isStopIntent("I can't stop overthinking about the exam"), false);
eq("worry that contains 停 is NOT a stop", core.isStopIntent("我個腦停唔落嚟"), false);
eq("worry that says 唔想做嘢 is NOT a stop", core.isStopIntent("我而家唔想做嘢），"), false);
eq("worry about 唔想做任何事 is NOT a stop", core.isStopIntent("我唔想做任何事"), false);

console.log("\n[7] safety guardrails in wording");
var all = JSON.stringify(core.QUIZ_POOL);
["diagnosis", "depression", "anxiety disorder", "抑郁症", "诊断", "治療", "cure"].forEach(function (bad) {
  eq("item pool never says '" + bad + "'", all.indexOf(bad) === -1, true);
});

console.log("\nresults: " + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
