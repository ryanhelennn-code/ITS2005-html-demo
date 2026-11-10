/* =============================================================
   EchoCheck — app.js
   Bilingual (EN / 繁體中文), rule-based, fully offline demo.

   SAFETY / GOVERNANCE NOTES (read before editing)
   1. This is a PRE-SCREENING demo only. No diagnosis, no therapy.
   2. Item pool = expert-panel-audited reference samples provided in
      the project brief. The engine NEVER generates or invents items.
      Adding items = adding audited entries to QUIZ_POOL below (and
      the same audited set must pass the panel before use in a school).
   3. Scoring / risk rules are fixed by the panel and hard-coded:
        A = stable-positive, B = mild stress, C = emotional burden,
        D = strong distress.  C/D count -> 0-1 Low, 2 Moderate, 3-4 High.
   4. Interpretation strings are PRESET templates (per mode x risk).
      Free-form "AI reading" is intentionally not implemented.
   5. Crisis wording bypasses the quiz and shows hotlines first.
   ============================================================= */
(function () {
  "use strict";

  /* ====== CORE_START  (pure logic, unit-testable in node) ====== */

  /* ---- shared tag vocabulary (panel-fixed) ---- */
  var TAGS = ["A", "B", "C", "D"];

  /* ---- theme registry: routing keys + audited quiz mapping ---- */
  var THEMES = {
    academic: {
      label: { en: "Academic pressure", zh: "學業壓力" },
      imagery: "I1",
      scenario: "S1",
      kwEn: ["exam", "exams", "test", "dse", "ies", "homework", "assignment", "assignments",
        "schoolwork", "study", "studying", "revise", "revising", "revision", "mark", "marks",
        "grade", "grades", "result", "results", "fail", "failing", "pass", "school", "class rank",
        "ranking", "tutorial", "papers", "pressure", "stream", "form 4",
        "form 5", "form 6", "s4", "s5", "s6", "teacher", "teachers", "uni", "university",
        "jupas", "can't keep up", "cant keep up", "falling behind", "disappointed"],
      kwZh: ["考試", "测验", "測驗", "功課", "作业", "作業", "溫習", "温習", "溫書", "默書", "嘜書", "測考", "會考",
        "文憑", "dse", "成績", "成绩", "分數", "分数", "班排", "名次", "升學", "升学", "入學", "老師", "老师",
        "補習", "补习", "報告", "报告", "做唔切", "趕唔切", "寫唔切", "追唔上", "學業", "学业", "讀書", "读书",
        "開卷", "操數", "唔夠時間", "失敗", "失败", "不合格", "重讀", "插班", "選科", "选科"]
    },
    peer: {
      label: { en: "Peer relationships & loneliness", zh: "同伴人際與孤獨" },
      imagery: "I2",
      scenario: "S2",
      kwEn: ["friend", "friends", "classmate", "classmates", "mate", "mates", "peer", "group project",
        "lonely", "loneliness", "alone", "nobody", "no one", "left out", "excluded", "bully",
        "bullying", "social", "talk to", "friends group", "chat app", "wahi", "clique"],
      kwZh: ["朋友", "同學", "同班", "孤立", "被排擠", "排挤", "霸凌", "欺凌", "得滯", "一個人", "一个一人",
        "冇人", "沒人", "無朋友", "孤單", "孤单", "唔有人理", "沒人理", "小圈子", "傾偈", "班friend",
        "clique", "被忽略", "無friend", "冇friend", "拍拖", "交友", "社交", "唔啱傾", "合唔到", "玩埋一邊"]
    },
    family: {
      label: { en: "Family conflict & home life", zh: "家庭衝突與在家關係" },
      imagery: "I3",
      scenario: "S3",
      kwEn: ["family", "mum", "mom", "mother", "dad", "father", "parent", "parents", "parents",
        "brother", "sister", "sibling", "grandma", "grandpa", "home", "at home", "argue",
        "arguing", "quarrel", "fight", "fighting", "scold", "scolded", "expectation",
        "expectations", "strict", "household"],
      kwZh: ["屋企", "家里", "在家", "爸", "媽", "爸媽", "父母", "老豆", "阿爸", "老母", "阿媽", "媽咪",
        "妈妈", "阿哥", "阿姐", "妹", "兄弟", "姊妹", "爺爺", "嫲嫲", "外賣", "吵", "嬡", "鬧", "鬧我",
        "大吵", "吵架", "打罵", "打駡", "嘔氣", "冇人明白", "無人明白", "唔俾我", "管我", "要求好高", "期望"]
    },
    low: {
      label: { en: "Low mood, emptiness, lost interest", zh: "低落、空虛、失去興趣" },
      imagery: "I4",
      scenario: "S4",
      kwEn: ["sad", "unhappy", "down", "depressed mood", "low mood", "empty", "numb", "hopeless",
        "no energy", "tired all the time", "nothing fun", "lose interest", "lost interest",
        "no motivation", "unmotivated", "bored", "cry", "crying", "worthless", "useless",
        "meaningless", "waste of time", "wake up", "can't sleep", "cant sleep", "sleep"],
      kwZh: ["唔開心", "不開心", "難過", "低落", "空虛", "空虚", "麻木", "冇勁", "無勁", "提唔起勁", "提不起勁",
        "冇心機", "無心機", "冇動力", "無動力", "冇興趣", "無興趣", "冇意思", "無意思", "喊", "喊咗", "眼濕濕",
        "想喊", "冇價", "冇價值", "無價值", "冇意義", "無意義", "好攰", "好累", "瞓唔着", "睡唔著", "失眠",
        "悶", "發呆", "躺"]
    },
    anxiety: {
      label: { en: "Overthinking & self-draining worry", zh: "自我內耗與反覆焦慮" },
      imagery: "I5",
      scenario: "S1",
      scenarioProxy: true,
      kwEn: ["overthink", "overthinking", "worry", "worrying", "anxious", "anxiety", "nervous",
        "panic", "ruminate", "can't switch off", "cant switch off", "mind won't stop",
        "spinning", "self blame", "self-blame", "blame myself", "hate myself", "second guess",
        "restless", "scared", "afraid", "fear", "tight chest", "heart racing", "shaky"],
      kwZh: ["胡思亂想", "胡思乱想", "諗太多", "谂太多", "焦慮", "焦虑", "緊張", "惊", "驚", "唔敢", "心跳",
        "心慌", "惊青", "惊恐", "發呆到驚", "自責", "自责", "怪自己", "覺得自己唔好", "完美主義", "反复諗",
        "猶豫", "内耗", "內耗", "擰巴", "放心唔落", "惊失敗", "怕失敗", "緊張到"]
    }
  };

  /* crisis wording -> skip the quiz, hotline page first (rule #3).
     Deliberately broad: a false positive only shows the support page,
     which is the safe direction of error. */
  var CRISIS_EN = ["suicide", "suicidal", "kill myself", "kill me", "end my life", "end it all",
    "want to die", "wanna die", "want do die", "better off dead", "no reason to live",
    "not worth living", "no point living", "dont want to be here", "don't want to be here",
    "harm myself", "hurting myself", "hurt myself", "self harm", "self-harm", "cut myself", "cutting myself",
    "burn myself", "overdose", "take pills", "jump off", "hang myself", "no point in living",
    "can't go on", "cant go on", "disappear forever", "not want to exist", "want to disappear"];
  var CRISIS_ZH = ["自殺", "自杀", "轻生", "輕生", "寻死", "尋死", "死左", "死咗", "去死", "想死", "唔想活",
    "不想活", "無意生存", "冇意生存", "自殘", "自残", "割腕", "割pp", "撞頭", "吞藥", "服藥自殺",
    "活落去冇意思", "撐唔住", "撑唔住", "結束生命", "了结自己", "瞭結自己", "唔想喺度", "不想喺度",
    "唔想生存", "唔存在", "抹掉自己", "解決自己", "消灭自己"];

  /* clearly non-worry chatter -> gentle redirect */
  /* A message that IS only a greeting / keyboard-mash. Anchored, so
     "hi i have been feeling low" is still taken as a concern. */
  var OFF_EN = /^(hi|hii+|hey|hello|halo|yo|sup|hai|test|testing|tester|asdf|sdfg|qwe|lol|lmao|haha+|ok(ay)?|k|nm|idk|what|nice|cool)[\s!?.]*$/i;
  /* An explicit non-screening request — checked before theme routing so
     "write me an essay about friendship" is not treated as a peer worry. */
  var OFF_Q = /(who are you|what are you|are you (a )?(bot|ai|real|human)|your name|what is your|can you (be|do) my|write me|generate|my essay|an essay|prompt|do my (homework|exam|test)|homework answer|answer my (exam|test)|cheat|tarot|horoscope|mbti|astrolog|psychic|zodiac|name (analysis|number)|塔羅|星座|占卜|睇相|算命|幫我(寫|做|答)|替我(寫|做|答)|寫功課|寫作業|做功課|做作業|貼我答案|走數|做份報告)/i;

  /* ---------- quiz pool : audited reference samples only ---------- */
  var QUIZ_POOL = {
    imagery: [
      {
        id: "I1", theme: "academic",
        title: { en: "Quiz 1 · Academic pressure (path to your goal)", zh: "問卷一 · 學業壓力（通往目標的小路）" },
        questions: [
          { q: { en: "Imagine a small path that leads to your goal. What is the weather on this path?", zh: "想像你要行一段通往目標的小路，條路嘅天氣係點？" },
            o: { A: { en: "Sunny with a light breeze, soft sunlight", zh: "晴朗微風，陽光柔和" },
                 B: { en: "Cloudy, but not raining", zh: "陰天，沒有下雨" },
                 C: { en: "A steady drizzle, the ground is slippery", zh: "持續細雨，路面濕滑" },
                 D: { en: "A wild storm, you cannot see ahead", zh: "狂風暴雨，看不清前方" } } },
          { q: { en: "On the path you see a backpack. What do you feel is inside?", zh: "行到一半見到一個背包，你直覺入面裝住啲咩？" },
            o: { A: { en: "Water, snacks and little things you like", zh: "水、零食、喜歡的小物件" },
                 B: { en: "Textbooks and notes, just the right weight", zh: "課本和筆記，分量剛好" },
                 C: { en: "Very thick books, heavy to carry", zh: "厚厚的書本，很重" },
                 D: { en: "You don't know what's inside, but it feels very heavy", zh: "唔知入面係啲咩，但感覺好沉重" } } },
          { q: { en: "Halfway along, a door appears ahead. What is your first thought?", zh: "行到一半，前面出現一扇門，你第一個反應係？" },
            o: { A: { en: "Push it open and see what is inside", zh: "推開門睇吓入面有啲咩" },
                 B: { en: "Stand at the door and think before deciding", zh: "先站在門口，想一想再決定" },
                 C: { en: "Rather not open it; you would take a detour", zh: "不想開門，想繞路走" },
                 D: { en: "You feel something bad must be behind it", zh: "覺得門後面一定是不好的事情" } } },
          { q: { en: "After walking the path, what do you most want to do?", zh: "行完呢條路之後，你最想做咩？" },
            o: { A: { en: "Find a place to sit, rest and properly relax", zh: "搵個地方坐低休息，好好放鬆" },
                 B: { en: "Briefly look back on what happened on the way", zh: "簡單回顧一下路上的經歷" },
                 C: { en: "Just want it to end; don't feel like doing anything", zh: "只想快啲結束，乜都不想郁" },
                 D: { en: "Feel that no matter how you walk, you won't reach the end", zh: "覺得點行都達唔到終點" } } }
        ]
      },
      {
        id: "I2", theme: "peer",
        title: { en: "Quiz 2 · Peers & loneliness (the room with the big window)", zh: "問卷二 · 同伴人際、孤獨（落地窗的房間）" },
        questions: [
          { q: { en: "Imagine you stand in a room with floor-to-ceiling windows. Outside there is a group of people. What do you do?", zh: "想像你企在一間有落地窗的房間，窗外有一班人，你會？" },
            o: { A: { en: "Go out and join them", zh: "願意走出去同佢哋一起" },
                 B: { en: "Stand quietly by the window, sometimes wave", zh: "站喺窗邊安靜睇住，偶爾招招手" },
                 C: { en: "Stay in the room, don't want to go out", zh: "只想喺房間入面，唔出去" },
                 D: { en: "Hope they do not notice you", zh: "希望佢哋唔好注視到自己" } } },
          { q: { en: "If you could become a small animal near a crowd, which would you be?", zh: "如果可以變成一種喺人群附近嘅小動物，你會揀邊隻？" },
            o: { A: { en: "A little rabbit, happy to approach gentle friends", zh: "小兔子，願意靠近溫和的夥伴" },
                 B: { en: "A cat, watching from afar, coming close only if it wants to", zh: "小貓，遠遠觀察，想靠近才靠近" },
                 C: { en: "A small bird, perched alone up high", zh: "一隻小鳥，獨自停喺高處" },
                 D: { en: "A night-time creature, avoiding people as much as possible", zh: "夜行小動物，盡量避開人群" } } },
          { q: { en: "You receive a blank sticky note. What do you instinctively do?", zh: "你收到一張空白便條紙，你本能會點做？" },
            o: { A: { en: "Write down a little thing you want to share", zh: "寫下想分享嘅小事" },
                 B: { en: "Draw a simple little pattern", zh: "畫簡單嘅小圖案" },
                 C: { en: "Leave it blank; you don't know what to write", zh: "空白放喺度，唔知寫咩好" },
                 D: { en: "Don't want to leave any trace at all", zh: "不想留下任何痕跡" } } },
          { q: { en: "At night, which sound do you prefer?", zh: "夜晚，你比較鍾意邊一種聲音？" },
            o: { A: { en: "Friends talking quietly together", zh: "朋友輕輕傾偈的聲音" },
                 B: { en: "Soft wind", zh: "輕柔嘅風聲" },
                 C: { en: "Silence — no sound at all", zh: "安靜，一點聲音都不想聽到" },
                 D: { en: "Loud noise, which makes you feel agitated", zh: "嘈雜聲響，會令你覺得心煩" } } }
        ]
      },
      {
        id: "I3", theme: "family",
        title: { en: "Quiz 3 · Family (the house you often stay in)", zh: "問卷三 · 家庭衝突（你常留低嗰間屋）" },
        questions: [
          { q: { en: "Imagine a house you often stay in. What is the light like inside?", zh: "想像一間你常留低嘅屋，屋入面嘅光線係點？" },
            o: { A: { en: "Bright and soft, with sunlight", zh: "明亮柔和，有陽光" },
                 B: { en: "Ordinary indoor lighting, neither bright nor dim", zh: "普通室內燈光，唔光唔暗" },
                 C: { en: "Rather dim and a bit stuffy", zh: "光線偏暗，有啲焗" },
                 D: { en: "Gloomy, making you want to leave", zh: "昏暗，令人想離開" } } },
          { q: { en: "There is a cabinet in the room. What do you feel is inside it?", zh: "房入面有一個櫃，你直覺櫃入面係點？" },
            o: { A: { en: "Keepsakes you like", zh: "放住喜歡嘅紀念品" },
                 B: { en: "Everyday things, neatly arranged", zh: "雜物，整齊擺放" },
                 C: { en: "Locked; you don't want anyone looking through it", zh: "鎖起嚟，裡面的東西不想被人翻看" },
                 D: { en: "Something hidden inside that makes you uncomfortable", zh: "入面藏住令你覺得唔舒服嘅嘢" } } },
          { q: { en: "From outside the window you hear people arguing. How do you feel?", zh: "窗外傳來其他人爭吵嘅聲，你嘅感受係點？" },
            o: { A: { en: "You know it is not about you; it does not affect you", zh: "知道同自己無關，唔受影響" },
                 B: { en: "A bit uneasy, but you can settle down", zh: "有啲不安，但可以平復到" },
                 C: { en: "Your heart tightens and you feel upset too", zh: "心入面跟住緊張、難受" },
                 D: { en: "Very scared; you want to hide", zh: "好驚，想匿埋" } } },
          { q: { en: "When you are very tired, what kind of space do you most want?", zh: "當你攰到爆嗰陣，你最想要嘅空間係點？" },
            o: { A: { en: "Being with someone you trust", zh: "同信任嘅人擺喺埋一齊" },
                 B: { en: "Your own cosy little corner", zh: "自己一個人舒服嘅細角落" },
                 C: { en: "A place where nobody can find you", zh: "一個邊個都搵唔到你嘅地方" },
                 D: { en: "You don't want to stay in that space", zh: "不想留喺呢個空間" } } }
        ]
      },
      {
        id: "I4", theme: "low",
        title: { en: "Quiz 4 · Low mood & lost interest (the sea, the paints, the flower)", zh: "問卷四 · 低落、失去興趣（海、顏料、花）" },
        questions: [
          { q: { en: "Imagine a sea. What does its surface look like in the first image that comes to you?", zh: "想像一片海，你腦中海面係點？" },
            o: { A: { en: "Soft shimmering light, clear water", zh: "波光柔和，海水清澈" },
                 B: { en: "Calm, with no big waves", zh: "平靜，冇大浪" },
                 C: { en: "Grey and hazy, with no sunlight", zh: "灰濛濛，冇陽光" },
                 D: { en: "Big waves, a dark and heavy sea", zh: "浪好大，海面陰沉" } } },
          { q: { en: "You are given a box of paints. Which do you pick up first?", zh: "你攞到一盒顏料，你會先拿起邊支？" },
            o: { A: { en: "Warm colours: yellow, light orange", zh: "暖色調：黃、淺橙" },
                 B: { en: "Neutral colours: light grey, light blue", zh: "中性色：淺灰、淺藍" },
                 C: { en: "Dark colours: deep blue, ink green", zh: "深色：深藍、墨綠" },
                 D: { en: "Black and dark grey", zh: "黑色、深灰" } } },
          { q: { en: "A flower slowly changes in front of you. How do you imagine it changing?", zh: "一朵花喺你面前慢慢變化，你想像佢會點？" },
            o: { A: { en: "Slowly blooming", zh: "慢慢綻放" },
                 B: { en: "Staying as it is, opening quietly", zh: "維持原樣，安靜咁開住" },
                 C: { en: "Slowly withering", zh: "慢慢枯萎" },
                 D: { en: "Dropping and dying at once; you don't want to look", zh: "直接凋謝，不想再睇" } } },
          { q: { en: "You have a whole free weekend. What do you instinctively want to do?", zh: "週末成一日自由時間，你本能想點做？" },
            o: { A: { en: "Go and do something you enjoy", zh: "搵喜歡嘅事去做" },
                 B: { en: "Do something light and easy", zh: "隨便做啲輕鬆嘅小事" },
                 C: { en: "Lie there spacing out, no energy at all", zh: "躺喺度發呆，冇動力" },
                 D: { en: "Feel that nothing is enjoyable at all", zh: "覺得做咩都冇樂趣" } } }
        ]
      },
      {
        id: "I5", theme: "anxiety",
        title: { en: "Quiz 5 · Overthinking & worry (the wheel, the bubble, the fog)", zh: "問卷五 · 自我內耗、反覆焦慮（轉盤、氣泡、迷霧）" },
        questions: [
          { q: { en: "There is a spinning wheel in your mind. How fast is it turning?", zh: "腦入面有一個轉盤，佢轉動嗰陣速度係點？" },
            o: { A: { en: "Turning slowly, at a steady pace", zh: "慢慢轉，節奏平穩" },
                 B: { en: "Medium speed, you can keep up", zh: "中等速度，可以跟到" },
                 C: { en: "Turning fast, it won't stop", zh: "轉得好快，停唔落嚟" },
                 D: { en: "Spinning wildly, out of your control", zh: "瘋狂旋轉，控制唔到" } } },
          { q: { en: "A bubble drifts towards you. What do you feel about it?", zh: "有個氣泡飄向你，你覺得佢會點？" },
            o: { A: { en: "It drifts gently; it is fine if it touches you", zh: "輕輕飄嚟，碰一下都冇關係" },
                 B: { en: "It comes closer slowly; you may choose to touch it", zh: "慢慢靠近，你可以選擇觸碰" },
                 C: { en: "You feel tense when it gets close", zh: "靠近嘅時候你會緊張" },
                 D: { en: "You fear it will burst and frighten you", zh: "害怕佢會爆破、嚇到自己" } } },
          { q: { en: "After finishing a small task, what does your mind usually do?", zh: "一件小事做完，你個腦會點？" },
            o: { A: { en: "Let it go and move on to the next thing", zh: "放低，轉做下一件事" },
                 B: { en: "Think back on it now and then", zh: "偶爾回想一下" },
                 C: { en: "Keep going back to check it and blame yourself", zh: "反覆回頭檢查、怪自己" },
                 D: { en: "Keep replaying it and can't get out of it", zh: "一直回想，好耐都走唔出嚟" } } },
          { q: { en: "Fog appears ahead of you. What do you believe?", zh: "前面出現迷霧，你覺得會點？" },
            o: { A: { en: "After a short walk the fog will clear", zh: "行一陣霧就會散開" },
                 B: { en: "If you walk slowly, you will see the way", zh: "慢慢行，會睇清條路" },
                 C: { en: "The fog will keep blocking your view", zh: "霧會一直擋住視線" },
                 D: { en: "Something bad is hidden inside the fog", zh: "迷霧入面藏住不好的嘢" } } }
        ]
      }
    ],
    scenario: [
      {
        id: "S1", theme: "academic",
        title: { en: "Quiz 1 · Academic pressure (everyday study situations)", zh: "問卷一 · 學業壓力（日常溫習情境）" },
        questions: [
          { q: { en: "You planned to revise at the weekend, but you open the book and have no energy. What do you do?", zh: "週末你排好時間溫習，但一改開書本就提唔起勁，你會點？" },
            o: { A: { en: "Rest 10 minutes first, then start slowly", zh: "先休息10分鐘，再慢慢開始" },
                 B: { en: "Keep blaming yourself for being lazy and force through", zh: "不斷怪自己偷懶，硬撐住捱" },
                 C: { en: "Give up completely, don't want to touch the books", zh: "擺喺度算數，完全不想碰書本" },
                 D: { en: "Worried about falling behind, you lose sleep over it", zh: "擔心追唔上，直接失眠焦慮" } } },
          { q: { en: "You get back a test result that is not good. What is your first reaction?", zh: "測考成績派返嚟，唔好，你第一個反應係？" },
            o: { A: { en: "Find out what you got wrong and adjust slowly", zh: "搵出邊度錯，慢慢調整" },
                 B: { en: "Feel you are useless and dismiss all your effort", zh: "覺得自己好冇用，否定全部努力" },
                 C: { en: "Don't want to mention it to anyone", zh: "不想同任何人講呢件事" },
                 D: { en: "Afraid of being blamed by family and teachers", zh: "害怕家人同老師的責備" } } },
          { q: { en: "Many assignments pile up at once. What is your feeling?", zh: "好多功課一齊堆喺度，你覺得點？" },
            o: { A: { en: "Break them into parts and do them one by one", zh: "拆分任務，一件一件做完" },
                 B: { en: "Your head feels stuffed and goes blank", zh: "壓力塞滿個頭，腦中一片空白" },
                 C: { en: "Avoid it and postpone to the last minute", zh: "逃避，拖延到最後一刻" },
                 D: { en: "Feel that nothing you do will meet expectations", zh: "覺得點做都達唔到期待" } } },
          { q: { en: "When you think about the future (DSE / advancement), what is usually true?", zh: "諗到將來 DSE／升學，你通常會點？" },
            o: { A: { en: "There is some worry, but you carry on as usual", zh: "有擔心，但仍然可以照常生活" },
                 B: { en: "Constant panic, often imagining the worst outcome", zh: "持續恐慌，成日諗最壞的結果" },
                 C: { en: "Numb — you don't want to think about the future", zh: "麻木，不想去思考未來" },
                 D: { en: "You often can't sleep because of this", zh: "成日因為呢件事瞓唔好" } } }
        ]
      },
      {
        id: "S2", theme: "peer",
        title: { en: "Quiz 2 · Peers & loneliness (class and friendship situations)", zh: "問卷二 · 同伴人際、孤獨（班房同交友情境）" },
        questions: [
          { q: { en: "For a group project nobody invites you. What do you do?", zh: "分組做功課，冇人主動邀你，你會點？" },
            o: { A: { en: "Ask others yourself whether you can join", zh: "主動問吓人可以唔可以加入" },
                 B: { en: "Feel disappointed but pretend it doesn't matter", zh: "心入面失落，但扮到冇事" },
                 C: { en: "Decide that nobody likes you", zh: "認定大家都唔鍾意自己" },
                 D: { en: "Avoid everyone and stay on your own", zh: "算數，避開所有人，自己一個" } } },
          { q: { en: "Your friend is playing with others and ignores you. What is your first feeling?", zh: "朋友同其他人玩得好開心，忽略咗你，你第一個感覺係？" },
            o: { A: { en: "You understand that everyone can have other friends", zh: "明白大家可以有唔同朋友" },
                 B: { en: "A bit sad, but you don't know how to bring it up", zh: "有啲難過，唔知點開口" },
                 C: { en: "Feel that you are not needed", zh: "覺得自己好多餘" },
                 D: { en: "Don't want to be the one reaching out any more", zh: "不想再主動交朋友" } } },
          { q: { en: "When something is on your mind, are you willing to tell someone?", zh: "有心事嘅時候，你願唔願意搵人講吓？" },
            o: { A: { en: "There is someone you trust to talk to", zh: "有信任嘅人可以講" },
                 B: { en: "You want to talk but fear being disliked", zh: "想講，但驚被人嫌棄" },
                 C: { en: "Don't want to talk; they wouldn't understand anyway", zh: "不想講，講了都唔會明" },
                 D: { en: "Don't want to communicate with anyone at all", zh: "完全不想同任何人傾" } } },
          { q: { en: "In a crowd, you often...", zh: "喺人群入面，你常常會點？" },
            o: { A: { en: "Can relax and be yourself", zh: "可以自在咁待喺度" },
                 B: { en: "Watch quietly, but feel lonely inside", zh: "安靜旁觀，心入面孤單" },
                 C: { en: "Feel nervous and afraid of being watched", zh: "緊張、害怕被人注視" },
                 D: { en: "Just want to get away as fast as possible", zh: "只想盡快離開" } } }
        ]
      },
      {
        id: "S3", theme: "family",
        title: { en: "Quiz 3 · Family (home and parent situations)", zh: "問卷三 · 家庭衝突（屋企同父母情境）" },
        questions: [
          { q: { en: "After an argument with your family, what do you usually do?", zh: "同屋企人吵完交之後，你一般點做？" },
            o: { A: { en: "Calm down first, then find a chance to talk", zh: "冷靜之後再搵機會傾" },
                 B: { en: "Stay alone in your room, feeling wronged", zh: "自己匿喺房入面，心入面委屈" },
                 C: { en: "Feel that your family will never understand you", zh: "覺得家人永遠唔明我" },
                 D: { en: "Don't want to go home; afraid of being at home", zh: "不想返屋企、害怕留喺屋企" } } },
          { q: { en: "Your parents have very high expectations of you. What do you do?", zh: "爸媽對你期望好高，你會點？" },
            o: { A: { en: "Do your best and accept your own limits", zh: "盡力而為，接受自己嘅局限" },
                 B: { en: "Fear falling short and stay tense for a long time", zh: "害怕達唔到，長期繃住" },
                 C: { en: "Don't want to please them and quietly push back", zh: "不想迎合，默默對抗" },
                 D: { en: "Feel that you are a burden to the family", zh: "覺得自己係屋企嘅負擔" } } },
          { q: { en: "When the atmosphere at home is heavy, what do you do?", zh: "屋企氣氛壓抑嘅時候，你會點做？" },
            o: { A: { en: "Do something you like to ease your mood", zh: "搵自己喜歡嘅事舒缓心情" },
                 B: { en: "Endure it quietly, don't dare to express your feelings", zh: "默默忍受，唔敢表達感受" },
                 C: { en: "Easily break down and want to cry", zh: "容易情緒崩潰、想喊" },
                 D: { en: "Hope to get away from this environment", zh: "想避開呢個環境" } } },
          { q: { en: "Are you willing to share your worries with your family?", zh: "你願唔願意同屋企人分享煩惱？" },
            o: { A: { en: "You can talk about some things", zh: "部分事情可以溝通" },
                 B: { en: "You want to talk but don't dare to start", zh: "想講，但唔敢開口" },
                 C: { en: "Talking would only bring blame, so you stay silent", zh: "講了只會被責備，所以唔講" },
                 D: { en: "You never open up to your family", zh: "完全唔會同屋企人交心" } } }
        ]
      },
      {
        id: "S4", theme: "low",
        title: { en: "Quiz 4 · Low mood & emptiness (daily energy and interest)", zh: "問卷四 · 低落、空虛、失去興趣（日常精神與興趣）" },
        questions: [
          { q: { en: "A hobby you used to love a lot — what is it like for you now?", zh: "以前好鍾意嘅嗜好，而家你會點？" },
            o: { A: { en: "You still enjoy it when you have time", zh: "有時間都會繼續享受" },
                 B: { en: "You think about it sometimes but have no drive", zh: "偶爾諗玩，但冇動力" },
                 C: { en: "Feel that everything is pointless", zh: "覺得一切都冇意思" },
                 D: { en: "Don't want to touch it; feel nothing helps", zh: "完全唔想碰，覺得做咩都冇用" } } },
          { q: { en: "Across a whole day, most of the time your mood is...", zh: "一日到黑，你心情大部分時間係點？" },
            o: { A: { en: "Steady — sometimes happy, sometimes flat", zh: "平穩，有開心都有平淡" },
                 B: { en: "A dull, slightly low feeling", zh: "淡淡嘅悶悶不樂" },
                 C: { en: "Persistently down, hard to feel happy", zh: "持續低落，好難開心得起" },
                 D: { en: "Feel that nothing has any meaning", zh: "覺得一切都冇意義" } } },
          { q: { en: "In your body, you often...", zh: "身體上，你經常會點？" },
            o: { A: { en: "Have normal energy", zh: "精力正常" },
                 B: { en: "Get tired and sleepy easily", zh: "容易疲憊、眼瞓" },
                 C: { en: "Very tired; long sleep doesn't restore you", zh: "好攰，瞓好耐都仲係休息唔好" },
                 D: { en: "No appetite, or eating far too much", zh: "冇胃口或者暴飲暴食" } } },
          { q: { en: "When something bad happens, you tend to...", zh: "壞事發生嘅時候，你傾向點諗？" },
            o: { A: { en: "Believe things will slowly pass", zh: "事情會慢慢過去" },
                 B: { en: "Keep drifting towards the worst thoughts", zh: "容易一味往壞處諗" },
                 C: { en: "Feel this bad state will last forever", zh: "覺得糟糕嘅狀態會一直持續" },
                 D: { en: "Feel you cannot hold on much longer", zh: "覺得自己撐唔落去" } } }
        ]
      }
    ]
  };

  function findQuiz(id) {
    var i, all = QUIZ_POOL.imagery.concat(QUIZ_POOL.scenario);
    for (i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function norm(s) { return String(s == null ? "" : s).toLowerCase(); }

  function countHits(text, list) {
    var i, n = 0;
    for (i = 0; i < list.length; i++) {
      if (text.indexOf(norm(list[i])) !== -1) n++;
    }
    return n;
  }

  /* ---- rule 3: direct self-harm / suicide wording -> skip quiz ---- */
  function detectCrisis(raw) {
    var t = norm(raw);
    var i;
    for (i = 0; i < CRISIS_EN.length; i++) if (t.indexOf(CRISIS_EN[i]) !== -1) return true;
    for (i = 0; i < CRISIS_ZH.length; i++) if (String(raw).indexOf(CRISIS_ZH[i]) !== -1) return true;
    return false;
  }

  /* ---- worry-intent check: does the text carry any emotional weight? ---- */
  function hasWorrySignal(text) {
    var t = norm(text);
    /* Emotion / concern signals — matching vocabulary, not display copy, so it
       carries both Traditional and Simplified spellings of the same word. Bare
       particles (好 唔 冇 無) are deliberately NOT listed: they appear in every
       Cantonese sentence and would make the off-topic check useless. */
    var feel = ["stress", "stressed", "pressure", "worried", "worry", "sad", "tired", "upset", "angry",
      "scared", "afraid", "lonely", "alone", "confused", "numb", "hopeless", "helpless", "tense",
      "can't", "cant", "struggle", "hard time", "trouble", "exhaust", "unhappy", "hate", "worries",
      "worrying", "meh", "no energy", "unmotivated", "worthless", "useless", "burden", "left out",
      "low", "empty", "drained", "burnout", "burnt out", "breakdown", "overwhelm", "cannot",
      "can not", "ashamed", "shame", "guilt", "irritable", "annoy", "mood", "feel like", "feel meh",
      "cry", "crying", "cried", "tears", "die", "died", "death", "pass away", "passed away",
      "lost my", "lose my", "breakup", "broke up", "argue", "arguing", "fight", "shout", "nag",
      "compare", "disappoint", "failure", "fail", "blank", "stuck", "can not sleep", "sleepless",
      "開心", "唔開心", "壓力", "煩", "驚", "累", "攰", "難過", "唔知點算", "好難", "唔得", "困扰", "困擾",
      "唔舒服", "唔安樂", "崩潰", "崩溃", "喊", "眼濕濕", "死", "去世", "走咗", "分手", "吵架", "鬧翻",
      "孤單", "孤单", "冇人理", "沒人理", "被排擠", "比較", "失望", "冇意義", "冇意思",
      "冇勁", "無勁", "提唔起", "提不起", "睜眼", "瞓唔着", "訓唔着", "瞓唔到", "做唔切", "趕唔切",
      "追唔上", "搞唔掂", "撐唔住", "頂唔順", "好大", "好多", "成日", "一直", "最近", "覺得", "觉得",
      "擔心", "担心", "焦慮", "焦虑", "緊張", "紧张", "害怕", "怕"];
    var i;
    for (i = 0; i < feel.length; i++) if (t.indexOf(norm(feel[i])) !== -1) return true;
    return false;
  }

  /* ---- classify the concern theme from the student's own words ---- */
  function classifyTopic(raw) {
    var lower = norm(raw);           /* CJK is unaffected by lower-casing */
    var keys = Object.keys(THEMES), best = null, bestScore = 0, i, sc;
    for (i = 0; i < keys.length; i++) {
      sc = countHits(lower, THEMES[keys[i]].kwEn) + countHits(lower, THEMES[keys[i]].kwZh);
      if (sc > bestScore) { bestScore = sc; best = keys[i]; }
    }
    return { theme: bestScore > 0 ? best : null, strength: bestScore };
  }

  /* "stop" only when the message *is* a stop request — a long worry sentence
     that merely contains the word "stop" must not kill the session.
     EN: must open with a stop phrase (so "I can't stop overthinking" is NOT a stop).
     CJK: multi-character stop phrases are unambiguous, so they may appear anywhere,
     but bare "停" is excluded (e.g. "個腦停唔落嚟" is a worry, not a stop). */
  var STOP_RE_EN = /^(please\s+|pls\s+|i\s+want\s+to\s+|i\s+need\s+to\s+|can\s+i\s+|let\s+me\s+|just\s+|i\s+)?(stop\b|quit\b|exit\b|cancel\b|pause\b|end\s+it\b)/;
  var STOP_RE_ZH = /(停止|停低|退出|算喇|算啦|唔做喇|唔想做喇|唔答喇|唔想再做|唔想繼續|不想再做|不想繼續|結束喇|結束咗)/;
  function isStopIntent(raw) {
    var s = String(raw == null ? "" : raw).trim(), t = norm(s);
    if (!t || t.length > 30) return false;
    return STOP_RE_EN.test(t) || STOP_RE_ZH.test(s);
  }

  /* Off-topic = we could not recognise any concern in the message.
     A stop request or a crisis mention is never bounced, so a student in pain
     can't be pushed back into a quiz about the weather. */
  function isOffTopic(raw) {
    var t = norm(raw);
    if (!t) return true;
    if (OFF_Q.test(t)) return true;                    /* a request, not a worry */
    if (isStopIntent(raw)) return false;               /* handled by the stop branch */
    if (detectCrisis(raw)) return false;               /* never bounce a crisis mention */
    if (OFF_EN.test(t.trim())) return true;            /* bare greeting / mash */
    if (classifyTopic(raw).theme) return false;
    if (hasWorrySignal(raw)) return false;
    return true;                                       /* nothing recognisable */
  }

  /* ---- panel-fixed scoring: count C/D tags ---- */
  function scoreAnswers(letters) {
    var cd = 0, i;
    for (i = 0; i < letters.length; i++) if (letters[i] === "C" || letters[i] === "D") cd++;
    var risk = cd <= 1 ? "low" : (cd === 2 ? "moderate" : "high");
    return { cdCount: cd, counts: { A: count(letters, "A"), B: count(letters, "B"), C: count(letters, "C"), D: count(letters, "D") }, risk: risk };
  }
  function count(arr, x) { var n = 0, i; for (i = 0; i < arr.length; i++) if (arr[i] === x) n++; return n; }

  /* ---- quiz routing: theme + mode -> audited item set ---- */
  function resolveQuiz(theme, mode) {
    var th = THEMES[theme];
    if (!th) return null;
    var id = mode === "A" ? th.imagery : th.scenario;
    return { quiz: findQuiz(id), proxy: mode === "B" && !!th.scenarioProxy };
  }

  var CORE = { THEMES: THEMES, QUIZ_POOL: QUIZ_POOL, CRISIS_EN: CRISIS_EN, CRISIS_ZH: CRISIS_ZH,
    detectCrisis: detectCrisis, classifyTopic: classifyTopic, scoreAnswers: scoreAnswers,
    resolveQuiz: resolveQuiz, findQuiz: findQuiz, isStopIntent: isStopIntent,
    isOffTopic: isOffTopic, hasWorrySignal: hasWorrySignal };
  if (typeof module !== "undefined" && module.exports) module.exports = CORE;

  /* ====== CORE_END ====== */

  if (typeof document === "undefined") return;   /* node: logic only */

  var ERRORS = [];
  window.addEventListener("error", function (e) { ERRORS.push(String(e.message)); });
  var wantQA = /[?&]qa=1/.test(location.search);

  /* ================= support roster (opens from Step 4's button) ==========
     These are ROLES, not people: a school's real social worker list, rooms and
     hours are decided by its social work team, so the demo never invents names
     or claims a real appointment. The booking lives in memory only and dies
     with the tab, which keeps the "nothing is stored" promise true.           */
  var ROSTER = [
    { id: "W1",
      role: { en: "School Social Worker · on campus", zh: "學校社工 · 駐校" },
      scope: { en: "Exam pressure, study pace, cannot sleep", zh: "考試壓力、讀書節奏、瞓唔着" },
      lang: { en: "Cantonese / English", zh: "廣東話／英語" },
      slots: [{ en: "Tue 14:30", zh: "週二 14:30" }, { en: "Wed 09:00", zh: "週三 09:00" },
              { en: "Fri 15:30", zh: "週五 15:30" }] },
    { id: "W2",
      role: { en: "Senior Social Worker · guidance office", zh: "高級社工 · 學校輔導組" },
      scope: { en: "Family clashes, friendship, being compared", zh: "同屋企人鬥氣、朋友關係、被人比較" },
      lang: { en: "Cantonese / Mandarin / English", zh: "廣東話／普通話／英語" },
      slots: [{ en: "Mon 10:00", zh: "週一 10:00" }, { en: "Thu 13:00", zh: "週四 13:00" },
              { en: "Thu 16:00", zh: "週四 16:00" }] },
    { id: "W3",
      role: { en: "Youth Outreach Worker · walk-in, evening", zh: "青年外展社工 · 可即席、夜晚時段" },
      scope: { en: "Low mood, being left out, night hours", zh: "情緒低落、冇人理、夜晚先搵到人" },
      lang: { en: "Cantonese", zh: "廣東話" },
      slots: [{ en: "Wed 18:00", zh: "週三 18:00" }, { en: "Sat 15:00", zh: "週六 15:00" }] }
  ];

  function findWorker(id) {
    for (var i = 0; i < ROSTER.length; i++) { if (ROSTER[i].id === id) return ROSTER[i]; }
    return null;
  }

  /* ================= i18n (panel wording, verbatim where specified) ======= */
  var T = {
    brandSub: { en: "Anonymous mood screening demo · all secondary students", zh: "匿名情緒初篩示範 · 全港中學生" },
    /* Online-safety badge: stays visible whatever the hosting route, so nobody
       mistakes a course artefact for a live service. */
    demoPill: { en: "Course demo · not a live service", zh: "課程示範 · 唔係真實服務" },
    sup: {
      tag: { en: "Support · demo roster", zh: "支援 · 示範名單" },
      title: { en: "Want a real person? Choose which role to ask", zh: "想搵真人傾？揀一個想約嘅職別" },
      intro: { en: "Screening only says where you are standing right now — a person is what changes things. This list is a DEMO of roles, not your school\u0027s real staff list: names, rooms and hours are set by the school social work team.",
               zh: "篩查只會話你知而家企喺邊，真正可以改變事情嘅係人。下面係**示範**職別名單，唔係你學校真實嘅職員名單；實際人名、地點同時間，由學校社工組決定。" },
      mock: { en: "DEMO ROSTER · not real staff · no appointment is actually made", zh: "示範名單 · 唔係真實職員 · 唔會真的預約到" },
      head: { en: "Role · who it fits · language · slots", zh: "職別 · 適合邊類困擾 · 語言 · 時段" },
      fits: { en: "Fits", zh: "適合" },
      langLbl: { en: "Language", zh: "語言" },
      slotCount: { en: "Slots", zh: "時段" },
      pick: { en: "Choose a role to see its free slots.", zh: "揀一個職別，先見到可選時段。" },
      askSlot: { en: "Pick one time — one tap cancels it again.", zh: "揀一個時間 — 一下就可以取消。" },
      notNow: { en: "Not now", zh: "而家唔想約" },
      barBtn: { en: "Show the hotline bar below", zh: "睇頁底支援熱線" },
      closedNow: { en: "You chose not to book. That is fine, and nothing was recorded.", zh: "你選擇而家唔約，完全冇問題，亦冇記錄過任何嘢。" },
      reopen: { en: "Open the roster again", zh: "再睇一次名單" },
      doneTag: { en: "Demo booking · nothing was sent", zh: "示範預約 · 冇送出任何資料" },
      doneHead: { en: "Picked, in this demo:", zh: "呢個示範入面你揀咗：" },
      roleLbl: { en: "Role", zh: "職別" },
      slotLbl: { en: "Time", zh: "時間" },
      stateLbl: { en: "Status", zh: "狀態" },
      stateV: { en: "Held in this tab only — not confirmed, not sent", zh: "只喺呢個分頁暫存 — 冇確認、冇送出" },
      whereLbl: { en: "Real booking", zh: "真實預約" },
      whereV: { en: "Ask the school social work team at the guidance office, or call a hotline below.", zh: "去學校輔導組搵社工主任，或者打頁底任何一條熱線。" },
      doneBody: { en: "This step only shows what booking feels like, so you can decide whether to do it for real. It is not sent to the school, not stored anywhere, and it disappears when the page closes. If you cannot wait, the numbers at the bottom are answered 24 hours a day.",
                  zh: "呢一步只係俾你感受吓預約係點，方便你決定要唔要真的約。唔會傳給學校、唔會儲存喺任何地方，收咗個頁就冇晒。如果等唔切，頁底嘅熱線全日都有人聽。" },
      cancelBtn: { en: "Cancel this demo booking", zh: "取消呢個示範預約" },
      change: { en: "Choose a different role", zh: "轉另一個職別" },
      cancelTag: { en: "Cancelled · nothing was stored", zh: "已取消 · 冇儲存過任何嘢" },
      cancelled: { en: "Cancelled. Nothing was ever stored, so there is nothing left to delete.", zh: "已取消。由頭到尾都冇儲存過，所以冇嘢需要刪走。" },
      dashNote: { en: "Nothing you tap here is added to the dashboard numbers on the right — those are separate anonymous aggregates.", zh: "呢度擰過嘅嘢唔會加入右邊嘅統計數字 — 嗰邊係另外嘅匿名匯總。" },
      stopNote: { en: "You can close this page, press the stop button, or just walk away at any point.", zh: "你隨時可以收咗呢個頁、撳「停止」，或者直接行開。" }
    },
    disclaimer: {
      en: '⚠️ <b>Disclaimer:</b> This is a student project demo for presentation only. It is an initial emotional screening tool, <b>NOT clinical diagnosis or therapy</b>. If you are in immediate crisis, use the Hong Kong 24-hour mental health hotlines listed at the bottom.',
      zh: '⚠️ <b>免責聲明：</b>本頁面只用作課業匯報示範，僅作初步情緒篩查，<b>並非臨床診斷或心理治療</b>。如你正處於危機狀態，請使用頁底香港24小時精神健康支援熱線。'
    },
    aboutTitle: { en: "About EchoCheck", zh: "關於 EchoCheck" },
    aboutSub: { en: "Co-designed and audited by an interdisciplinary team", zh: "由跨學科團隊聯合設計並審定框架" },
    about: {
      target: { en: "Target Users", zh: "對象" },
      targetV: { en: "Hong Kong secondary students (Secondary 1–6, all forms)", zh: "香港中學生（中一至中六，全級適用）" },
      team: { en: "Co-design Team", zh: "聯合設計團隊" },
      teamV: { en: "Clinical psychologists, education researchers, school social workers, subject teachers and parent representatives", zh: "臨床心理學家、教育學者、學校社工、科任老師與家長代表" },
      flow: { en: "Core Workflow", zh: "核心流程" },
      flowSteps: { en: "Share worries → AI matches suitable quiz → User selects quiz mode → Complete questions → Generate emotional profile → Risk stratification → Support referral", zh: "說出煩惱 → AI 配對合適問卷 → 使用者選擇模式 → 逐題作答 → 產生情緒画像 → 風險分級 → 支援轉介" },
      modes: { en: "Two quiz modes available", zh: "兩種測評模式可自由選擇" },
      modeA: { en: "Projective imagery mode (recommended): imaginative, metaphor-based questions, lower defensiveness", zh: "意象投射模式（推薦）：想像、隱喻式題目，防備感較低" },
      modeB: { en: "Scenario self-report mode: direct daily scenario questions, simpler to understand", zh: "情景自評模式：直接的生活情景選擇題，較易明白" },
      value: { en: "Value", zh: "價值" },
      valueV: { en: "Free, professionally audited, low-shame screening", zh: "免費、經專業審定、低羞恥感的篩查" },
      boundary: { en: "Boundary", zh: "界線" },
      boundaryV: { en: "We only do pre-screening and referral. We cannot give formal mental health diagnosis.", zh: "我們只作初步篩查與轉介，不能提供任何正式的精神健康診斷。" },
      gov: { en: "Item governance", zh: "題目治理" },
      govV: { en: "Pool = 5 audited imagery sets + 4 audited scenario sets. The demo never invents questions; any expansion must first be approved by the expert panel.", zh: "題庫池＝5套審定意象題＋4套審定情景題。示範不會即興創作題目；任何擴充都必須先經專家小組審定。" },
      priv: { en: "Privacy", zh: "私隱" },
      privV: { en: "Runs in your browser only. Nothing is uploaded, stored or shared with the school.", zh: "只喺你嘅瀏覽器內運行，唔會上傳、儲存或分享任何內容。" }
    },
    chatTitle: { en: "Screening conversation", zh: "測評對話區" },
    chatSub: { en: "You are in control: start, pause or stop at any moment.", zh: "全程由你決定：可以隨時開始、暫停或結束。" },
    inputPh: { en: "Type your worries here…", zh: "喺度輸入你最近的心事…" },
    btnSend: { en: "Send", zh: "送出" },
    btnStop: { en: "Stop / Exit", zh: "停止／退出" },
    hint: { en: "Press Enter to send · Shift + Enter for a new line · You may type “stop” at any point · A, B, C, D also work as keyboard answers.", zh: "Enter 送出 · Shift + Enter 換行 · 任何時候輸入 stop／「停止」都可以結束 · 亦可用鍵盤 A B C D 作答。" },
    chipsTitle: { en: "Example worries (tap to fill)", zh: "示例煩惱（點擊即填入）" },

    /* ---- fixed opening line (spec) ---- */
    open: {
      en: ["Hi. You can share anything that has been troubling you recently. All your input is anonymous.",
        "After you share your concerns, I will prepare suitable mood quizzes for you. You can choose between the imaginative imagery quiz (recommended) or the simple scenario quiz.",
        "There are no right or wrong answers. You may stop at any time."],
      zh: ["你好。你可以講吓最近有啲咩困住你，你輸入嘅內容全部匿名。",
        "講完之後，我會為你準備合適的情緒小問卷；你可以揀「意象想像版」（推薦），或者「生活情景版」。",
        "呢度冇啱唔啱之分，你隨時可以停低。"]
    },
    /* ---- Step 1 : mode choice (spec) ---- */
    thanks: {
      en: "Thank you for sharing. Based on what you’ve told me, I’ve prepared matching mood check options.",
      zh: "多謝你願意講出嚟。根據你講嘅情況，我準備咗對應的情緒篩查卷。"
    },
    matched: { en: "Matched concern theme", zh: "配對到嘅困擾主題" },
    matchNote: { en: "Routing is rule-based (keyword themes set by the expert panel). No diagnosis is made from what you typed.", zh: "配對屬規則式關鍵詞匹配（由專家小組設定主題），不會根據你輸入嘅內容作任何診斷。" },
    chooseMode: { en: "Please choose your preferred quiz mode:", zh: "請揀你偏好嘅問卷模式：" },
    modeATitle: { en: "A. Imagery projective quiz", zh: "A. 意象投射問卷" },
    modeABody: { en: "imagination & picture-based, recommended", zh: "靠想像同畫面（推薦）" },
    modeBTitle: { en: "B. Scenario choice quiz", zh: "B. 情景選擇問卷" },
    modeBBody: { en: "daily situation questions", zh: "日常情境選擇題" },
    themeAsk: {
      en: "I am not sure which area fits you best. Which of these sounds closest to you right now?",
      zh: "我唔太肯定邊個主題最貼近你。以下邊一個最像你而家的情况？"
    },
    themeAskNote: { en: "You can also skip this and just type a few words about your situation.", zh: "你也可以唔揀，直接打多幾個字形容你嘅情况。" },
    proxyNote: {
      en: "Note: for this theme the audited scenario set available in this demo is the academic-pressure set (closest same-standard match). The imagery set for this theme is fully matched.",
      zh: "註：就呢個主題，本示範可用嘅審定情景題集為「學業壓力」集（最接近的同規範配對）；該主題的意象題集則完全對應。"
    },
    /* ---- Step 2 : question card ---- */
    qTag: { en: "Question", zh: "題目" },
    qTagOf: { en: "of", zh: "／共" },
    answerAsk: { en: "Tap an option, or press A / B / C / D.", zh: "點擊選項，或輸入 A / B / C / D。" },
    ansOf: { en: "Your answer", zh: "你揀嘅答案" },
    quizSet: { en: "Quiz set", zh: "問卷集" },
    modeUsed: { en: "Mode", zh: "模式" },
    modeNameA: { en: "Imagery projective", zh: "意象投射" },
    modeNameB: { en: "Scenario self-report", zh: "情景自評" },
    /* ---- Step 3 : profile + risk ---- */
    profileTitle: { en: "Your emotional profile (preset reading)", zh: "你的情緒画像（預設解讀）" },
    tallyTitle: { en: "Tag tally (panel rule)", zh: "標籤統計（專家組規則）" },
    cdCount: { en: "C/D count", zh: "C／D 數目" },
    ruleLine: { en: "0–1 → Low · 2 → Moderate · 3–4 → High", zh: "0–1 → 低風險 · 2 → 中等風險 · 3–4 → 高風險" },
    reportTitle: { en: "Risk stratification report", zh: "風險分級報告" },
    tagLabel: {
      A: { en: "A = stable positive", zh: "A = 穩定正向" },
      B: { en: "B = mild stress, adjustable", zh: "B = 輕微壓力、可調節" },
      C: { en: "C = emotional burden, ongoing", zh: "C = 情緒負擔、持續困擾" },
      D: { en: "D = strong distress, high-risk signal", zh: "D = 強烈痛苦、高風險信號" }
    },
    riskTitle: {
      low: { en: "Your mood check result: Low risk", zh: "你的情緒篩查結果：低風險" },
      moderate: { en: "Your mood check result: Moderate risk", zh: "你的情緒篩查結果：中等風險" },
      high: { en: "Your mood check result: High risk", zh: "你的情緒篩查結果：高風險" }
    },
    riskLow: {
      en: ["You are facing mild stress. Here are some self-regulation tips you can try freely:",
        "· 5-minute box breathing exercise",
        "· Keep a simple mood diary",
        "· Reserve time for one small enjoyable activity every day"],
      zh: ["你正面對輕度壓力。以下自我調整方法你可以隨意試試：",
        "· 5 分鐘 box breathing 呼吸練習",
        "· 寫一句式情緒日記",
        "· 每日預留時間做一件自己喜歡嘅小事"]
    },
    riskLowNote: { en: "Note: You can come back anytime if your mood gets worse.", zh: "註：如果情緒轉差，你可以隨時返嚟再做一次。" },
    riskMod: {
      en: ["Your recent stress is affecting your daily life. It is recommended that you talk to a trusted school teacher, school social worker or a supportive family member. Your school’s counselling service is available for you. You are not forced to take any action."],
      zh: ["你最近嘅壓力已經影響日常生活。建議你搵信任嘅老師、學校社工或者支持你嘅家人傾吓；你學校嘅輔導服務可以用。你唔會被要求一定要做咩。"]
    },
    riskHigh: {
      en: ["Your responses show you are experiencing severe distress. Please reach out to professional mental health support immediately.",
        "List of Hong Kong crisis hotlines:",
        "· 24-hour Suicide Prevention Hotline: 2896 0000",
        "· Youth Mental Health Hotline: 2777 8899",
        "Seek help from registered psychologists or psychiatrists as soon as possible."],
      zh: ["你嘅回答顯示你正經歷較大嘅困擾。請即時聯絡專業精神健康支援。",
        "香港危機熱線一覽：",
        "· 24小時防止自殺熱線：2896 0000",
        "· 青年精神健康熱線：2777 8899",
        "請盡快尋求註冊心理學家或精神科醫生的協助。"]
    },
    /* preset profile readings — mode x risk, nothing free-form */
    profile: {
      imgLow: { en: "Your imagination leans toward soft, bright scenes. You generally hold gentle expectations for things ahead.", zh: "你嘅想像偏向柔和、明亮嘅畫面，對前面嘅事仍然有溫和嘅期待。" },
      imgMod: { en: "You tend to imagine dim, quiet scenes. You have been carrying some emotional weight recently.", zh: "你比較常想像偏暗、安靜嘅畫面，最近似乎背住一些情緒上嘅重量。" },
      imgHigh: { en: "Your choices lean toward stormy, dark imagery. It suggests you are under heavy distress at this moment.", zh: "你嘅選擇偏向風暴、陰暗嘅畫面，反映呢個時刻你正承受較大嘅困擾。" },
      sceLow: { en: "Your answers point to steady day-to-day coping. You usually take things one step at a time.", zh: "你嘅回答顯示你日常大致應對到，習慣一步一步處理事情。" },
      sceMod: { en: "Your answers point to stress that has been hanging around and is starting to affect daily life.", zh: "你嘅回答顯示壓力已經留咗一陣，開始影響日常生活。" },
      sceHigh: { en: "Your answers point to heavy distress that feels hard to carry on your own right now.", zh: "你嘅回答顯示你而家承受住好重嘅困擾，好似好難一個人撐住。" },
      focus: { en: "This check focused on:", zh: "今次篩查集中嘅主題：" }
    },
    /* ---- Step 4 : closing (spec) ---- */
    closing: {
      en: "This is only a preliminary screening result. The interpretation is for reference only, not a psychological diagnosis. You can exit, restart the check, or view support resources below.",
      zh: "呢個只係初步篩查結果，解讀僅供參考，並非心理診斷。你可以離開、重新再做一次，或者喺下方查看支援資源。"
    },
    btnRestart: { en: "Restart new check", zh: "重新開始新篩查" },
    btnRes: { en: "View support resources", zh: "查看支援資源" },
    /* ---- off-topic & stop ---- */
    redirect: {
      en: "This platform is for mood screening. You may tell me what is bothering you recently to start the quiz, or press restart.",
      zh: "呢個平台用嚟做情緒篩查。你可以講吓最近有咩困住你，然後開始問卷；或者按「重新開始」。"
    },
    answerAskOnly: {
      en: "For this question just tap an option, or type A / B / C / D. If you would rather not continue, type stop.",
      zh: "呢題請點擊選項，或者輸入 A / B / C / D。如果不想繼續，輸入 stop 就可以結束。"
    },
    stoppedTitle: { en: "Stopped — nothing was saved", zh: "已結束 · 沒有任何內容被儲存" },
    stoppedBody: {
      en: ["You can stop at any time — that is completely fine and your own decision.",
        "This demo kept everything in this browser window only; no record was made and the school dashboard cannot see you.",
        "If anything still feels heavy, the support resources at the bottom are there whenever you want them."],
      zh: ["你隨時可以停止 — 呢個決定完全冇問題，由你自己話事。",
        "呢個示範所有內容只停留喺你呢個瀏覽器視窗：冇做任何記錄，學校後台都睇唔到你。",
        "如果仲覺得心入面好重，頁底嘅支援資源隨時都可以用。"]
    },
    btnResume: { en: "Start a check again", zh: "重新開始篩查" },
    /* ---- crisis bypass ---- */
    crisisTag: { en: "Support first · screening paused", zh: "支援優先 · 篩查已暫停" },
    crisisTitle: { en: "What you wrote sounds really heavy — and I am glad you said it", zh: "你講嘅嘢聽落真的好重 — 好高興你肯講出嚟" },
    crisisBody: {
      en: ["Because you mentioned thoughts of harming yourself or not wanting to be here, this demo stops the quiz straight away and puts support first. This is a safety rule set by the expert panel.",
        "This is still not a diagnosis, and you are not in trouble. But you should not carry this alone — please contact one of these now:",
        "· 24-hour Suicide Prevention Hotline: 2896 0000",
        "· Youth Mental Health Hotline: 2777 8899",
        "· 182 Community Support Line (24 hours)",
        "If you feel unsafe right now, tell an adult near you — teacher, school social worker, parent — or go to the nearest A&E department."],
      zh: ["因為你提到傷害自己或者唔想喺度嘅念頭，呢個示範會即刻暫停問卷，把支援放喺第一位 — 呢個係專家小組設定嘅安全規則。",
        "呢個仍然唔係診斷，你亦都冇做錯任何事。但你好難一個人撐 — 請即時聯絡其中一個：",
        "· 24小時防止自殺熱線：2896 0000",
        "· 青年精神健康熱線：2777 8899",
        "· 182 情緒支援專線（24小時）",
        "如果你而家覺得唔安全，請即時話俾身邊嘅大人知 — 老師、學校社工、家長 — 或者去最近急症室。"]
    },
    crisisContinue: { en: "I am safe for now — continue with a check", zh: "我暫時安全 — 繼續做篩查" },
    /* ---- dashboard (block 4) ---- */
    dashTitle: { en: "School Social Worker Dashboard (Aggregated Anonymous Data)", zh: "學校社工後台（匯總匿名數據）" },
    dashNote: { en: "This panel only shows group-level statistics. NO individual student information will be recorded.", zh: "呢個面板只顯示群組層面統計，不會記錄任何個別學生資料。" },
    dashTrendH: { en: "Recent 7-day mood trend", zh: "近7日情緒趨勢" },
    dashTrendSub: { en: "aggregate distress index · lower = calmer", zh: "群組困擾指數 · 越低越平穩" },
    dashTopH: { en: "Top 3 common concerns", zh: "最常見關注主題 Top 3" },
    dashRiskH: { en: "Risk distribution summary", zh: "風險分級分佈" },
    dashUseH: { en: "How schools use this", zh: "學校如何用呢組數據" },
    dashUse: { en: "This dashboard helps schools arrange mental health workshops and support plans.", zh: "呢個後台協助學校安排精神健康工作坊同支援計劃。" },
    dashStatSessions: { en: "anonymous checks (7d)", zh: "匿名篩查次數（7日）" },
    dashStatDone: { en: "completion rate", zh: "完成率" },
    dashStatRef: { en: "referred to school SW", zh: "轉介學校社工" },
    dashStatZero: { en: "individual records stored", zh: "個人記錄存檔數" },
    dashDays: { en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], zh: ["一", "二", "三", "四", "五", "六", "日"] },
    dashPrivacy: { en: "<b>Aggregation rule:</b> anything below 10 checks in a group is not displayed, so nobody can be identified from these numbers. Data on this page is simulated for the presentation.", zh: "<b>匯總規則：</b>任何組別不足10次篩查都不會顯示，因此無法從數字辨識個人。呢頁數字為課業匯報嘅模擬數據。" },
    riskWords: { low: { en: "Low risk", zh: "低風險" }, moderate: { en: "Moderate risk", zh: "中等風險" }, high: { en: "High risk", zh: "高風險" } },
    /* ---- footer resources ---- */
    resTitle: { en: "Hong Kong Youth Mental Health Resources", zh: "香港青少年精神健康資源" },
    resSim: { en: "Simulated demo content — verify hotline numbers with the school before public release.", zh: "示範用模擬內容 — 公開使用前請與學校核實熱線電話。" },
    resources: [
      { name: { en: "24-hour Suicide Prevention Hotline", zh: "24小時防止自殺熱線" }, num: "2896 0000", desc: { en: "24h crisis support", zh: "24小時危機支援" } },
      { name: { en: "Youth Mental Health Hotline", zh: "青年精神健康熱線" }, num: "2777 8899", desc: { en: "youth-focused counselling referrals", zh: "青少年輔導轉介" } },
      { name: { en: "182 Community Support Line", zh: "182 情緒支援專線" }, num: "182", desc: { en: "24h emotional support", zh: "24小時情緒支援" } },
      { name: { en: "Samaritans Hotline", zh: "撒瑪利亚防止自杀會熱線" }, num: "2389 2222", desc: { en: "24h emotional support, anonymous", zh: "24小時匿名情緒支援" } },
      { name: { en: "Your school social worker / counsellor", zh: "你學校嘅學校社工／輔導老師" }, num: null, desc: { en: "walk in or ask for a private chat", zh: "可以直接搵佢哋傾" } }
    ],
    onlineLabel: { en: "Online (HKFYG e-CONNECT youth counselling)", zh: "網上輔導（青協 e-CONNECT 青少年輔導）" }
  };

  /* short tag words for the tally line (panel vocabulary) */
  var TAG_SHORT = {
    A: { en: "A stable", zh: "A 穩定" },
    B: { en: "B mild", zh: "B 輕微" },
    C: { en: "C burden", zh: "C 困擾" },
    D: { en: "D distress", zh: "D 痛苦" }
  };

  var L = "en";
  function t(key) {
    /* one dotted level is supported (T.sup.mock) so grouped copy stays readable;
       a miss must be loud — echoing the raw key would print "sup.slotLbl" into
       the conversation, which is exactly what happened before this fix. */
    var dot = key.indexOf("."), v;
    if (dot < 0) v = T[key];
    else { var g = T[key.slice(0, dot)]; v = g ? g[key.slice(dot + 1)] : null; }
    return v ? v[L] : "⚠ missing string: " + key;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ================= state ================= */
  var S = {
    lang: "en",
    phase: "awaitWorry",      /* intro | themePick | modePick | quiz | result | stopped | crisisHold */
    theme: null,
    mode: null,
    quiz: null,
    proxy: false,
    qi: 0,
    answers: [],
    book: { worker: null, slot: null },   /* support roster pick, memory only */
    msgs: [],                 /* {role, kind, data} */
    busy: false
  };

  var thread = document.getElementById("thread");
  var input = document.getElementById("input");
  var chipsBox = document.getElementById("chips");

  /* ================= static panels ================= */
  function renderStatic() {
    document.documentElement.lang = L === "en" ? "en" : "zh-HK";
    document.getElementById("disclaimer").innerHTML = t("disclaimer");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = T[el.getAttribute("data-i18n")] ? T[el.getAttribute("data-i18n")][L] : "";
    });
    document.getElementById("btnEn").setAttribute("aria-pressed", L === "en" ? "true" : "false");
    document.getElementById("btnZh").setAttribute("aria-pressed", L === "zh" ? "true" : "false");
    input.setAttribute("placeholder", T.inputPh[L]);
    document.getElementById("composerHint").textContent = T.hint[L];
    renderAbout();
    renderDash();
    renderChips();
    renderResources();
  }

  function feat(title, bodyHtml, tick) {
    return '<div class="feature"><div class="feature-title"><span class="tick">' +
      (tick === false ? "⛔" : "✅") + "</span><span>" + esc(title) + "</span></div>" +
      '<div class="feature-body">' + bodyHtml + "</div></div>";
  }

  function renderAbout() {
    var a = T.about;
    var steps = a.flow[L].split("→");
    var chain = '<div class="flow-chain">' + steps.map(function (s, i) {
      return '<span>' + esc(s.trim()) + "</span>" + (i < steps.length - 1 ? " <em style='color:#9db4c8;font-style:normal'>›</em> " : "");
    }).join("") + "</div>";
    document.getElementById("aboutBody").innerHTML =
      feat(a.target[L], esc(a.targetV[L])) +
      feat(a.team[L], esc(a.teamV[L])) +
      feat(a.flow[L], chain) +
      feat(a.modes[L],
        '<div class="mode-line"><span class="badge rec">A</span><span>' + esc(a.modeA[L]) + "</span></div>" +
        '<div class="mode-line"><span class="badge">B</span><span>' + esc(a.modeB[L]) + "</span></div>") +
      feat(a.value[L], esc(a.valueV[L])) +
      feat(a.boundary[L], esc(a.boundaryV[L]), false) +
      feat(a.gov[L], esc(a.govV[L]), false) +
      feat(a.priv[L], esc(a.privV[L]), false);
  }

  /* ---- CJK-aware helpers so the text charts stay aligned ---- */
  function vwid(s) { var n = 0, i; for (i = 0; i < s.length; i++) n += s.charCodeAt(i) > 0x2e80 ? 2 : 1; return n; }
  function slot(s, w) { var p = "", i, n = Math.max(1, w - vwid(s)); for (i = 0; i < n; i++) p += " "; return p + s; }
  function rslot(s, w) { var p = "", i, n = Math.max(1, w - vwid(s)); for (i = 0; i < n; i++) p += " "; return s + p; }

  /* 7-day aggregate distress index (simulated demo data) */
  var TREND = [38, 44, 51, 47, 56, 43, 40];
  function asciiTrend() {
    var days = T.dashDays[L], H = 7, lo = 28, step = 4, out = [], lvl, i, row;
    for (lvl = H; lvl >= 1; lvl--) {
      row = String(lo + lvl * step).padStart(3, " ") + "┤";
      for (i = 0; i < TREND.length; i++) {
        var h = Math.max(1, Math.min(H, Math.round((TREND[i] - lo) / step)));
        row += " " + (h >= lvl ? "▅▅▅" : "···");
      }
      out.push(row);
    }
    out.push("   └" + "────".repeat(TREND.length));
    out.push("   " + days.map(function (d) { return slot(d, 4); }).join(""));
    out.push("   " + TREND.map(function (v) { return slot(String(v), 4); }).join(""));
    return out.join("\n");
  }

  function asciiBar(pct, width) {
    width = width || 20;
    var n = Math.max(0, Math.min(width, Math.round(pct / 100 * width))), s = "", i;
    for (i = 0; i < n; i++) s += "█";
    for (i = n; i < width; i++) s += "░";
    return s;
  }

  function renderDash() {
    var top = [["academic", 46], ["peer", 29], ["family", 18]];
    var dist = [["low", 72], ["moderate", 24], ["high", 4]];
    var topHtml = top.map(function (r) {
      return '<div class="bar"><span>' + esc(THEMES[r[0]].label[L]) + "</span><span>" + r[1] + "%</span>" +
        '<span class="track"><span class="fill" style="width:' + r[1] + '%"></span></span></div>';
    }).join("");
    var distAscii = dist.map(function (r) {
      return rslot(T.riskWords[r[0]][L], 14) + rslot(String(r[1]) + "%", 6) + asciiBar(r[1], 20);
    }).join("\n");
    document.getElementById("dashBody").innerHTML =
      '<div class="statgrid">' +
      stat(412, T.dashStatSessions[L], "simulated") +
      stat("94%", T.dashStatDone[L], "") +
      stat(11, T.dashStatRef[L], "") +
      stat(0, T.dashStatZero[L], "✓") +
      "</div>" +
      '<div class="dash-block"><div class="dash-h">' + esc(T.dashTrendH[L]) + "<em>" + esc(T.dashTrendSub[L]) + "</em></div>" +
      '<pre class="ascii">' + asciiTrend() + "</pre></div>" +
      '<div class="dash-block"><div class="dash-h">' + esc(T.dashTopH[L]) + "<em>7d</em></div>" +
      '<div class="barlist">' + topHtml + "</div></div>" +
      '<div class="dash-block"><div class="dash-h">' + esc(T.dashRiskH[L]) + "<em>n=412</em></div>" +
      '<pre class="ascii">' + esc(distAscii) + "</pre></div>" +
      '<div class="dash-block"><div class="dash-h">' + esc(T.dashUseH[L]) + "</div>" +
      '<p class="dash-note">' + esc(T.dashUse[L]) + "</p>" +
      '<p class="privacy" style="margin-top:8px">' + T.dashPrivacy[L] + "</p></div>";
  }
  function stat(v, k, d) {
    return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(String(v)) + "</div>" +
      (d ? '<div class="d">' + esc(d) + "</div>" : "") + "</div>";
  }

  var CHIPS = [
    { en: "DSE and homework are crushing me", zh: "DSE 同功課搞到我透唔過氣", theme: "academic" },
    { en: "Nobody in my class talks to me", zh: "班入面冇人同我傾偈", theme: "peer" },
    { en: "My parents and I fight every night", zh: "我同屋企人每晚都吵", theme: "family" },
    { en: "Nothing feels fun any more", zh: "做咩都冇樂趣、提唔起勁", theme: "low" },
    { en: "My mind will not stop overthinking", zh: "個腦停唔落嚟，不斷諗", theme: "anxiety" }
  ];
  function renderChips() {
    chipsBox.innerHTML = CHIPS.map(function (c, i) {
      return '<button class="chip" type="button" data-chip="' + i + '">' + esc(c[L]) + "</button>";
    }).join("");
  }

  function renderResources() {
    document.getElementById("resList").innerHTML = T.resources.map(function (r) {
      return '<span class="res"><span class="who">' + esc(r.name[L]) + "</span>" +
        (r.num ? '<span class="num">' + esc(r.num) + "</span>" : "") +
        '<span>' + esc(r.desc[L]) + "</span></span>";
    }).join("") + '<span class="res"><span class="who">' + esc(T.onlineLabel[L]) + "</span></span>";
  }

  /* ================= message rendering ================= */
  function pushMsg(m) { S.msgs.push(m); }

  function para(arr, cls) {
    return arr.map(function (p) { return "<p class='" + (cls || "") + "'>" + esc(p) + "</p>"; }).join("");
  }

  function cardInner(m) {
    var d = m.data || {}, k = m.kind, h = "";

    if (k === "modeCard") {
      h += '<div class="card-tag">' + esc(L === "en" ? "Step 1 · choose mode" : "步驟一 · 選擇模式") + "</div>";
      h += "<p class='card-text lead'>" + esc(t("thanks")) + "</p>";
      if (d.theme) {
        h += '<p class="card-text"><b>' + esc(t("matched")) + ":</b> " + esc(THEMES[d.theme].label[L]) + "</p>";
      }
      h += '<p class="card-text muted">' + esc(t("matchNote")) + "</p>";
      h += "<p class='card-text'>" + esc(t("chooseMode")) + "</p>";
      h += '<div class="btnrow">' +
        btn("mode", "A", t("modeATitle") + " · " + t("modeABody"), d.picked === "A", d.picked && d.picked !== "A") +
        btn("mode", "B", t("modeBTitle") + " · " + t("modeBBody"), d.picked === "B", d.picked && d.picked !== "B") +
        "</div>";
      if (d.picked === "B" && d.theme === "anxiety") {
        h += '<p class="card-text muted" style="margin-top:9px">' + esc(t("proxyNote")) + "</p>";
      }
      return h;
    }

    if (k === "themeCard") {
      h += '<div class="card-tag">' + esc(L === "en" ? "Step 1 · pick a theme" : "步驟一 · 揀主題") + "</div>";
      h += "<p class='card-text'>" + esc(t("themeAsk")) + "</p>";
      h += '<div class="optrow"><div class="btnrow" style="gap:7px">';
      Object.keys(THEMES).forEach(function (key) {
        h += btn("theme", key, THEMES[key].label[L], d.picked === key, d.picked && d.picked !== key);
      });
      h += "</div></div>";
      h += '<p class="card-text muted" style="margin-top:8px">' + esc(t("themeAskNote")) + "</p>";
      return h;
    }

    if (k === "qCard") {
      var quiz = findQuiz(d.quizId);
      var q = quiz.questions[d.qi];
      var total = quiz.questions.length;
      var dots = "";
      for (var i = 0; i < total; i++) {
        dots += '<span class="pip ' + (d.picked ? "done" : (i === d.qi ? "now" : (i < d.qi ? "done" : ""))) + '"></span>';
      }
      h += '<div class="card-tag">' + esc(t("qTag")) + " " + (d.qi + 1) + " " + t("qTagOf") + " " + total +
        " · " + esc(quiz.title[L]) + "</div>";
      h += '<div class="prog">' + dots + '<span class="prog-label">' + (d.qi + 1) + "/" + total + "</span></div>";
      h += "<p class='qtext'>" + esc(q.q[L]) + "</p>";
      h += '<div class="optrow">' + TAGS.map(function (tag) {
        return '<button class="opt' + (d.picked === tag ? " picked" : "") + '" type="button" data-act="ans" data-val="' + tag + '"' +
          (d.picked ? " disabled" : "") + '><span class="key">' + tag + "</span><span>" + esc(q.o[tag][L]) + "</span></button>";
      }).join("") + "</div>";
      if (!d.picked) h += '<p class="card-text muted" style="margin-top:9px">' + esc(t("answerAsk")) + "</p>";
      return h;
    }

    if (k === "resultCard") {
      var sc = d.score, quiz = findQuiz(d.quizId);
      h += '<div class="card-tag">' + esc(L === "en" ? "Step 3 · profile + risk" : "步驟三 · 画像 + 分級") + "</div>";
      h += '<p class="card-text"><b>' + esc(t("quizSet")) + ":</b> " + esc(quiz.title[L]) +
        " · <b>" + esc(t("modeUsed")) + ":</b> " + esc(d.mode === "A" ? t("modeNameA") : t("modeNameB")) + "</p>";
      /* preset profile */
      var pk = (d.mode === "A" ? "img" : "sce") + (sc.risk === "low" ? "Low" : sc.risk === "moderate" ? "Mod" : "High");
      h += '<div class="result-profile"><b>' + esc(t("profileTitle")) + "</b><p style='margin:4px 0 0'>" +
        esc(T.profile[pk][L]) + "</p><p style='margin:6px 0 0' class='muted'>" + esc(T.profile.focus[L]) + " " +
        esc(THEMES[d.theme].label[L]) + "</p></div>";
      /* tally */
      h += '<div class="tally"><b>' + esc(t("tallyTitle")) + ":</b>" +
        d.answers.map(function (a, i) {
          return '<span class="tchip ' + a + '">Q' + (i + 1) + " " + a + "</span>";
        }).join("") +
        "<span>" + TAG_SHORT.A[L] + " ×" + sc.counts.A + " · " + TAG_SHORT.B[L] + " ×" + sc.counts.B +
        " · " + TAG_SHORT.C[L] + " ×" + sc.counts.C + " · " + TAG_SHORT.D[L] + " ×" + sc.counts.D + "</span>" +
        '<b>' + esc(t("cdCount")) + ": " + sc.cdCount + " / 4</b>" +
        '<span class="muted">' + esc(t("ruleLine")) + "</span></div>";
      /* risk report */
      h += '<p class="card-text lead">' + esc(t("reportTitle")) + "</p>";
      h += '<div class="riskbox ' + (sc.risk === "low" ? "low" : sc.risk === "moderate" ? "mod" : "high") + '">' +
        "<p class='risk-label'>" + esc(T.riskTitle[sc.risk][L]) + "</p>" +
        para(t(sc.risk === "low" ? "riskLow" : sc.risk === "moderate" ? "riskMod" : "riskHigh")) +
        (sc.risk === "low" ? '<p class="note">' + esc(t("riskLowNote")) + "</p>" : "") +
        "</div>";
      /* closing + buttons */
      h += "<p class='card-text'>" + esc(t("closing")) + "</p>";
      h += '<div class="btnrow"><button class="btn primary" type="button" data-act="restart">' + esc(t("btnRestart")) +
        "</button><button class='btn' type='button' data-act='resources'>" + esc(t("btnRes")) + "</button></div>";
      return h;
    }

    if (k === "rosterCard") {
      var bw = S.book.worker, bs = S.book.slot;
      h += '<div class="card-tag demo">' + esc(t("sup.tag")) + "</div>";
      if (d.closed) {
        h += "<p class='card-text'>" + esc(t("sup.closedNow")) + "</p>";
        h += '<div class="btnrow"><button class="btn primary" type="button" data-act="reopenRoster">' +
          esc(t("sup.reopen")) + '</button><button class="btn" type="button" data-act="resourcesBar">' +
          esc(t("sup.barBtn")) + "</button></div>";
        return h;
      }
      h += "<p class='card-text lead'>" + esc(t("sup.title")) + "</p>";
      h += para([t("sup.intro")]);
      h += '<div class="mockbadge">' + esc(t("sup.mock")) + "</div>";
      h += '<div class="roster-head">' + esc(t("sup.head")) + "</div>";
      ROSTER.forEach(function (w) {
        var picked = bw === w.id;
        h += '<div class="wrow' + (picked ? " picked" : "") + '">';
        h += '<button class="wname" type="button" data-act="worker" data-val="' + w.id + '">' + esc(w.role[L]) + "</button>";
        h += '<div class="wmeta"><span><b>' + esc(t("sup.fits")) + "</b> " + esc(w.scope[L]) +
          "</span><span><b>" + esc(t("sup.langLbl")) + "</b> " + esc(w.lang[L]) +
          "</span><span><b>" + esc(t("sup.slotCount")) + "</b> " + w.slots.length + "</span></div>";
        if (picked) {
          h += '<div class="slotrow"><span class="slotask">' + esc(t("sup.askSlot")) + "</span>";
          w.slots.forEach(function (sl, i) {
            h += '<button class="slot' + (bs === i ? " picked" : "") + '" type="button" data-act="slot" data-val="' + i + '">' +
              esc(sl[L]) + "</button>";
          });
          h += "</div>";
        }
        h += "</div>";
      });
      h += '<div class="btnrow"><button class="btn" type="button" data-act="notNow">' + esc(t("sup.notNow")) +
        '</button><button class="btn" type="button" data-act="resourcesBar">' + esc(t("sup.barBtn")) + "</button></div>";
      h += '<p class="note">' + esc(t("sup.dashNote")) + "</p>";
      h += '<p class="note">' + esc(t("sup.stopNote")) + "</p>";
      return h;
    }

    if (k === "bookingCard") {
      var bd = d, bwr = findWorker(bd.worker), bslot = bwr ? bwr.slots[bd.slot] : null;
      if (bd.cancelled) {
        h += '<div class="card-tag ok">' + esc(t("sup.cancelTag")) + "</div>";
        h += "<p class='card-text'>" + esc(t("sup.cancelled")) + "</p>";
        h += '<div class="btnrow"><button class="btn primary" type="button" data-act="workerBack">' +
          esc(t("sup.reopen")) + '</button><button class="btn" type="button" data-act="restart">' +
          esc(t("btnRestart")) + "</button></div>";
        return h;
      }
      h += '<div class="card-tag ok">' + esc(t("sup.doneTag")) + "</div>";
      h += "<p class='card-text lead'>" + esc(t("sup.doneHead")) + "</p>";
      h += '<div class="bookgrid">' +
        "<div><b>" + esc(t("sup.roleLbl")) + "</b><span>" + esc(bwr ? bwr.role[L] : "") + "</span></div>" +
        "<div><b>" + esc(t("sup.slotLbl")) + "</b><span>" + esc(bslot ? bslot[L] : "") + "</span></div>" +
        "<div><b>" + esc(t("sup.stateLbl")) + "</b><span>" + esc(t("sup.stateV")) + "</span></div>" +
        "<div><b>" + esc(t("sup.whereLbl")) + "</b><span>" + esc(t("sup.whereV")) + "</span></div></div>";
      h += para([t("sup.doneBody")]);
      h += '<p class="note">' + esc(t("sup.dashNote")) + "</p>";
      h += '<div class="btnrow"><button class="btn" type="button" data-act="bookCancel">' + esc(t("sup.cancelBtn")) +
        '</button><button class="btn" type="button" data-act="workerBack">' + esc(t("sup.change")) + "</button></div>";
      return h;
    }

    if (k === "crisisCard") {
      h += '<div class="card-tag" style="background:#fdf0ee;color:#a8443b;border-color:#f2d3cd">' + esc(t("crisisTag")) + "</div>";
      h += "<p class='card-text lead' style='font-size:14.5px;color:#a8443b'>" + esc(t("crisisTitle")) + "</p>";
      h += para(T.crisisBody[L]);
      h += '<div class="riskbox high" style="margin-top:10px"><p class="risk-label">' +
        esc(L === "en" ? "Call now (24 hours)" : "請即時致電（24小時）") + "</p>";
      h += '<div class="hotline"><span class="num">2896 0000</span><span>' +
        esc(L === "en" ? "24-hour Suicide Prevention Hotline" : "24小時防止自殺熱線") + "</span></div>";
      h += '<div class="hotline"><span class="num">2777 8899</span><span>' +
        esc(L === "en" ? "Youth Mental Health Hotline" : "青年精神健康熱線") + "</span></div>";
      h += '<div class="hotline"><span class="num">182</span><span>' +
        esc(L === "en" ? "Community Support Line" : "182 情緒支援專線") + "</span></div>";
      h += '<div class="hotline"><span class="num">999 / 112</span><span>' +
        esc(L === "en" ? "Police / Ambulance if in immediate danger" : "如即時危險，請致电 999／112") + "</span></div></div>";
      h += '<p class="card-text muted">' + esc(L === "en"
        ? "This demo did not record what you typed, and it will not show a quiz result for this input. A real person who can help you matters more than any screening."
        : "呢個示範冇記錄你輸入嘅內容，亦唔會呢一輪顯示問卷結果。一個可以幫到你嘅真人，比任何篩查都重要。") + "</p>";
      h += '<div class="btnrow"><button class="btn primary" type="button" data-act="resources">' + esc(t("btnRes")) +
        "</button><button class='btn' type='button' data-act='crisisContinue'>" + esc(t("crisisContinue")) + "</button></div>";
      return h;
    }

    if (k === "endCard") {
      h += '<div class="card-tag" style="background:#f0f7f3;color:#2f7a5b;border-color:#cfe7db">' + esc(t("stoppedTitle")) + "</div>";
      h += para(T.stoppedBody[L]);
      h += '<div class="btnrow" style="margin-top:9px"><button class="btn primary" type="button" data-act="restart">' +
        esc(t("btnResume")) + '</button><button class="btn" type="button" data-act="resources">' + esc(t("btnRes")) + "</button></div>";
      return h;
    }
    return "";
  }

  function btn(act, val, label, picked, dim) {
    return '<button class="btn' + (picked ? " primary" : "") + '" type="button" data-act="' + act + '" data-val="' + val + '"' +
      (picked ? " disabled" : (dim ? " disabled" : "")) + ">" + esc(label) + "</button>";
  }

  function renderThread() {
    var html = "";
    S.msgs.forEach(function (m) {
      if (m.role === "user") {
        html += '<div class="msg you"><div class="msg-av">🙂</div><div class="bubble"><p>' + esc(m.data.text) + "</p>" +
          (m.data.sub ? '<p class="muted">' + esc(m.data.sub) + "</p>" : "") + "</div></div>";
      } else if (m.kind === "text") {
        html += '<div class="msg ai"><div class="msg-av">🫧</div><div class="bubble">' + para(m.data.paras) + "</div></div>";
      } else if (m.kind === "typing") {
        html += '<div class="msg ai"><div class="msg-av">🫧</div><div class="bubble"><div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div></div>';
      } else {
        html += '<div class="cardx' + (m.kind === "resultCard" || m.kind === "crisisCard" || m.kind === "rosterCard" || m.kind === "bookingCard" ? " wide" : "") + '">' + cardInner(m) + "</div>";
      }
    });
    thread.innerHTML = html;
    thread.scrollTop = thread.scrollHeight;
  }

  /* ================= flow ================= */
  function aiSay(paras, cb) { pushMsg({ role: "ai", kind: "text", data: { paras: paras } }); renderThread(); if (cb) cb(); }
  function later(fn, ms) { S.busy = true; setTimeout(function () { S.busy = false; fn(); }, ms || 420); }

  function greet() {
    pushMsg({ role: "ai", kind: "text", data: { paras: T.open[L] } });
    S.phase = "awaitWorry";
    renderThread();
  }

  function afterWorry(text) {
    pushMsg({ role: "user", kind: "text", data: { text: text } });
    renderThread();
    /* rule 3 : crisis wording -> skip the quiz, hotline first */
    if (detectCrisis(text)) {
      S.phase = "crisisHold";
      later(function () {
        pushMsg({ role: "ai", kind: "crisisCard", data: {} });
        renderThread();
      });
      return;
    }
    var cl = classifyTopic(text);
    if (isOffTopic(text)) {
      /* unrelated content -> gentle redirect, stay on the main line */
      later(function () { aiSay([t("redirect")]); });
      return;
    }
    S.theme = cl.theme;
    later(function () {
      if (cl.theme) {
        pushMsg({ role: "ai", kind: "modeCard", data: { theme: cl.theme } });
        S.phase = "modePick";
        renderThread();
      } else {
        pushMsg({ role: "ai", kind: "themeCard", data: {} });
        S.phase = "themePick";
        renderThread();
      }
    });
  }

  function pickTheme(key) {
    var last = lastCard("themeCard");
    if (!last) return;
    last.data.picked = key;
    S.theme = key;
    pushMsg({ role: "user", kind: "text", data: { text: THEMES[key].label[L] } });
    later(function () {
      pushMsg({ role: "ai", kind: "modeCard", data: { theme: key } });
      S.phase = "modePick";
      renderThread();
    });
    renderThread();
  }

  function pickMode(m) {
    var last = lastCard("modeCard");
    if (!last) return;
    last.data.picked = m;
    S.mode = m;
    var r = resolveQuiz(S.theme, m);
    S.quiz = r.quiz; S.proxy = r.proxy;
    pushMsg({ role: "user", kind: "text", data: { text: m === "A" ? T.modeATitle[L] : T.modeBTitle[L] } });
    later(function () {
      var note = [];
      if (r.proxy) note.push(t("proxyNote"));
      note.push(L === "en"
        ? "Here is your set — " + r.quiz.title.en + ". Four questions, one at a time. Tap stop any time."
        : "你嘅問卷係 — " + r.quiz.title.zh + "。四題，一題一題嚟。任何時候都可以按停止。");
      aiSay(note, askQuestion);
    });
    renderThread();
  }

  function askQuestion() {
    S.qi = 0; S.answers = [];
    showQuestion();
  }
  function showQuestion() {
    pushMsg({ role: "ai", kind: "qCard", data: { quizId: S.quiz.id, qi: S.qi } });
    S.phase = "quiz";
    renderThread();
  }

  function answer(tag) {
    var card = lastCard("qCard");
    if (!card || card.data.picked) return;
    card.data.picked = tag;
    S.answers.push(tag);
    pushMsg({ role: "user", kind: "text", data: { text: tag, sub: T.ansOf[L] + " Q" + (S.qi + 1) } });
    renderThread();
    later(function () {
      if (S.qi + 1 < S.quiz.questions.length) {
        S.qi++;
        showQuestion();
      } else {
        finish();
      }
    }, 260);
  }

  function finish() {
    var score = scoreAnswers(S.answers);
    S.phase = "result";
    pushMsg({ role: "ai", kind: "resultCard", data: {
      quizId: S.quiz.id, mode: S.mode, theme: S.theme, answers: S.answers.slice(), score: score } });
    renderThread();
  }

  function lastCard(kind) {
    for (var i = S.msgs.length - 1; i >= 0; i--) {
      if (S.msgs[i].kind === kind) return S.msgs[i];
      if (S.msgs[i].role === "user" && i < S.msgs.length - 2) { /* keep searching anyway */ }
    }
    return null;
  }

  function stopAll(reason) {
    pushMsg({ role: "user", kind: "text", data: { text: reason } });
    S.phase = "stopped";
    later(function () {
      pushMsg({ role: "ai", kind: "endCard", data: {} });
      renderThread();
    });
    renderThread();
  }

  function restart() {
    S.msgs = []; S.theme = null; S.mode = null; S.quiz = null; S.answers = []; S.qi = 0; S.phase = "awaitWorry";
    S.book = { worker: null, slot: null };
    greet();
    input.value = "";
    input.focus();
  }

  /* ================= input handling ================= */
  function submitText(forced) {
    var raw = String(forced == null ? input.value : forced).trim();
    if (!raw) return;
    input.value = "";
    autoGrow();
    /* rule 5: the right to stop outranks everything else, in every phase */
    if (isStopIntent(raw)) { stopAll(raw); return; }

    if (S.phase === "awaitWorry") { afterWorry(raw); return; }

    if (S.phase === "themePick") {
      /* typed words instead of tapping a theme card */
      var cl = classifyTopic(raw);
      if (!cl.theme) { afterWorry(raw); return; }
      S.theme = cl.theme;
      pushMsg({ role: "user", kind: "text", data: { text: raw } });
      later(function () {
        pushMsg({ role: "ai", kind: "modeCard", data: { theme: cl.theme } });
        S.phase = "modePick"; renderThread();
      });
      return;
    }

    if (S.phase === "modePick") {
      var m = raw.match(/^[AaBb]/);
      if (m) { pickMode(m[0].toUpperCase()); return; }
      pushMsg({ role: "user", kind: "text", data: { text: raw } });
      renderThread();
      later(function () { aiSay([t("redirect")]); });
      return;
    }

    if (S.phase === "quiz") {
      var a = raw.match(/^[A-Da-d]/);
      if (a) { answer(a[0].toUpperCase()); return; }
      /* free text mid-quiz is not an answer: say so, then re-ask the same item */
      pushMsg({ role: "user", kind: "text", data: { text: raw } });
      renderThread();
      later(function () { aiSay([t("answerAskOnly")]); });
      return;
    }

    /* result / stopped / crisisHold : typing for help opens the same roster
       instead of throwing the redirect at someone who asked a real question */
    if (/(support|resource|social worker|book|appointment|meet|helpline|社工|支援|預約|面見|熱線|轉介)/i.test(raw)) {
      pushMsg({ role: "user", kind: "text", data: { text: raw } });
      openRoster();
      return;
    }

    /* result / stopped / crisisHold : anything else is gently redirected */
    pushMsg({ role: "user", kind: "text", data: { text: raw } });
    renderThread();
    later(function () { aiSay([t("redirect")]); });
  }

  /* ================= support roster / demo booking ======================
     The Step-4 "View support resources" button used to only scroll to the
     footer bar, which read as a dead button on a projector. It now opens a
     real card in the conversation: pick a role, pick a time, see the booking
     state, cancel it. Nothing here leaves memory.                            */
  function openRoster() {
    var last = S.msgs[S.msgs.length - 1];
    if (last && last.kind === "rosterCard" && !last.data.closed) { renderThread(); return; }
    S.book = { worker: null, slot: null };
    pushMsg({ role: "ai", kind: "rosterCard", data: {} });
    renderThread();
  }

  function closeRoster() {
    var rc = lastCard("rosterCard");
    if (rc) rc.data.closed = true;
    S.book = { worker: null, slot: null };
    renderThread();
  }

  function onCardAction(act, val) {
    if (act === "mode") pickMode(val);
    else if (act === "theme") pickTheme(val);
    else if (act === "ans") answer(val);
    else if (act === "restart") restart();
    else if (act === "crisisContinue") {
      pushMsg({ role: "user", kind: "text", data: { text: T.crisisContinue[L] } });
      S.phase = "awaitWorry";
      later(function () {
        aiSay([L === "en"
          ? "Okay. Before anything else: if at any point it feels unsafe, stop and call 2896 0000 or 182 — that is more useful than this demo."
          : "好。不過要講明：如果任何時刻覺得唔安全，請即刻停低並致電 2896 0000 或 182 — 呢個會比呢個示範有用得多。"]);
      });
      renderThread();
    } else if (act === "resources") {
      openRoster();
    } else if (act === "resourcesBar") {
      document.getElementById("resources").scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (act === "notNow") {
      closeRoster();
    } else if (act === "reopenRoster") {
      openRoster();
    } else if (act === "worker") {
      S.book = { worker: val, slot: null };
      renderThread();
    } else if (act === "slot") {
      var sw = findWorker(S.book.worker);
      if (!sw) { openRoster(); return; }
      S.book.slot = +val;
      pushMsg({ role: "ai", kind: "bookingCard", data: { worker: sw.id, slot: +val, cancelled: false } });
      renderThread();
    } else if (act === "bookCancel") {
      var bc = lastCard("bookingCard");
      if (bc && !bc.data.cancelled) bc.data.cancelled = true;
      /* the roster stays open on purpose: taking a booking back should never
         also hide the list, which is the one thing a student may need again */
      S.book.slot = null;
      renderThread();
    } else if (act === "workerBack") {
      S.book = { worker: null, slot: null };
      openRoster();
    }
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (b && !b.disabled) { onCardAction(b.getAttribute("data-act"), b.getAttribute("data-val")); return; }
    var c = e.target.closest("[data-chip]");
    if (c) { var i = +c.getAttribute("data-chip"); input.value = CHIPS[i][L]; input.focus(); autoGrow(); }
  });

  document.getElementById("btnSend").addEventListener("click", submitText);
  document.getElementById("btnStop").addEventListener("click", function () {
    if (S.phase === "awaitWorry" && S.msgs.length <= 1) return;
    stopAll(t("btnStop"));
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitText(); }
    if (S.phase === "quiz" && /^[A-Da-d]$/.test(e.key)) {
      /* only hijack when the box is empty so typing words still works */
      if (!input.value) { e.preventDefault(); answer(e.key.toUpperCase()); }
    }
  });
  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(118, input.scrollHeight) + "px"; }
  input.addEventListener("input", autoGrow);

  function setLang(l) {
    if (S.lang === l) return;
    S.lang = l; L = l;
    renderStatic();
    renderThread();
    document.getElementById("composerHint").textContent = T.hint[L];
  }
  document.getElementById("btnEn").addEventListener("click", function () { setLang("en"); });
  document.getElementById("btnZh").addEventListener("click", function () { setLang("zh"); });

  /* ---------- presentation helper: ?shot=low|moderate|high|crisis|offtopic|stop|idle ----------
     auto-plays one path so the team can rehearse or screenshot a branch. */
  var SHOT_ANSWERS = { low: "AABA", moderate: "BCBD", high: "CDCD" };
  var SHOT_WORRY = "DSE exams and homework are piling up, I cannot sleep and I keep overthinking";
  function preview(which) {
    if (which === "idle") return;
    if (which === "crisis") { afterWorry("I feel hopeless, I want to die, I hurt myself"); return; }
    if (which === "offtopic") { setTimeout(function () { submitText("today is a sunny day"); }, 500); return; }
    if (which === "stop") {
      afterWorry(SHOT_WORRY);
      setTimeout(function () {
        pickMode("A");
        var iv = setInterval(function () {
          var card = lastCard("qCard");
          if (card && !card.data.picked) {
            clearInterval(iv);
            answer("B");
            setTimeout(function () { submitText("stop"); }, 900);
          }
        }, 120);
        setTimeout(function () { clearInterval(iv); }, 8000);
      }, 750);
      return;
    }
    var letters = SHOT_ANSWERS[which] || SHOT_ANSWERS.moderate, idx = 0;
    afterWorry(SHOT_WORRY);
    setTimeout(function () {
      pickMode("A");
      var iv = setInterval(function () {
        var card = lastCard("qCard");
        if (card && !card.data.picked) {
          if (idx >= letters.length) { clearInterval(iv); return; }
          answer(letters[idx++]);
        }
      }, 120);
      setTimeout(function () { clearInterval(iv); }, 8000);
    }, 750);
  }
  var shot = (location.search.match(/shot=(\w+)/) || [])[1];
  window.EchoCheck = CORE;

  /* ================= boot ================= */
  var startLang = (location.search.match(/lang=(zh|en)/) || [])[1];
  if (startLang) { S.lang = startLang; L = startLang; }
  renderStatic();
  if (shot) { greet(); setTimeout(function () { preview(shot); }, 30); }
  else greet();

  /* ================= QA harness (only with ?qa=1) =================
     Lets the team verify the demo end-to-end without a human clicker:
     chrome --headless --dump-dom "index.html?shot=moderate&qa=1"
     prints the result block into the document title + #qaReport.      */
  if (wantQA) {
    var R = [];
    function ck(name, cond, extra) {
      R.push((cond ? "PASS  " : "FAIL  ") + name + (cond ? "" : "  <" + extra + ">"));
    }
    function txt() { return document.body.innerText; }
    /* flow assertions must look at the conversation only: the B4 dashboard
       legitimately shows "Low risk / Moderate risk / High risk" labels too. */
    function conv() {
      var el = document.querySelector(".chat-body");
      /* textContent, not innerText: some labels are CSS-uppercased, so the
         card tag really renders "STOPPED — NOTHING WAS SAVED". Asserting on
         innerText would fail English wording checks for no real reason. */
      return el ? el.textContent : txt();
    }
    function q(sel) { return document.querySelectorAll(sel); }
    function waitFor(cond, then, tries) {
      if (cond()) return then();
      if (!tries) return then();
      setTimeout(function () { waitFor(cond, then, tries - 1); }, 120);
    }
    var EXPECT = {
      low: /Low risk|低風險/,
      moderate: /Moderate risk|中等風險/,
      high: /High risk|高風險/,
      crisis: null
    };
    setTimeout(function () {
      /* --- structural blocks --- */
      ck("block1 disclaimer bar present", !!document.querySelector(".topbar .disclaimer"));
      ck("block1 disclaimer keeps safety wording",
        /NOT clinical diagnosis or therapy|並非臨床診斷或心理治療/.test(document.getElementById("disclaimer").textContent),
        document.getElementById("disclaimer").textContent.slice(0, 60));
      ck("block2 about panel present", /About EchoCheck|關於 EchoCheck/.test(txt()));
      ck("block2 keeps the no-diagnosis boundary", /cannot give formal mental health diagnosis|不能提供任何正式的精神健康診斷/.test(txt()));
      ck("block3 chat present", !!document.querySelector(".chat"));
      ck("block4 dashboard present", /Social Worker Dashboard|學校社工後台/.test(txt()));
      ck("block5 resources present", /Hong Kong Youth Mental Health Resources|香港青少年精神健康資源/.test(txt()));
      ck("opening line auto-sent", /You can share anything|你可以講吓最近有啲咩困住你/.test(txt()));
      ck("hotline 2896 0000 rendered", /2896 0000/.test(txt()));
      ck("dashboard risk split 72/24/4", /72%/.test(txt()) && /24%/.test(txt()) && /4%/.test(txt()));

      /* --- flow results (scoped to the conversation, not the dashboard) --- */
      if (shot === "offtopic") {
        ck("small talk is echoed, then redirected",
          /today is a sunny day/.test(conv()) && /is for mood screening|用嚟做情緒篩查/i.test(conv()));
        ck("redirect names both exits", /restart|重新開始/.test(conv()));
        ck("no quiz started after off-topic input", q('[data-act="ans"]').length === 0,
          q('[data-act="ans"]').length + " option buttons shown");
        ck("no theme guessed from small talk", !/Quiz 1|問卷一|choose mode|揀模式/.test(conv()));
      } else if (shot === "stop") {
        ck("stop ends the check on the spot", /Stopped|已結束/i.test(conv()));
        ck("stop page states nothing was saved", /nothing was saved|沒有任何內容被儲存/i.test(conv()));
        ck("stop page keeps the resource bar reachable", /2896 0000/.test(txt()));
        ck("stop produced no risk verdict", !/Tag tally|標籤統計|result:|結果：/i.test(conv()));
      } else if (shot === "support") {
        /* Step 4's button must really do something now */
        var nCard0 = q(".cardx").length;
        var rbtn = document.querySelector('[data-act="resources"]');
        ck("result card exposes the support button", !!rbtn);
        if (rbtn) rbtn.click();
        ck("button opens the social worker roster in the chat",
          q('[data-act="worker"]').length === 3 && q(".cardx").length > nCard0,
          q('[data-act="worker"]').length + " roles shown");
        ck("roster is labelled demo, not real staff",
          /DEMO ROSTER|not real staff|示範名單|唔係真實職員/i.test(conv()),
          "TAIL>>" + conv().slice(-160));
        ck("no booking claimed before a slot is picked", !/Demo booking|示節應約/i.test(conv()));
        var wb = document.querySelector('[data-act="worker"]');
        if (wb) wb.click();
        ck("slots appear once a role is chosen", q('[data-act="slot"]').length === 3,
          q('[data-act="slot"]').length + " slots");
        var sb = document.querySelector('[data-act="slot"]');
        if (sb) sb.click();
        ck("booking card shows role + time + status",
          q('[data-act="bookCancel"]').length === 1 && /Demo booking|示範預約|Picked/i.test(conv()),
          "btns" + q('[data-act="bookCancel"]').length + " TAIL>>" + conv().slice(-160));
        ck("booking card states nothing is sent or stored",
          /not sent|not stored|nothing was sent|唔會傳給|唔會僲存|沒出送/i.test(conv()),
          conv().slice(-90));
        ck("booking card still names the real route + hotlines",
          /guidance office|社工主任/.test(conv()) && /2896 0000/.test(txt()));
        ck("booking does not leak into the dashboard numbers", /72%/.test(txt()) && /4%/.test(txt()));
        var cb = document.querySelector('[data-act="bookCancel"]');
        if (cb) cb.click();
        ck("cancel clears the demo booking", q('[data-act="bookCancel"]').length === 0 &&
          /Cancelled|已取消/i.test(conv()));
        document.getElementById("btnZh").click();
        ck("toggle re-renders roster copy in Chinese", /職別|時段/.test(conv()), "no CJK roster copy");
        document.getElementById("btnEn").click();
        ck("toggle back keeps roster + booking cards rendered", /Role|Free slots|Slots/.test(conv()));
        ck("support flow still invents no quiz items", q('[data-act="ans"]').length === 0 || S.phase !== "quiz");
      } else if (shot === "crisis") {
        ck("crisis bypass shows support page", /Support first|支援優先|Call now|請即時致電/.test(conv()));
        ck("crisis bypass skips the quiz", q('[data-act="ans"]').length === 0, q('[data-act="ans"]').length + " options shown");
        ck("crisis page lists 3 numbers in the thread", /2896 0000/.test(conv()) && /2777 8899/.test(conv()) && /182/.test(conv()));
        ck("crisis page gives no interpretation", !/Tag tally|標籤統計|profile|画像/i.test(conv()));
      } else if (shot && shot !== "idle") {
        ck("quiz asked exactly 4 questions", q(".cardx").length >= 4 && /Your mood check result|情緒篩查結果/.test(conv()));
        ck("expected risk level shown", EXPECT[shot] ? EXPECT[shot].test(conv()) : false, shot);
        ck("profile + report + closing all rendered",
          /emotional profile|情緒画像/.test(conv()) && /Tag tally|標籤統計/.test(conv()) && /preliminary screening result|初步篩查結果/.test(conv()));
        ck("restart + resources buttons", /Restart new check|重新開始新篩查/.test(conv()) && /View support resources|查看支援資源/.test(conv()));
        ck("no free-form invented reading", !/constellation|horoscope|tarot|MBTI/i.test(conv()));
        /* --- language toggle on the finished conversation --- */
        document.getElementById("btnZh").click();
        ck("toggle switches disclaimer to Chinese", /免責聲明/.test(document.getElementById("disclaimer").textContent));
        ck("toggle switches quiz + result wording to Chinese", /風險/.test(conv()) && /問卷|題目/.test(conv()), "no CJK in thread");
        ck("toggle keeps hotlines visible", /2896 0000/.test(txt()));
        ck("toggle translates dashboard header", /學校社工後台/.test(txt()));
        ck("toggle keeps resources footer", /香港青少年精神健康資源/.test(txt()));
        document.getElementById("btnEn").click();
        ck("toggle back to English", /Disclaimer/.test(document.getElementById("disclaimer").textContent));
        /* --- restart resets the flow --- */
        var rb = document.querySelector('[data-act="restart"]');
        if (rb) rb.click();
        setTimeout(function () {
          ck("restart clears to the opening line",
            q('[data-act="ans"]').length === 0 && /You can share anything/.test(conv()),
            q('[data-act="ans"]').length + " option buttons left");
          /* --- layout sanity --- */
          ck("no unresolved i18n key printed on screen", !/missing string|\bsup\.[a-zA-Z]/.test(conv()),
        (conv().match(/\bsup\.[a-zA-Z]+/g) || []).join(","));
      ck("no horizontal overflow", document.documentElement.scrollWidth <= window.innerWidth + 2,
            document.documentElement.scrollWidth + " vs " + window.innerWidth);
          ck("no runtime errors", ERRORS.length === 0, ERRORS.join(" / "));
          finish();
        }, 400);
        return;
      }
      ck("no unresolved i18n key printed on screen", !/missing string|\bsup\.[a-zA-Z]/.test(conv()),
        (conv().match(/\bsup\.[a-zA-Z]+/g) || []).join(","));
      ck("no horizontal overflow", document.documentElement.scrollWidth <= window.innerWidth + 2,
        document.documentElement.scrollWidth + " vs " + window.innerWidth);
      ck("no runtime errors", ERRORS.length === 0, ERRORS.join(" / "));
      finish();
    }, shot === "stop" || shot === "offtopic" ? 8000 : (shot && shot !== "idle" ? 3000 : 600));

    function finish() {
      var fails = R.filter(function (r) { return r.indexOf("FAIL") === 0; });
      document.title = "QA " + (R.length - fails.length) + "/" + R.length + (fails.length ? " :: " + fails.join(" || ") : " :: ALL GREEN");
      var pre = document.createElement("pre");
      pre.id = "qaReport";
      pre.textContent = "== ECHOCheck QA ==\n" + R.join("\n") + "\n";
      document.body.appendChild(pre);
    }
  }

})();
