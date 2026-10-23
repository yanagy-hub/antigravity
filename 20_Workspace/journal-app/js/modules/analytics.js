/**
 * Modern Journal App - Analytics & Mood Trends Module
 */

import { MOODS } from './constants.js';

let moodTrendChartInstance = null;
let moodDistributionChartInstance = null;

/**
 * 統計データの計算
 */
export function calculateStats(entries) {
    const totalEntries = entries.length;
    const favoriteCount = entries.filter(e => e.isFavorite).length;

    // Mood distribution
    const moodCounts = {
        happy: 0,
        good: 0,
        neutral: 0,
        sad: 0,
        angry: 0
    };

    let totalScore = 0;
    entries.forEach(e => {
        if (moodCounts[e.mood] !== undefined) {
            moodCounts[e.mood]++;
            totalScore += (MOODS[e.mood] ? MOODS[e.mood].score : 3);
        }
    });

    const averageMoodScore = totalEntries > 0 ? (totalScore / totalEntries).toFixed(1) : 0;

    // Tag counts
    const tagCounts = {};
    entries.forEach(e => {
        (e.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return {
        totalEntries,
        favoriteCount,
        moodCounts,
        averageMoodScore,
        tagCounts
    };
}

/**
 * 過去30日間の気分推移データを取得（日付順ソート）
 */
export function getMoodTrendData(entries, days = 30) {
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 最近のN件または指定日数
    const recent = sorted.slice(-days);

    const labels = recent.map(e => {
        const parts = e.date.split('-');
        return parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : e.date;
    });

    const scores = recent.map(e => MOODS[e.mood] ? MOODS[e.mood].score : 3);
    const titles = recent.map(e => e.title);

    return { labels, scores, titles };
}

/**
 * Chart.jsによるグラフ描画
 */
export function renderCharts(entries) {
    const trendCanvas = document.getElementById('chart-mood-trend');
    const distCanvas = document.getElementById('chart-mood-dist');
    const emptyStateEl = document.getElementById('dashboard-empty-state');
    const chartsContainer = document.getElementById('dashboard-charts-container');

    if (!trendCanvas || !distCanvas) return;

    if (!entries || entries.length === 0) {
        if (emptyStateEl) emptyStateEl.classList.remove('hidden');
        if (chartsContainer) chartsContainer.classList.add('hidden');
        return;
    }

    if (emptyStateEl) emptyStateEl.classList.add('hidden');
    if (chartsContainer) chartsContainer.classList.remove('hidden');

    if (!window.Chart) {
        console.warn('Chart.js is not loaded.');
        return;
    }

    // 破棄 (再描画時のメモリリーク防止)
    if (moodTrendChartInstance) {
        moodTrendChartInstance.destroy();
    }
    if (moodDistributionChartInstance) {
        moodDistributionChartInstance.destroy();
    }

    const { labels, scores } = getMoodTrendData(entries, 14); // 過去14エントリー
    const stats = calculateStats(entries);

    // 1. 気分推移 (折れ線グラフ)
    moodTrendChartInstance = new window.Chart(trendCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '気分スコア (1: 😤 〜 5: 😊)',
                data: scores,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                borderWidth: 3,
                pointBackgroundColor: '#38bdf8',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function(val) {
                            const scoreLabels = {
                                5: '😊 最高',
                                4: '😃 良い',
                                3: '😐 普通',
                                2: '😔 憂鬱',
                                1: '😤 イライラ'
                            };
                            return scoreLabels[val] || val;
                        },
                        color: '#94a3b8'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0' } }
            }
        }
    });

    // 2. 気分割合 (ドーナツグラフ)
    const moodKeys = ['happy', 'good', 'neutral', 'sad', 'angry'];
    moodDistributionChartInstance = new window.Chart(distCanvas, {
        type: 'doughnut',
        data: {
            labels: moodKeys.map(k => `${MOODS[k].emoji} ${MOODS[k].label}`),
            datasets: [{
                data: moodKeys.map(k => stats.moodCounts[k]),
                backgroundColor: moodKeys.map(k => MOODS[k].color),
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e2e8f0', boxWidth: 14 }
                }
            }
        }
    });
}
