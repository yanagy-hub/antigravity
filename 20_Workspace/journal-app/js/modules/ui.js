/**
 * Modern Journal App - UI Rendering & Interaction Module
 */

import { MOODS, MOOD_EMOJIS } from './constants.js';
import { renderMarkdown, escapeHTML } from './markdown.js';
import { calculateStats, renderCharts } from './analytics.js';
import { exportSingleMarkdown } from './storage.js';

export class UIManager {
    constructor(state) {
        this.state = state;
        this.elements = {};
        this.cachedElements();
    }

    cachedElements() {
        this.elements = {
            entriesGrid: document.getElementById('entries-grid'),
            emptyState: document.getElementById('empty-state'),
            searchInput: document.getElementById('search-input'),
            searchClear: document.getElementById('search-clear'),
            btnNewEntry: document.getElementById('btn-new-entry'),
            btnEmptyNew: document.getElementById('btn-empty-new'),
            
            // Counts & Summary
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
            
            // Entry Form Modal
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
            
            // Markdown Tabs
            tabEdit: document.getElementById('tab-edit'),
            tabPreview: document.getElementById('tab-preview'),
            tabPaneEdit: document.getElementById('tab-pane-edit'),
            tabPanePreview: document.getElementById('tab-pane-preview'),
            markdownPreviewArea: document.getElementById('markdown-preview-area'),

            // Reader Modal
            readerModal: document.getElementById('reader-modal'),
            readerClose: document.getElementById('reader-close'),
            readerTitle: document.getElementById('reader-title'),
            readerDate: document.getElementById('reader-date'),
            readerMood: document.getElementById('reader-mood'),
            readerTags: document.getElementById('reader-tags'),
            readerBody: document.getElementById('reader-body'),
            btnReaderEdit: document.getElementById('btn-reader-edit'),
            btnReaderExportMd: document.getElementById('btn-reader-export-md'),

            // Dashboard Modal
            btnDashboard: document.getElementById('btn-dashboard'),
            dashboardModal: document.getElementById('dashboard-modal'),
            dashboardClose: document.getElementById('dashboard-close'),
            statTotalEntries: document.getElementById('stat-total-entries'),
            statFavoriteEntries: document.getElementById('stat-favorite-entries'),
            statAvgMood: document.getElementById('stat-avg-mood'),
            statTopTag: document.getElementById('stat-top-tag'),

            // Import/Export
            btnExport: document.getElementById('btn-export'),
            btnExportMdAll: document.getElementById('btn-export-md-all'),
            btnImportTrigger: document.getElementById('btn-import-trigger'),
            inputImport: document.getElementById('input-import')
        };
    }

