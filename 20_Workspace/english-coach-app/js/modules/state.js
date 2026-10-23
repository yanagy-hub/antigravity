/**
 * English Coach App - 状態管理 (State Management)
 */

import { MODES } from './constants.js';

class AppState {
  constructor() {
    this.subscribers = new Set();
    this.state = {
      mode: 'daily', // daily | business | toeic
      tab: 'dashboard', // dashboard | chat | review | quiz | phrasebook
      apiKey: '',
      selectedModel: 'gemini-1.5-flash',
      
      // 学習進捗統計
      stats: {
        totalMinutes: 0,
        todayMinutes: 0,
        lastStudyDate: new Date().toISOString().split('T')[0],
        streakDays: 1,
        modeDistribution: {
          daily: 0,
          business: 0,
          toeic: 0
        },
        dailyHistory: {}, // { 'YYYY-MM-DD': minutes }
        completedMissions: [], // [missionString]
        savedPhrasesCount: 0,
        reviewedCount: 0,
        quizzesTaken: 0,
        quizzesCorrect: 0
      },

      // 現在の対話ロールプレイセッション
      currentSituationId: 'cafe',
      chatMessages: [], // [{ role: 'user'|'model', text: '', tip: '', timestamp: '' }]

      // 添削履歴
      reviewHistory: [],

      // 保存済みフレーズ集
      savedPhrases: [],

      // デイリークイズ状態
      quiz: {
        currentQuestions: [],
        currentIndex: 0,
        score: 0,
        answered: false,
        reviewList: [] // 間違えた問題
      },

      // 学習タイマー
      timer: {
        isActive: false,
        seconds: 0
      }
    };
  }

  init(savedData = {}) {
    if (savedData.stats) {
      this.state.stats = { ...this.state.stats, ...savedData.stats };
    }
    if (savedData.mode && MODES[savedData.mode]) {
      this.state.mode = savedData.mode;
    }
    if (savedData.apiKey) {
      this.state.apiKey = savedData.apiKey;
    }
    if (savedData.selectedModel) {
      this.state.selectedModel = savedData.selectedModel;
    }
    if (Array.isArray(savedData.savedPhrases)) {
      this.state.savedPhrases = savedData.savedPhrases;
      this.state.stats.savedPhrasesCount = savedData.savedPhrases.length;
    }
    if (Array.isArray(savedData.reviewHistory)) {
      this.state.reviewHistory = savedData.reviewHistory;
      this.state.stats.reviewedCount = savedData.reviewHistory.length;
    }

    // 日付変更とストリークの整合性チェック
    this.checkAndUpdateStreak();
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this.state);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }

  setMode(modeId) {
    if (MODES[modeId]) {
      this.state.mode = modeId;
      // モードに応じた初期シチュエーション設定
      const firstSituation = MODES[modeId].situations[0];
      if (firstSituation) {
        this.state.currentSituationId = firstSituation.id;
      }
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
      // 間違えた問題を要復習に追加
      if (!this.state.quiz.reviewList.some(q => q.question === question.question)) {
        this.state.quiz.reviewList.push({ ...question, mode: this.state.mode });
      }
    }
    this.notify();
  }

  // タイマー関連
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
      // 1分ごとに統計に加算
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
    
    // 現在のモードの比率を加算
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

    if (lastDate === today) {
      // 今日すでに学習・記録済み
      return;
    }

    const todayDate = new Date(today);
    const last = new Date(lastDate);
    const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // 連続学習継続！
      this.state.stats.streakDays += 1;
      this.state.stats.todayMinutes = 0;
      this.state.stats.lastStudyDate = today;
    } else if (diffDays > 1) {
      // 途切れた場合は1日目からリセット
      this.state.stats.streakDays = 1;
      this.state.stats.todayMinutes = 0;
      this.state.stats.lastStudyDate = today;
    }
  }
}

export const state = new AppState();
