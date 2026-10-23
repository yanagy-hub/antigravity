/**
 * Modern Journal App - Markdown Parser Module
 */

/**
 * Escape HTML special characters to prevent basic XSS
 */
export function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

/**
 * Parse Markdown to HTML
 * marked.js がグローバルにある場合はパースし、なければフォールバック
 */
export function renderMarkdown(content) {
    if (!content) return '';
    
    if (window.marked && typeof window.marked.parse === 'function') {
        try {
            // Configure marked options
            window.marked.setOptions({
                gfm: true,
                breaks: true,
                sanitize: false // markedの推奨はDOMPurify併用
            });
            return window.marked.parse(content);
        } catch (e) {
            console.error('marked parsing error:', e);
        }
    }

    // Fallback: Simple plain text to HTML with paragraph/break
    return escapeHTML(content)
        .split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}
