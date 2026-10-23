/**
 * English Coach App - Gemini API クライアントモジュール
 */

import { SYSTEM_PROMPTS, MODES } from './constants.js';

export class GeminiClient {
  constructor(apiKey = '', model = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setModel(model) {
    this.model = model;
  }

  async testConnection() {
    if (!this.apiKey) {
      throw new Error('APIキーが設定されていません。');
    }
    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: 'Hello, please reply "OK" if you can hear me.' }] }
      ]
    };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `APIエラー: ステータスコード ${response.status}`);
    }
    return true;
  }

  /**
   * チャット英会話・ロールプレイ
   */
  async chat({ modeId, situationId, messageHistory, userMessage }) {
    if (!this.apiKey) {
      // オフライン/キー未設定時のモック応答
      return this.getMockChatResponse(userMessage, modeId);
    }

    const mode = MODES[modeId] || MODES.daily;
    const situation = mode.situations.find(s => s.id === situationId) || mode.situations[0];
    const systemInstruction = SYSTEM_PROMPTS.chat(mode, situation);

    // 履歴構築
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
    
    // チューターTipの分離
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

  /**
   * 英文添削・文法解説
   */
  async reviewWriting({ modeId, inputText }) {
    if (!this.apiKey) {
      return this.getMockReviewResponse(inputText, modeId);
    }

    const mode = MODES[modeId] || MODES.daily;
    const systemPrompt = SYSTEM_PROMPTS.review(mode);

    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Input to Review:\n"""\n${inputText}\n"""` }] }
      ]
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

  /**
   * クイズ自動生成
   */
  async generateQuiz({ modeId }) {
    if (!this.apiKey) {
      const mode = MODES[modeId] || MODES.daily;
      return mode.presetQuizzes;
    }

    const mode = MODES[modeId] || MODES.daily;
    const systemPrompt = SYSTEM_PROMPTS.quizGeneration(mode);

    const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ]
    };

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

  // オフライン用フォールバックモック
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
