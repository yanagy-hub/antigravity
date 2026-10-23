/**
 * English Coach App - Chart.js による学習進捗の可視化 (Analytics)
 */

export class AnalyticsManager {
  constructor() {
    this.historyChart = null;
    this.distributionChart = null;
  }

  renderCharts(stats) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded yet.');
      return;
    }

    this.renderHistoryChart(stats.dailyHistory || {});
    this.renderDistributionChart(stats.modeDistribution || {});
  }

  renderHistoryChart(dailyHistory) {
    const ctx = document.getElementById('studyHistoryChart');
    if (!ctx) return;

    if (this.historyChart) {
      this.historyChart.destroy();
    }

    // 直近7日間の日付と学習時間の生成
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      labels.push(displayLabel);
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
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${item.raw} 分の学習`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5,
              color: '#94a3b8'
            },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          }
        }
      }
    });
  }

  renderDistributionChart(modeDistribution) {
    const ctx = document.getElementById('modeDistributionChart');
    if (!ctx) return;

    if (this.distributionChart) {
      this.distributionChart.destroy();
    }

    const daily = modeDistribution.daily || 0;
    const business = modeDistribution.business || 0;
    const toeic = modeDistribution.toeic || 0;
    const total = daily + business + toeic;

    // データが0の場合のプレースホルダー
    const data = total === 0 ? [1, 1, 1] : [daily, business, toeic];
    const bgColors = total === 0 
      ? ['#334155', '#475569', '#64748b']
      : ['#10b981', '#3b82f6', '#8b5cf6'];

    this.distributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['日常会話', 'ビジネス', 'TOEIC'],
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              boxWidth: 12,
              padding: 12
            }
          }
        },
        cutout: '70%'
      }
    });
  }
}

export const analytics = new AnalyticsManager();
