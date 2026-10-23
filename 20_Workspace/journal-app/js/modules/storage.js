/**
 * Modern Journal App - Storage & Export/Import Module
 */

import { STORAGE_KEY } from './constants.js';

export function loadEntries() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load entries from localStorage', e);
        return [];
    }
}

export function saveEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        return true;
    } catch (e) {
        console.error('Failed to save entries to localStorage', e);
        alert('ローカルストレージへの保存に失敗しました。容量制限等をご確認ください。');
        return false;
    }
}

export function getInitialSeedData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    return [
        {
            id: 'demo-1',
            title: 'Journal Appの開発をスタート！',
            content: '# Journal App へようこそ\n\n今日からObsidian Vault内に新しいジャーナルアプリの開発を開始しました。\n\n### 今回の改善ポイント\n- **Markdown対応**: 見出しやリスト、コードブロックが書ける\n- **Obsidian連携**: Vaultとそのまま相互同期\n- **ダッシュボード**: 気分推移をグラフで可視化\n\n快適な執筆を楽しみましょう！',
            date: today,
            mood: 'happy',
            tags: ['開発', 'アイデア', '初投稿'],
            isFavorite: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'demo-2',
            title: '夕方の散歩と新しい気付き',
            content: '近所の公園を散歩しながら、今後のタスク整理を行った。\n静かな環境で頭を整える時間はやっぱり大切。\n\n明日も早起きしよう。',
            date: yesterday,
            mood: 'good',
            tags: ['日常', '散歩'],
            isFavorite: false,
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];
}

/**
 * JSONエクスポート
 */
export function exportJSON(entries) {
    const jsonStr = JSON.stringify(entries, null, 2);
    downloadFile(jsonStr, `journal-backup-${getTodayString()}.json`, 'application/json');
}

/**
 * JSONインポート
 */
export function importJSON(file, currentEntries, onComplete) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const imported = JSON.parse(evt.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`${imported.length} 件のエントリーを読み込みます。既存のデータに追加しますか？`)) {
                    const merged = [...imported, ...currentEntries];
                    // Deduplicate by ID
                    const seen = new Set();
                    const deduplicated = merged.filter(item => {
                        if (seen.has(item.id)) return false;
                        seen.add(item.id);
                        return true;
                    });
                    saveEntries(deduplicated);
                    onComplete(deduplicated);
                    alert('インポートが完了しました！');
                }
            } else {
                alert('有効なジャーナルJSONデータではありません。');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('JSONファイルの解析に失敗しました。');
        }
    };
    reader.readAsText(file);
}

/**
 * エントリーをObsidian標準のYAML Frontmatter形式Markdownに変換
 */
export function entryToMarkdown(entry) {
    const safeTitle = JSON.stringify(entry.title);
    const tagsYaml = entry.tags && entry.tags.length > 0
        ? '\n' + entry.tags.map(t => `  - ${t}`).join('\n')
        : ' []';

    return `---
id: "${entry.id}"
title: ${safeTitle}
date: "${entry.date}"
mood: "${entry.mood}"
favorite: ${!!entry.isFavorite}
created_at: "${entry.createdAt || entry.date}"
updated_at: "${entry.updatedAt || entry.createdAt || entry.date}"
tags:${tagsYaml}
---

${entry.content}
`;
}

/**
 * 単体エントリーのMarkdownダウンロード
 */
export function exportSingleMarkdown(entry) {
    const mdContent = entryToMarkdown(entry);
    const filename = `${entry.date}_${sanitizeFilename(entry.title)}.md`;
    downloadFile(mdContent, filename, 'text/markdown');
}

/**
 * 全エントリーを個別のMarkdownファイルとして一括ダウンロード（またはバッチ保存）
 */
export function exportAllMarkdown(entries) {
    if (!entries || entries.length === 0) {
        alert('エクスポートするエントリーがありません。');
        return;
    }
    
    // ブラウザで複数ファイルを連続ダウンロード
    entries.forEach((entry, idx) => {
        setTimeout(() => {
            exportSingleMarkdown(entry);
        }, idx * 150);
    });
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function sanitizeFilename(name) {
    return (name || 'journal').replace(/[/\\?%*:|"<>]/g, '-').trim().substring(0, 50);
}
