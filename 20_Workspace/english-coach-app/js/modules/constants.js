/**
 * English Coach App - 定数およびプリセットデータ定義
 */

export const STORAGE_KEYS = {
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

export const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (高速・推奨)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (最新・超高速)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (最高精度・深い解説)' }
];

export const DEFAULT_MODEL = 'gemini-1.5-flash';

export const MODES = {
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

export const GRAMMAR_GUIDES = [
  {
    id: 'parts_of_speech',
    title: '品詞の役割と文の5文型',
    summary: '英語の骨格を掴む最も重要な基礎ルール。',
    content: `### 1. 英語の4大主要品詞
- **名詞 (Noun)**: 人や物の名前。主語(S)、目的語(O)、補語(C)になる。
- **動詞 (Verb)**: 動作や状態を表す。述語(V)になる。
- **形容詞 (Adjective)**: 名詞を詳しく説明（修飾）する、または補語(C)になる。
- **副詞 (Adverb)**: 動詞、形容詞、他の副詞、または文全体を修飾する（文の骨格にはならない）。

### 2. 基本5文型
1. **第1文型 (S + V)**: 「SがVする」 例: *The train arrived.*
2. **第2文型 (S + V + C)**: 「SはCである (S = C)」 例: *She looks happy.*
3. **第3文型 (S + V + O)**: 「SがOをVする」 例: *I checked the report.*
4. **第4文型 (S + V + O1 + O2)**: 「SがO1にO2を与える」 例: *He sent me an email.*
5. **第5文型 (S + V + O + C)**: 「SはOがCだと〜する (O = C)」 例: *They named the project Phoenix.*`
  },
  {
    id: 'tenses_aspects',
    title: '時制とアスペクト（現在完了の感覚）',
    summary: '「過去」と「現在完了」の決定的違いを理解する。',
    content: `### 1. 過去形 vs 現在完了形 (have + p.p.)
- **過去形 (Simple Past)**: 過去の「ある一点」の出来事。*現在とのつながりは切れている*。
  - 例: *I lost my key.* (過去に鍵を失くした。いま見つかったかどうかは不明)
- **現在完了形 (Present Perfect)**: 過去の出来事が*「今この瞬間にどう影響しているか」*を表す。
  - 例: *I have lost my key.* (鍵を失くして、*今も手元にない*状態)

### 2. 現在完了の3大用法
1. **継続 (ずっと〜している)**: *I have lived here for two years.*
2. **経験 (〜したことがある)**: *Have you ever been to Sydney?*
3. **完了・結果 (〜し終えた / してしまった)**: *I have just finished the slides.*`
  },
  {
    id: 'polite_requests',
    title: '丁寧な依頼・助動詞のニュアンス',
    summary: 'Can you / Could you / Would you mind の使い分け。',
    content: `### 丁寧度のグラデーション
1. **Can you ~ ?** （カジュアル・友人向け）
   - *Can you send me the link?* （リンク送ってくれる？）
2. **Could you ~ ?** （丁寧・ビジネス日常）
   - *Could you please send me the link?* （リンクを送っていただけますか？）
3. **Would you be able to ~ ?** （より慎重で丁寧なビジネス）
   - *Would you be able to review this by 3 PM?* （15時までにこれをご確認いただくことは可能でしょうか？）
4. **Would you mind -ing ~ ?** （最上級に丁寧・恐縮した依頼）
   - *Would you mind sending me the link?* （恐れ入りますがリンクを送っていただけないでしょうか？）
   - **注意**: 承諾するときは "Not at all."（まったく嫌ではありません＝喜んで）と答えます。`
  }
];

export const SYSTEM_PROMPTS = {
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
    "answer": 0, // 0-indexed correct option
    "explanation": "Clear Japanese explanation of why this answer is correct and why other options are wrong."
  }
]
\`\`\`
Return only the JSON markdown block.`
};
