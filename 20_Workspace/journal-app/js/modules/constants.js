/**
 * Modern Journal App - Constants & Configuration
 */

export const STORAGE_KEY = 'modern_journal_entries_v1';

export const MOODS = {
    happy: { emoji: '😊', label: '最高', score: 5, color: '#10b981' },
    good: { emoji: '😃', label: '良い', score: 4, color: '#3b82f6' },
    neutral: { emoji: '😐', label: '普通', score: 3, color: '#8b5cf6' },
    sad: { emoji: '😔', label: '憂鬱', score: 2, color: '#f59e0b' },
    angry: { emoji: '😤', label: 'イライラ', score: 1, color: '#ef4444' }
};

export const MOOD_EMOJIS = {
    happy: '😊',
    good: '😃',
    neutral: '😐',
    sad: '😔',
    angry: '😤'
};
