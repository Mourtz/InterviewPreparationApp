// shared/uiUtils.js
// Cross-platform notification helper for Interview Preparation App

/**
 * Show a notification in a cross-platform way.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} [type='info'] - Notification type
 * @param {object} [options] - Optional: { duration, containerId }
 * @param {function} [customHandler] - Optional: custom function for notification (for Electron)
 */
function showNotification(message, type = 'info', options = {}, customHandler) {
    if (typeof customHandler === 'function') {
        customHandler(message, type, options);
        return;
    }
    // Web default: show notification in a toast div
    let container = document.getElementById(options.containerId || 'notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = 9999;
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    toast.style.marginBottom = '8px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '6px';
    toast.style.background = {
        success: '#2ecc40',
        error: '#ff4136',
        warning: '#ffdc00',
        info: '#0074d9'
    }[type] || '#0074d9';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
        if (!container.hasChildNodes()) container.remove();
    }, options.duration || 3500);
}

module.exports = { showNotification };
