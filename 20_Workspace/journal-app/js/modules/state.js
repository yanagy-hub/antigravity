/**
 * Modern Journal App - Application State Management
 */

class AppState {
    constructor() {
        this.entries = [];
        this.activeFilter = 'all'; // 'all', 'favorites'
        this.activeMoodFilter = null;
        this.activeTagFilter = null;
        this.searchQuery = '';
        this.currentEditingId = null;
        this.listeners = [];
    }

    setEntries(entries) {
        this.entries = entries;
        this.notify();
    }

    addEntry(entry) {
        this.entries.unshift(entry);
        this.notify();
    }

    updateEntry(id, updatedFields) {
        const index = this.entries.findIndex(e => e.id === id);
        if (index !== -1) {
            this.entries[index] = {
                ...this.entries[index],
                ...updatedFields,
                updatedAt: new Date().toISOString()
            };
            this.notify();
        }
    }

    deleteEntry(id) {
        this.entries = this.entries.filter(e => e.id !== id);
        this.notify();
    }

    toggleFavorite(id) {
        const entry = this.entries.find(e => e.id === id);
        if (entry) {
            entry.isFavorite = !entry.isFavorite;
            entry.updatedAt = new Date().toISOString();
            this.notify();
        }
    }

    setFilter(filter) {
        this.activeFilter = filter;
        this.activeMoodFilter = null;
        this.activeTagFilter = null;
        this.notify();
    }

    toggleMoodFilter(mood) {
        this.activeMoodFilter = this.activeMoodFilter === mood ? null : mood;
        this.notify();
    }

    toggleTagFilter(tag) {
        this.activeTagFilter = this.activeTagFilter === tag ? null : tag;
        this.notify();
    }

    setSearchQuery(query) {
        this.searchQuery = (query || '').trim().toLowerCase();
        this.notify();
    }

    clearFilters() {
        this.activeFilter = 'all';
        this.activeMoodFilter = null;
        this.activeTagFilter = null;
        this.searchQuery = '';
        this.notify();
    }

    getFilteredEntries() {
        return this.entries.filter(entry => {
            if (this.activeFilter === 'favorites' && !entry.isFavorite) {
                return false;
            }
            if (this.activeMoodFilter && entry.mood !== this.activeMoodFilter) {
                return false;
            }
            if (this.activeTagFilter && (!entry.tags || !entry.tags.includes(this.activeTagFilter))) {
                return false;
            }
            if (this.searchQuery) {
                const q = this.searchQuery;
                const matchTitle = (entry.title || '').toLowerCase().includes(q);
                const matchContent = (entry.content || '').toLowerCase().includes(q);
                const matchTags = (entry.tags || []).some(t => t.toLowerCase().includes(q));
                if (!matchTitle && !matchContent && !matchTags) {
                    return false;
                }
            }
            return true;
        });
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(fn => fn(this));
    }
}

export const state = new AppState();