    render() {
        const filtered = this.state.getFilteredEntries();
        const allEntries = this.state.entries;
        const stats = calculateStats(allEntries);

        // 1. Update Sidebar Counts & Summary
        if (this.elements.countAll) this.elements.countAll.textContent = allEntries.length;
        if (this.elements.countFav) this.elements.countFav.textContent = stats.favoriteCount;
        if (this.elements.totalStats) {
            this.elements.totalStats.textContent = `${filtered.length} / ${allEntries.length} 件のエントリー`;
        }

        // 2. Active Tab & Mood Highlighting
        this.elements.filterItems.forEach(item => {
            const isActive = item.dataset.filter === this.state.activeFilter && !this.state.activeMoodFilter && !this.state.activeTagFilter;
            item.classList.toggle('active', isActive);
        });

        this.elements.moodChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.mood === this.state.activeMoodFilter);
        });

        // 3. Render Tags Cloud
        this.renderTagsCloud(stats.tagCounts);

        // 4. Render Active Filter Bar
        this.renderActiveFilterBar();

        // 5. Render Cards Grid
        this.renderEntriesGrid(filtered);

        // 6. Refresh Icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    renderEntriesGrid(filtered) {
        if (!this.elements.entriesGrid) return;

        if (filtered.length === 0) {
            this.elements.entriesGrid.innerHTML = '';
            if (this.elements.emptyState) this.elements.emptyState.classList.remove('hidden');
            return;
        }

        if (this.elements.emptyState) this.elements.emptyState.classList.add('hidden');

        this.elements.entriesGrid.innerHTML = filtered.map(entry => this.createCardHTML(entry)).join('');

        // Attach listeners to cards
        filtered.forEach(entry => {
            const cardEl = document.getElementById(`card-${entry.id}`);
            if (!cardEl) return;

            // Card body click -> Open Reader Modal
            cardEl.addEventListener('click', (e) => {
                if (e.target.closest('.card-actions') || e.target.closest('.card-tag')) return;
                this.openReaderModal(entry);
            });

            // Action Buttons
            const btnStar = cardEl.querySelector('.btn-star');
            if (btnStar) {
                btnStar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.state.toggleFavorite(entry.id);
                });
            }

            const btnEdit = cardEl.querySelector('.btn-edit');
            if (btnEdit) {
                btnEdit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openEntryModal(entry);
                });
            }

            const btnDelete = cardEl.querySelector('.btn-delete');
            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`「${entry.title}」を削除してもよろしいですか？`)) {
                        this.state.deleteEntry(entry.id);
                    }
                });
            }

            const btnExportMd = cardEl.querySelector('.btn-export-md');
            if (btnExportMd) {
                btnExportMd.addEventListener('click', (e) => {
                    e.stopPropagation();
                    exportSingleMarkdown(entry);
                });
            }

            // Tag click
            cardEl.querySelectorAll('.card-tag').forEach(tagEl => {
                tagEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.state.toggleTagFilter(tagEl.dataset.tag);
                });
            });
        });
    }

    createCardHTML(entry) {
        const emoji = MOOD_EMOJIS[entry.mood] || '😐';
        const formattedDate = this.formatDateString(entry.date);
        const favClass = entry.isFavorite ? 'active' : '';

        const tagsHTML = (entry.tags || []).map(t => 
            `<span class="tag-badge card-tag" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`
        ).join('');

        // Preview snippet: Strip markdown headers/asterisks for clean summary
        const plainSnippet = (entry.content || '')
            .replace(/[#*`_~>[\]]/g, '')
            .substring(0, 140);

        return `
            <article class="journal-card" id="card-${entry.id}">
                <div class="card-header">
                    <div class="card-meta">
                        <span class="card-mood" title="気分">${emoji}</span>
                        <span class="card-date">${formattedDate}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-export-md" title="Obsidian形式(Markdown)で保存">
                            <i data-lucide="file-down"></i>
                        </button>
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
                <p class="card-preview">${escapeHTML(plainSnippet)}${entry.content.length > 140 ? '...' : ''}</p>
                <div class="card-footer">
                    <div class="card-tags">
                        ${tagsHTML}
                    </div>
                </div>
            </article>
        `;
    }

    renderTagsCloud(tagCounts) {
        if (!this.elements.tagsCloud) return;

        const tags = Object.keys(tagCounts);
        if (tags.length === 0) {
            this.elements.tagsCloud.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">タグなし</span>';
            return;
        }

        this.elements.tagsCloud.innerHTML = tags.map(tag => {
            const isActive = this.state.activeTagFilter === tag;
            return `<span class="tag-badge ${isActive ? 'active' : ''}" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)} (${tagCounts[tag]})</span>`;
        }).join('');

        this.elements.tagsCloud.querySelectorAll('.tag-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                this.state.toggleTagFilter(badge.dataset.tag);
            });
        });
    }

    renderActiveFilterBar() {
        if (!this.elements.activeFilterBar) return;

        const hasFilter = this.state.activeMoodFilter || this.state.activeTagFilter || this.state.searchQuery || this.state.activeFilter === 'favorites';
        if (hasFilter) {
            const parts = [];
            if (this.state.activeFilter === 'favorites') parts.push('お気に入り');
            if (this.state.activeMoodFilter) parts.push(`気分: ${MOOD_EMOJIS[this.state.activeMoodFilter]}`);
            if (this.state.activeTagFilter) parts.push(`タグ: #${this.state.activeTagFilter}`);
            if (this.state.searchQuery) parts.push(`検索: "${this.state.searchQuery}"`);

            this.elements.activeFilterText.textContent = `適用中: ${parts.join(' | ')}`;
            this.elements.activeFilterBar.classList.remove('hidden');
        } else {
            this.elements.activeFilterBar.classList.add('hidden');
        }
    }

    // --- Modal Controls ---

    openEntryModal(entry = null) {
        if (entry) {
            this.state.currentEditingId = entry.id;
            this.elements.modalTitle.textContent = 'ジャーナルを編集';
            this.elements.entryIdInput.value = entry.id;
            this.elements.entryTitleInput.value = entry.title;
            this.elements.entryDateInput.value = entry.date;
            this.elements.entryContentInput.value = entry.content;
            this.elements.entryTagsInput.value = (entry.tags || []).join(', ');
            this.elements.entryFavInput.checked = !!entry.isFavorite;

            const moodRadio = this.elements.entryForm.querySelector(`input[name="mood"][value="${entry.mood}"]`);
            if (moodRadio) moodRadio.checked = true;
        } else {
            this.state.currentEditingId = null;
            this.elements.modalTitle.textContent = '新しいジャーナル';
            this.elements.entryForm.reset();
            this.elements.entryIdInput.value = '';
            this.elements.entryDateInput.value = new Date().toISOString().split('T')[0];
            const defaultMood = this.elements.entryForm.querySelector('input[name="mood"][value="happy"]');
            if (defaultMood) defaultMood.checked = true;
        }

        // Reset to Edit tab
        this.switchEditorTab('edit');
        this.elements.entryModal.classList.remove('hidden');
        this.elements.entryTitleInput.focus();
    }

    closeEntryModal() {
        this.elements.entryModal.classList.add('hidden');
        this.elements.entryForm.reset();
        this.state.currentEditingId = null;
    }

    switchEditorTab(tab) {
        if (tab === 'edit') {
            if (this.elements.tabEdit) this.elements.tabEdit.classList.add('active');
            if (this.elements.tabPreview) this.elements.tabPreview.classList.remove('active');
            if (this.elements.tabPaneEdit) this.elements.tabPaneEdit.classList.remove('hidden');
            if (this.elements.tabPanePreview) this.elements.tabPanePreview.classList.add('hidden');
        } else {
            if (this.elements.tabEdit) this.elements.tabEdit.classList.remove('active');
            if (this.elements.tabPreview) this.elements.tabPreview.classList.add('active');
            if (this.elements.tabPaneEdit) this.elements.tabPaneEdit.classList.add('hidden');
            if (this.elements.tabPanePreview) this.elements.tabPanePreview.classList.remove('hidden');
            
            // Render Live Markdown Preview
            const content = this.elements.entryContentInput.value;
            this.elements.markdownPreviewArea.innerHTML = renderMarkdown(content) || '<p style="color:var(--text-muted);">本文が入力されていません。</p>';
        }
    }

    openReaderModal(entry) {
        if (!this.elements.readerModal) return;

        this.elements.readerTitle.textContent = entry.title;
        this.elements.readerDate.textContent = this.formatDateString(entry.date);
        this.elements.readerMood.textContent = `${MOOD_EMOJIS[entry.mood] || '😐'} ${MOODS[entry.mood] ? MOODS[entry.mood].label : ''}`;
        
        const tagsHTML = (entry.tags || []).map(t => `<span class="tag-badge">#${escapeHTML(t)}</span>`).join(' ');
        this.elements.readerTags.innerHTML = tagsHTML;
        this.elements.readerBody.innerHTML = renderMarkdown(entry.content);

        // Bind Reader actions
        this.elements.btnReaderEdit.onclick = () => {
            this.closeReaderModal();
            this.openEntryModal(entry);
        };

        this.elements.btnReaderExportMd.onclick = () => {
            exportSingleMarkdown(entry);
        };

        this.elements.readerModal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    closeReaderModal() {
        if (this.elements.readerModal) this.elements.readerModal.classList.add('hidden');
    }

    openDashboardModal() {
        if (!this.elements.dashboardModal) return;

        const allEntries = this.state.entries;
        const stats = calculateStats(allEntries);

        // Fill Stat Cards
        if (this.elements.statTotalEntries) this.elements.statTotalEntries.textContent = `${stats.totalEntries} 件`;
        if (this.elements.statFavoriteEntries) this.elements.statFavoriteEntries.textContent = `${stats.favoriteCount} 件`;
        if (this.elements.statAvgMood) this.elements.statAvgMood.textContent = `${stats.averageMoodScore} / 5.0`;

        const topTag = Object.entries(stats.tagCounts).sort((a, b) => b[1] - a[1])[0];
        if (this.elements.statTopTag) {
            this.elements.statTopTag.textContent = topTag ? `#${topTag[0]} (${topTag[1]})` : 'なし';
        }

        this.elements.dashboardModal.classList.remove('hidden');

        // Draw Charts
        setTimeout(() => {
            renderCharts(allEntries);
        }, 50);
    }

    closeDashboardModal() {
        if (this.elements.dashboardModal) this.elements.dashboardModal.classList.add('hidden');
    }

    formatDateString(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
        }
        return dateStr;
    }
}
