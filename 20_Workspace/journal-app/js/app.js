/**
 * Modern Journal App - JavaScript Logic
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'modern_journal_entries_v1';

    // State Management
    let state = {
        entries: [],
        activeFilter: 'all', // 'all', 'favorites'
        activeMoodFilter: null,
        activeTagFilter: null,
        searchQuery: '',
        currentEditingId: null
    };

    // DOM Elements
    const elements = {
        entriesGrid: document.getElementById('entries-grid'),
        emptyState: document.getElementById('empty-state'),
        searchInput: document.getElementById('search-input'),
        searchClear: document.getElementById('search-clear'),
        btnNewEntry: document.getElementById('btn-new-entry'),
        btnEmptyNew: document.getElementById('btn-empty-new'),
        
        // Stats & Counts
        countAll: document.getElementById('count-all'),
        countFav: document.getElementById('count-fav'),
        totalStats: document.getElementById('total-stats'),
        
        // Filters
        filterItems: document.querySelectorAll('.filter-item'),
        moodChips: document.querySelectorAll('.mood-chip'),
        tagsCloud: document.getElementById('tags-cloud'),
        activeFilterBar: document.getElementById('active-filter-bar'),
        activeFilterText: document.getElementById('active-filter-text'),
        btnClearFilter: document.getElementById('btn-clear-filter'),
        
        // Modal & Form
        entryModal: document.getElementById('entry-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        btnCancel: document.getElementById('btn-cancel'),
        entryForm: document.getElementById('entry-form'),
        entryIdInput: document.getElementById('entry-id'),
        entryTitleInput: document.getElementById('entry-title-input'),
        entryDateInput: document.getElementById('entry-date-input'),
        entryContentInput: document.getElementById('entry-content-input'),
        entryTagsInput: document.getElementById('entry-tags-input'),
        entryFavInput: document.getElementById('entry-fav-input'),
        
        // Backup
        btnExport: document.getElementById('btn-export'),
        btnImportTrigger: document.getElementById('btn-import-trigger'),
        inputImport: document.getElementById('input-import')
    };

    // Helper: Mood Emojis
    const moodEmojis = {
        happy: '😊',
        good: '😃',
        neutral: '😐',
        sad: '😔',
        angry: '😤'
    };

    // Initialize App
    function init() {
        loadEntries();
        if (state.entries.length === 0) {
            seedInitialData();
        }
        setupEventListeners();
        render();
    }

    // Load entries from localStorage
    function loadEntries() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            state.entries = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load entries from localStorage', e);
            state.entries = [];
        }
    }

    // Save entries to localStorage
    function saveEntries() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
        } catch (e) {
            console.error('Failed to save entries to localStorage', e);
            alert('ローカルストレージへの保存に失敗しました。');
        }
    }

    // Seed Initial Sample Data
    function seedInitialData() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        state.entries = [
            {
                id: 'demo-1',
                title: 'Journal Appの開発をスタート！',
                content: '今日からObsidian Vault内に新しいジャーナルアプリの開発を開始しました。\nデザインはモダンなダークモード基調にして、書き心地の良い空間を作ります。',
                date: today,
                mood: 'happy',
                tags: ['開発', 'アイデア', '初投稿'],
                isFavorite: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo-2',
                title: '夕方の散歩と新しい気付き',
                content: '近所の公園を散歩しながら、今後のタスク整理を行った。\n静かな環境で頭を整える時間はやっぱり大切。明日も早起きしよう。',
                date: yesterday,
                mood: 'good',
                tags: ['日常', '散歩'],
                isFavorite: false,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        saveEntries();
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Modal Open / Close
        elements.btnNewEntry.addEventListener('click', () => openModal());
        elements.btnEmptyNew.addEventListener('click', () => openModal());
        elements.modalClose.addEventListener('click', closeModal);
        elements.btnCancel.addEventListener('click', closeModal);

        // Backdrop click close
        elements.entryModal.addEventListener('click', (e) => {
            if (e.target === elements.entryModal) closeModal();
        });

        // Form Submit
        elements.entryForm.addEventListener('submit', handleFormSubmit);

        // Search Input
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim().toLowerCase();
            elements.searchClear.classList.toggle('hidden', state.searchQuery === '');
            render();
        });

        elements.searchClear.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.searchClear.classList.add('hidden');
            render();
        });

        // Category Filter Tabs
        elements.filterItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                state.activeFilter = filter;
                state.activeMoodFilter = null;
                state.activeTagFilter = null;
                render();
            });
        });

        // Mood Filter Chips
        elements.moodChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const mood = chip.dataset.mood;
                if (state.activeMoodFilter === mood) {
                    state.activeMoodFilter = null; // Toggle off
                } else {
                    state.activeMoodFilter = mood;
                }
                render();
            });
        });

        // Clear All Filters
        elements.btnClearFilter.addEventListener('click', () => {
            state.activeFilter = 'all';
            state.activeMoodFilter = null;
            state.activeTagFilter = null;
            state.searchQuery = '';
            elements.searchInput.value = '';
            elements.searchClear.classList.add('hidden');
            render();
        });

        // Export Data
        elements.btnExport.addEventListener('click', exportData);

        // Import Data
        elements.btnImportTrigger.addEventListener('click', () => elements.inputImport.click());
        elements.inputImport.addEventListener('change', importData);
    }

    // Open Modal for New or Edit
    function openModal(entry = null) {
        if (entry) {
            state.currentEditingId = entry.id;
            elements.modalTitle.textContent = 'ジャーナルを編集';
            elements.entryIdInput.value = entry.id;
            elements.entryTitleInput.value = entry.title;
            elements.entryDateInput.value = entry.date;
            elements.entryContentInput.value = entry.content;
            elements.entryTagsInput.value = entry.tags.join(', ');
            elements.entryFavInput.checked = !!entry.isFavorite;

            const moodRadio = elements.entryForm.querySelector(`input[name="mood"][value="${entry.mood}"]`);
            if (moodRadio) moodRadio.checked = true;
        } else {
            state.currentEditingId = null;
            elements.modalTitle.textContent = '新しいジャーナル';
            elements.entryForm.reset();
            elements.entryIdInput.value = '';
            elements.entryDateInput.value = new Date().toISOString().split('T')[0];
            const defaultMood = elements.entryForm.querySelector('input[name="mood"][value="happy"]');
            if (defaultMood) defaultMood.checked = true;
        }

        elements.entryModal.classList.remove('hidden');
        elements.entryTitleInput.focus();
    }

    // Close Modal
    function closeModal() {
        elements.entryModal.classList.add('hidden');
        elements.entryForm.reset();
        state.currentEditingId = null;
    }

    // Form Submit Handler (Create / Update)
    function handleFormSubmit(e) {
        e.preventDefault();

        const title = elements.entryTitleInput.value.trim();
        const date = elements.entryDateInput.value;
        const content = elements.entryContentInput.value.trim();
        const moodRadio = elements.entryForm.querySelector('input[name="mood"]:checked');
        const mood = moodRadio ? moodRadio.value : 'happy';
        
        // Tags parsing
        const rawTags = elements.entryTagsInput.value;
        const tags = rawTags
            ? rawTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [];

        const isFavorite = elements.entryFavInput.checked;

        if (!title || !date || !content) {
            alert('タイトル、日付、本文を入力してください。');
            return;
        }

        if (state.currentEditingId) {
            // Update
            const index = state.entries.findIndex(item => item.id === state.currentEditingId);
            if (index !== -1) {
                state.entries[index] = {
                    ...state.entries[index],
                    title,
                    date,
                    content,
                    mood,
                    tags,
                    isFavorite,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create
            const newEntry = {
                id: 'entry-' + Date.now(),
                title,
                date,
                content,
                mood,
                tags,
                isFavorite,
                createdAt: new Date().toISOString()
            };
            state.entries.unshift(newEntry);
        }

        saveEntries();
        closeModal();
        render();
    }

    // Toggle Favorite Status
    function toggleFavorite(id) {
        const entry = state.entries.find(item => item.id === id);
        if (entry) {
            entry.isFavorite = !entry.isFavorite;
            saveEntries();
            render();
        }
    }

    // Delete Entry
    function deleteEntry(id) {
        if (confirm('このジャーナルエントリーを削除してもよろしいですか？')) {
            state.entries = state.entries.filter(item => item.id !== id);
            saveEntries();
            render();
        }
    }

    // Filter Logic
    function getFilteredEntries() {
        return state.entries.filter(entry => {
            // Filter Tab
            if (state.activeFilter === 'favorites' && !entry.isFavorite) {
                return false;
            }

            // Mood Filter
            if (state.activeMoodFilter && entry.mood !== state.activeMoodFilter) {
                return false;
            }

            // Tag Filter
            if (state.activeTagFilter && !entry.tags.includes(state.activeTagFilter)) {
                return false;
            }

            // Search Query
            if (state.searchQuery) {
                const q = state.searchQuery;
                const matchTitle = entry.title.toLowerCase().includes(q);
                const matchContent = entry.content.toLowerCase().includes(q);
                const matchTags = entry.tags.some(t => t.toLowerCase().includes(q));
                if (!matchTitle && !matchContent && !matchTags) {
                    return false;
                }
            }

            return true;
        });
    }

    // Main Render Function
    function render() {
        const filtered = getFilteredEntries();

        // Update Counts
        const favCount = state.entries.filter(e => e.isFavorite).length;
        elements.countAll.textContent = state.entries.length;
        elements.countFav.textContent = favCount;
        elements.totalStats.textContent = `${filtered.length} / ${state.entries.length} 件のエントリー`;

        // Active Navigation Highlight
        elements.filterItems.forEach(item => {
            item.classList.toggle('active', item.dataset.filter === state.activeFilter && !state.activeMoodFilter && !state.activeTagFilter);
        });

        // Mood Chips Highlight
        elements.moodChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.mood === state.activeMoodFilter);
        });

        // Render Tags Cloud
        renderTagsCloud();

        // Active Filter Notification Bar
        const hasActiveFilter = state.activeMoodFilter || state.activeTagFilter || state.searchQuery || state.activeFilter === 'favorites';
        if (hasActiveFilter) {
            let labelParts = [];
            if (state.activeFilter === 'favorites') labelParts.push('お気に入り');
            if (state.activeMoodFilter) labelParts.push(`気分: ${moodEmojis[state.activeMoodFilter]}`);
            if (state.activeTagFilter) labelParts.push(`タグ: #${state.activeTagFilter}`);
            if (state.searchQuery) labelParts.push(`検索: "${state.searchQuery}"`);
            
            elements.activeFilterText.textContent = `フィルター適用中: ${labelParts.join(' | ')}`;
            elements.activeFilterBar.classList.remove('hidden');
        } else {
            elements.activeFilterBar.classList.add('hidden');
        }

        // Render Cards Grid or Empty State
        if (filtered.length === 0) {
            elements.entriesGrid.innerHTML = '';
            elements.emptyState.classList.remove('hidden');
        } else {
            elements.emptyState.classList.add('hidden');
            elements.entriesGrid.innerHTML = filtered.map(entry => createCardHTML(entry)).join('');
            
            // Attach Event Listeners to Card Buttons
            filtered.forEach(entry => {
                const cardEl = document.getElementById(`card-${entry.id}`);
                if (!cardEl) return;

                cardEl.querySelector('.btn-edit').addEventListener('click', () => openModal(entry));
                cardEl.querySelector('.btn-delete').addEventListener('click', () => deleteEntry(entry.id));
                cardEl.querySelector('.btn-star').addEventListener('click', () => toggleFavorite(entry.id));

                cardEl.querySelectorAll('.card-tag').forEach(tagEl => {
                    tagEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        state.activeTagFilter = tagEl.dataset.tag;
                        render();
                    });
                });
            });
        }

        // Re-initialize Icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // Render Tags Cloud in Sidebar
    function renderTagsCloud() {
        const allTagsMap = {};
        state.entries.forEach(entry => {
            entry.tags.forEach(t => {
                allTagsMap[t] = (allTagsMap[t] || 0) + 1;
            });
        });

        const tags = Object.keys(allTagsMap);
        if (tags.length === 0) {
            elements.tagsCloud.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">タグなし</span>';
            return;
        }

        elements.tagsCloud.innerHTML = tags.map(tag => {
            const isActive = state.activeTagFilter === tag;
            return `<span class="tag-badge ${isActive ? 'active' : ''}" data-tag="${tag}">#${tag} (${allTagsMap[tag]})</span>`;
        }).join('');

        // Tag Click Event
        elements.tagsCloud.querySelectorAll('.tag-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                const tag = badge.dataset.tag;
                if (state.activeTagFilter === tag) {
                    state.activeTagFilter = null; // Toggle off
                } else {
                    state.activeTagFilter = tag;
                }
                render();
            });
        });
    }

    // Create HTML for a Single Card
    function createCardHTML(entry) {
        const emoji = moodEmojis[entry.mood] || '😐';
        const formattedDate = formatDateString(entry.date);
        const favClass = entry.isFavorite ? 'active' : '';

        const tagsHTML = entry.tags.map(t => `<span class="tag-badge card-tag" data-tag="${t}">#${t}</span>`).join('');

        return `
            <article class="journal-card" id="card-${entry.id}">
                <div class="card-header">
                    <div class="card-meta">
                        <span class="card-mood" title="気分">${emoji}</span>
                        <span class="card-date">${formattedDate}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-star ${favClass}" title="お気に入り">
                            <i data-lucide="star"></i>
                        </button>
                        <button class="btn-icon btn-edit" title="編集">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="削除">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <h4 class="card-title">${escapeHTML(entry.title)}</h4>
                <p class="card-preview">${escapeHTML(entry.content)}</p>
                <div class="card-footer">
                    <div class="card-tags">
                        ${tagsHTML}
                    </div>
                </div>
            </article>
        `;
    }

    // Helper: Format Date (YYYY-MM-DD -> YYYY年MM月DD日)
    function formatDateString(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
        }
        return dateStr;
    }

    // Helper: Escape HTML
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Export Entries as JSON
    function exportData() {
        const jsonStr = JSON.stringify(state.entries, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import Entries from JSON
    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`${imported.length} 件のエントリーを読み込みます。既存のデータに追加しますか？`)) {
                        state.entries = [...imported, ...state.entries];
                        // Deduplicate by ID
                        const seen = new Set();
                        state.entries = state.entries.filter(item => {
                            if (seen.has(item.id)) return false;
                            seen.add(item.id);
                            return true;
                        });
                        saveEntries();
                        render();
                        alert('インポートが完了しました！');
                    }
                } else {
                    alert('有効なジャーナルJSONデータではありません。');
                }
            } catch (err) {
                console.error('Import error:', err);
                alert('JSONファイルの解析に失敗しました。');
            }
            elements.inputImport.value = '';
        };
        reader.readAsText(file);
    }

    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();
