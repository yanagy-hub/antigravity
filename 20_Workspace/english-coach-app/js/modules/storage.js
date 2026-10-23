/**
 * English Coach App - ストレージ管理およびエクスポート/インポート
 */

import { STORAGE_KEYS } from './constants.js';

export const storage = {
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

      return {
        apiKey,
        selectedModel,
        mode,
        stats,
        savedPhrases,
        reviewHistory
      };
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return {};
    }
  },

  saveData(appState) {
    try {
      if (appState.apiKey !== undefined) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, appState.apiKey);
      }
      if (appState.selectedModel) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, appState.selectedModel);
      }
      if (appState.mode) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, appState.mode);
      }
      if (appState.stats) {
        localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(appState.stats));
      }
      if (appState.savedPhrases) {
        localStorage.setItem(STORAGE_KEYS.PHRASE_BOOK, JSON.stringify(appState.savedPhrases));
      }
      if (appState.reviewHistory) {
        localStorage.setItem(STORAGE_KEYS.REVIEW_HISTORY, JSON.stringify(appState.reviewHistory));
      }
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

  // Obsidian Vault連携用 Markdownエクスポート（単一フレーズまたは一括）
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
