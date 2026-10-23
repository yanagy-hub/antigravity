/**
 * English Coach App - メインエントリーポイント
 */

import { state } from './modules/state.js';
import { storage } from './modules/storage.js';
import { GeminiClient } from './modules/gemini.js';
import { UIManager } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. ローカルストレージから保存データをロード
  const savedData = storage.loadData();
  
  // 2. State初期化
  state.init(savedData);

  // 3. Gemini API クライアント初期化
  const gemini = new GeminiClient(state.state.apiKey, state.state.selectedModel);

  // 4. UIマネージャー初期化
  const ui = new UIManager(state, gemini, storage);
  ui.init();

  // 5. アイコンの初期描画
  if (window.lucide) {
    window.lucide.createIcons();
  }

  console.log('🚀 English Coach App initialized successfully.');
});
