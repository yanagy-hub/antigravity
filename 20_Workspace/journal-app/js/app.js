/**
 * Modern Journal App - Main Application Entry Point
 * Refactored to modular architecture (ES Modules)
 */

import { state } from './modules/state.js';
import { 
    loadEntries, 
    saveEntries, 
    getInitialSeedData, 
    exportJSON, 
    importJSON, 
    exportAllMarkdown 
} from './modules/storage.js';
import { UIManager } from './modules/ui.js';

(function () {
    'use strict';

    let ui = null;

    function init() {
        // 1. Load initial data
        let initialEntries = loadEntries();
        if (!initialEntries || initialEntries.length === 0) {
            initialEntries = getInitialSeedData();
            saveEntries(initialEntries);
        }

        // 2. Setup State
        state.setEntries(initialEntries);

        // 3. Initialize UI
        ui = new UIManager(state);

        // 4. Subscribe to state changes: save to storage and re-render
        state.subscribe((currentState) => {
            saveEntries(currentState.entries);
            ui.render();
        });

        // 5. Bind Global Events
        setupEventListeners();

        // 6. Initial Render
        ui.render();
    }

    function setupEventListeners() {
        const { elements } = ui;

        // --- Entry Modal Triggers ---
        if (elements.btnNewEntry) {
            elements.btnNewEntry.addEventListener('click', () => ui.openEntryModal());
        }
        if (elements.btnEmptyNew) {
            elements.btnEmptyNew.addEventListener('click', () => ui.openEntryModal());
        }
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', () => ui.closeEntryModal());
        }
        if (elements.btnCancel) {
            elements.btnCancel.addEventListener('click', () => ui.closeEntryModal());
        }
        if (elements.entryModal) {
            elements.entryModal.addEventListener('click', (e) => {
                if (e.target === elements.entryModal) ui.closeEntryModal();
            });
        }

        // --- Markdown Tabs ---
        if (elements.tabEdit) {
            elements.tabEdit.addEventListener('click', () => ui.switchEditorTab('edit'));
        }
        if (elements.tabPreview) {
            elements.tabPreview.addEventListener('click', () => ui.switchEditorTab('preview'));
        }

        // --- Reader Modal Close ---
        if (elements.readerClose) {
            elements.readerClose.addEventListener('click', () => ui.closeReaderModal());
        }
        if (elements.readerModal) {
            elements.readerModal.addEventListener('click', (e) => {
                if (e.target === elements.readerModal) ui.closeReaderModal();
            });
        }

        // --- Dashboard Modal ---
        if (elements.btnDashboard) {
            elements.btnDashboard.addEventListener('click', () => ui.openDashboardModal());
        }
        if (elements.dashboardClose) {
            elements.dashboardClose.addEventListener('click', () => ui.closeDashboardModal());
        }
        if (elements.dashboardModal) {
            elements.dashboardModal.addEventListener('click', (e) => {
                if (e.target === elements.dashboardModal) ui.closeDashboardModal();
            });
        }

        // --- Form Submit (Create / Edit) ---
        if (elements.entryForm) {
            elements.entryForm.addEventListener('submit', handleFormSubmit);
        }

        // --- Search Input ---
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                state.setSearchQuery(query);
                if (elements.searchClear) {
                    elements.searchClear.classList.toggle('hidden', query.trim() === '');
                }
            });
        }

        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', () => {
                elements.searchInput.value = '';
                elements.searchClear.classList.add('hidden');
                state.setSearchQuery('');
            });
        }

        // --- Filter Tabs ---
        elements.filterItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                state.setFilter(filter);
            });
        });

        // --- Mood Filter Chips ---
        elements.moodChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const mood = chip.dataset.mood;
                state.toggleMoodFilter(mood);
            });
        });

        // --- Clear All Filters ---
        if (elements.btnClearFilter) {
            elements.btnClearFilter.addEventListener('click', () => {
                state.clearFilters();
                if (elements.searchInput) elements.searchInput.value = '';
                if (elements.searchClear) elements.searchClear.classList.add('hidden');
            });
        }

        // --- Import / Export ---
        if (elements.btnExport) {
            elements.btnExport.addEventListener('click', () => {
                exportJSON(state.entries);
            });
        }

        if (elements.btnExportMdAll) {
            elements.btnExportMdAll.addEventListener('click', () => {
                exportAllMarkdown(state.entries);
            });
        }

        if (elements.btnImportTrigger && elements.inputImport) {
            elements.btnImportTrigger.addEventListener('click', () => {
                elements.inputImport.click();
            });
            elements.inputImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                importJSON(file, state.entries, (newEntries) => {
                    state.setEntries(newEntries);
                });
                elements.inputImport.value = '';
            });
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const { elements } = ui;

        const title = elements.entryTitleInput.value.trim();
        const date = elements.entryDateInput.value;
        const content = elements.entryContentInput.value.trim();
        const moodRadio = elements.entryForm.querySelector('input[name="mood"]:checked');
        const mood = moodRadio ? moodRadio.value : 'happy';

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
            state.updateEntry(state.currentEditingId, {
                title,
                date,
                content,
                mood,
                tags,
                isFavorite
            });
        } else {
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
            state.addEntry(newEntry);
        }

        ui.closeEntryModal();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
