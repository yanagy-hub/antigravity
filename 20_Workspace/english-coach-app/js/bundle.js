/**
 * English Coach App - Single Standalone Bundle
 * Allows opening index.html directly via file:// protocol without CORS module restrictions.
 */

(function () {
  'use strict';

  /* ==========================================
   * 1. CONSTANTS & PRESETS
   * ========================================== */
  const STORAGE_KEYS = {
    API_KEY: 'eca_gemini_api_key',
    SELECTED_MODEL: 'eca_selected_model',
    CURRENT_MODE: 'eca_current_mode',
    USER_STATE: 'eca_user_state_v1',
    CHAT_HISTORY: 'eca_chat_history_v1',
    REVIEW_HISTORY: 'eca_review_history_v1',
    PHRASE_BOOK: 'eca_phrase_book_v1',
    QUIZ_HISTORY: 'eca_quiz_history_v1',
    SETTINGS: 'eca_settings_v1',
  };

  const GEMINI_MODELS = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (高速・推奨)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (最新・超高速)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (最高精度・深い解説)' }
  ];

  const MODES = {
    daily: {
      id: 'daily',
      name: '日常会話',
      enName: 'Daily Conversation',
      icon: 'coffee',
      badgeClass: 'badge-daily',
      color: '#10b981',
      description: '基礎からのスピーキング・リスニング、日常の感情や出来事をスムーズに表現する力を養います。',
      curriculum: [
        {
          phase: 'Phase 1: 基礎構築 (1〜3ヶ月)',
          focus: '中学英語の自動化と基本時制・瞬発スピーキング',
          missions: [
            '5文型と基本動詞（get, take, have, make）の感覚を復習する',
            '現在完了形（have + p.p.）の日常会話での使い方をマスターする',
            '「週末の予定」をAI講師に3文以上の英語で話してみる',
            'デイリークイズで日常頻出フレーズの穴埋めを解く'
          ]
        },
        {
          phase: 'Phase 2: 運用力向上 (4〜6ヶ月)',
          focus: '感情表現、理由の付け足し、自然な相槌と聞き返し',
          missions: [
            'because/so を使って自分の意見に理由を2つ添える練習',
            'ロールプレイ: カフェでのカスタム注文とトラブル対応',
            '今日の出来事を音声入力を使って30秒間英語で語る',
            '日常イディオム・句動詞（look forward to, figure out 等）の復習'
          ]
        },
        {
          phase: 'Phase 3: 流暢性確立 (7〜12ヶ月)',
          focus: '仮定法・関係代名詞の自然な活用、長文雑談の維持',
          missions: [
            '仮定法過去（If I had... I would...）を使った願望の表現練習',
            'ロールプレイ: 旅行先での突発トラブル解決と友人との深い議論',
            'AI講師の英語をシャドーイング（音声再生と同時に発話）する',
            '1週間の振り返り日記を英語で書いて添削を受ける'
          ]
        }
      ],
      situations: [
        { id: 'cafe', title: 'カフェで注文・カスタマイズ', prompt: 'You are a friendly barista at a cozy specialty coffee shop in Seattle. Greet the customer warmly and take their order. Recommend your signature iced latte or seasonal pastry.' },
        { id: 'directions', title: '街中で道案内・おすすめを尋ねる', prompt: 'You are a helpful local resident in London. The user seems a bit lost and asks for directions to the British Museum or good nearby eateries. Be polite and clear.' },
        { id: 'weekend', title: '同僚・友人との週末の雑談', prompt: 'You are an enthusiastic friend catching up on a Monday morning. Ask how their weekend was, what they enjoyed, and share a brief fun activity you did.' },
        { id: 'hobby', title: '趣味や好きな映画についての対話', prompt: 'You are chatting casually about movies, music, and weekend hobbies. Ask open-ended questions and show genuine interest in the user’s preferences.' }
      ],
      presetPhrases: [
        { en: "Could I get an iced latte with oat milk, please?", ja: "オーツミルクのアイスラテをいただけますか？", category: "日常・カフェ" },
        { en: "How has your week been going so far?", ja: "今週ここまでの調子はどうですか？", category: "日常・雑談" },
        { en: "To be honest, I haven't really thought about it.", ja: "正直なところ、あまり考えていませんでした。", category: "日常・会話表現" },
        { en: "That sounds like a lot of fun! Tell me more.", ja: "すごく楽しそうですね！もっと教えてください。", category: "日常・相槌" },
        { en: "I'm looking forward to catching up this weekend.", ja: "今週末にゆっくり話せるのを楽しみにしています。", category: "日常・予定" },
        { en: "Would you mind if I took a quick photo here?", ja: "ここで写真を1枚撮ってもよろしいですか？", category: "日常・お願い" },
        { en: "It completely slipped my mind. I'm so sorry.", ja: "完全にうっかり忘れていました。本当にごめんなさい。", category: "日常・謝罪" },
        { en: "What do you usually do in your spare time?", ja: "普段休日は何をして過ごしていますか？", category: "日常・質問" }
      ],
      presetQuizzes: [
        {
          question: "「オーツミルクのアイスラテをもらえますか？」に最も適した表現は？",
          options: ["Could I get an iced latte with oat milk?", "Give me an iced latte oat milk.", "I want drink iced latte oat milk.", "Can you make iced latte oat milk to me?"],
          answer: 0,
          explanation: "丁寧な注文には 'Could I get ~ ?' または 'Can I have ~ ?' が最も自然で好印象です。"
        },
        {
          question: "「楽しみに待っています」を表す自然なイディオムは？",
          options: ["look forward to", "look out for", "look after", "look into"],
          answer: 0,
          explanation: "'look forward to + 名詞/動名詞(-ing)' で「〜を心待ちにする」という意味になります。"
        },
        {
          question: "空欄に入る適切な前置詞は？ 'I will meet you ___ Friday afternoon.'",
          options: ["on", "at", "in", "by"],
          answer: 0,
          explanation: "特定の曜日や「曜日＋時間帯（Friday afternoon）」の前には前置詞 'on' を用います。"
        }
      ]
    },
    business: {
      id: 'business',
      name: 'ビジネス英語',
      enName: 'Business English',
      icon: 'briefcase',
      badgeClass: 'badge-business',
      color: '#3b82f6',
      description: 'プロフェッショナルな表現、ミーティング進行、丁寧な依頼・交渉・メール作成力を鍛えます。',
      curriculum: [
        {
          phase: 'Phase 1: 基礎構築 (1〜3ヶ月)',
          focus: '丁寧なビジネス表現（Could you / Would you）と基本メール定型句',
          missions: [
            '命令文を回避し、クッション言葉を用いた依頼表現を身につける',
            '自己紹介と自社・担当プロジェクトの簡潔なピッチ練習',
            'アポイントメント依頼と日程調整メールの作成・添削',
            'デイリークイズでビジネス頻出動詞（collaborate, follow up等）を学習'
          ]
        },
        {
          phase: 'Phase 2: 運用力向上 (4〜6ヶ月)',
          focus: 'ミーティングでの発言・合意形成・質問の切り出し',
          missions: [
            '会議での遮り方（"May I jump in here?"）と意見提起の練習',
            'ロールプレイ: 新規クライアントとの要件定義ヒアリング',
            '進捗報告（Status Update: 成果・課題・ネクストアクション）の英作文',
            'ビジネスリスニング: 異なるアクセントや速い英語の聞き取り訓練'
          ]
        },
        {
          phase: 'Phase 3: 実践・応用 (7〜12ヶ月)',
          focus: '条件交渉、プレゼンテーション、エグゼクティブ向け報告',
          missions: [
            'Win-Winを目指す条件提示と代替案（Compromise）の交渉練習',
            'ロールプレイ: 予算交渉および納期遅延時のプロフェッショナルな報告',
            'プロジェクトロードマップの英語プレゼンテーション',
            '複雑なビジネス英文の添削（よりフォーマル・簡潔なトーンへの昇華）'
          ]
        }
      ],
      situations: [
        { id: 'meeting', title: 'プロジェクト進捗ミーティング', prompt: 'You are the project lead at an international tech firm. Run a brief weekly check-in with the user. Ask about their current task progress, blockers, and upcoming milestones in a professional yet supportive tone.' },
        { id: 'negotiation', title: '納期・スコープの調整交渉', prompt: 'You are a pragmatic client stakeholder. The user needs to negotiate a 2-week deadline extension due to technical complexities. Be reasonable but ask for clear trade-offs and mitigation plans.' },
        { id: 'email_followup', title: '商談後のフォローアップと次回提案', prompt: 'You are an executive partner who just attended an introductory product demo. Discuss next steps, ask for a detailed proposal, and clarify pricing tiers.' },
        { id: 'presentation', title: '新機能提案のQ&Aセッション', prompt: 'You are an attendee at a technical presentation. Ask constructive, insightful questions regarding architecture scalability and cost efficiency.' }
      ],
      presetPhrases: [
        { en: "I would like to follow up on our discussion yesterday regarding the timeline.", ja: "昨日のスケジュールに関する協議についてフォローアップさせていただきたく存じます。", category: "ビジネス・フォローアップ" },
        { en: "Could you please clarify what you mean by that requirement?", ja: "その要件の具体的な意図についてもう少し詳しくご説明いただけますでしょうか？", category: "ビジネス・質問" },
        { en: "We are currently on track to meet the scheduled launch date.", ja: "現在、予定されているローンチ期日に向けて順調に進捗しております。", category: "ビジネス・進捗報告" },
        { en: "I appreciate your prompt response. Let's touch base again on Thursday.", ja: "迅速なご返信をいただき感謝いたします。木曜日に改めて状況を共有しましょう。", category: "ビジネス・メール" },
        { en: "From my perspective, option B offers the best cost-performance ratio.", ja: "私の見解としては、選択肢Bが最も費用対効果に優れていると考えます。", category: "ビジネス・意見表明" },
        { en: "Would it be feasible to deliver the first milestone by the end of this month?", ja: "最初のマイルストーンを今月末までに納品いただくことは可能でしょうか？", category: "ビジネス・納期交渉" }
      ],
      presetQuizzes: [
        {
          question: "「昨日の議論についてフォローアップしたい」を最もプロフェッショナルに表す文は？",
          options: [
            "I'd like to follow up on our discussion yesterday.",
            "I want to ask again about yesterday.",
            "Check yesterday's talk, please.",
            "Do you remember yesterday?"
          ],
          answer: 0,
          explanation: "'I would like to follow up on ~' はビジネスメールや会議で最も標準的かつ好まれるスマートな表現です。"
        },
        {
          question: "空欄に入る最も適切なビジネス単語は？ 'We are strictly ___ track to deliver the project on time.'",
          options: ["on", "in", "at", "by"],
          answer: 0,
          explanation: "'on track' で「予定通り順調に進んで」という意味の頻出ビジネスイディオムです。"
        },
        {
          question: "「実現可能ですか？」をビジネスで丁寧に尋ねる形容詞は？",
          options: ["feasible", "possible-ish", "doable-enough", "working"],
          answer: 0,
          explanation: "'feasible'（実行可能な、実現可能な）は技術的・予算的な現実性を問う際の定番表現です。"
        }
      ]
    },
    toeic: {
      id: 'toeic',
      name: 'TOEIC対策',
      enName: 'TOEIC Prep (L&R)',
      icon: 'award',
      badgeClass: 'badge-toeic',
      color: '#8b5cf6',
      description: 'Part 5文法問題の秒殺テクニック、Part 3/4リスニング先読み、Part 7速読力と語彙力を強化します。',
      curriculum: [
        {
          phase: 'Phase 1: 基礎構築 (1〜3ヶ月)',
          focus: '品詞の見分け（名詞・動詞・形容詞・副詞）とPart 5頻出文法パターンの速解',
          missions: [
            '語尾（-tion, -tive, -ly, -ment）による品詞判別トレーニング',
            '接続詞 vs 前置詞の判別ルール（although vs despite 等）',
            'TOEIC頻出基本単語（appliance, mandatory, itinerary等）20語の暗記',
            'Part 5ミニ模試5問を1問20秒以内で解答する'
          ]
        },
        {
          phase: 'Phase 2: 運用力向上 (4〜6ヶ月)',
          focus: 'Part 3/4の会話・アナウンスの先読み手法と情報検索スピード向上',
          missions: [
            '設問のキーワード（Who, Where, Why）の先読み訓練',
            '受動態・分詞構文・関係代名詞の識別スピード強化',
            'ロールプレイ: TOEIC Part 3形式の社内通達・出張手配の対話リスニング',
            'デイリークイズで頻出多義語（address, conduct, observe）をマスター'
          ]
        },
        {
          phase: 'Phase 3: 実践・応用 (7〜12ヶ月)',
          focus: 'Part 7複数パッセージ速読、言い換え（Paraphrase）察知力、800〜900点突破',
          missions: [
            '設問と本文の言い換えパターン（scheduled -> slated for 等）の分析',
            '長文ビジネスレター・請求書・Eメールの構造把握スキャン読解',
            'AI講師による難問Part 5/6の文法トラップ徹底添削と解説',
            'TOEIC頻出コロケーション（broad range of, in compliance with等）の定着'
          ]
        }
      ],
      situations: [
        { id: 'toeic_part3', title: 'Part 3風: 社内設備の故障と業者連絡', prompt: 'You are playing the role of an office manager in a TOEIC Part 3 listening style dialogue. Converse with the user about a broken color printer on the 4th floor, discuss warranty terms, and decide whether to call a technician.' },
        { id: 'toeic_part4', title: 'Part 4風: 空港アナウンス・フライト遅延', prompt: 'You are giving a broadcast announcement at an international airport terminal regarding a gate change and flight delay due to severe weather. Present the details clearly in formal English.' },
        { id: 'toeic_part7_discussion', title: 'Part 7風: 契約書・請求書の記載事項確認', prompt: 'You are a vendor discussing an invoice discrepancy with the user. Inquire politely about the missing purchase order number and discount application.' }
      ],
      presetPhrases: [
        { en: "Please note that all submissions are subject to managerial approval.", ja: "すべての提出物は管理職の承認を必要としますのでご留意ください。（TOEIC頻出）", category: "TOEIC・頻出構文" },
        { en: "In compliance with safety regulations, safety goggles must be worn.", ja: "安全規則に従い、安全ゴーグルを着用しなければなりません。（Part 5/7定番）", category: "TOEIC・規則" },
        { en: "The keynote speaker is scheduled to arrive shortly.", ja: "基調講演者は間もなく到着する予定です。（Part 4頻出）", category: "TOEIC・イベント" },
        { en: "We are pleased to announce the promotion of Ms. Garcia to Vice President.", ja: "ガルシア氏の副社長昇進を発表できることを嬉しく思います。（Part 7定番）", category: "TOEIC・人事通達" },
        { en: "Due to circumstances beyond our control, the shipment has been delayed.", ja: "不測の事態により、発送が遅延しております。（Part 3/7定番）", category: "TOEIC・トラブル" }
      ],
      presetQuizzes: [
        {
          question: "空欄に入る適切な品詞は？ 'The committee reviewed the proposal ___ before making a final decision.'",
          options: ["thoroughly", "thorough", "thoroughness", "more thorough"],
          answer: 0,
          explanation: "動詞 reviewed を修飾する語が必要なため、副詞の thoroughly（徹底的に）が正解です。"
        },
        {
          question: "空欄に入る適切な語は？ '___ the heavy snowfall, the morning train arrived on time.'",
          options: ["Despite", "Although", "Even though", "In spite"],
          answer: 0,
          explanation: "後ろに名詞句（the heavy snowfall）が続いているため、前置詞の Despite が正解です（In spite は of が必要、Althoughは節を導く）。"
        },
        {
          question: "TOEIC頻出の多義語 'address' が動詞として使われた場合の意味は？ 'The CEO will address the issue at the meeting.'",
          options: ["（問題・課題に）対処する・取り組む", "住所を特定する", "手紙を送る", "無視する"],
          answer: 0,
          explanation: "TOEICでは address the issue / address the problem で「課題に取り組む・対処する」という意味で極めて頻出です。"
        }
      ]
    }
  };

  const GRAMMAR_GUIDES = [
    {
      id: 'parts_of_speech',
      title: '品詞の役割と文の5文型',
      summary: '英語の骨格を掴む最も重要な基礎ルール。',
      content: `### 1. 英語の4大主要品詞\n- **名詞 (Noun)**: 人や物の名前。主語(S)、目的語(O)、補語(C)になる。\n- **動詞 (Verb)**: 動作や状態を表す。述語(V)になる。\n- **形容詞 (Adjective)**: 名詞を詳しく説明（修飾）する、または補語(C)になる。\n- **副詞 (Adverb)**: 動詞、形容詞、他の副詞、または文全体を修飾する（文の骨格にはならない）。\n\n### 2. 基本5文型\n1. **第1文型 (S + V)**: 「SがVする」 例: *The train arrived.*\n2. **第2文型 (S + V + C)**: 「SはCである (S = C)」 例: *She looks happy.*\n3. **第3文型 (S + V + O)**: 「SがOをVする」 例: *I checked the report.*\n4. **第4文型 (S + V + O1 + O2)**: 「SがO1にO2を与える」 例: *He sent me an email.*\n5. **第5文型 (S + V + O + C)**: 「SはOがCだと〜する (O = C)」 例: *They named the project Phoenix.*`
    },
    {
      id: 'tenses_aspects',
      title: '時制とアスペクト（現在完了の感覚）',
      summary: '「過去」と「現在完了」の決定的違いを理解する。',
      content: `### 1. 過去形 vs 現在完了形 (have + p.p.)\n- **過去形 (Simple Past)**: 過去の「ある一点」の出来事。*現在とのつながりは切れている*。\n  - 例: *I lost my key.* (過去に鍵を失くした。いま見つかったかどうかは不明)\n- **現在完了形 (Present Perfect)**: 過去の出来事が*「今この瞬間にどう影響しているか」*を表す。\n  - 例: *I have lost my key.* (鍵を失くして、*今も手元にない*状態)\n\n### 2. 現在完了の3大用法\n1. **継続 (ずっと〜している)**: *I have lived here for two years.*\n2. **経験 (〜したことがある)**: *Have you ever been to Sydney?*\n3. **完了・結果 (〜し終えた / してしまった)**: *I have just finished the slides.*`
    },
    {
      id: 'polite_requests',
      title: '丁寧な依頼・助動詞のニュアンス',
      summary: 'Can you / Could you / Would you mind の使い分け。',
      content: `### 丁寧度のグラデーション\n1. **Can you ~ ?** （カジュアル・友人向け）\n   - *Can you send me the link?* （リンク送ってくれる？）\n2. **Could you ~ ?** （丁寧・ビジネス日常）\n   - *Could you please send me the link?* （リンクを送っていただけますか？）\n3. **Would you be able to ~ ?** （より慎重で丁寧なビジネス）\n   - *Would you be able to review this by 3 PM?* （15時までにこれをご確認いただくことは可能でしょうか？）\n4. **Would you mind -ing ~ ?** （最上級に丁寧・恐縮した依頼）\n   - *Would you mind sending me the link?* （恐れ入りますがリンクを送っていただけないでしょうか？）\n   - **注意**: 承諾するときは "Not at all."（まったく嫌ではありません＝喜んで）と答えます。`
    }
  ];

  const SYSTEM_PROMPTS = {
    chat: (mode, situation) => `You are "Coach Nova", a world-class, encouraging, and supportive personal English tutor helping Tatsuya master English.
Currently, the user is studying in "${mode.name}" mode (${mode.enName}).
Current Scenario: ${situation.title}.
Background Instructions: ${situation.prompt}

Guidelines:
1. Speak in natural, engaging English suitable for the user's level (approachable intermediate, clear vocabulary).
2. Keep your conversational response relatively concise (2-4 sentences) so that it encourages back-and-forth conversation.
3. At the end of your response, ALWAYS include a small section formatted like this:
---
💡 **Tutor's Tip**: [One short sentence explaining a useful phrase, alternative native expression, or grammar tip related to what was just said, in gentle Japanese]
4. If the user makes a clear grammatical mistake, politely model the correct expression without being pedantic.`,

    review: (mode) => `You are "Coach Nova", an expert English editor and grammar teacher.
The user wants to review and improve their written English in the context of "${mode.name}" (${mode.enName}).

Analyze the user's input text and respond strictly in the following JSON format:
\`\`\`json
{
  "original": "User's input text",
  "corrections": [
    {
      "type": "Grammar / Spelling / Punctuation",
      "issue": "What was incorrect or awkward",
      "fixed": "The corrected text",
      "explanation": "Clear, friendly Japanese explanation of the grammar rule"
    }
  ],
  "versions": {
    "corrected": "Grammatically correct version keeping original tone",
    "natural": "How a native speaker would naturally say this in modern English",
    "business_or_formal": "A polished, formal or professional version suitable for business/formal writing"
  },
  "key_vocabulary": [
    {
      "word": "Key word or phrase",
      "meaning": "Japanese meaning",
      "example": "Sample sentence using this word"
    }
  ],
  "coach_comment": "Encouraging short advice in Japanese praising what was good and pointing out 1 key takeaway."
}
\`\`\`
Ensure all explanations and comments are in helpful, clear Japanese. Return only the JSON markdown block.`,

    quizGeneration: (mode) => `You are an expert English test creator for "${mode.name}" (${mode.enName}).
Generate 3 fresh, high-quality multiple choice quiz questions (suitable for TOEIC, Business, or Daily usage).
Respond strictly in the following JSON format:
\`\`\`json
[
  {
    "question": "English question or sentence with a blank (___)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Clear Japanese explanation of why this answer is correct and why other options are wrong."
  }
]
\`\`\`
Return only the JSON markdown block.`
  };

  /* ==========================================
   * 2. STATE MANAGEMENT
   * ========================================== */
  class AppState {
    constructor() {
      this.subscribers = new Set();
      this.state = {
        mode: 'daily',
        tab: 'dashboard',
        apiKey: '',
        selectedModel: 'gemini-1.5-flash',
        stats: {
          totalMinutes: 0,
          todayMinutes: 0,
          lastStudyDate: new Date().toISOString().split('T')[0],
          streakDays: 1,
          modeDistribution: { daily: 0, business: 0, toeic: 0 },
          dailyHistory: {},
          completedMissions: [],
          savedPhrasesCount: 0,
          reviewedCount: 0,
          quizzesTaken: 0,
          quizzesCorrect: 0
        },
        currentSituationId: 'cafe',
        chatMessages: [],
        reviewHistory: [],
        savedPhrases: [],
        quiz: {
          currentQuestions: [],
          currentIndex: 0,
          score: 0,
          answered: false,
          reviewList: []
        },
        timer: {
          isActive: false,
          seconds: 0
        }
      };
    }

    init(savedData = {}) {
      if (savedData.stats) this.state.stats = { ...this.state.stats, ...savedData.stats };
      if (savedData.mode && MODES[savedData.mode]) this.state.mode = savedData.mode;
      if (savedData.apiKey) this.state.apiKey = savedData.apiKey;
      if (savedData.selectedModel) this.state.selectedModel = savedData.selectedModel;
      if (Array.isArray(savedData.savedPhrases)) {
        this.state.savedPhrases = savedData.savedPhrases;
        this.state.stats.savedPhrasesCount = savedData.savedPhrases.length;
      }
      if (Array.isArray(savedData.reviewHistory)) {
        this.state.reviewHistory = savedData.reviewHistory;
        this.state.stats.reviewedCount = savedData.reviewHistory.length;
      }
      this.checkAndUpdateStreak();
      this.notify();
    }

    subscribe(callback) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }

    notify() {
      for (const callback of this.subscribers) {
        try { callback(this.state); } catch (err) { console.error('State subscriber error:', err); }
      }
    }

    setMode(modeId) {
      if (MODES[modeId]) {
        this.state.mode = modeId;
        const firstSit = MODES[modeId].situations[0];
        if (firstSit) this.state.currentSituationId = firstSit.id;
        this.notify();
      }
    }

    setTab(tabId) {
      this.state.tab = tabId;
      this.notify();
    }

    setApiKey(key) {
      this.state.apiKey = (key || '').trim();
      this.notify();
    }

    setSelectedModel(modelId) {
      this.state.selectedModel = modelId;
      this.notify();
    }

    setSituation(situationId) {
      this.state.currentSituationId = situationId;
      this.notify();
    }

    addChatMessage(role, text, tip = '') {
      this.state.chatMessages.push({
        role,
        text,
        tip,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.notify();
    }

    clearChat() {
      this.state.chatMessages = [];
      this.notify();
    }

    addReviewResult(result) {
      this.state.reviewHistory.unshift({
        ...result,
        id: 'rev_' + Date.now(),
        mode: this.state.mode,
        createdAt: new Date().toISOString()
      });
      this.state.stats.reviewedCount = this.state.reviewHistory.length;
      this.notify();
    }

    savePhrase(phrase) {
      const exists = this.state.savedPhrases.some(p => p.en.toLowerCase() === phrase.en.toLowerCase());
      if (!exists) {
        this.state.savedPhrases.unshift({
          ...phrase,
          id: 'phrase_' + Date.now(),
          mode: this.state.mode,
          savedAt: new Date().toISOString()
        });
        this.state.stats.savedPhrasesCount = this.state.savedPhrases.length;
        this.notify();
        return true;
      }
      return false;
    }

    removePhrase(id) {
      this.state.savedPhrases = this.state.savedPhrases.filter(p => p.id !== id);
      this.state.stats.savedPhrasesCount = this.state.savedPhrases.length;
      this.notify();
    }

    toggleMission(missionText) {
      const idx = this.state.stats.completedMissions.indexOf(missionText);
      if (idx === -1) {
        this.state.stats.completedMissions.push(missionText);
      } else {
        this.state.stats.completedMissions.splice(idx, 1);
      }
      this.notify();
    }

    recordQuizResult(isCorrect, question) {
      this.state.stats.quizzesTaken += 1;
      if (isCorrect) {
        this.state.stats.quizzesCorrect += 1;
      } else if (question) {
        if (!this.state.quiz.reviewList.some(q => q.question === question.question)) {
          this.state.quiz.reviewList.push({ ...question, mode: this.state.mode });
        }
      }
      this.notify();
    }

    startTimer() {
      this.state.timer.isActive = true;
      this.notify();
    }

    pauseTimer() {
      this.state.timer.isActive = false;
      this.notify();
    }

    tickTimer() {
      if (this.state.timer.isActive) {
        this.state.timer.seconds += 1;
        if (this.state.timer.seconds % 60 === 0) {
          this.addStudyMinute();
        }
        this.notify();
      }
    }

    addStudyMinute() {
      const today = new Date().toISOString().split('T')[0];
      this.state.stats.totalMinutes += 1;
      this.state.stats.todayMinutes += 1;
      this.state.stats.dailyHistory[today] = (this.state.stats.dailyHistory[today] || 0) + 1;
      const currentMode = this.state.mode;
      if (this.state.stats.modeDistribution[currentMode] !== undefined) {
        this.state.stats.modeDistribution[currentMode] += 1;
      }
      this.notify();
    }

    checkAndUpdateStreak() {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = this.state.stats.lastStudyDate;
      if (!lastDate) {
        this.state.stats.lastStudyDate = today;
        this.state.stats.streakDays = 1;
        return;
      }
      if (lastDate === today) return;

      const todayDate = new Date(today);
      const last = new Date(lastDate);
      const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        this.state.stats.streakDays += 1;
        this.state.stats.todayMinutes = 0;
        this.state.stats.lastStudyDate = today;
      } else if (diffDays > 1) {
        this.state.stats.streakDays = 1;
        this.state.stats.todayMinutes = 0;
        this.state.stats.lastStudyDate = today;
      }
    }
  }

  const state = new AppState();

  /* ==========================================
   * 3. STORAGE & EXPORT
   * ========================================== */
  const storage = {
    loadData() {
      try {
        const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
        const selectedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'gemini-1.5-flash';
        const mode = localStorage.getItem(STORAGE_KEYS.CURRENT_MODE) || 'daily';
        const statsRaw = localStorage.getItem(STORAGE_KEYS.USER_STATE);
        const stats = statsRaw ? JSON.parse(statsRaw) : null;
        const phrasesRaw = localStorage.getItem(STORAGE_KEYS.PHRASE_BOOK);
        const savedPhrases = phrasesRaw ? JSON.parse(phrasesRaw) : [];
        const reviewsRaw = localStorage.getItem(STORAGE_KEYS.REVIEW_HISTORY);
        const reviewHistory = reviewsRaw ? JSON.parse(reviewsRaw) : [];

        return { apiKey, selectedModel, mode, stats, savedPhrases, reviewHistory };
      } catch (err) {
        console.error('Failed to load from localStorage:', err);
        return {};
      }
    },

    saveData(appState) {
      try {
        if (appState.apiKey !== undefined) localStorage.setItem(STORAGE_KEYS.API_KEY, appState.apiKey);
        if (appState.selectedModel) localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, appState.selectedModel);
        if (appState.mode) localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, appState.mode);
        if (appState.stats) localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(appState.stats));
        if (appState.savedPhrases) localStorage.setItem(STORAGE_KEYS.PHRASE_BOOK, JSON.stringify(appState.savedPhrases));
        if (appState.reviewHistory) localStorage.setItem(STORAGE_KEYS.REVIEW_HISTORY, JSON.stringify(appState.reviewHistory));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    },

    exportJSON(appState) {
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        stats: appState.stats,
        savedPhrases: appState.savedPhrases,
        reviewHistory: appState.reviewHistory
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `english_coach_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importJSON(jsonString, stateInstance) {
      try {
        const data = JSON.parse(jsonString);
        if (data.stats || data.savedPhrases || data.reviewHistory) {
          stateInstance.init(data);
          this.saveData(stateInstance.state);
          return { success: true, count: (data.savedPhrases?.length || 0) };
        }
        throw new Error('無効なデータ形式です。');
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    exportPhrasesMarkdown(phrases) {
      const lines = [
        '---',
        'title: "English Coach - Saved Phrases"',
        `updated: ${new Date().toISOString()}`,
        'tags:',
        '  - english-learning',
        '  - vocabulary',
        '  - phrases',
        '---',
        '',
        '# 📚 English Coach - 保存済みフレーズ集',
        '',
        '| 英語表現 (Expression) | 日本語訳 (Meaning) | カテゴリ | モード | 登録日 |',
        '| :--- | :--- | :--- | :--- | :--- |'
      ];
      for (const p of phrases) {
        const date = p.savedAt ? p.savedAt.split('T')[0] : '-';
        lines.push(`| **${p.en.replace(/\|/g, '\\|')}** | ${p.ja.replace(/\|/g, '\\|')} | ${p.category || '-'} | ${p.mode || '-'} | ${date} |`);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `English_Phrases_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  /* ==========================================
   * 4. GEMINI CLIENT
   * ========================================== */
  class GeminiClient {
    constructor(apiKey = '', model = 'gemini-1.5-flash') {
      this.apiKey = apiKey;
      this.model = model;
      this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    setApiKey(key) { this.apiKey = key; }
    setModel(model) { this.model = model; }

    async testConnection() {
      if (!this.apiKey) throw new Error('APIキーが設定されていません。');
      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: 'Hello, please reply "OK" if you can hear me.' }] }]
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `APIエラー (${response.status})`);
      }
      return true;
    }

    async chat({ modeId, situationId, messageHistory, userMessage }) {
      if (!this.apiKey) return this.getMockChatResponse(userMessage, modeId);

      const mode = MODES[modeId] || MODES.daily;
      const situation = mode.situations.find(s => s.id === situationId) || mode.situations[0];
      const systemInstruction = SYSTEM_PROMPTS.chat(mode, situation);

      const contents = [
        { role: 'user', parts: [{ text: `[System Instruction]\n${systemInstruction}\n\nLet's start the dialogue.` }] },
        { role: 'model', parts: [{ text: `Hello! I am ready. Let's begin our conversation for "${situation.title}".` }] }
      ];

      for (const msg of messageHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text + (msg.tip ? `\n\n---\n💡 **Tutor's Tip**: ${msg.tip}` : '') }]
        });
      }

      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gemini API呼び出しエラー (${response.status})`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this.parseChatResponse(candidate);
    }

    parseChatResponse(rawText) {
      const tipIndex = rawText.indexOf("💡 **Tutor's Tip**:");
      if (tipIndex !== -1) {
        const text = rawText.substring(0, tipIndex).replace(/---\s*$/, '').trim();
        const tip = rawText.substring(tipIndex + "💡 **Tutor's Tip**:".length).trim();
        return { text, tip };
      }
      return { text: rawText.trim(), tip: '' };
    }

    async reviewWriting({ modeId, inputText }) {
      if (!this.apiKey) return this.getMockReviewResponse(inputText, modeId);

      const mode = MODES[modeId] || MODES.daily;
      const systemPrompt = SYSTEM_PROMPTS.review(mode);
      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Input to Review:\n"""\n${inputText}\n"""` }] }]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gemini API添削エラー (${response.status})`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this.extractJSON(rawText);
    }

    async generateQuiz({ modeId }) {
      if (!this.apiKey) {
        const mode = MODES[modeId] || MODES.daily;
        return mode.presetQuizzes;
      }

      const mode = MODES[modeId] || MODES.daily;
      const systemPrompt = SYSTEM_PROMPTS.quizGeneration(mode);
      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const payload = { contents: [{ role: 'user', parts: [{ text: systemPrompt }] }] };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gemini APIクイズ生成エラー (${response.status})`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this.extractJSON(rawText);
    }

    extractJSON(text) {
      try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const cleaned = jsonMatch ? jsonMatch[1].trim() : text.trim();
        return JSON.parse(cleaned);
      } catch (err) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('AIの応答を構造化データとして解析できませんでした。');
      }
    }

    getMockChatResponse(userMessage, modeId) {
      const responses = {
        daily: {
          text: `That's wonderful to hear! Practicing everyday conversation is all about keeping it natural and relaxed. What did you enjoy the most today?`,
          tip: `「That's wonderful to hear!」は相手のポジティブな話を聞いたときの王道の相槌フレーズです。`
        },
        business: {
          text: `Thank you for updating me on the project status. I appreciate your clear summary. Could you specify the expected timeline for the next milestone?`,
          tip: `「Could you specify ~ ?」は「具体的に〜を教えていただけますか？」とプロフェッショナルに確認する表現です。`
        },
        toeic: {
          text: `Certainly. According to the revised schedule, the conference room has been reserved until 4 PM. Please inform the team accordingly.`,
          tip: `「accordingly（それに応じて・適切に）」はTOEIC Part 7のビジネス連絡で頻出の副詞です。`
        }
      };
      return responses[modeId] || responses.daily;
    }

    getMockReviewResponse(inputText, modeId) {
      return {
        original: inputText,
        corrections: [
          {
            type: "Politeness & Tone",
            issue: "やや直接的な表現になっています",
            fixed: "Could you please ~ / I would like to ~",
            explanation: "英語ではストレートな命令形よりも、助動詞（Could/Would）を使うことで親しみやすさとプロフェッショナルな品格が生まれます。"
          }
        ],
        versions: {
          corrected: inputText.trim().replace(/^i /i, 'I '),
          natural: `Naturally expressed: "${inputText.trim()}" (Clear and direct)`,
          business_or_formal: `I would like to follow up regarding: "${inputText.trim()}"`
        },
        key_vocabulary: [
          {
            word: "follow up on",
            meaning: "〜について追跡確認する、フォローアップする",
            example: "I will follow up on this task tomorrow morning."
          }
        ],
        coach_comment: "素晴らしいアウトプットです！言いたい骨格がしっかり伝わっています。助動詞のニュアンスを意識するとさらに洗練されますよ！"
      };
    }
  }

  /* ==========================================
   * 5. SPEECH SERVICE
   * ========================================== */
  class SpeechService {
    constructor() {
      this.recognition = null;
      this.isListening = false;
      this.synthesis = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
      this.selectedVoice = null;
      this.speechRate = 0.95;
      this.initRecognition();
      this.initVoices();
    }

    initRecognition() {
      if (typeof window === 'undefined') return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = true;
        this.recognition.continuous = false;
      } catch (err) {
        console.error('Failed to init recognition:', err);
      }
    }

    initVoices() {
      if (!this.synthesis) return;
      const setVoice = () => {
        const voices = this.synthesis.getVoices();
        const preferred = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
        this.selectedVoice = preferred || voices.find(v => v.lang.startsWith('en')) || voices[0];
      };
      setVoice();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = setVoice;
      }
    }

    isRecognitionSupported() {
      return !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
    }

    startListening({ onStart, onResult, onEnd, onError }) {
      if (!this.recognition) {
        if (onError) onError(new Error('お使いのブラウザは音声認識をサポートしていません。'));
        return;
      }
      if (this.isListening) this.stopListening();

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        if (onResult) onResult({ final: finalTranscript, interim: interimTranscript });
      };
      this.recognition.onerror = (event) => {
        this.isListening = false;
        if (onError) onError(new Error(`音声認識エラー: ${event.error}`));
      };
      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      try {
        this.recognition.start();
      } catch (err) {
        if (onError) onError(err);
      }
    }

    stopListening() {
      if (this.recognition && this.isListening) {
        try { this.recognition.stop(); } catch (err) {}
        this.isListening = false;
      }
    }

    speak(text) {
      if (!this.synthesis) return;
      this.stopSpeaking();
      const cleanText = text.replace(/[*_#`~]/g, '').replace(/---\s*💡.*/s, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = this.speechRate;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;
      this.synthesis.speak(utterance);
    }

    stopSpeaking() {
      if (this.synthesis) this.synthesis.cancel();
    }
  }

  const speech = new SpeechService();

  /* ==========================================
   * 6. ANALYTICS MANAGER
   * ========================================== */
  class AnalyticsManager {
    constructor() {
      this.historyChart = null;
      this.distributionChart = null;
    }

    renderCharts(stats) {
      if (typeof Chart === 'undefined') return;
      this.renderHistoryChart(stats.dailyHistory || {});
      this.renderDistributionChart(stats.modeDistribution || {});
    }

    renderHistoryChart(dailyHistory) {
      const ctx = document.getElementById('studyHistoryChart');
      if (!ctx) return;
      if (this.historyChart) this.historyChart.destroy();

      const labels = [];
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        data.push(dailyHistory[dateStr] || 0);
      }

      this.historyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: '学習時間 (分)',
            data,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#10b981'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
          }
        }
      });
    }

    renderDistributionChart(modeDistribution) {
      const ctx = document.getElementById('modeDistributionChart');
      if (!ctx) return;
      if (this.distributionChart) this.distributionChart.destroy();

      const daily = modeDistribution.daily || 0;
      const business = modeDistribution.business || 0;
      const toeic = modeDistribution.toeic || 0;
      const total = daily + business + toeic;

      const data = total === 0 ? [1, 1, 1] : [daily, business, toeic];
      const bgColors = total === 0 
        ? ['#334155', '#475569', '#64748b']
        : ['#10b981', '#3b82f6', '#8b5cf6'];

      this.distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['日常会話', 'ビジネス', 'TOEIC'],
          datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', boxWidth: 12, padding: 12 }
            }
          },
          cutout: '70%'
        }
      });
    }
  }

  const analytics = new AnalyticsManager();

  /* ==========================================
   * 6.5. MISSION 6-STEP LEARNING CONTENT & ENGINE
   * ========================================== */
  const MISSION_LEARNING_CONTENT = {
    // --- 日常英会話 Phase 1 ---
    "5文型と基本動詞（get, take, have, make）の感覚を復習する": {
      category: "文型・基本動詞",
      phase: "Phase 1: 基礎構築",
      step1: {
        title: "基本動詞のコアイメージを掴む",
        concept: "英語は『誰が・どうする・何を』の文型がすべての土台です。特に get / take / have / make は日本語訳ではなく、空間的なイメージで捉えることが流暢さへの第1歩です。",
        points: [
          { term: "have のイメージ", desc: "『自分の空間・テリトリーに持っている』状態。モノだけでなく予定・経験・感情も have します。" },
          { term: "get のイメージ", desc: "『外から内へ入り込む／状態が変化する』動き。get tired（疲れた状態になる）、get a ticket（手に入れる）。" },
          { term: "take のイメージ", desc: "『自分から手を伸ばして選び取る・引き寄せる』能動的な動き。take a bus（バスを選ぶ）、take a break（休憩を取る）。" },
          { term: "make のイメージ", desc: "『力を加えて新しい状態を作り出す』。make coffee、make people happy（人を幸せにする）。" }
        ],
        coreTip: "💡 動詞を覚えるときは、主語から目的語へエネルギーがどう流れるかをイメージしましょう。"
      },
      step2: {
        question: "次の日本語に合うように空欄に適する動詞を選んでください。<br/><strong>「ちょっと休憩しましょうか？」</strong>",
        sentence: "Why don't we [ _____ ] a short break?",
        options: ["take", "make", "get", "do"],
        answer: 0,
        explanation: "「休憩を取る」は自分の意志で休憩を引き寄せるイメージなので take a break が最も自然です。"
      },
      step3: {
        title: "週末の計画を話す日常会話",
        passage: "I usually have a busy week at work, so I like to take it easy on Saturdays. Sometimes I get some fresh coffee and make breakfast for my family.",
        passageJa: "普段平日は仕事で忙しいので、土曜日はのんびり過ごすのが好きです。たまに淹れたてのコーヒーを買って、家族のために朝食を作ったりします。",
        focusWords: ["have a busy week", "take it easy", "get fresh coffee", "make breakfast"]
      },
      step4: {
        target: "Why don't we take a short break and get some coffee?",
        targetJa: "少し休憩を取って、コーヒーでも買いに行きませんか？",
        tip: "take a short break を一息でなめらかに発音しましょう。"
      },
      step5: {
        scenario: "同僚のAI講師 Nova とオフィスで話しています。",
        aiGreeting: "Hey! You've been working at your desk for three hours. Are you feeling tired?",
        aiGreetingJa: "やあ！もう3時間もぶっ通しで作業してるよ。疲れてない？",
        suggestedReplies: [
          "Yeah, I'm pretty exhausted. Let's take a break!",
          "I have one more email to send, then I'll get some coffee."
        ],
        aiFeedback: "Excellent! You used the core verbs 'take a break' and 'get coffee' perfectly!"
      },
      step6: {
        summary: "基本動詞のコアイメージ（have/get/take/make）を体得し、日常の動作表現を習得しました。",
        keyPhrases: [
          { en: "take a short break", ja: "少し休憩を取る" },
          { en: "take it easy", ja: "のんびり気楽に過ごす" },
          { en: "get some coffee", ja: "コーヒーを買いに行く・手に入れる" }
        ]
      }
    },

    "現在完了形（have + p.p.）の日常会話での使い方をマスターする": {
      category: "完了形・時制",
      phase: "Phase 1: 基礎構築",
      step1: {
        title: "現在完了形 (have + 過去分詞) の感覚",
        concept: "現在完了形は「過去の出来事を、今の手元にギュッと抱え持っている」感覚です。単なる過去形（過去の一点）と違い、今の状態に直結しています。",
        points: [
          { term: "完了・結果", desc: "『〜しちゃった（だから今こうだよ）』例: I have lost my keys.（鍵を失くした＝今もない！）" },
          { term: "経験", desc: "『（今までの人生で）〜した経験を持っている』例: I have visited London twice." },
          { term: "継続", desc: "『過去から今までずっと〜の状態である』例: I have lived here for 3 years." }
        ],
        coreTip: "💡 『過去に起きたことが、今も影響している！』という現在の視点を意識するのがコツです。"
      },
      step2: {
        question: "「もうお昼ご飯食べた？」と自然に尋ねる文として適切なものは？",
        sentence: "[ _____ ] lunch yet?",
        options: ["Have you had", "Did you have", "Are you having", "Were you having"],
        answer: 0,
        explanation: "「今のお腹の状態（もう食べたか）」を尋ねる日常会話では、現在完了形 Have you had lunch yet? が極めて自然です。"
      },
      step3: {
        title: "同僚とのランチ前の会話",
        passage: "A: Have you finished the morning report yet?\nB: Yes, I have just submitted it to our manager. How about you?\nA: I haven't started yet because I've been in meetings all morning.",
        passageJa: "A: 午前の報告書はもう終わった？\nB: うん、ちょうど課長に提出したところだよ。君は？\nA: 午前中ずっと会議だったから、まだ手をつけてないんだ。",
        focusWords: ["have finished", "have just submitted", "haven't started yet", "have been in meetings"]
      },
      step4: {
        target: "I have lived in Japan for five years and I love it.",
        targetJa: "私は日本に5年間住んでいて、とても気に入っています。",
        tip: "have lived を弱くつなげて 'アイヴリヴド' のように発音します。"
      },
      step5: {
        scenario: "AI講師 Nova がランチに誘ってくれました。",
        aiGreeting: "Hey! I'm heading out to grab some sushi. Have you eaten lunch yet?",
        aiGreetingJa: "やあ！これからお寿司を食べに行くんだけど、もうお昼食べた？",
        suggestedReplies: [
          "Not yet! I have just wrapped up my work. I'd love to join!",
          "I have already eaten a sandwich, but I'll join you for some tea."
        ],
        aiFeedback: "Brilliant! Your use of 'have just wrapped up' and 'have already eaten' was spot-on!"
      },
      step6: {
        summary: "現在完了形（完了・経験・継続）のニュアンスを理解し、日常会話での自然な受け答えを練習しました。",
        keyPhrases: [
          { en: "Have you eaten yet?", ja: "もうご飯は食べましたか？" },
          { en: "I have just finished...", ja: "ちょうど〜を終えたところです" },
          { en: "I've been busy all day.", ja: "一日中ずっと忙しい状態です" }
        ]
      }
    },

    "「週末の予定」をAI講師に3文以上の英語で話してみる": {
      category: "スピーキング・発信力",
      phase: "Phase 1: 基礎構築",
      step1: {
        title: "予定を語る時の3段構成（予定・理由・感情）",
        concept: "英語で話を広げる基本は『① 予定を言う』『② 理由や具体例を足す』『③ 自分の気持ちを添える』の3ステップです。",
        points: [
          { term: "Step 1: 予定 (be going to / planning to)", desc: "I'm planning to go camping this weekend." },
          { term: "Step 2: 理由・詳細 (because / with)", desc: "Because the weather is going to be clear and sunny." },
          { term: "Step 3: 感情 (I'm really looking forward to)", desc: "I'm really looking forward to relaxing in nature." }
        ],
        coreTip: "💡 1文で終わらせず、Because... や I hope... を付け足すだけで英語がグンと生き生きします！"
      },
      step2: {
        question: "「今週末、友達と映画を見に行く予定です」を表す最も自然な文は？",
        sentence: "I am [ _____ ] a movie with my friends this weekend.",
        options: ["planning to watch", "plan watching", "planned to see", "will watching"],
        answer: 0,
        explanation: "すでに考えている予定を伝えるときは 'be planning to + 動詞の原形' がスムーズです。"
      },
      step3: {
        title: "週末の予定を語るミニスピーチ",
        passage: "This Saturday, I'm planning to go hiking with my colleagues. The autumn leaves are beautiful right now, so it should be great. I'm really looking forward to it!",
        passageJa: "今週の土曜日は同僚とハイキングに行く予定です。ちょうど紅葉が綺麗なので、きっと最高だと思います。とても楽しみにしています！",
        focusWords: ["planning to go hiking", "autumn leaves", "looking forward to"]
      },
      step4: {
        target: "I'm planning to visit Kyoto this weekend, and I'm really looking forward to it.",
        targetJa: "今週末京都を訪れる予定で、本当に楽しみにしています。",
        tip: "planning to と looking forward to を強調してリズムよく話しましょう。"
      },
      step5: {
        scenario: "金曜日の夕方、AI講師 Nova が週末の予定を聞いてきました。",
        aiGreeting: "TGIF! The week is almost over. Do you have any fun plans for this weekend?",
        aiGreetingJa: "やっと金曜日だね！今週末何か楽しい予定はある？",
        suggestedReplies: [
          "I'm planning to relax at home and read a new book.",
          "I'm going to a barbecue with my friends on Sunday. I hope it won't rain!"
        ],
        aiFeedback: "Fantastic! You expanded your sentence with details and your personal feeling!"
      },
      step6: {
        summary: "週末の予定について、予定・理由・感情の3文構成で流暢に伝える練習を完了しました。",
        keyPhrases: [
          { en: "I'm planning to...", ja: "〜する予定です・計画しています" },
          { en: "I'm really looking forward to it.", ja: "本当に楽しみにしています。" },
          { en: "TGIF (Thank God It's Friday)", ja: "やっと金曜日だ！（花金）" }
        ]
      }
    },

    // --- ビジネス英語 Phase 1 ---
    "命令文を回避し、クッション言葉を用いた依頼表現を身につける": {
      category: "ビジネス依頼・マナー",
      phase: "Phase 1: 基礎構築",
      step1: {
        title: "命令文を避け、敬意を伝えるクッション表現",
        concept: "英語圏のビジネスでは 'Please send the file.' ですら命令口調（上から目線）に聞こえることがあります。敬意を表すソフトなクッション表現を使いこなしましょう。",
        points: [
          { term: "Could you please...?", desc: "『〜していただけますでしょうか？』最も一般的で好感度の高いビジネス標準。" },
          { term: "Would you be able to...?", desc: "『もし可能でしたら〜していただけますか？』相手の都合を優先する配慮に満ちた表現。" },
          { term: "I would appreciate it if you could...", desc: "『〜していただけますと幸甚に存じます』重要案件や目上の相手に最適な最上級の敬語表現。" }
        ],
        coreTip: "💡 'Please do this' ではなく 'Could you possibly...' や 'Would it be possible to...' に置き換える習慣をつけましょう。"
      },
      step2: {
        question: "「もし可能であれば、明日までにこの草案をチェックしていただけますでしょうか？」に最も適した表現は？",
        sentence: "[ _____ ] review this draft by tomorrow?",
        options: ["Would you be able to", "Must you", "Please you can", "Do you review"],
        answer: 0,
        explanation: "相手の可能・不可能を気遣う Would you be able to + 原形 がビジネスでの最善の選択肢です。"
      },
      step3: {
        title: "海外パートナーへの丁寧な依頼メール",
        passage: "Dear Alex, I hope this email finds you well. Could you please review the attached proposal when you have a moment? I would greatly appreciate your feedback by Friday.",
        passageJa: "アレックス様、お世話になっております。お手すきの際に、添付の企画書をご確認いただけますでしょうか？金曜日までにフィードバックをいただけますと大変助かります。",
        focusWords: ["review the attached proposal", "when you have a moment", "greatly appreciate"]
      },
      step4: {
        target: "Could you please review the attached document when you have a moment?",
        targetJa: "お手すきの際に、添付書類をご確認いただけますでしょうか？",
        tip: "when you have a moment（お手すきの際に）を添えることでぐっと柔らかくなります。"
      },
      step5: {
        scenario: "マネージャーのNovaに資料のフィードバックをお願いする場面です。",
        aiGreeting: "Hello! I saw your message. Do you need any assistance with the presentation slides?",
        aiGreetingJa: "こんにちは！メッセージ見ましたよ。プレゼンスライドでお手伝いできることはありますか？",
        suggestedReplies: [
          "Could you please take a quick look at slide 5 when you have time?",
          "Would you be able to share your thoughts on the market analysis section?"
        ],
        aiFeedback: "Impeccable politeness! Your tone is professional, respectful, and crystal clear."
      },
      step6: {
        summary: "命令調を回避し、洗練されたビジネス依頼・クッション言葉の運用力を習得しました。",
        keyPhrases: [
          { en: "Could you please review...", ja: "〜をご確認いただけますでしょうか" },
          { en: "when you have a moment", ja: "お手すきの際に・お時間のある時に" },
          { en: "I would greatly appreciate it.", ja: "大変感謝いたします・幸甚に存じます" }
        ]
      }
    },

    // --- TOEIC対策 Phase 1 ---
    "語尾（-tion, -tive, -ly, -ment）による品詞判別トレーニング": {
      category: "TOEIC Part 5 文法",
      phase: "Phase 1: 基礎構築",
      step1: {
        title: "接尾辞（語尾）による品詞の瞬殺見分け",
        concept: "TOEIC Part 5 は1問20秒で解く必要があります。単語の意味が分からなくても、語尾のパターンを見れば5秒で品詞を確定できます！",
        points: [
          { term: "名詞の語尾", desc: "-tion (creation), -ment (agreement), -ty (capacity), -ance/-ence (importance)" },
          { term: "形容詞の語尾", desc: "-tive (productive), -able/-ible (reliable), -al (financial), -ful (helpful)" },
          { term: "副詞の語尾", desc: "形容詞 + -ly (rapidly, successfully, highly)" }
        ],
        coreTip: "💡 空欄の前後に冠詞 (a/the) や名詞がある場合、空欄には名詞を修飾する『形容詞』が入るのが鉄板パターンです。"
      },
      step2: {
        question: "空欄に入る最も適切な品詞を選んでください。<br/>The marketing team developed a highly [ _____ ] strategy.",
        sentence: "The marketing team developed a highly [ _____ ] strategy.",
        options: ["effective", "effect", "effectively", "effectiveness"],
        answer: 0,
        explanation: "副詞 highly（非常に）の後、名詞 strategy（戦略）の前なので、名詞を修飾する形容詞 effective（効果的な）が正解です。"
      },
      step3: {
        title: "社内業務改善の通知文（TOEIC Part 7風）",
        passage: "The new software allows for rapid communication between remote teams. Its effective implementation has already resulted in a significant reduction in operational costs.",
        passageJa: "新しいソフトウェアにより、リモートチーム間の迅速なコミュニケーションが可能になります。効果的な導入により、すでに業務コストの大幅な削減が実現しています。",
        focusWords: ["rapid communication", "effective implementation", "significant reduction"]
      },
      step4: {
        target: "The new system ensures rapid communication and high efficiency.",
        targetJa: "新しいシステムは迅速なコミュニケーションと高い効率性を保証します。",
        tip: "rapid communication（形容詞＋名詞）と high efficiency（形容詞＋名詞）の構造を意識して発音します。"
      },
      step5: {
        scenario: "TOEIC講師のNovaとPart 5の解法テクニックを振り返ります。",
        aiGreeting: "Well done on tackling the part 5 question! How did you spot the right answer so quickly?",
        aiGreetingJa: "Part 5の問題への取り組み、お見事です！どうやってそんなに素早く正解を見抜けたのですか？",
        suggestedReplies: [
          "I looked at the ending '-tive' and knew it was an adjective modifying 'strategy'.",
          "The adverb 'highly' was followed by a blank and a noun, so an adjective was required."
        ],
        aiFeedback: "Exactly right! Mastering suffixes will easily push your score past 700!"
      },
      step6: {
        summary: "語尾による品詞判別（名詞・形容詞・副詞）のルールをマスターし、Part 5の解答速度を大幅に向上させました。",
        keyPhrases: [
          { en: "effective implementation", ja: "効果的な導入・実施" },
          { en: "significant reduction", ja: "大幅な削減" },
          { en: "rapid communication", ja: "迅速なコミュニケーション" }
        ]
      }
    }
  };

  /**
   * ミッション名とモードに基づき、完全な6ステップ学習コンテンツを返却する（辞書または動的生成）
   */
  function getMissionContent(missionTitle, modeId) {
    if (MISSION_LEARNING_CONTENT[missionTitle]) {
      return MISSION_LEARNING_CONTENT[missionTitle];
    }
    const currentMode = MODES[modeId] || MODES.daily;
    return {
      category: currentMode.name,
      phase: "ロードマップ学習",
      step1: {
        title: `${missionTitle} のコアイメージと基本原則`,
        concept: `このミッションでは「${missionTitle}」の核となる感覚と、実際のコミュニケーションで役立つ使い方をマスターします。`,
        points: [
          { term: "コア原則", desc: "自然な英語表現の基本は、相手との関係性・文脈に合わせた適切なトーンとリズムです。" },
          { term: "文法・語彙のポイント", desc: "単語単体ではなく、前後の語（コロケーション）や短いフレーズ単位で口に馴染ませましょう。" },
          { term: "実践での活用", desc: "実際の会話やテストでは、迷わず0.5秒でアウトプットできるようにすることが目標です。" }
        ],
        coreTip: "💡 頭で日本語に翻訳せず、情景や感情をそのまま英語の音に乗せる練習を意識しましょう。"
      },
      step2: {
        question: `「${missionTitle}」に関連する表現として、最も自然な選択肢を選んでください。`,
        sentence: "I would like to improve my English skills by practicing [ _____ ] day.",
        options: ["every", "all", "each and", "any"],
        answer: 0,
        explanation: "「毎日コツコツ練習する」は practicing every day が最も自然なコロケーションです。"
      },
      step3: {
        title: `${missionTitle} の実践パッセージ`,
        passage: `Learning English is an ongoing journey. When you focus on "${missionTitle}", you build confidence step by step. Consistent daily practice makes all the difference!`,
        passageJa: `英語学習は継続的な旅です。「${missionTitle}」に集中して取り組むことで、一歩ずつ自信がつきます。毎日の継続こそが大きな成果を生み出します！`,
        focusWords: ["ongoing journey", "build confidence", "consistent daily practice", "makes all the difference"]
      },
      step4: {
        target: "Consistent daily practice makes all the difference in English learning.",
        targetJa: "毎日の継続的な練習こそが、英語学習において決定的な違いを生み出します。",
        tip: "makes all the difference（決定的な違いを生む）を感情を込めて発音してみましょう。"
      },
      step5: {
        scenario: `AI講師 Nova と「${missionTitle}」のテーマについて話しています。`,
        aiGreeting: `Hi! Today we are working on "${missionTitle}". How do you feel about your progress so far?`,
        aiGreetingJa: `こんにちは！今日は「${missionTitle}」に取り組んでいますね。ここまでの手応えはいかがですか？`,
        suggestedReplies: [
          "I'm feeling good! Practicing step by step really helps.",
          "It's a bit challenging, but I'm learning a lot of useful expressions."
        ],
        aiFeedback: "Wonderful mindset! Step-by-step consistency is the true secret to fluency."
      },
      step6: {
        summary: `「${missionTitle}」の全ステップ（初期学習・短文・長文・スピーキング・ロールプレイ）をやり遂げました！`,
        keyPhrases: [
          { en: "Consistent daily practice", ja: "継続的な日々の練習" },
          { en: "makes all the difference", ja: "大きな違いを生み出す" },
          { en: "step by step", ja: "一歩一歩着実に" }
        ]
      }
    };
  }

  /* ==========================================
   * 7. UI MANAGER
   * ========================================== */

  class UIManager {
    constructor(stateInstance, geminiClient, storageService) {
      this.state = stateInstance;
      this.gemini = geminiClient;
      this.storage = storageService;
      this.currentQuizList = [];
      this.currentQuizIndex = 0;
      this.currentSession = null;
      this.currentSessionStep = 1;
      this.sessionRecognition = null;
      this.isRecordingSpeaking = false;
    }

    init() {
      this.bindGlobalEvents();
      this.initStudySessionModal();
      this.renderAll();

      this.state.subscribe(() => {
        this.updateHeaderStats();
        this.storage.saveData(this.state.state);
      });

      setInterval(() => {
        this.state.tickTimer();
        this.updateTimerDisplay();
      }, 1000);
    }

    renderAll() {
      this.renderHeader();
      this.renderActiveTab();
    }

    bindGlobalEvents() {
      const modeSelect = document.getElementById('modeSelect');
      if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
          this.state.setMode(e.target.value);
          this.currentQuizList = [];
          this.currentQuizIndex = 0;
          this.renderAll();
          this.showToast(`モードを「${MODES[e.target.value].name}」に切り替えました`);
        });
      }

      const tabButtons = document.querySelectorAll('.nav-tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.switchTab(btn.dataset.tab);
        });
      });

      const timerToggleBtn = document.getElementById('timerToggleBtn');
      if (timerToggleBtn) {
        timerToggleBtn.addEventListener('click', () => {
          if (this.state.state.timer.isActive) {
            this.state.pauseTimer();
            timerToggleBtn.innerHTML = `<i data-lucide="play"></i> <span>学習再開</span>`;
          } else {
            this.state.startTimer();
            timerToggleBtn.innerHTML = `<i data-lucide="pause"></i> <span>一時停止</span>`;
          }
          if (window.lucide) window.lucide.createIcons();
        });
      }

      // API Settings
      const settingsBtn = document.getElementById('settingsBtn');
      const settingsModal = document.getElementById('settingsModal');
      const closeSettingsBtn = document.getElementById('closeSettingsBtn');
      const saveSettingsBtn = document.getElementById('saveSettingsBtn');
      const testApiBtn = document.getElementById('testApiBtn');

      if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
          document.getElementById('apiKeyInput').value = this.state.state.apiKey;
          document.getElementById('modelSelect').value = this.state.state.selectedModel;
          settingsModal.classList.remove('hidden');
        });
      }
      if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
      }
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
          const key = document.getElementById('apiKeyInput').value.trim();
          const model = document.getElementById('modelSelect').value;
          this.state.setApiKey(key);
          this.state.setSelectedModel(model);
          this.gemini.setApiKey(key);
          this.gemini.setModel(model);
          settingsModal.classList.add('hidden');
          this.showToast('設定を保存しました');
        });
      }
      if (testApiBtn) {
        testApiBtn.addEventListener('click', async () => {
          const key = document.getElementById('apiKeyInput').value.trim();
          const model = document.getElementById('modelSelect').value;
          if (!key) { alert('APIキーを入力してください。'); return; }
          testApiBtn.disabled = true;
          testApiBtn.textContent = '検証中...';
          try {
            const tempClient = new GeminiClient(key, model);
            await tempClient.testConnection();
            alert('✅ 接続成功！Gemini APIは正常に利用可能です。');
          } catch (err) {
            alert(`❌ 接続失敗: ${err.message}`);
          } finally {
            testApiBtn.disabled = false;
            testApiBtn.textContent = '接続テスト';
          }
        });
      }

      // Grammar Guide
      const grammarGuideBtn = document.getElementById('grammarGuideBtn');
      const grammarModal = document.getElementById('grammarModal');
      const closeGrammarBtn = document.getElementById('closeGrammarBtn');
      if (grammarGuideBtn && grammarModal) {
        grammarGuideBtn.addEventListener('click', () => {
          this.renderGrammarGuideModal();
          grammarModal.classList.remove('hidden');
        });
      }
      if (closeGrammarBtn && grammarModal) {
        closeGrammarBtn.addEventListener('click', () => grammarModal.classList.add('hidden'));
      }

      // 「学習を記録する」ボタン
      const logStudyBtn = document.getElementById('logStudyBtn');
      if (logStudyBtn) {
        logStudyBtn.addEventListener('click', () => this.handleLogStudySession());
      }

      // 達成モーダル閉じる
      const closeCelebrationBtn = document.getElementById('closeCelebrationBtn');
      const celebrationModal = document.getElementById('celebrationModal');
      if (closeCelebrationBtn && celebrationModal) {
        closeCelebrationBtn.addEventListener('click', () => {
          celebrationModal.classList.add('hidden');
        });
      }
    }

    async handleLogStudySession() {
      // 1. タイマー時間の確定
      const sec = this.state.state.timer.seconds;
      if (sec > 0) {
        const minsToAdd = Math.max(1, Math.round(sec / 60));
        for (let i = 0; i < minsToAdd; i++) {
          this.state.addStudyMinute();
        }
        this.state.state.timer.seconds = 0;
      } else if (this.state.state.stats.todayMinutes === 0) {
        this.state.addStudyMinute();
      }

      this.state.pauseTimer();
      this.state.checkAndUpdateStreak();
      this.storage.saveData(this.state.state);
      this.updateHeaderStats();
      this.updateTimerDisplay();

      const timerToggleBtn = document.getElementById('timerToggleBtn');
      if (timerToggleBtn) {
        timerToggleBtn.innerHTML = `<i data-lucide="play"></i> <span>学習開始</span>`;
      }

      // 2. モーダル表示内容の更新
      const stats = this.state.state.stats;
      const modalToday = document.getElementById('modalTodayMinutes');
      const modalStreak = document.getElementById('modalStreakDays');
      const modalTotal = document.getElementById('modalTotalMinutes');
      const modalPhrases = document.getElementById('modalPhrasesCount');
      const modalStatus = document.getElementById('modalSyncStatusText');

      if (modalToday) modalToday.textContent = `${stats.todayMinutes}分`;
      if (modalStreak) modalStreak.textContent = `🔥 ${stats.streakDays}日連続`;
      if (modalTotal) modalTotal.textContent = `${stats.totalMinutes}分`;
      if (modalPhrases) modalPhrases.textContent = `${stats.savedPhrasesCount}語`;

      // 3. Vaultサーバー (/api/save) への自動保存試行
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.state.state)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && modalStatus) {
            modalStatus.textContent = '✅ Obsidian Vault (30_Document/English_Learning/) に直接記録を保存しました！';
          }
        } else {
          throw new Error('Server returned error');
        }
      } catch (e) {
        if (modalStatus) {
          modalStatus.textContent = '✅ 今日の学習を記録しました！（次回起動時にも引き継がれます）';
        }
      }

      // 4. モーダル表示
      const modal = document.getElementById('celebrationModal');
      if (modal) {
        modal.classList.remove('hidden');
      }

      if (window.lucide) window.lucide.createIcons();
      this.renderActiveTab();
      this.showToast('🎉 本日の学習を記録しました！');
    }

    switchTab(tabId) {
      this.state.setTab(tabId);
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });
      document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);
      });
      this.renderActiveTab();
      if (window.lucide) window.lucide.createIcons();
    }

    renderActiveTab() {
      const currentTab = this.state.state.tab;
      switch (currentTab) {
        case 'dashboard': this.renderDashboard(); break;
        case 'chat': this.renderChatTab(); break;
        case 'review': this.renderReviewTab(); break;
        case 'quiz': this.renderQuizTab(); break;
        case 'phrasebook': this.renderPhrasebookTab(); break;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    renderHeader() {
      const currentMode = MODES[this.state.state.mode];
      const modeBadge = document.getElementById('currentModeBadge');
      if (modeBadge && currentMode) {
        modeBadge.textContent = currentMode.name;
        modeBadge.className = `badge ${currentMode.badgeClass}`;
      }
      const modeSelect = document.getElementById('modeSelect');
      if (modeSelect) modeSelect.value = this.state.state.mode;
      this.updateHeaderStats();
    }

    updateHeaderStats() {
      const stats = this.state.state.stats;
      const streakEl = document.getElementById('headerStreakCount');
      if (streakEl) streakEl.textContent = `${stats.streakDays}日連続`;
      const todayMinsEl = document.getElementById('headerTodayMinutes');
      if (todayMinsEl) todayMinsEl.textContent = `${stats.todayMinutes}分`;
    }

    updateTimerDisplay() {
      const timerDisplay = document.getElementById('studyTimerDisplay');
      if (timerDisplay) {
        const sec = this.state.state.timer.seconds;
        const mins = Math.floor(sec / 60).toString().padStart(2, '0');
        const secs = (sec % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
      }
    }

    /* --- Dashboard --- */
    renderDashboard() {
      const container = document.getElementById('tab-dashboard');
      if (!container) return;
      const currentMode = MODES[this.state.state.mode];
      const stats = this.state.state.stats;

      container.innerHTML = `
        <!-- クイック学習記録バナー -->
        <div class="quick-log-banner mb-6" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15)); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-card);">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">✨</span> 本日の英語学習を記録する
            </h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">学習が終わったらここをクリック！学習時間やストリークを確定し、Obsidian Vaultへ自動同期します。</p>
          </div>
          <button id="dashboardLogBtn" class="btn btn-primary" style="padding: 0.7rem 1.4rem; font-size: 0.95rem; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
            <i data-lucide="check-circle-2"></i> <span>学習を記録する</span>
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-icon-box text-emerald"><i data-lucide="flame"></i></div>
            <div class="stat-info">
              <span class="stat-label">連続学習ストリーク</span>
              <span class="stat-value">${stats.streakDays} <span class="unit">日</span></span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-box text-blue"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <span class="stat-label">今日の学習時間</span>
              <span class="stat-value">${stats.todayMinutes} <span class="unit">分</span></span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-box text-purple"><i data-lucide="award"></i></div>
            <div class="stat-info">
              <span class="stat-label">累計学習時間</span>
              <span class="stat-value">${stats.totalMinutes} <span class="unit">分</span></span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-box text-amber"><i data-lucide="bookmark"></i></div>
            <div class="stat-info">
              <span class="stat-label">保存済みフレーズ</span>
              <span class="stat-value">${stats.savedPhrasesCount} <span class="unit">語</span></span>
            </div>
          </div>
        </div>

        <div class="dashboard-main-columns">
          <div class="panel-section">
            <div class="section-header">
              <h3><i data-lucide="compass"></i> ${currentMode.name} - 6〜12ヶ月ロードマップ</h3>
              <span class="subtitle">${currentMode.description}</span>
            </div>
            <div class="curriculum-accordion">
              ${currentMode.curriculum.map((c, idx) => `
                <div class="phase-card ${idx === 0 ? 'active' : ''}">
                  <div class="phase-header">
                    <h4>${c.phase}</h4>
                    <span class="phase-focus">${c.focus}</span>
                  </div>
                  <ul class="mission-list">
                    ${c.missions.map(m => {
                      const isDone = stats.completedMissions.includes(m);
                      const safeId = 'm_' + Math.abs(m.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
                      return `
                        <li class="mission-item ${isDone ? 'completed' : ''}" data-mission="${encodeURIComponent(m)}">
                          <div class="mission-left">
                            <input type="checkbox" ${isDone ? 'checked' : ''} class="mission-checkbox" id="${safeId}">
                            <label class="mission-label" for="${safeId}">${m}</label>
                          </div>
                          <button class="btn-start-mission ${isDone ? 'completed-btn' : ''}" data-mission="${encodeURIComponent(m)}" title="このミッションの6ステップ学習を開始">
                            <i data-lucide="${isDone ? 'check-circle' : 'play-circle'}"></i>
                            <span>${isDone ? '復習する' : '学習する'}</span>
                          </button>
                        </li>
                      `;
                    }).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h3><i data-lucide="bar-chart-2"></i> 学習進捗アナリティクス</h3>
            </div>
            <div class="chart-wrapper mb-4">
              <h5 class="chart-title">直近7日間の学習推移 (分)</h5>
              <div style="height: 180px;"><canvas id="studyHistoryChart"></canvas></div>
            </div>
            <div class="chart-wrapper">
              <h5 class="chart-title">モード別学習バランス</h5>
              <div style="height: 160px;"><canvas id="modeDistributionChart"></canvas></div>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.mission-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const item = e.target.closest('.mission-item');
          const missionText = decodeURIComponent(item.dataset.mission);
          this.state.toggleMission(missionText);
          item.classList.toggle('completed', e.target.checked);
          const btn = item.querySelector('.btn-start-mission');
          if (btn) {
            btn.classList.toggle('completed-btn', e.target.checked);
            btn.innerHTML = `<i data-lucide="${e.target.checked ? 'check-circle' : 'play-circle'}"></i> <span>${e.target.checked ? '復習する' : '学習する'}</span>`;
            if (window.lucide) window.lucide.createIcons();
          }
        });
      });

      container.querySelectorAll('.btn-start-mission').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const missionText = decodeURIComponent(btn.dataset.mission);
          this.openStudySession(missionText);
        });
      });

      const dashLogBtn = document.getElementById('dashboardLogBtn');
      if (dashLogBtn) {
        dashLogBtn.addEventListener('click', () => this.handleLogStudySession());
      }

      if (window.lucide) {
        window.lucide.createIcons();
      }

      analytics.renderCharts(this.state.state.stats);
    }

    /* --- Chat Tab --- */
    renderChatTab() {
      const container = document.getElementById('tab-chat');
      if (!container) return;

      const currentMode = MODES[this.state.state.mode];
      const situations = currentMode.situations;
      const currentSitId = this.state.state.currentSituationId;
      const currentSit = situations.find(s => s.id === currentSitId) || situations[0];
      const messages = this.state.state.chatMessages;

      container.innerHTML = `
        <div class="chat-container">
          <div class="situation-selector-bar">
            <div class="situation-info">
              <span class="label">シチュエーション設定:</span>
              <select id="situationSelect" class="styled-select">
                ${situations.map(s => `
                  <option value="${s.id}" ${s.id === currentSit.id ? 'selected' : ''}>${s.title}</option>
                `).join('')}
              </select>
            </div>
            <button id="clearChatBtn" class="btn btn-secondary btn-sm" title="対話をリセット">
              <i data-lucide="refresh-cw"></i> リセット
            </button>
          </div>

          <div class="chat-messages-scroll" id="chatMessagesScroll">
            ${messages.length === 0 ? `
              <div class="empty-chat-state">
                <div class="avatar-large"><i data-lucide="bot"></i></div>
                <h4>AI講師 Nova と英会話を始めましょう！</h4>
                <p>下のマイクボタンを押して英語で話しかけるか、英文を入力して送信してください。</p>
                <div class="starter-chips">
                  <button class="chip-btn" data-text="Hello! Nice to meet you.">"Hello! Nice to meet you."</button>
                  <button class="chip-btn" data-text="Could you give me a recommendation?">"Could you give me a recommendation?"</button>
                </div>
              </div>
            ` : messages.map((m) => `
              <div class="chat-bubble-wrapper ${m.role === 'user' ? 'user-msg' : 'ai-msg'}">
                <div class="avatar-circle">
                  <i data-lucide="${m.role === 'user' ? 'user' : 'sparkles'}"></i>
                </div>
                <div class="bubble-content">
                  <div class="bubble-header">
                    <span class="sender-name">${m.role === 'user' ? 'Tatsuya' : 'Coach Nova'}</span>
                    <span class="timestamp">${m.timestamp}</span>
                  </div>
                  <div class="message-text">${m.text.replace(/\n/g, '<br/>')}</div>
                  ${m.tip ? `
                    <div class="tutor-tip-card">
                      <i data-lucide="lightbulb" class="tip-icon"></i>
                      <div class="tip-text">${m.tip}</div>
                    </div>
                  ` : ''}
                  ${m.role === 'model' ? `
                    <div class="bubble-actions">
                      <button class="action-icon-btn speak-msg-btn" data-text="${encodeURIComponent(m.text)}" title="英語音声を再生">
                        <i data-lucide="volume-2"></i>
                      </button>
                      <button class="action-icon-btn save-phrase-btn" data-text="${encodeURIComponent(m.text)}" title="フレーズ集に保存">
                        <i data-lucide="bookmark-plus"></i>
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
            <div id="chatTypingIndicator" class="typing-indicator hidden">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              <span>Nova is typing...</span>
            </div>
          </div>

          <div id="speechRecordingBanner" class="speech-recording-banner hidden">
            <div class="wave-animation"><span></span><span></span><span></span><span></span><span></span></div>
            <span id="speechInterimText">Listening to your voice...</span>
            <button id="cancelSpeechBtn" class="btn-cancel-rec"><i data-lucide="x"></i></button>
          </div>

          <div class="chat-input-bar">
            <button id="micBtn" class="btn-mic" title="音声認識（話しかける）">
              <i data-lucide="mic"></i>
            </button>
            <textarea id="chatInputText" rows="1" placeholder="Type a message or use microphone..." class="chat-textarea"></textarea>
            <button id="sendChatBtn" class="btn btn-primary btn-send">
              <i data-lucide="send"></i>
            </button>
          </div>
        </div>
      `;

      const sitSelect = document.getElementById('situationSelect');
      if (sitSelect) {
        sitSelect.addEventListener('change', (e) => {
          this.state.setSituation(e.target.value);
          this.renderChatTab();
        });
      }

      const clearChatBtn = document.getElementById('clearChatBtn');
      if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
          if (confirm('会話履歴をリセットしますか？')) {
            this.state.clearChat();
            this.renderChatTab();
          }
        });
      }

      container.querySelectorAll('.speak-msg-btn').forEach(btn => {
        btn.addEventListener('click', () => speech.speak(decodeURIComponent(btn.dataset.text)));
      });

      container.querySelectorAll('.save-phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = decodeURIComponent(btn.dataset.text);
          const saved = this.state.savePhrase({
            en: text.substring(0, 120),
            ja: 'AIチューターとの会話フレーズ',
            category: currentSit.title
          });
          this.showToast(saved ? 'フレーズ集に保存しました！' : '既に保存されています。');
        });
      });

      container.querySelectorAll('.chip-btn').forEach(chip => {
        chip.addEventListener('click', () => {
          const input = document.getElementById('chatInputText');
          if (input) {
            input.value = chip.dataset.text;
            this.handleSendMessage();
          }
        });
      });

      const sendBtn = document.getElementById('sendChatBtn');
      const inputArea = document.getElementById('chatInputText');
      const triggerSend = () => this.handleSendMessage();
      if (sendBtn) sendBtn.addEventListener('click', triggerSend);
      if (inputArea) {
        inputArea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            triggerSend();
          }
        });
      }

      const micBtn = document.getElementById('micBtn');
      const recordingBanner = document.getElementById('speechRecordingBanner');
      const interimTextEl = document.getElementById('speechInterimText');
      const cancelSpeechBtn = document.getElementById('cancelSpeechBtn');

      if (micBtn) {
        micBtn.addEventListener('click', () => {
          if (!speech.isRecognitionSupported()) {
            alert('お使いのブラウザは音声認識に対応していません。テキスト入力をご利用ください。');
            return;
          }
          if (speech.isListening) {
            speech.stopListening();
            return;
          }

          speech.startListening({
            onStart: () => {
              micBtn.classList.add('recording');
              recordingBanner.classList.remove('hidden');
              interimTextEl.textContent = 'Listening... Speak English now!';
            },
            onResult: ({ final, interim }) => {
              interimTextEl.textContent = final || interim || 'Listening...';
              if (final && inputArea) {
                inputArea.value = (inputArea.value ? inputArea.value + ' ' : '') + final;
              }
            },
            onEnd: () => {
              micBtn.classList.remove('recording');
              recordingBanner.classList.add('hidden');
            },
            onError: (err) => {
              micBtn.classList.remove('recording');
              recordingBanner.classList.add('hidden');
              this.showToast(err.message, 'error');
            }
          });
        });
      }

      if (cancelSpeechBtn) {
        cancelSpeechBtn.addEventListener('click', () => speech.stopListening());
      }

      const scrollArea = document.getElementById('chatMessagesScroll');
      if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
    }

    async handleSendMessage() {
      const inputArea = document.getElementById('chatInputText');
      if (!inputArea) return;
      const text = inputArea.value.trim();
      if (!text) return;

      inputArea.value = '';
      this.state.addChatMessage('user', text);
      this.renderChatTab();

      const typingEl = document.getElementById('chatTypingIndicator');
      if (typingEl) typingEl.classList.remove('hidden');

      try {
        const response = await this.gemini.chat({
          modeId: this.state.state.mode,
          situationId: this.state.state.currentSituationId,
          messageHistory: this.state.state.chatMessages.slice(0, -1),
          userMessage: text
        });

        this.state.addChatMessage('model', response.text, response.tip);
        this.renderChatTab();
        speech.speak(response.text);
      } catch (err) {
        this.showToast(`エラー: ${err.message}`, 'error');
        if (typingEl) typingEl.classList.add('hidden');
      }
    }

    /* --- Review Tab --- */
    renderReviewTab() {
      const container = document.getElementById('tab-review');
      if (!container) return;
      const history = this.state.state.reviewHistory;
      const latest = history[0] || null;

      container.innerHTML = `
        <div class="review-layout">
          <div class="review-input-panel">
            <div class="section-header">
              <h3><i data-lucide="edit-3"></i> 英文添削＆文法解説</h3>
              <span class="subtitle">作成した英文を入力してください。文法チェックとより自然・ビジネスな3段階表現を提案します。</span>
            </div>
            <textarea id="reviewInputText" class="review-textarea" rows="4" placeholder="例: I want you to send me the report tomorrow because I need to check it before meeting."></textarea>
            <div class="review-action-row">
              <div class="quick-examples">
                <span>クイック例文:</span>
                <button class="sample-btn" data-text="I think we should extend the deadline by two weeks.">納期延長の提案</button>
                <button class="sample-btn" data-text="Thank you for your reply yesterday. I will check the file.">返信御礼と確認</button>
              </div>
              <button id="submitReviewBtn" class="btn btn-primary">
                <i data-lucide="sparkles"></i> 添削を受ける
              </button>
            </div>
          </div>

          <div class="review-results-panel" id="reviewResultArea">
            ${latest ? this.getReviewResultHTML(latest) : `
              <div class="empty-state-box">
                <i data-lucide="file-check" class="large-icon"></i>
                <h4>まだ添削結果がありません</h4>
                <p>上の入力欄に英文を入れて「添削を受ける」を押すと、詳細な文法指導と洗練された書き換え候補が表示されます。</p>
              </div>
            `}
          </div>
        </div>
      `;

      container.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = document.getElementById('reviewInputText');
          if (input) input.value = btn.dataset.text;
        });
      });

      const submitBtn = document.getElementById('submitReviewBtn');
      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          const input = document.getElementById('reviewInputText');
          if (!input || !input.value.trim()) {
            alert('添削したい英文を入力してください。');
            return;
          }
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> 添削中...`;
          if (window.lucide) window.lucide.createIcons();

          try {
            const result = await this.gemini.reviewWriting({
              modeId: this.state.state.mode,
              inputText: input.value.trim()
            });
            this.state.addReviewResult(result);
            this.renderReviewTab();
            this.showToast('添削が完了しました！');
          } catch (err) {
            this.showToast(`添削エラー: ${err.message}`, 'error');
          } finally {
            submitBtn.disabled = false;
          }
        });
      }

      this.bindReviewResultActions(container);
    }

    getReviewResultHTML(res) {
      return `
        <div class="review-card">
          <div class="review-card-header">
            <h4><i data-lucide="check-circle-2"></i> 添削結果レポート</h4>
            <span class="date-badge">${new Date(res.createdAt).toLocaleString()}</span>
          </div>

          <div class="versions-grid">
            <div class="version-card border-correct">
              <div class="version-badge bg-emerald">① 文法修正版 (Grammar Fixed)</div>
              <p class="version-text">${res.versions?.corrected || '-'}</p>
              <button class="copy-phrase-btn" data-text="${encodeURIComponent(res.versions?.corrected || '')}"><i data-lucide="copy"></i> コピー</button>
            </div>
            <div class="version-card border-natural">
              <div class="version-badge bg-blue">② ネイティブ自然表現 (Natural)</div>
              <p class="version-text">${res.versions?.natural || '-'}</p>
              <button class="copy-phrase-btn" data-text="${encodeURIComponent(res.versions?.natural || '')}"><i data-lucide="copy"></i> コピー</button>
            </div>
            <div class="version-card border-formal">
              <div class="version-badge bg-purple">③ フォーマル/ビジネス表現 (Formal)</div>
              <p class="version-text">${res.versions?.business_or_formal || '-'}</p>
              <button class="copy-phrase-btn" data-text="${encodeURIComponent(res.versions?.business_or_formal || '')}"><i data-lucide="copy"></i> コピー</button>
            </div>
          </div>

          ${res.corrections && res.corrections.length > 0 ? `
            <div class="corrections-section">
              <h5><i data-lucide="book-open"></i> 文法チェック＆ポイント解説</h5>
              ${res.corrections.map(c => `
                <div class="correction-item">
                  <span class="correction-type">${c.type}</span>
                  <div class="correction-desc">
                    <div class="issue-line"><strong>懸念点:</strong> ${c.issue}</div>
                    <div class="fix-line"><strong>改善:</strong> <code>${c.fixed}</code></div>
                    <p class="explanation">${c.explanation}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${res.key_vocabulary && res.key_vocabulary.length > 0 ? `
            <div class="vocab-section">
              <h5><i data-lucide="key"></i> ピックアップ重要フレーズ</h5>
              <div class="vocab-tags">
                ${res.key_vocabulary.map(v => `
                  <div class="vocab-badge">
                    <strong>${v.word}</strong>: ${v.meaning}
                    <button class="quick-add-phrase" data-en="${encodeURIComponent(v.word)}" data-ja="${encodeURIComponent(v.meaning)}">
                      <i data-lucide="plus"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${res.coach_comment ? `
            <div class="coach-comment-box">
              <div class="coach-avatar"><i data-lucide="award"></i></div>
              <div class="comment-content">
                <strong>Coach Nova からのフィードバック:</strong>
                <p>${res.coach_comment}</p>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    bindReviewResultActions(container) {
      container.querySelectorAll('.copy-phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text));
          this.showToast('クリップボードにコピーしました！');
        });
      });
      container.querySelectorAll('.quick-add-phrase').forEach(btn => {
        btn.addEventListener('click', () => {
          const en = decodeURIComponent(btn.dataset.en);
          const ja = decodeURIComponent(btn.dataset.ja);
          const saved = this.state.savePhrase({ en, ja, category: '添削抽出語彙' });
          this.showToast(saved ? `「${en}」をフレーズ集に保存しました！` : '既に保存されています。');
        });
      });
    }

    /* --- Quiz Tab --- */
    renderQuizTab() {
      const container = document.getElementById('tab-quiz');
      if (!container) return;
      const currentMode = MODES[this.state.state.mode];
      if (this.currentQuizList.length === 0) {
        this.currentQuizList = [...currentMode.presetQuizzes];
        this.currentQuizIndex = 0;
      }
      const q = this.currentQuizList[this.currentQuizIndex] || this.currentQuizList[0];
      const totalQ = this.currentQuizList.length;

      container.innerHTML = `
        <div class="quiz-container">
          <div class="quiz-header-bar">
            <div class="quiz-title">
              <h3><i data-lucide="help-circle"></i> デイリーミニクイズ (${currentMode.name})</h3>
              <span class="q-progress">問 ${this.currentQuizIndex + 1} / ${totalQ}</span>
            </div>
            <button id="generateAiQuizBtn" class="btn btn-secondary btn-sm">
              <i data-lucide="sparkles"></i> AIで新しい問題を作成
            </button>
          </div>

          <div class="quiz-card" id="activeQuizCard">
            <div class="question-text">
              <h4>${q.question}</h4>
            </div>
            <div class="quiz-options-list">
              ${q.options.map((opt, idx) => `
                <button class="quiz-option-btn" data-index="${idx}">
                  <span class="opt-prefix">${['A', 'B', 'C', 'D'][idx]}</span>
                  <span class="opt-text">${opt}</span>
                </button>
              `).join('')}
            </div>
            <div id="quizFeedbackBox" class="quiz-feedback-box hidden">
              <div id="feedbackStatus" class="feedback-status"></div>
              <div id="feedbackExplanation" class="feedback-explanation"></div>
              <div class="feedback-actions">
                <button id="nextQuestionBtn" class="btn btn-primary">次の問題へ <i data-lucide="arrow-right"></i></button>
              </div>
            </div>
          </div>

          ${this.state.state.quiz.reviewList.length > 0 ? `
            <div class="review-questions-section">
              <h4><i data-lucide="alert-circle"></i> 要復習リスト (${this.state.state.quiz.reviewList.length}問)</h4>
              <div class="review-questions-grid">
                ${this.state.state.quiz.reviewList.map(rq => `
                  <div class="review-question-card">
                    <p class="rq-text"><strong>Q:</strong> ${rq.question}</p>
                    <p class="rq-ans"><strong>正解:</strong> ${rq.options[rq.answer]}</p>
                    <p class="rq-exp">${rq.explanation}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const optionBtns = container.querySelectorAll('.quiz-option-btn');
      const feedbackBox = document.getElementById('quizFeedbackBox');
      const feedbackStatus = document.getElementById('feedbackStatus');
      const feedbackExp = document.getElementById('feedbackExplanation');
      const nextBtn = document.getElementById('nextQuestionBtn');

      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const selectedIdx = parseInt(btn.dataset.index, 10);
          const isCorrect = selectedIdx === q.answer;
          optionBtns.forEach(b => b.disabled = true);
          btn.classList.add(isCorrect ? 'correct' : 'wrong');
          optionBtns[q.answer].classList.add('correct');
          this.state.recordQuizResult(isCorrect, q);

          feedbackStatus.innerHTML = isCorrect 
            ? `<span class="text-emerald font-bold">🎉 正解！ Excellent!</span>` 
            : `<span class="text-rose font-bold">❌ 不正解... Nice try!</span>`;
          feedbackExp.innerHTML = `<p>${q.explanation}</p>`;
          feedbackBox.classList.remove('hidden');
        });
      });

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.currentQuizIndex = (this.currentQuizIndex + 1) % this.currentQuizList.length;
          this.renderQuizTab();
        });
      }

      const genBtn = document.getElementById('generateAiQuizBtn');
      if (genBtn) {
        genBtn.addEventListener('click', async () => {
          genBtn.disabled = true;
          genBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> 生成中...`;
          try {
            const newQuizzes = await this.gemini.generateQuiz({ modeId: this.state.state.mode });
            if (Array.isArray(newQuizzes) && newQuizzes.length > 0) {
              this.currentQuizList = newQuizzes;
              this.currentQuizIndex = 0;
              this.showToast('AIによる新クイズ3問を生成しました！');
              this.renderQuizTab();
            }
          } catch (err) {
            this.showToast(`生成エラー: ${err.message}`, 'error');
          } finally {
            genBtn.disabled = false;
          }
        });
      }
    }

    /* --- Phrasebook Tab --- */
    renderPhrasebookTab() {
      const container = document.getElementById('tab-phrasebook');
      if (!container) return;
      const saved = this.state.state.savedPhrases;
      const currentMode = MODES[this.state.state.mode];
      const presets = currentMode.presetPhrases;

      container.innerHTML = `
        <div class="phrasebook-layout">
          <div class="phrasebook-header">
            <div>
              <h3><i data-lucide="bookmark"></i> 保存済みフレーズ＆単語帳</h3>
              <span class="subtitle">会話や添削からストックした重要表現。Obsidian Vaultと同期できます。</span>
            </div>
            <div class="header-actions">
              <button id="exportMdBtn" class="btn btn-secondary">
                <i data-lucide="download"></i> Obsidian用Markdown出力
              </button>
              <button id="backupJsonBtn" class="btn btn-secondary">
                <i data-lucide="file-json"></i> JSONバックアップ
              </button>
              <label class="btn btn-secondary cursor-pointer">
                <i data-lucide="upload"></i> JSONインポート
                <input type="file" id="importJsonInput" accept=".json" class="hidden">
              </label>
            </div>
          </div>

          <div class="phrasebook-sections">
            <div class="panel-section mb-6">
              <h4><i data-lucide="star"></i> マイク・添削・会話から保存したフレーズ (${saved.length}件)</h4>
              ${saved.length === 0 ? `
                <div class="empty-state-box">
                  <p>保存されたフレーズはまだありません。チャットや添削結果の「保存」ボタンから追加できます。</p>
                </div>
              ` : `
                <div class="phrases-table-wrapper">
                  <table class="phrases-table">
                    <thead>
                      <tr>
                        <th>英語表現</th>
                        <th>意味・用途</th>
                        <th>カテゴリ</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${saved.map(p => `
                        <tr>
                          <td class="phrase-en"><strong>${p.en}</strong></td>
                          <td class="phrase-ja">${p.ja}</td>
                          <td><span class="badge badge-secondary">${p.category || '一般'}</span></td>
                          <td class="action-cell">
                            <button class="action-icon-btn speak-table-btn" data-text="${encodeURIComponent(p.en)}" title="音声再生">
                              <i data-lucide="volume-2"></i>
                            </button>
                            <button class="action-icon-btn delete-phrase-btn text-rose" data-id="${p.id}" title="削除">
                              <i data-lucide="trash-2"></i>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>

            <div class="panel-section">
              <h4><i data-lucide="book"></i> ${currentMode.name} - 厳選必須フレーズ集 (${presets.length}選)</h4>
              <div class="preset-phrases-grid">
                ${presets.map(p => `
                  <div class="preset-phrase-card">
                    <div class="preset-header">
                      <span class="badge ${currentMode.badgeClass}">${p.category}</span>
                      <button class="action-icon-btn speak-table-btn" data-text="${encodeURIComponent(p.en)}" title="発音再生">
                        <i data-lucide="volume-2"></i>
                      </button>
                    </div>
                    <p class="preset-en">${p.en}</p>
                    <p class="preset-ja">${p.ja}</p>
                    <button class="btn btn-sm btn-secondary add-preset-btn" data-en="${encodeURIComponent(p.en)}" data-ja="${encodeURIComponent(p.ja)}" data-cat="${encodeURIComponent(p.category)}">
                      <i data-lucide="bookmark-plus"></i> マイ単語帳に追加
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.speak-table-btn').forEach(btn => {
        btn.addEventListener('click', () => speech.speak(decodeURIComponent(btn.dataset.text)));
      });

      container.querySelectorAll('.delete-phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('このフレーズを削除しますか？')) {
            this.state.removePhrase(btn.dataset.id);
            this.renderPhrasebookTab();
            this.showToast('削除しました');
          }
        });
      });

      container.querySelectorAll('.add-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const en = decodeURIComponent(btn.dataset.en);
          const ja = decodeURIComponent(btn.dataset.ja);
          const category = decodeURIComponent(btn.dataset.cat);
          const savedOk = this.state.savePhrase({ en, ja, category });
          this.showToast(savedOk ? `「${en}」を保存しました！` : '既に登録されています。');
          this.renderPhrasebookTab();
        });
      });

      const exportMdBtn = document.getElementById('exportMdBtn');
      if (exportMdBtn) {
        exportMdBtn.addEventListener('click', () => {
          this.storage.exportPhrasesMarkdown([...saved, ...presets]);
          this.showToast('Obsidian用Markdownを出力しました！');
        });
      }

      const backupJsonBtn = document.getElementById('backupJsonBtn');
      if (backupJsonBtn) {
        backupJsonBtn.addEventListener('click', () => {
          this.storage.exportJSON(this.state.state);
          this.showToast('バックアップJSONをダウンロードしました！');
        });
      }

      const importInput = document.getElementById('importJsonInput');
      if (importInput) {
        importInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const res = this.storage.importJSON(event.target.result, this.state);
              if (res.success) {
                this.showToast('データを正常に復元しました！');
                this.renderAll();
              } else {
                alert(`インポート失敗: ${res.error}`);
              }
            };
            reader.readAsText(file);
          }
        });
      }
    }

    /* --- Grammar Guide Modal --- */
    renderGrammarGuideModal() {
      const body = document.getElementById('grammarGuideModalBody');
      if (!body) return;
      body.innerHTML = `
        <div class="grammar-modal-content">
          ${GRAMMAR_GUIDES.map(g => {
            const parsed = (typeof marked !== 'undefined' && marked.parse) ? marked.parse(g.content) : `<pre>${g.content}</pre>`;
            return `
              <div class="grammar-block mb-4">
                <h3>${g.title}</h3>
                <p class="summary-line" style="color: #94a3b8; margin-bottom: 0.5rem;"><em>${g.summary}</em></p>
                <div class="markdown-preview">${parsed}</div>
              </div>
            `;
          }).join('<hr style="border-color: #334155; margin: 1.5rem 0;"/>')}
        </div>
      `;
    }

    /* ==========================================
     * 6-STEP STUDY SESSION CONTROLLER
     * ========================================== */

    initStudySessionModal() {
      const closeBtn = document.getElementById('closeStudySessionBtn');
      const prevBtn = document.getElementById('sessionPrevBtn');
      const nextBtn = document.getElementById('sessionNextBtn');
      const skipBtn = document.getElementById('sessionSkipBtn');

      if (closeBtn) closeBtn.addEventListener('click', () => this.closeStudySession());
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          this.goToSessionStep(this.currentSessionStep - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentSessionStep >= 6) {
            this.handleCompleteSession();
          } else {
            this.goToSessionStep(this.currentSessionStep + 1);
          }
        });
      }

      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          if (this.currentSessionStep < 6) {
            this.goToSessionStep(this.currentSessionStep + 1);
          } else {
            this.closeStudySession();
          }
        });
      }

      document.querySelectorAll('.step-indicator').forEach(ind => {
        ind.addEventListener('click', () => {
          const s = parseInt(ind.dataset.step, 10);
          if (s) this.goToSessionStep(s);
        });
      });
    }

    openStudySession(missionTitle) {
      const modeId = this.state.state.mode;
      const content = getMissionContent(missionTitle, modeId);

      this.currentSession = {
        missionTitle,
        modeId,
        content,
        completedSteps: new Set([1]),
        speakingAccuracy: null,
        speakingRecognized: '',
        roleplayMessages: [
          { sender: 'ai', text: content.step5.aiGreeting, ja: content.step5.aiGreetingJa }
        ],
        quizAnswered: false,
        quizSelected: null
      };
      this.currentSessionStep = 1;

      const phaseBadge = document.getElementById('sessionModalPhaseBadge');
      const modeBadge = document.getElementById('sessionModalModeBadge');
      const titleEl = document.getElementById('sessionModalTitle');

      if (phaseBadge) phaseBadge.textContent = content.phase || 'カリキュラム学習';
      if (modeBadge) modeBadge.textContent = MODES[modeId]?.name || '日常会話';
      if (titleEl) titleEl.textContent = missionTitle;

      const modal = document.getElementById('studySessionModal');
      if (modal) modal.classList.remove('hidden');

      this.updateStepIndicators();
      this.renderSessionStepContent();
    }

    closeStudySession() {
      const modal = document.getElementById('studySessionModal');
      if (modal) modal.classList.add('hidden');
      if (this.sessionRecognition) {
        try { this.sessionRecognition.abort(); } catch (e) {}
        this.sessionRecognition = null;
      }
      this.isRecordingSpeaking = false;
      this.currentSession = null;
    }

    goToSessionStep(stepIndex) {
      if (stepIndex < 1 || stepIndex > 6) return;
      if (this.currentSession) {
        this.currentSession.completedSteps.add(this.currentSessionStep);
      }
      this.currentSessionStep = stepIndex;
      this.updateStepIndicators();
      this.renderSessionStepContent();
    }

    updateStepIndicators() {
      const step = this.currentSessionStep;
      const stepNames = ["初期学習", "短文", "長文", "スピーキング", "ロールプレイ", "振り返り"];

      document.querySelectorAll('.step-indicator').forEach(ind => {
        const s = parseInt(ind.dataset.step, 10);
        ind.classList.remove('active', 'done');
        if (s === step) {
          ind.classList.add('active');
        } else if (this.currentSession && this.currentSession.completedSteps.has(s)) {
          ind.classList.add('done');
        }
      });

      const prevBtn = document.getElementById('sessionPrevBtn');
      const nextBtn = document.getElementById('sessionNextBtn');
      const skipBtn = document.getElementById('sessionSkipBtn');
      const hintEl = document.getElementById('sessionStepHint');

      if (prevBtn) {
        prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
      }

      if (hintEl) {
        hintEl.textContent = `Step ${step} / 6: ${stepNames[step - 1]}`;
      }

      if (nextBtn) {
        if (step === 6) {
          nextBtn.className = 'btn btn-primary btn-sm';
          nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          nextBtn.innerHTML = `<span>🎉 完了して学習記録</span> <i data-lucide="check"></i>`;
          if (skipBtn) skipBtn.style.display = 'none';
        } else {
          nextBtn.className = 'btn btn-primary btn-sm';
          nextBtn.style.background = '';
          nextBtn.innerHTML = `<span>次へ進む</span> <i data-lucide="arrow-right"></i>`;
          if (skipBtn) skipBtn.style.display = 'inline-flex';
        }
      }

      if (window.lucide) window.lucide.createIcons();
    }

    renderSessionStepContent() {
      const area = document.getElementById('studySessionContentArea');
      if (!area || !this.currentSession) return;

      const content = this.currentSession.content;
      const step = this.currentSessionStep;

      switch (step) {
        case 1:
          this.renderSessionStep1(area, content.step1);
          break;
        case 2:
          this.renderSessionStep2(area, content.step2);
          break;
        case 3:
          this.renderSessionStep3(area, content.step3);
          break;
        case 4:
          this.renderSessionStep4(area, content.step4);
          break;
        case 5:
          this.renderSessionStep5(area, content.step5);
          break;
        case 6:
          this.renderSessionStep6(area, content.step6);
          break;
      }

      if (window.lucide) window.lucide.createIcons();
    }

    /* --- Step 1: 初期学習 (Core Concept & Basics) --- */
    renderSessionStep1(container, data) {
      container.innerHTML = `
        <div class="step-content-card">
          <div class="step-instruction-box">
            <h4><i data-lucide="sparkles" style="color: #f59e0b;"></i> ${data.title}</h4>
            <p style="font-size: 1rem; color: #e2e8f0; line-height: 1.6; margin-top: 0.5rem;">
              ${data.concept}
            </p>
          </div>

          <div class="concept-points-list" style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem;">
            ${data.points.map(p => `
              <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
                <div style="font-weight: 700; color: #60a5fa; font-size: 0.95rem; margin-bottom: 0.25rem;">
                  📌 ${p.term}
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                  ${p.desc}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.9rem; color: #fbbf24;">
            ${data.coreTip}
          </div>
        </div>
      `;
    }

    /* --- Step 2: 短文 (Short Sentence Drill) --- */
    renderSessionStep2(container, data) {
      const answered = this.currentSession.quizAnswered;
      const selected = this.currentSession.quizSelected;

      container.innerHTML = `
        <div class="step-content-card">
          <div class="step-instruction-box">
            <h4><i data-lucide="edit-3" style="color: #60a5fa;"></i> 短文の感覚チェック</h4>
            <p>${data.question}</p>
          </div>

          <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border-subtle); text-align: center; margin-bottom: 1.25rem;">
            <span style="font-size: 1.2rem; font-weight: 700; letter-spacing: 0.5px; color: #f8fafc;">
              ${data.sentence}
            </span>
          </div>

          <div class="quiz-options-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
            ${data.options.map((opt, idx) => {
              let optClass = 'quiz-option-btn';
              if (answered) {
                if (idx === data.answer) optClass += ' correct';
                else if (idx === selected) optClass += ' wrong';
              }
              return `
                <button class="${optClass}" data-opt-idx="${idx}" ${answered ? 'disabled' : ''}>
                  <span class="opt-prefix">${String.fromCharCode(65 + idx)}</span>
                  <span>${opt}</span>
                </button>
              `;
            }).join('')}
          </div>

          ${answered ? `
            <div style="background: ${selected === data.answer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${selected === data.answer ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}; border-radius: var(--radius-md); padding: 1rem; font-size: 0.9rem;">
              <div style="font-weight: 700; margin-bottom: 0.35rem; color: ${selected === data.answer ? '#34d399' : '#f87171'};">
                ${selected === data.answer ? '🎉 正解！感覚がしっかり掴めています！' : '💡 正解は ' + String.fromCharCode(65 + data.answer) + '「' + data.options[data.answer] + '」です'}
              </div>
              <div style="color: var(--text-secondary); line-height: 1.5;">${data.explanation}</div>
            </div>
          ` : ''}
        </div>
      `;

      if (!answered) {
        container.querySelectorAll('.quiz-option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.optIdx, 10);
            this.currentSession.quizAnswered = true;
            this.currentSession.quizSelected = idx;
            this.renderSessionStepContent();
          });
        });
      }
    }

    /* --- Step 3: 長文 (Reading & Listening / Context) --- */
    renderSessionStep3(container, data) {
      container.innerHTML = `
        <div class="step-content-card">
          <div class="step-instruction-box">
            <h4><i data-lucide="book-open" style="color: #a78bfa;"></i> ${data.title}</h4>
            <p>文脈（コンテクスト）の中で自然な英語のリズムと語彙の使い方を精読・リスニングしましょう。</p>
          </div>

          <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; border: 1px solid var(--border-subtle); margin-bottom: 1rem;">
            <p id="step3PassageEn" style="font-size: 1.05rem; line-height: 1.8; color: #f8fafc; font-weight: 500; white-space: pre-line;">
              ${data.passage}
            </p>
            <div id="step3PassageJa" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-card); font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; display: none; white-space: pre-line;">
              ${data.passageJa}
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.25rem;">
            <button id="btnListenPassage" class="btn btn-secondary btn-sm">
              <i data-lucide="volume-2"></i> <span>ネイティブ音声で聴く</span>
            </button>
            <button id="btnTogglePassageJa" class="btn btn-secondary btn-sm">
              <i data-lucide="languages"></i> <span>日本語訳を表示</span>
            </button>
          </div>

          ${data.focusWords && data.focusWords.length > 0 ? `
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">重要キー表現:</span>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${data.focusWords.map(w => `<span class="badge" style="background: var(--bg-card); border: 1px solid var(--border-card); color: #60a5fa; font-size: 0.8rem;">${w}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const listenBtn = container.querySelector('#btnListenPassage');
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          speech.speak(data.passage, { rate: 0.95 });
        });
      }

      const toggleJaBtn = container.querySelector('#btnTogglePassageJa');
      const jaBox = container.querySelector('#step3PassageJa');
      if (toggleJaBtn && jaBox) {
        toggleJaBtn.addEventListener('click', () => {
          const isHidden = jaBox.style.display === 'none';
          jaBox.style.display = isHidden ? 'block' : 'none';
          toggleJaBtn.innerHTML = isHidden 
            ? `<i data-lucide="eye-off"></i> <span>日本語訳を隠す</span>`
            : `<i data-lucide="languages"></i> <span>日本語訳を表示</span>`;
          if (window.lucide) window.lucide.createIcons();
        });
      }
    }

    /* --- Step 4: スピーキング (Speaking & STT Practice) --- */
    renderSessionStep4(container, data) {
      const accuracy = this.currentSession.speakingAccuracy;
      const recognized = this.currentSession.speakingRecognized;

      container.innerHTML = `
        <div class="step-content-card">
          <div class="step-instruction-box">
            <h4><i data-lucide="mic" style="color: #10b981;"></i> スピーキング＆発音音読練習</h4>
            <p>お手本音声を聴いたあと、マイクボタンを押して実際に声に出して音読してみましょう。</p>
          </div>

          <div class="speaking-practice-box">
            <div class="speaking-target-phrase">${data.target}</div>
            <div class="speaking-target-ja">${data.targetJa}</div>

            <div class="speaking-controls-row">
              <button id="btnListenTarget" class="btn btn-secondary">
                <i data-lucide="volume-2"></i> <span>お手本を聴く</span>
              </button>
              <button id="btnRecordSpeaking" class="btn btn-primary ${this.isRecordingSpeaking ? 'btn-recording' : ''}">
                <i data-lucide="${this.isRecordingSpeaking ? 'square' : 'mic'}"></i>
                <span>${this.isRecordingSpeaking ? '録音中...（停止）' : '声に出して音読する'}</span>
              </button>
            </div>

            ${recognized ? `
              <div class="spoken-result-box">
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">認識された音声:</div>
                <div style="font-weight: 600; color: #fff;">"${recognized}"</div>
                ${accuracy !== null ? `
                  <div class="accuracy-pill ${accuracy >= 70 ? 'accuracy-good' : 'accuracy-fair'}">
                    ${accuracy >= 80 ? '🎉 Excellent! (精度 ' + accuracy + '%)' : accuracy >= 60 ? '👍 Good! (精度 ' + accuracy + '%)' : '😊 練習中! (精度 ' + accuracy + '%)'}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
              💡 <strong>ワンポイント:</strong> ${data.tip || 'リラックスして息をしっかり吐きながら発声しましょう。'}
            </div>
          </div>
        </div>
      `;

      const listenBtn = container.querySelector('#btnListenTarget');
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          speech.speak(data.target, { rate: 0.9 });
        });
      }

      const recBtn = container.querySelector('#btnRecordSpeaking');
      if (recBtn) {
        recBtn.addEventListener('click', () => {
          this.startSpeakingPractice(data.target);
        });
      }
    }

    startSpeakingPractice(targetText) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        this.showToast('お使いのブラウザは音声認識機能に対応していません。音読練習を行い「次へ」進んでください。', 'info');
        this.currentSession.speakingAccuracy = 100;
        this.currentSession.speakingRecognized = targetText;
        this.renderSessionStepContent();
        return;
      }

      if (this.isRecordingSpeaking) {
        if (this.sessionRecognition) {
          try { this.sessionRecognition.stop(); } catch (e) {}
        }
        this.isRecordingSpeaking = false;
        this.renderSessionStepContent();
        return;
      }

      try {
        const rec = new SpeechRec();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;

        this.isRecordingSpeaking = true;
        this.sessionRecognition = rec;
        this.renderSessionStepContent();

        rec.onresult = (event) => {
          const result = event.results[0][0].transcript;
          const accuracy = this.calculateWordSimilarity(targetText, result);
          this.currentSession.speakingRecognized = result;
          this.currentSession.speakingAccuracy = accuracy;
          this.isRecordingSpeaking = false;
          this.renderSessionStepContent();
          this.showToast(`音読を認識しました！（一致度: ${accuracy}%）`);
        };

        rec.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          this.isRecordingSpeaking = false;
          this.renderSessionStepContent();
          this.showToast('マイク音声を認識できませんでした。もう一度お試しください。', 'warning');
        };

        rec.onend = () => {
          this.isRecordingSpeaking = false;
          if (this.currentSessionStep === 4) {
            this.renderSessionStepContent();
          }
        };

        rec.start();
      } catch (err) {
        console.error('Mic start error:', err);
        this.isRecordingSpeaking = false;
        this.showToast('マイクの起動に失敗しました。ブラウザのマイク権限をご確認ください。', 'warning');
        this.renderSessionStepContent();
      }
    }

    calculateWordSimilarity(target, spoken) {
      const clean = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
      const targetWords = clean(target);
      const spokenWords = clean(spoken);
      if (targetWords.length === 0) return 100;

      let matches = 0;
      targetWords.forEach(w => {
        if (spokenWords.includes(w)) matches++;
      });
      return Math.min(100, Math.round((matches / targetWords.length) * 100));
    }

    /* --- Step 5: ロールプレイ (Quick AI Dialogue) --- */
    renderSessionStep5(container, data) {
      const history = this.currentSession.roleplayMessages || [];

      container.innerHTML = `
        <div class="step-content-card">
          <div class="step-instruction-box">
            <h4><i data-lucide="message-square" style="color: #ec4899;"></i> 実践ロールプレイ</h4>
            <p><strong>シチュエーション:</strong> ${data.scenario}</p>
          </div>

          <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border-subtle); max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1rem;" id="sessionChatHistory">
            ${history.map(msg => `
              <div style="display: flex; gap: 0.75rem; align-items: flex-start; ${msg.sender === 'user' ? 'flex-direction: row-reverse;' : ''}">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${msg.sender === 'ai' ? '#10b981' : '#3b82f6'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; font-size: 0.8rem; font-weight: 700;">
                  ${msg.sender === 'ai' ? 'AI' : 'YOU'}
                </div>
                <div style="background: ${msg.sender === 'ai' ? 'var(--bg-input)' : '#1e3a8a'}; border: 1px solid ${msg.sender === 'ai' ? 'var(--border-card)' : '#3b82f6'}; border-radius: var(--radius-md); padding: 0.75rem 1rem; max-width: 80%;">
                  <div style="font-size: 0.95rem; color: #fff; line-height: 1.5;">${msg.text}</div>
                  ${msg.ja ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${msg.ja}</div>` : ''}
                  ${msg.sender === 'ai' ? `
                    <button class="action-icon-btn btn-speak-roleplay" data-speak="${encodeURIComponent(msg.text)}" style="margin-top: 0.25rem; padding: 2px 6px; font-size: 0.75rem;">
                      <i data-lucide="volume-2" style="width: 14px; height: 14px;"></i> 音声
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          ${data.suggestedReplies && data.suggestedReplies.length > 0 ? `
            <div style="margin-bottom: 0.85rem;">
              <span style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem; display: block;">クイック返答の提案:</span>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${data.suggestedReplies.map(r => `
                  <button class="chip-btn btn-suggested-reply" data-text="${encodeURIComponent(r)}">
                    "${r}"
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="sessionRoleplayInput" class="form-input" placeholder="英語で返答を入力、または上の提案を選択..." style="flex: 1;">
            <button id="sessionRoleplaySendBtn" class="btn btn-primary">
              <i data-lucide="send"></i>
            </button>
          </div>
        </div>
      `;

      container.querySelectorAll('.btn-speak-roleplay').forEach(b => {
        b.addEventListener('click', () => {
          speech.speak(decodeURIComponent(b.dataset.speak));
        });
      });

      container.querySelectorAll('.btn-suggested-reply').forEach(b => {
        b.addEventListener('click', () => {
          const text = decodeURIComponent(b.dataset.text);
          this.handleRoleplaySend(text);
        });
      });

      const input = container.querySelector('#sessionRoleplayInput');
      const sendBtn = container.querySelector('#sessionRoleplaySendBtn');
      if (sendBtn && input) {
        sendBtn.addEventListener('click', () => {
          const val = input.value.trim();
          if (val) this.handleRoleplaySend(val);
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && input.value.trim()) {
            this.handleRoleplaySend(input.value.trim());
          }
        });
      }
    }

    async handleRoleplaySend(userText) {
      if (!this.currentSession) return;
      this.currentSession.roleplayMessages.push({ sender: 'user', text: userText });
      this.renderSessionStepContent();

      const step5 = this.currentSession.content.step5;

      // Gemini連携またはプリセットフィードバック
      if (this.gemini && this.gemini.apiKey) {
        try {
          const prompt = `You are Nova, an encouraging English coach. In this 1-turn quick roleplay, the scenario is: "${step5.scenario}". The learner replied: "${userText}".
Reply warmly in 1-2 sentences of English, praise their response, and provide 1 polite suggestion if applicable. Include a Japanese translation line starting with "訳: ".`;
          const reply = await this.gemini.sendMessage(prompt);
          this.currentSession.roleplayMessages.push({
            sender: 'ai',
            text: reply
          });
        } catch (e) {
          this.currentSession.roleplayMessages.push({
            sender: 'ai',
            text: step5.aiFeedback || "Wonderful response! You communicated clearly and naturally."
          });
        }
      } else {
        this.currentSession.roleplayMessages.push({
          sender: 'ai',
          text: step5.aiFeedback || "Wonderful response! You communicated clearly and naturally."
        });
      }

      this.renderSessionStepContent();
    }

    /* --- Step 6: 振り返り (Reflection & Vault Log) --- */
    renderSessionStep6(container, data) {
      const phrases = data.keyPhrases || [];

      container.innerHTML = `
        <div class="step-content-card">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 2.8rem; margin-bottom: 0.25rem;">🎉</div>
            <h4 style="font-size: 1.3rem; font-weight: 700; color: #fff;">ミッション学習コンプリート！</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              ${data.summary || '全6ステップの学習を完了しました。着実に英語力がレベルアップしています！'}
            </p>
          </div>

          <div class="reflection-grid">
            <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1rem 1.25rem; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">✅ 完了したステップ</div>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #34d399; line-height: 1.8;">
                <li>✓ 1. 初期学習 (コア概念・文法感覚)</li>
                <li>✓ 2. 短文 (穴埋めチェック)</li>
                <li>✓ 3. 長文 (パッセージ精読＆リスニング)</li>
                <li>✓ 4. スピーキング (マイク音読練習)</li>
                <li>✓ 5. ロールプレイ (AI対話実践)</li>
                <li>✓ 6. 振り返り (知識の定着)</li>
              </ul>
            </div>

            <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1rem 1.25rem; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">⏱️ 記録される成果</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #60a5fa; margin-bottom: 0.25rem;">
                +10分 学習時間を加算
              </div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
                ダッシュボードのストリークを更新し、Obsidian Vault (30_Document/English_Learning/) へ直接保存します。
              </p>
              <div style="display: flex; align-items: center; gap: 0.35rem; color: #34d399; font-size: 0.85rem;">
                <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> Vault自動同期準備完了
              </div>
            </div>
          </div>

          ${phrases.length > 0 ? `
            <div style="margin-top: 1rem; background: var(--bg-input); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-card);">
              <div style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>📚 習得したキーフレーズ (${phrases.length}語)</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">単語帳に自動登録されます</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${phrases.map(p => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                    <div>
                      <strong style="color: #60a5fa;">${p.en}</strong>
                      <span style="color: var(--text-secondary); margin-left: 0.5rem;">${p.ja}</span>
                    </div>
                    <button class="action-icon-btn btn-speak-phrase" data-speak="${encodeURIComponent(p.en)}" title="発音を聴く">
                      <i data-lucide="volume-2" style="width: 14px; height: 14px;"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.querySelectorAll('.btn-speak-phrase').forEach(b => {
        b.addEventListener('click', () => {
          speech.speak(decodeURIComponent(b.dataset.speak));
        });
      });
    }

    async handleCompleteSession() {
      if (!this.currentSession) return;
      const mission = this.currentSession.missionTitle;
      const content = this.currentSession.content;

      // 1. ミッション完了化
      if (!this.state.state.stats.completedMissions.includes(mission)) {
        this.state.toggleMission(mission);
      }

      // 2. 学習時間加算 (10分)
      this.state.state.stats.todayMinutes += 10;
      this.state.state.stats.totalMinutes += 10;

      // 3. キーフレーズを単語帳に保存
      if (content.step6 && content.step6.keyPhrases) {
        content.step6.keyPhrases.forEach(p => {
          const exists = this.state.state.savedPhrases.some(sp => sp.en === p.en);
          if (!exists) {
            this.state.addPhrase({
              id: 'phrase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              en: p.en,
              ja: p.ja,
              category: content.category || 'ミッション学習',
              date: new Date().toISOString().split('T')[0]
            });
          }
        });
      }

      this.storage.saveData(this.state.state);

      // 4. Obsidian Vaultへ直接保存
      const todayStr = new Date().toISOString().split('T')[0];
      const markdownContent = `---
date: "${todayStr}"
type: "mission_study_session"
mission: "${mission}"
mode: "${this.state.state.mode}"
status: "completed"
tags:
  - english/learning
  - english/mission
---

# 英語学習ミッション完了記録: ${mission}

## 1. 完了情報
- **ミッション**: ${mission}
- **モード**: ${MODES[this.state.state.mode]?.name || '日常会話'}
- **完了日時**: ${new Date().toLocaleString('ja-JP')}
- **学習時間加算**: +10 分

## 2. コア概念の要約
${content.step1?.concept || ''}

## 3. 習得キーフレーズ
${(content.step6?.keyPhrases || []).map(p => `- **${p.en}**: ${p.ja}`).join('\n')}

---
*Generated automatically by English Coach App Study Session*
`;

      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `Reviews/Mission_${todayStr}_${encodeURIComponent(mission).slice(0, 20)}.md`,
            content: markdownContent
          })
        });
        if (res.ok) {
          console.log('Successfully saved session to Obsidian Vault');
        }
      } catch (err) {
        console.log('Saved to LocalStorage (Standalone mode)');
      }

      this.closeStudySession();
      this.renderAll();
      this.showToast(`🎉 「${mission}」の学習を完了し、Obsidian Vaultへ記録しました！`);
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast-notification ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('visible'), 50);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  /* ==========================================
   * 8. APPLICATION INITIALIZATION
   * ========================================== */
  function startApp() {
    const savedData = storage.loadData();
    state.init(savedData);

    const gemini = new GeminiClient(state.state.apiKey, state.state.selectedModel);
    const ui = new UIManager(state, gemini, storage);
    ui.init();

    if (window.lucide) {
      window.lucide.createIcons();
    }
    console.log('🚀 English Coach App loaded and running via bundle.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }

})();
