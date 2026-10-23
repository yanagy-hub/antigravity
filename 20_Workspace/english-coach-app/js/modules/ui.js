/**
 * English Coach App - UIレンダリング & イベントハンドラー
 */

import { MODES, GRAMMAR_GUIDES, GEMINI_MODELS } from './constants.js';
import { speech } from './speech.js';
import { analytics } from './analytics.js';

export class UIManager {
  constructor(stateInstance, geminiClient, storageService) {
    this.state = stateInstance;
    this.gemini = geminiClient;
    this.storage = storageService;

    this.currentQuizList = [];
    this.currentQuizIndex = 0;
  }

  init() {
    this.bindGlobalEvents();
    this.renderAll();

    // 状態変更の監視
    this.state.subscribe(() => {
      this.updateHeaderStats();
      this.storage.saveData(this.state.state);
    });

    // タイマー周期処理 (1秒ごと)
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
    // モード切り替え
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.state.setMode(e.target.value);
        this.renderAll();
        this.showToast(`モードを「${MODES[e.target.value].name}」に切り替えました`);
      });
    }

    // タブナビゲーション
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // タイマー操作
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

    // APIキー設定モーダル開閉
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
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
      });
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
        if (!key) {
          alert('APIキーを入力してください。');
          return;
        }
        testApiBtn.disabled = true;
        testApiBtn.textContent = '検証中...';
        try {
          const tempClient = new (this.gemini.constructor)(key, model);
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

    // 文法ガイドモーダル
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
      closeGrammarBtn.addEventListener('click', () => {
        grammarModal.classList.add('hidden');
      });
    }
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
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'chat':
        this.renderChatTab();
        break;
      case 'review':
        this.renderReviewTab();
        break;
      case 'quiz':
        this.renderQuizTab();
        break;
      case 'phrasebook':
        this.renderPhrasebookTab();
        break;
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
    if (modeSelect) {
      modeSelect.value = this.state.state.mode;
    }
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

  /* ------------------- 1. Dashboard Tab ------------------- */
  renderDashboard() {
    const container = document.getElementById('tab-dashboard');
    if (!container) return;

    const currentMode = MODES[this.state.state.mode];
    const stats = this.state.state.stats;

    container.innerHTML = `
      <div class="dashboard-grid">
        <!-- 統計サマリーカード -->
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
        <!-- 左列: カリキュラム & 今日のミッション -->
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
                    return `
                      <li class="mission-item ${isDone ? 'completed' : ''}" data-mission="${m}">
                        <input type="checkbox" ${isDone ? 'checked' : ''} class="mission-checkbox" id="m-${btoa(encodeURIComponent(m)).substring(0, 10)}">
                        <label for="m-${btoa(encodeURIComponent(m)).substring(0, 10)}">${m}</label>
                      </li>
                    `;
                  }).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 右列: 進捗グラフ -->
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

    // ミッションチェックボックスのバインド
    container.querySelectorAll('.mission-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const item = e.target.closest('.mission-item');
        const missionText = item.dataset.mission;
        this.state.toggleMission(missionText);
        item.classList.toggle('completed', e.target.checked);
      });
    });

    // グラフ描画
    analytics.renderCharts(this.state.state.stats);
  }

  /* ------------------- 2. Chat & Roleplay Tab ------------------- */
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
        <!-- シチュエーション選択バー -->
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

        <!-- チャット履歴メッセージ -->
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
          ` : messages.map((m, idx) => `
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

        <!-- 音声認識波形インジケーター -->
        <div id="speechRecordingBanner" class="speech-recording-banner hidden">
          <div class="wave-animation"><span></span><span></span><span></span><span></span><span></span></div>
          <span id="speechInterimText">Listening to your voice...</span>
          <button id="cancelSpeechBtn" class="btn-cancel-rec"><i data-lucide="x"></i></button>
        </div>

        <!-- メッセージ入力バー -->
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

    // シチュエーション変更
    const sitSelect = document.getElementById('situationSelect');
    if (sitSelect) {
      sitSelect.addEventListener('change', (e) => {
        this.state.setSituation(e.target.value);
        this.renderChatTab();
      });
    }

    // チャットリセット
    const clearChatBtn = document.getElementById('clearChatBtn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        if (confirm('会話履歴をリセットしますか？')) {
          this.state.clearChat();
          this.renderChatTab();
        }
      });
    }

    // 音声再生ボタン
    container.querySelectorAll('.speak-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        speech.speak(text);
      });
    });

    // フレーズ保存ボタン
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

    // スターターチップ
    container.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('chatInputText');
        if (input) {
          input.value = chip.dataset.text;
          this.handleSendMessage();
        }
      });
    });

    // メッセージ送信
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

    // 音声認識マイクボタン
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
      cancelSpeechBtn.addEventListener('click', () => {
        speech.stopListening();
      });
    }

    // スクロール最下部へ
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

      // 自動音声読み上げ
      speech.speak(response.text);
    } catch (err) {
      this.showToast(`エラー: ${err.message}`, 'error');
      if (typingEl) typingEl.classList.add('hidden');
    }
  }

  /* ------------------- 3. Review & Grammar Tab ------------------- */
  renderReviewTab() {
    const container = document.getElementById('tab-review');
    if (!container) return;

    const history = this.state.state.reviewHistory;
    const latest = history[0] || null;

    container.innerHTML = `
      <div class="review-layout">
        <!-- 入力パネル -->
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

        <!-- 添削結果パネル -->
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

    // サンプルボタンのバインド
    container.querySelectorAll('.sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('reviewInputText');
        if (input) input.value = btn.dataset.text;
      });
    });

    // 添削実行
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

        <!-- 3パターンの書き換え候補 -->
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

        <!-- 修正箇所と文法解説 -->
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

        <!-- 重要語彙 -->
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

        <!-- コーチからのアドバイス -->
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
        const text = decodeURIComponent(btn.dataset.text);
        navigator.clipboard.writeText(text);
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

  /* ------------------- 4. Quiz Tab ------------------- */
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

        <!-- 要復習リスト -->
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

    // 選択肢クリック
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

    // AIクイズ生成
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

  /* ------------------- 5. Phrasebook Tab ------------------- */
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
          <!-- ユーザー保存フレーズ -->
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

          <!-- プリセット頻出フレーズ -->
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

    // 再生ボタン
    container.querySelectorAll('.speak-table-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        speech.speak(decodeURIComponent(btn.dataset.text));
      });
    });

    // 削除ボタン
    container.querySelectorAll('.delete-phrase-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('このフレーズを削除しますか？')) {
          this.state.removePhrase(btn.dataset.id);
          this.renderPhrasebookTab();
          this.showToast('削除しました');
        }
      });
    });

    // プリセット追加ボタン
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

    // エクスポートボタン
    const exportMdBtn = document.getElementById('exportMdBtn');
    if (exportMdBtn) {
      exportMdBtn.addEventListener('click', () => {
        const listToExport = [...saved, ...presets];
        this.storage.exportPhrasesMarkdown(listToExport);
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

  /* ------------------- 文法ガイドモーダル ------------------- */
  renderGrammarGuideModal() {
    const body = document.getElementById('grammarGuideModalBody');
    if (!body) return;

    body.innerHTML = `
      <div class="grammar-modal-content">
        ${GRAMMAR_GUIDES.map(g => `
          <div class="grammar-block">
            <h3>${g.title}</h3>
            <p class="summary-line"><em>${g.summary}</em></p>
            <div class="markdown-preview">${marked.parse(g.content)}</div>
          </div>
        `).join('<hr/>')}
      </div>
    `;
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
